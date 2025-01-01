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
const ws_1 = require("ws");
let USERS = [];
let ROOMS = {};
const app = (0, express_1.default)();
const httpServer = app.listen(11011, () => {
    console.log(`Server Started at PORT:${11011}`);
});
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
        ROOMS[code] = { roomCode: code, queue: [], user: admin, details: details };
        return code;
    });
}
function joinRoom(roomCode, username, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ROOMS[roomCode]) {
            socket.roomCode = roomCode;
            return `${username} joined the room!`;
        }
        return "Room not found!";
    });
}
function insertMusicIntoQueue(roomCode, music, user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ROOMS[roomCode]) {
            const queue = ROOMS[roomCode].queue;
            const existingMusicIndex = queue.findIndex((song) => song.youtubeUrl === music.youtubeUrl);
            if (existingMusicIndex !== -1) {
                queue[existingMusicIndex].votes = music.votes;
            }
            else {
                queue.push(music);
            }
            return `${user} added the song ${music.youtubeUrl} into the queue! vote it to play`;
        }
        return "Room not found!";
    });
}
function deleteMusicFromQueue(roomCode, music) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ROOMS[roomCode]) {
            ROOMS[roomCode].queue = ROOMS[roomCode].queue.filter((song) => song.youtubeUrl !== music.youtubeUrl);
            return "admin deleted the song";
        }
        return "Room not found!";
    });
}
function getSongs(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ROOMS[roomCode]) {
            return ROOMS[roomCode].queue;
        }
        return "No songs found or Room not found!";
    });
}
function closeRoom(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ROOMS[roomCode]) {
            delete ROOMS[roomCode];
            return `Room Closed!`;
        }
        return "Room not found!";
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
            let admin, roomCode, username, response, music, details;
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
                    response = yield insertMusicIntoQueue(roomCode, music, username);
                    socket.send(JSON.stringify({ type: "add-music", message: response, music: music }));
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
            }
        }));
    }
});
// MAKE THE ALGO FIRST INSERTING THE SONGS ON THE BASIS OF MONEY AND THEN PRIORITIZING ON THE BASIS OF VOTES THEN NORMALLY AND THEN JUST DOING THE GET SONGS -> NORMALLY -> COMPLETE 
