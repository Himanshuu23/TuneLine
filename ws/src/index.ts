import express from "express";
import Redis from "ioredis";
import { WebSocketServer, WebSocket } from "ws";

type dataType = {
    roomCode: string,
    queue: musicType[],
    user: string,
    details: string,
}

type musicType = {
  youtubeUrl: string,
  money: number,
  votes: number
};

type RateLimitingType = {
    ip: string,
    count: number,
    time: number 
};

type WebSocketWithRoomCode = WebSocket & { roomCode?: string };

let USERS: RateLimitingType[] = [];
let ROOMS: { [key: string]: dataType } = {};

const app = express();
const httpServer = app.listen(11011, () => {
  console.log(`Server Started at PORT:${11011}`);
});

const client = new Redis();

const wss = new WebSocketServer({ server: httpServer });

function rateLimitByIp(ip: string): boolean {
    let toBeRateLimited = false;
    USERS.forEach((user) => {
        if(user.ip === ip) {
            const currentTime = Date.now();
            if(currentTime - user.time >= 600000) {
                USERS = USERS.filter((user) => user.ip !== ip);
                toBeRateLimited = false;
            }
            else {
                if(user.count < 10) {
                    user.count += 1;
                    toBeRateLimited = false;
                }
                else {
                    toBeRateLimited = true;
                }
            }
        }
        else {
            USERS.push({ ip: ip, count: 1, time: Date.now() });
            toBeRateLimited = false;
        }
    })
    return toBeRateLimited;
}

async function init() {
    const result = await client.get("name");
    console.log(result);
}

async function makeNewRoom(admin: string, details: string): Promise<string> {
    let code = Math.random().toString(36).substring(2, 8);
    ROOMS[code] = { roomCode: code, queue: [], user: admin, details: details };
    return code;
}

async function joinRoom(roomCode: string, username: string, socket: WebSocketWithRoomCode): Promise<string> {
    if (ROOMS[roomCode]) {
        socket.roomCode = roomCode;
        return `${username} joined the room!`;
    }
    return "Room not found!";
}

async function insertMusicIntoQueue(roomCode: string, music: musicType): Promise<any> {
    if (ROOMS[roomCode]) {
        const queue = ROOMS[roomCode].queue;
        const existingMusicIndex = queue.findIndex((song) => song.youtubeUrl === music.youtubeUrl);
        const response = await fetchVideoDetails(music.youtubeUrl);
        if (existingMusicIndex !== -1) {
            queue[existingMusicIndex].votes = music.votes;
        } else {
            queue.push(music);
        }
        
        return response;
    }
    return "Room not found!";
}

async function deleteMusicFromQueue(roomCode: string, music: musicType): Promise<string> {
    if (ROOMS[roomCode]) {
        ROOMS[roomCode].queue = ROOMS[roomCode].queue.filter((song) => song.youtubeUrl !== music.youtubeUrl);
        return "admin deleted the song";
    }
    return "Room not found!";
}

async function getSongs(roomCode: string): Promise<musicType[] | string> {
    if (ROOMS[roomCode]) {
        return ROOMS[roomCode].queue;
    }
    return "No songs found or Room not found!";
}

async function getCreators() {
    let creators = []
    for (let i in ROOMS) {
        creators.push(ROOMS[i].user)
    }

    return creators
}

async function closeRoom(roomCode: string): Promise<string> {
    if (ROOMS[roomCode]) {
        delete ROOMS[roomCode];
        return `Room Closed!`;
    }
    return "Room not found!";
}

function getYoutubeVideoId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
    );
    return match ? match[1] : null;
  }

async function fetchVideoDetails(url: string) {
    const videoId = getYoutubeVideoId(url);
    const API_KEY = "AIzaSyA8TG3tJ3hcgrD6u8iuD0bY3kcOBwYCHk4";
    const reqUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;

    const res = await fetch(reqUrl);
    const data = await res.json();

    
    if (data.items.length > 0) {
        const { title, channelTitle, thumbnails } = data.items[0].snippet;
        return { title, artist: channelTitle, thumbnail: thumbnails.high.url };
    }

    return null;
}

wss.on("connection", (socket: WebSocket, request) => {
  console.log("WebSocket Connection established!");
  socket.on("error", console.error);
  init();

  const ip = request.socket.remoteAddress?.replace(/^::ffff:/, '') || "";
  const dontLetHimGo = rateLimitByIp(ip);

  if(dontLetHimGo) {
    socket.send(JSON.stringify({ type:"rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }));
  } else {
    socket.on("message", async (data) => {
        const message = JSON.parse(data.toString());
        let admin: string, roomCode: string, username: string, response: string | musicType[], music: musicType, details: string, creators: string[];
        switch(message.type) {
            case "make-room":
                admin = message.username;
                details = message.details
                roomCode = await makeNewRoom(admin, details);
                response = await joinRoom(roomCode, admin, socket as WebSocketWithRoomCode);
                socket.send(JSON.stringify({ type:"make-room", message: "created-room", roomCode: roomCode, response: response }));
                break;
            case "join-room":
                roomCode = message.roomCode;
                username = message.username;
                response = await joinRoom(roomCode, username, socket as WebSocketWithRoomCode);
                socket.send(JSON.stringify({ type:"join-room", message: response, roomCode: roomCode }));
                wss.clients.forEach((client) => {
                    if ((client as WebSocketWithRoomCode).roomCode === roomCode && client !== socket) {
                        (client as WebSocketWithRoomCode).send(JSON.stringify({ type:"join-room", message: response }));
                    }
                });
                break;
            case "add-music":
                username = message.username;
                music = message.music;
                roomCode = message.roomCode;
                const result = await insertMusicIntoQueue(roomCode, music);
                await new Promise(resolve => setTimeout(resolve, 0.000001));
                socket.send(JSON.stringify({ type: "add-music", message: `${username} added the song ${result.title} into the queue! vote it to play`, music: music, details: result }));
                break;
            case "delete-music":
                music = message.music;
                roomCode = message.roomCode;
                response = await deleteMusicFromQueue(roomCode, music);
                socket.send(JSON.stringify({ type: "delete-music", message: response, music: music }));
                break;
            case "close-room":
                roomCode = message.roomCode;
                response = await closeRoom(roomCode);
                socket.send(JSON.stringify({ type: "close-room", message: response }));
                break;
            case "get-songs":
                roomCode = message.roomCode;
                response = await getSongs(roomCode);
                socket.send(JSON.stringify({ type:"get-songs", songs: response }));
                break;
            case "get-creators":
                creators = await getCreators();
                socket.send(JSON.stringify({ type: "get-creators", response: JSON.stringify(creators) }));
                break;
        }
    });
  }
});
// MAKE THE ALGO FIRST INSERTING THE SONGS ON THE BASIS OF MONEY AND THEN PRIORITIZING ON THE BASIS OF VOTES THEN NORMALLY AND THEN JUST DOING THE GET SONGS -> NORMALLY -> COMPLETE 