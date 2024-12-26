import express from "express";
import { WebSocketServer, WebSocket } from "ws";

type dataType = {
    roomCode: string,
    queue: musicType[],
    user: string,
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

async function makeNewRoom(admin: string): Promise<string> {
    let code = Math.random().toString(36).substring(2, 8);
    ROOMS[code] = { roomCode: code, queue: [], user: admin };
    return code;
}

async function joinRoom(roomCode: string, username: string, socket: WebSocketWithRoomCode): Promise<string> {
    if (ROOMS[roomCode]) {
        socket.roomCode = roomCode;
        return `${username} joined the room!`;
    }
    return "Room not found!";
}

async function insertMusicIntoQueue(roomCode: string, music: musicType, user: string): Promise<string> {
    if (ROOMS[roomCode]) {
        const queue = ROOMS[roomCode].queue;
        const existingMusicIndex = queue.findIndex((song) => song.youtubeUrl === music.youtubeUrl);
        if (existingMusicIndex !== -1) {
            queue[existingMusicIndex].votes = music.votes;
        } else {
            queue.push(music);
        }
        return `${user} added the song ${music.youtubeUrl} into the queue! vote it to play`;
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

async function getSongs(roomCode: string): Promise<string> {
    if (ROOMS[roomCode]) {
        const songs = ROOMS[roomCode].queue.map((music) => music.youtubeUrl).join(", ");
        return songs;
    }
    return "No songs found or Room not found!";
}

async function closeRoom(roomCode: string): Promise<string> {
    if (ROOMS[roomCode]) {
        delete ROOMS[roomCode];
        return `Room Closed!`;
    }
    return "Room not found!";
}

wss.on("connection", (socket: WebSocket, request) => {
  console.log("WebSocket Connection established!");
  socket.on("error", console.error);

  const ip = request.socket.remoteAddress?.replace(/^::ffff:/, '') || "";
  const dontLetHimGo = rateLimitByIp(ip);

  if(dontLetHimGo) { 
    socket.send(JSON.stringify({ type:"rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }));
  } else {
    socket.on("message", async (data) => {
        const message = JSON.parse(data.toString());
        let admin: string, roomCode: string, username: string, response: string, music: musicType;
        switch(message.type) {
            case "make-room":
                admin = message.username;
                roomCode = await makeNewRoom(admin);
                response = await joinRoom(roomCode, admin, socket as WebSocketWithRoomCode);
                socket.send(JSON.stringify({ type:"make-room", message: "created-room", roomCode: roomCode, response: response }));
                break;
            case "join-room":
                roomCode = message.roomCode;
                username = message.username;
                response = await joinRoom(roomCode, username, socket as WebSocketWithRoomCode);
                socket.send(JSON.stringify({ type:"join-room", message: response }));
                wss.clients.forEach((client) => {
                    if ((client as WebSocketWithRoomCode).roomCode === roomCode) {
                        (client as WebSocketWithRoomCode).send(JSON.stringify({ type:"join-room", message: response }));
                    }
                });
                break;
            case "add-music":
                username = message.username;
                music = message.music;
                roomCode = message.roomCode;
                response = await insertMusicIntoQueue(roomCode, music, username);
                wss.clients.forEach((client) => {
                    if ((client as WebSocketWithRoomCode).roomCode === roomCode) {
                        (client as WebSocketWithRoomCode).send(JSON.stringify({ type: "add-music", message: response, music: music }));
                    }
                });
                break;
            case "delete-music":
                music = message.music;
                roomCode = message.roomCode;
                response = await deleteMusicFromQueue(roomCode, music);
                wss.clients.forEach((client) => {
                    if ((client as WebSocketWithRoomCode).roomCode === roomCode) {
                        (client as WebSocketWithRoomCode).send(JSON.stringify({ type: "delete-music", message: response, music: music }));
                    }
                });
                break;
            case "close-room":
                roomCode = message.roomCode;
                response = await closeRoom(roomCode);
                wss.clients.forEach((client) => {
                    if ((client as WebSocketWithRoomCode).roomCode === roomCode) {
                        (client as WebSocketWithRoomCode).send(JSON.stringify({ type: "close-room", message: response }));
                    }
                });
                break;
            case "get-songs":
                roomCode = message.roomCode;
                response = await getSongs(roomCode);
                socket.send(JSON.stringify({ type:"get-songs", songs: response }));
                break;
        }
    });
  }
});
MAKE THE ALGO FIRST INSERTING THE SONGS ON THE BASIS OF MONEY AND THEN PRIORITIZING ON THE BASIS OF VOTES THEN NORMALLY AND THEN JUST DOING THE GET SONGS -> NORMALLY -> COMPLETE 