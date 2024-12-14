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
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const app_1 = require("firebase/app");
const database_1 = require("firebase/database");
const ws_1 = require("ws");
// PayPal payments and youtubeAPi part -> on the frontend -> the song returned by getSongs, addSongs -> use its ytUrl and send that to the ytApi 
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
};
const fapp = (0, app_1.initializeApp)(firebaseConfig);
const db = (0, database_1.getDatabase)(fapp);
const ROOMS = (0, database_1.ref)(db, "rooms");
let USERS = [];
const app = (0, express_1.default)();
const httpServer = app.listen(process.env.PORT, () => {
    console.log(`Server Started at PORT:${process.env.PORT}`);
});
const wss = new ws_1.WebSocketServer({ server: httpServer });
function makeNewRoom(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        let code = Math.random().toString(36).substring(2, 8);
        const roomQuery = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("roomCode"), (0, database_1.equalTo)(code));
        const snapshot = yield (0, database_1.get)(roomQuery);
        if (snapshot.exists()) {
            return makeNewRoom(admin);
        }
        else {
            yield (0, database_1.push)(ROOMS, { roomCode: code, room: [], queue: [], admin });
            return code;
        }
    });
}
function joinRoom(roomCode, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const roomQuery = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("roomCode"), (0, database_1.equalTo)(roomCode));
        const snapshot = yield (0, database_1.get)(roomQuery);
        let userJoined = false;
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const roomRef = childSnapshot.ref;
                const currentRoom = childSnapshot.val().room;
                (0, database_1.update)(roomRef, { room: [...currentRoom, username] });
                userJoined = true;
            });
            if (userJoined) {
                return `${username} joined the room.`;
            }
            else {
                return 'Failed to join the room.';
            }
        }
        else {
            return "Could not join. Room not found.";
        }
    });
}
function insertMusicIntoQueue(music, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("admin"), (0, database_1.equalTo)(admin));
        const snapshot = yield (0, database_1.get)(room);
        let isMusicInQueue;
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const roomRef = childSnapshot.ref;
                const currentQueue = childSnapshot.val().queue || [];
                isMusicInQueue = currentQueue.some((item) => item.youtubeUrl === music.youtubeUrl);
                if (isMusicInQueue) {
                    return;
                }
                else {
                    const updatedQueue = [music, ...currentQueue];
                    (0, database_1.update)(roomRef, { queue: updatedQueue });
                }
            });
            if (isMusicInQueue) {
                return "Song already exists in the queue.";
            }
            else {
                return "Music added successfully.";
            }
        }
        else {
            return "Room not found.";
        }
    });
}
function deleteMusicFromQueue(admin, music) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("admin"), (0, database_1.equalTo)(admin));
        const snapshot = yield (0, database_1.get)(room);
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const roomRef = childSnapshot.ref;
                const updatedQueue = (childSnapshot.val().queue || []).filter((song) => song.youtubeUrl !== music.youtubeUrl);
                (0, database_1.update)(roomRef, { queue: updatedQueue });
            });
            return "Music removed successfully.";
        }
        else {
            return "Room not found.";
        }
    });
}
function removeMusic(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("admin"), (0, database_1.equalTo)(admin));
        const snapshot = yield (0, database_1.get)(room);
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const roomRef = childSnapshot.ref;
                (0, database_1.update)(roomRef, { queue: childSnapshot.val().queue.pop() });
            });
            return "Removed successfully.";
        }
        else {
            return "Some error occurred.";
        }
    });
}
function getSongs(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("admin"), (0, database_1.equalTo)(admin));
        const snapshot = yield (0, database_1.get)(room);
        if (snapshot.exists()) {
            const songs = [];
            snapshot.forEach((childSnapshot) => {
                const currentRoom = childSnapshot.val();
                songs.push(...currentRoom.queue);
            });
            songs.sort((a, b) => {
                if (a.money == b.money) {
                    return b.votes - a.votes;
                }
                else {
                    return b.money - a.money;
                }
            });
            return songs;
        }
        else {
            return "Could not get the songs";
        }
    });
}
function voteSong(admin, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("admin"), (0, database_1.equalTo)(admin));
        const snapshot = yield (0, database_1.get)(room);
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const roomRef = childSnapshot.ref;
                const updatedQueue = (childSnapshot.val().queue || []).map((song) => {
                    if (song.youtubeUrl === url) {
                        return Object.assign(Object.assign({}, song), { votes: song.votes + 1 });
                    }
                });
                (0, database_1.update)(roomRef, { queue: updatedQueue });
            });
            return "Voted!";
        }
        else {
            return "Room not found.";
        }
    });
}
function closeRoom(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = (0, database_1.query)(ROOMS, (0, database_1.orderByChild)("admin"), (0, database_1.equalTo)(admin));
        const snapshot = yield (0, database_1.get)(room);
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                (0, database_1.remove)(childSnapshot.ref);
            });
            return "Room deleted!";
        }
        else {
            return "Room not found.";
        }
    });
}
function rateLimitByIp(ip) {
    let toBeRateLimited = false;
    USERS.forEach((user) => {
        if (user.ip === ip) {
            const currentTime = Date.now();
            if (currentTime - user.time >= 600000) {
                USERS.filter((user) => user.ip !== ip);
                toBeRateLimited = false;
            }
            else {
                if (user.count < 10) {
                    toBeRateLimited = false;
                }
                else {
                    user.count += 1;
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
wss.on("connection", (socket, request) => {
    var _a;
    console.log("WebSocket Connection established!");
    socket.on("error", console.error);
    const ip = ((_a = request.socket.remoteAddress) === null || _a === void 0 ? void 0 : _a.replace(/^::ffff:/, '')) || "";
    const dontLetHimGo = rateLimitByIp(ip);
    if (dontLetHimGo) {
        // user has the money then also let him go -> donot increase the counter -> they can send infinite request with money but no money increases the counter and all
    }
    else if (dontLetHimGo) {
        socket.send(JSON.stringify({ type: "rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }));
    }
    else {
        socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const message = JSON.parse(data.toString());
            let admin, roomCode, username, response, url, music, songs;
            switch (message.type) {
                case "make-room":
                    admin = message.username;
                    roomCode = yield makeNewRoom(admin);
                    socket.send(JSON.stringify({ type: "make-room", message: "created-room", roomCode: roomCode }));
                    break;
                case "join-room":
                    roomCode = message.roomCode;
                    username = message.username;
                    response = yield joinRoom(roomCode, username);
                    socket.send(JSON.stringify({ type: "join-room", message: response }));
                    break;
                case "add-music":
                    username = message.username;
                    music = message.music;
                    response = yield insertMusicIntoQueue(music, username);
                    socket.send(JSON.stringify({ type: "add-music", message: response, music: music }));
                    break;
                case "delete-music":
                    music = message.music;
                    username = message.username;
                    response = yield deleteMusicFromQueue(username, music);
                    socket.send(JSON.stringify({ type: "delete-music", message: response, music: music }));
                    break;
                case "close-room":
                    admin = message.username;
                    response = yield closeRoom(admin);
                    socket.send(JSON.stringify({ type: "close-room", message: response }));
                    break;
                case "remove-music":
                    admin = message.username;
                    response = removeMusic(admin);
                    socket.send(JSON.stringify({ type: "remove-music", message: response }));
                    break;
                case "get-songs":
                    admin = message.username;
                    response = yield getSongs(admin);
                    socket.send(JSON.stringify({ type: "get-songs", songs: response }));
                    break;
                case "vote-song":
                    admin = message.username;
                    url = message.url;
                    response = yield voteSong(admin, url);
                    socket.send(JSON.stringify({ type: "vote-song", message: response }));
                    break;
                default:
                    socket.send(JSON.stringify({ type: "error", message: "Please Try Again Later" }));
            }
        }));
    }
});
