"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ioredis_1 = __importDefault(require("ioredis"));
const ws_1 = require("ws");
let USERS = [];
let ROOMS = {};
const app = (0, express_1.default)();
const httpServer = app.listen(11011, () => {
    console.log(`Server Started at PORT:${11011}`);
});
const client = new ioredis_1.default();
const wss = new ws_1.WebSocketServer({ server: httpServer });
function rateLimitByIp(ip) {
    let toBeRateLimited = false;
    USERS.forEach((user) => {
        if (user.ip === ip) {
            const currentTime = Date.now();
            if (currentTime - user.time >= 600000) {
                USERS = USERS.filter((user) => user.ip !== ip);
                toBeRateLimited = false;
            }
            else {
                if (user.count < 10) {
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
    });
    return toBeRateLimited;
}
function makeNewRoom(admin, details) {
    return __awaiter(this, void 0, void 0, function* () {
        let code = Math.random().toString(36).substring(2, 8);
        // ROOMS[code] = { roomCode: code, queue: [], user: admin, details: details };
        yield client.hmset(`${code}`, { user: admin, createdAt: Date.now() });
        yield client.rpush('tuneline:creators', JSON.stringify({ creator: admin }));
        return code;
    });
}
function joinRoom(roomCode, username, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const ROOM = yield client.exists(`${roomCode}`);
        if (ROOM) {
            socket.roomCode = roomCode;
            return `${username} joined the room!`;
        }
        return "Room not found!";
    });
}
function songAlreadyExists(songs, music) {
    let exists = false;
    songs.map((song) => {
        if (song.youtubeUrl === music.youtubeUrl) {
            exists = true;
        }
    });
    return exists;
}
function insertMusicIntoQueue(roomCode, music) {
    return __awaiter(this, void 0, void 0, function* () {
        // if (ROOMS[roomCode]) {
        //     const queue = ROOMS[roomCode].queue;
        //     const existingMusicIndex = queue.findIndex((song) => song.youtubeUrl === music.youtubeUrl);
        const response = yield fetchVideoDetails(music.youtubeUrl);
        //     if (existingMusicIndex !== -1) {
        //         queue[existingMusicIndex].votes = music.votes;
        //     } else {
        //         queue.push(music);
        //     }
        //     return response;
        // }
        // return "Room not found!";
        const songs = yield client.lrange(`${roomCode}:queue`, 0, -1);
        const parsedSongs = songs.map((song) => JSON.parse(song));
        if (songAlreadyExists(parsedSongs, music)) {
            return "song already inside the queue";
        }
        yield client.rpush(`${roomCode}:queue`, JSON.stringify(music));
        return response;
    });
}
function deleteMusicFromQueue(roomCode, music) {
    return __awaiter(this, void 0, void 0, function* () {
        // if (ROOMS[roomCode]) {
        //     ROOMS[roomCode].queue = ROOMS[roomCode].queue.filter((song) => song.youtubeUrl !== music.youtubeUrl);
        //     return "admin deleted the song";
        // }
        // return "Room not found!";
        const songs = yield client.lrange(`${roomCode}:queue`, 0, -1);
        const parsedSongs = songs.map((song) => JSON.parse(song));
        if (!songAlreadyExists(parsedSongs, music)) {
            return "song is not even in the queue";
        }
        if (parsedSongs.length > 0) {
            yield client.lrem(`${roomCode}:queue`, 1, JSON.stringify(music));
            return "song removed";
        }
        return "song not found or room not found";
    });
}
function removeSong(roomCode, music) {
    return __awaiter(this, void 0, void 0, function* () {
        const songs = yield client.lrange(`${roomCode}:queue`, 0, -1);
        const parsedSongs = songs.map((song) => JSON.parse(song));
        if (!songAlreadyExists(parsedSongs, music)) {
            return "song is not even in the queue";
        }
        yield client.lpop(`${roomCode}:queue`);
    });
}
function getSongs(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        // if (ROOMS[roomCode]) {
        //     return ROOMS[roomCode].queue;
        // }
        const songs = yield client.lrange(`${roomCode}:queue`, 0, -1);
        if (songs.length > 0) {
            const parsedSongs = songs.map((song) => JSON.parse(song));
            return parsedSongs;
        }
        return "No songs found or Room not found!";
    });
}
function getCreators() {
    return __awaiter(this, void 0, void 0, function* () {
        // let creators = []
        // for (let i in ROOMS) {
        //     creators.push(ROOMS[i].user)
        // }
        // return creators
        const creators = yield client.lrange('tuneline:creators', 0, -1);
        const parsedCreators = creators.map((creator) => JSON.parse(creator));
        return parsedCreators;
    });
}
function closeRoom(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        // if (ROOMS[roomCode]) {
        //     delete ROOMS[roomCode];
        //     return `Room Closed!`;
        // }
        // return "Room not found!";
        yield client.del(`${roomCode}`, `${roomCode}:queue`);
        return "Room Closed!";
    });
}
function getYoutubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    return match ? match[1] : null;
}
function fetchVideoDetails(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const videoId = getYoutubeVideoId(url);
        const API_KEY = "AIzaSyA8TG3tJ3hcgrD6u8iuD0bY3kcOBwYCHk4";
        const reqUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`;
        const res = yield fetch(reqUrl);
        const data = yield res.json();
        if (data.items.length > 0) {
            const { title, channelTitle, thumbnails } = data.items[0].snippet;
            return { title, artist: channelTitle, thumbnail: thumbnails.high.url };
        }
        return null;
    });
}
wss.on("connection", (socket, request) => {
    var _a;
    console.log("WebSocket Connection established!");
    socket.on("error", console.error);
    const ip = ((_a = request.socket.remoteAddress) === null || _a === void 0 ? void 0 : _a.replace(/^::ffff:/, '')) || "";
    const dontLetHimGo = rateLimitByIp(ip);
    if (dontLetHimGo) {
        socket.send(JSON.stringify({ type: "rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }));
    }
    else {
        socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const message = JSON.parse(data.toString());
            let admin, roomCode, username, response, music, details, creators;
            switch (message.type) {
                case "make-room":
                    admin = message.username;
                    details = message.details;
                    roomCode = yield makeNewRoom(admin, details);
                    response = yield joinRoom(roomCode, admin, socket);
                    socket.send(JSON.stringify({ type: "make-room", message: "created-room", roomCode: roomCode, response: response }));
                    break;
                case "join-room":
                    roomCode = message.roomCode;
                    username = message.username;
                    response = yield joinRoom(roomCode, username, socket);
                    socket.send(JSON.stringify({ type: "join-room", message: response, roomCode: roomCode }));
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode && client !== socket) {
                            client.send(JSON.stringify({ type: "join-room", message: response }));
                        }
                    });
                    break;
                case "add-music":
                    username = message.username;
                    music = message.music;
                    roomCode = message.roomCode;
                    const result = yield insertMusicIntoQueue(roomCode, music);
                    // console.log(result)
                    yield new Promise(resolve => setTimeout(resolve, 0.000001));
                    socket.send(JSON.stringify({ type: "add-music", message: `${username} added the song result.title into the queue! vote it to play`, music: music, details: result }));
                    break;
                case "delete-music":
                    music = message.music;
                    roomCode = message.roomCode;
                    response = yield deleteMusicFromQueue(roomCode, music);
                    socket.send(JSON.stringify({ type: "delete-music", message: response, music: music }));
                    break;
                case "close-room":
                    roomCode = message.roomCode;
                    response = yield closeRoom(roomCode);
                    socket.send(JSON.stringify({ type: "close-room", message: response }));
                    break;
                case "get-songs":
                    roomCode = message.roomCode;
                    response = yield getSongs(roomCode);
                    socket.send(JSON.stringify({ type: "get-songs", songs: response }));
                    break;
                case "get-creators":
                    creators = yield getCreators();
                    socket.send(JSON.stringify({ type: "get-creators", response: JSON.stringify(creators) }));
                    break;
            }
        }));
    }
});
// MAKE THE ALGO FIRST INSERTING THE SONGS ON THE BASIS OF MONEY AND THEN PRIORITIZING ON THE BASIS OF VOTES THEN NORMALLY AND THEN JUST DOING THE GET SONGS -> NORMALLY -> COMPLETE 
