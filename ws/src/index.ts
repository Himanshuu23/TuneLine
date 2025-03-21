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

type WebSocketWithRoomCode = WebSocket & { roomCode?: string, id: string };

let USERS: RateLimitingType[] = [];
let ACTIVE_SOCKETS = new Map<string, WebSocketWithRoomCode>();

const PORT = process.env.PORT || 11011;

const app = express();
const httpServer = app.listen(PORT, () => {
  console.log(`Server Started at PORT:${PORT}`);
});

const client = new Redis();

const wss = new WebSocketServer({ server: httpServer });

function rateLimitByIp(ip: string): boolean { // We'll do this using nginx only as it is much more simpler
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

async function makeNewRoom(details: any, socket: WebSocketWithRoomCode) {
    let code = Math.random().toString(36).substring(2, 8);

    await client.hmset(`${code}`, { user: details.name, createdAt: Date.now() });
    await client.hmset(`${code}:sockets`, { socketId: socket.id })
    await client.rpush('tuneline:creators', JSON.stringify({ creator: details.name, channelProfile: details.profilePic }));
    
    ACTIVE_SOCKETS.set(socket.id, socket);

    return JSON.stringify({ roomCode: code, message: "Room Created!", videoUrl: details.videoUrl });
}

async function joinRoom(roomCode: string, username: string, socket: WebSocketWithRoomCode) {
    const ROOM = await client.exists(`${roomCode}`);
    await client.hmset(`${roomCode}:sockets`, { socketId: socket.id })
    ACTIVE_SOCKETS.set(socket.id, socket);

    if (ROOM) {
        socket.roomCode = roomCode;
        return JSON.stringify({ message: `${username} joined the room!` });
    }
    
    return JSON.stringify({ message: "Invalid room code!" });
}

function songAlreadyExists(songs: any, music: musicType) {
    let exists = false;
    songs.map((song: any) => {
        if (song.youtubeUrl === music.youtubeUrl) {
            exists = true
        }
    })

    return exists;
}

async function insertMusicIntoQueue(roomCode: string, music: musicType): Promise<any> {
    const response:any = await fetchVideoDetails(music.youtubeUrl);
    const score = music.money * 1e6 + music.votes

    await client.zadd(`${roomCode}:queue`, score, JSON.stringify(music))
    return response
}

async function getHighestPrioritySong(roomCode: string) {
    const result:any = await client.zrevrange(`${roomCode}:queue`, 0, 0)

    return JSON.parse(result[0])
}

async function removeSong(roomCode: string, music: musicType) {
    const result = await client.zrange(`${roomCode}:queue`, 0, 0)
    const parsedSongs = result.map((song) => JSON.parse(song))
    
    if (parsedSongs.length > 0 && !songAlreadyExists(parsedSongs, music)) {
        return JSON.stringify({ message: "song is not even in the queue" })
    }

    await client.zrem(`${roomCode}:queue`, result[0])
    return JSON.stringify({ message: "song removed!" })
}

async function getSongs(roomCode: string) {
    const songs = await client.zrevrange(`${roomCode}:queue`, 0, -1, "WITHSCORES");
    const parsedSongs = songs.map((song) => JSON.parse(song))

    return JSON.stringify({ response: parsedSongs })
}

async function getCreators() { // also store channel name maybe and also their channel pfp to show in the search bar would look amazing
    const creators = await client.lrange('tuneline:creators', 0, -1);
    const parsedCreators = creators.map((creator) => JSON.parse(creator));

    return JSON.stringify({ response: parsedCreators })
}

async function closeRoom(roomCode: string, socket: WebSocketWithRoomCode){
    const socketIds = await client.smembers(`${roomCode}:sockets`);
    for (const socketId of socketIds) {
        const socket = ACTIVE_SOCKETS.get(socketId);
        if (socket) {
            socket.close();
            ACTIVE_SOCKETS.delete(socketId);
        }
    }

    await client.del(`${roomCode}`, `${roomCode}:queue`, `${roomCode}:sockets`);

    return JSON.stringify({ message: "Room Closed!" })
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
//   console.log("new connection from: ", request.socket.remoteAddress) -> for nginx testing
  socket.on("error", console.error);

  const ip = request.socket.remoteAddress?.replace(/^::ffff:/, '') || "";
  const dontLetHimGo = rateLimitByIp(ip);

  if(dontLetHimGo) {
    socket.send(JSON.stringify({ type:"rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }));
  } else {
    socket.on("message", async (data) => {
        const message = JSON.parse(data.toString());
        let admin: string, roomCode: string, username: string, response: string | musicType[], music: musicType, creators: string[], details: any;
        switch(message.type) {
            case "make-room":
                details = message.details;
                roomCode = await makeNewRoom(details, socket as WebSocketWithRoomCode);
                response = await joinRoom(roomCode, details.name, socket as WebSocketWithRoomCode);
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
                // console.log(result)
                await new Promise(resolve => setTimeout(resolve, 0.000001));
                socket.send(JSON.stringify({ type: "add-music", message: `${username} added the song result.title into the queue! vote it to play`, music: music, details: result }));
                break;
            case "delete-music":
                music = message.music;
                roomCode = message.roomCode;
                response = await removeSong(roomCode, music);
                socket.send(JSON.stringify({ type: "delete-music", message: response, music: music }));
                break;
            case "remove-song":
                music = message.music;
                roomCode = message.roomCode;
                response = await removeSong(roomCode, music) || "this is the response";
                socket.send(JSON.stringify({ type: "remove-song", message: response, music: music }));
                break;
            case "close-room":
                roomCode = message.roomCode;
                response = await closeRoom(roomCode, socket as WebSocketWithRoomCode);
                socket.send(JSON.stringify({ type: "close-room", message: response }));
                break;
            case "get-songs":
                roomCode = message.roomCode;
                response = await getSongs(roomCode);
                socket.send(JSON.stringify({ type:"get-songs", songs: response }));
                break;
            case "get-creators":
                creators = JSON.parse(await getCreators()).response;
                socket.send(JSON.stringify({ type: "get-creators", response: JSON.stringify(creators) }));
                break;
            case "get-highest":
                roomCode = message.roomCode;
                response = await getHighestPrioritySong(roomCode);
                socket.send(JSON.stringify({ response: response }))
        }
    });
  }
});
// MAKE THE ALGO FIRST INSERTING THE SONGS ON THE BASIS OF MONEY AND THEN PRIORITIZING ON THE BASIS OF VOTES THEN NORMALLY AND THEN JUST DOING THE GET SONGS -> NORMALLY -> COMPLETE 