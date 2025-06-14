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
let ACTIVE_SOCKETS = new Map();
let CURRENTLY_PLAYING = new Map(); // Track currently playing song per room
const PORT = process.env.PORT || 11011;
const app = (0, express_1.default)();
const httpServer = app.listen(PORT, () => {
    console.log(`Server Started at PORT:${PORT}`);
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
function makeNewRoom(details, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        let code = Math.random().toString(36).substring(2, 8);
        yield client.hmset(`${code}`, {
            user: details.name,
            createdAt: Date.now(),
            streamUrl: details.streamUrl || "" // Store stream URL
        });
        yield client.hmset(`${code}:sockets`, { socketId: socket.id });
        yield client.rpush('tuneline:creators', JSON.stringify({ creator: details.name, channelProfile: details.profilePic }));
        ACTIVE_SOCKETS.set(socket.id, socket);
        return JSON.stringify({ roomCode: code, message: "Room Created!", videoUrl: details.videoUrl, streamUrl: details.streamUrl });
    });
}
function joinRoom(roomCode, username, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const ROOM = yield client.exists(`${roomCode}`);
        yield client.hmset(`${roomCode}:sockets`, { socketId: socket.id });
        ACTIVE_SOCKETS.set(socket.id, socket);
        if (ROOM) {
            socket.roomCode = roomCode;
            return JSON.stringify({ message: `${username} joined the room!` });
        }
        return JSON.stringify({ message: "Invalid room code!" });
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
        const response = yield fetchVideoDetails(music.youtubeUrl);
        // Priority algorithm: money * 1e6 + votes
        // This ensures money has higher priority than votes
        const score = music.money * 1e6 + music.votes;
        // Create complete song data with video details
        const completeSong = Object.assign(Object.assign({}, music), { title: (response === null || response === void 0 ? void 0 : response.title) || 'Unknown Title', artist: (response === null || response === void 0 ? void 0 : response.artist) || 'Unknown Artist', thumbnail: (response === null || response === void 0 ? void 0 : response.thumbnail) || '', votedBy: music.votedBy || [], addedAt: Date.now() // Add timestamp for tie-breaking
         });
        yield client.zadd(`${roomCode}:queue`, score, JSON.stringify(completeSong));
        return response;
    });
}
function getHighestPrioritySong(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.zrevrange(`${roomCode}:queue`, 0, 0);
        return JSON.parse(result[0]);
    });
}
function removeSong(roomCode, music) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.zrange(`${roomCode}:queue`, 0, -1);
        const parsedSongs = result.map((song) => JSON.parse(song));
        // Find the specific song to remove
        const songToRemove = parsedSongs.find((song) => song.youtubeUrl === music.youtubeUrl);
        if (!songToRemove) {
            return JSON.stringify({ message: "song is not in the queue" });
        }
        // Remove the specific song by its score and value
        const score = songToRemove.money * 1e6 + songToRemove.votes;
        yield client.zrem(`${roomCode}:queue`, JSON.stringify(songToRemove));
        return JSON.stringify({ message: "song removed!" });
    });
}
function getSongs(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const songs = yield client.zrevrange(`${roomCode}:queue`, 0, -1);
        const parsedSongs = songs.map((song) => JSON.parse(song));
        return parsedSongs;
    });
}
function getCreators() {
    return __awaiter(this, void 0, void 0, function* () {
        const creators = yield client.lrange('tuneline:creators', 0, -1);
        const parsedCreators = creators.map((creator) => JSON.parse(creator));
        return JSON.stringify({ response: parsedCreators });
    });
}
function closeRoom(roomCode, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        const socketIds = yield client.smembers(`${roomCode}:sockets`);
        for (const socketId of socketIds) {
            const socket = ACTIVE_SOCKETS.get(socketId);
            if (socket) {
                socket.close();
                ACTIVE_SOCKETS.delete(socketId);
            }
        }
        yield client.del(`${roomCode}`, `${roomCode}:queue`, `${roomCode}:sockets`);
        return JSON.stringify({ message: "Room Closed!" });
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
    //   console.log("new connection from: ", request.socket.remoteAddress) -> for nginx testing
    socket.on("error", console.error);
    // Generate a unique ID for the socket
    socket.id = Math.random().toString(36).substring(2, 15);
    const ip = ((_a = request.socket.remoteAddress) === null || _a === void 0 ? void 0 : _a.replace(/^::ffff:/, '')) || "";
    const dontLetHimGo = rateLimitByIp(ip);
    if (dontLetHimGo) {
        socket.send(JSON.stringify({ type: "rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }));
    }
    else {
        socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
            const message = JSON.parse(data.toString());
            let roomCode, username, response, music, creators, details, roomDetails;
            switch (message.type) {
                case "make-room":
                    details = message.details;
                    roomDetails = JSON.parse(yield makeNewRoom(details, socket));
                    response = yield joinRoom(roomDetails.roomCode, details.name, socket);
                    socket.send(JSON.stringify({ type: "make-room", message: "created-room", roomCode: roomDetails.roomCode, response: response }));
                    break;
                case "join-room":
                    roomCode = message.roomCode;
                    username = message.username;
                    response = yield joinRoom(roomCode, username, socket);
                    socket.send(JSON.stringify({ type: "join-room", message: response, roomCode: roomCode }));
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode && client !== socket) {
                            client.send(JSON.stringify({
                                type: "join-room",
                                message: response,
                                roomCode: roomCode,
                                username: username
                            }));
                        }
                    });
                    break;
                case "add-music":
                    username = message.username;
                    music = message.music;
                    roomCode = message.roomCode;
                    const result = yield insertMusicIntoQueue(roomCode, music);
                    yield new Promise(resolve => setTimeout(resolve, 0.000001));
                    // Check if there's currently a song playing
                    const currentlyPlaying = CURRENTLY_PLAYING.get(roomCode);
                    const shouldUpdateVideo = !currentlyPlaying; // Only update if no song is playing
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode) {
                            client.send(JSON.stringify({
                                type: "add-music",
                                message: `${username} added the song ${(result === null || result === void 0 ? void 0 : result.title) || 'Unknown'} into the queue! vote it to play`,
                                music: music,
                                details: result,
                                shouldUpdateVideo: shouldUpdateVideo, // Tell frontend whether to update video
                                username: username // Include username for chat notifications
                            }));
                        }
                    });
                    break;
                case "remove-song":
                    music = message.music;
                    roomCode = message.roomCode;
                    response = (yield removeSong(roomCode, music)) || "this is the response";
                    socket.send(JSON.stringify({ type: "remove-song", message: response, music: music }));
                    // Broadcast the removal to all clients in the room
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode) {
                            client.send(JSON.stringify({ type: "delete-music", music: music }));
                        }
                    });
                    break;
                case "close-room":
                    roomCode = message.roomCode;
                    response = yield closeRoom(roomCode, socket);
                    socket.send(JSON.stringify({ type: "close-room", message: response }));
                    break;
                case "get-songs":
                    roomCode = message.roomCode;
                    response = yield getSongs(roomCode);
                    socket.send(JSON.stringify({ type: "get-songs", songs: response }));
                    break;
                case "get-creators":
                    creators = JSON.parse(yield getCreators()).response;
                    socket.send(JSON.stringify({ type: "get-creators", response: JSON.stringify(creators) }));
                    break;
                case "get-highest":
                    roomCode = message.roomCode;
                    response = yield getHighestPrioritySong(roomCode);
                    socket.send(JSON.stringify({ response: response }));
                    break;
                case "get-room-details":
                    roomCode = message.roomCode;
                    const roomInfo = yield client.hgetall(`${roomCode}`);
                    const creatorDetails = yield client.lrange('tuneline:creators', 0, -1);
                    const parsedCreators = creatorDetails.map((creator) => JSON.parse(creator));
                    const roomCreator = parsedCreators.find((creator) => creator.creator === roomInfo.user);
                    socket.send(JSON.stringify({
                        type: "room-details",
                        details: {
                            creator: roomInfo.user || "Unknown",
                            channelProfile: (roomCreator === null || roomCreator === void 0 ? void 0 : roomCreator.channelProfile) || "/test.jpg",
                            streamUrl: roomInfo.streamUrl || ""
                        }
                    }));
                    break;
                case "start-song":
                    roomCode = message.roomCode;
                    const songToStart = message.music;
                    CURRENTLY_PLAYING.set(roomCode, songToStart);
                    // Broadcast to all clients that a song has started
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode) {
                            client.send(JSON.stringify({
                                type: "song-started",
                                music: songToStart
                            }));
                        }
                    });
                    break;
                case "end-song":
                    roomCode = message.roomCode;
                    CURRENTLY_PLAYING.delete(roomCode);
                    // Get the next highest priority song
                    const nextSong = yield getHighestPrioritySong(roomCode);
                    if (nextSong) {
                        // Remove the song from queue and start it
                        yield client.zrem(`${roomCode}:queue`, JSON.stringify(nextSong));
                        CURRENTLY_PLAYING.set(roomCode, nextSong);
                        // Broadcast the next song to all clients
                        wss.clients.forEach((client) => {
                            if (client.roomCode === roomCode) {
                                client.send(JSON.stringify({
                                    type: "next-song",
                                    music: nextSong
                                }));
                            }
                        });
                    }
                    else {
                        // No more songs in queue
                        wss.clients.forEach((client) => {
                            if (client.roomCode === roomCode) {
                                client.send(JSON.stringify({
                                    type: "queue-empty"
                                }));
                            }
                        });
                    }
                    break;
                case "vote-song":
                    roomCode = message.roomCode;
                    const songUrl = message.url;
                    const admin = message.admin;
                    // Get all songs and find the one to vote for
                    const allSongs = yield client.zrange(`${roomCode}:queue`, 0, -1);
                    const parsedAllSongs = allSongs.map((song) => JSON.parse(song));
                    const songToVote = parsedAllSongs.find((song) => song.youtubeUrl === songUrl);
                    if (songToVote) {
                        // Remove the old song
                        yield client.zrem(`${roomCode}:queue`, JSON.stringify(songToVote));
                        // Initialize votedBy array if it doesn't exist
                        if (!songToVote.votedBy) {
                            songToVote.votedBy = [];
                        }
                        const userHasVoted = songToVote.votedBy.includes(admin);
                        if (userHasVoted) {
                            // User has already voted, so unvote
                            songToVote.votedBy = songToVote.votedBy.filter((email) => email !== admin);
                            songToVote.votes -= 1;
                        }
                        else {
                            // User hasn't voted, so vote
                            songToVote.votedBy.push(admin);
                            songToVote.votes += 1;
                        }
                        // Ensure votes don't go below 0
                        if (songToVote.votes < 0) {
                            songToVote.votes = 0;
                        }
                        // Use the same priority algorithm: money * 1e6 + votes
                        const newScore = songToVote.money * 1e6 + songToVote.votes;
                        yield client.zadd(`${roomCode}:queue`, newScore, JSON.stringify(songToVote));
                        // Broadcast the updated song to all clients
                        wss.clients.forEach((client) => {
                            if (client.roomCode === roomCode) {
                                client.send(JSON.stringify({
                                    type: "vote-updated",
                                    music: songToVote,
                                    action: userHasVoted ? "unvoted" : "voted"
                                }));
                            }
                        });
                    }
                    break;
                case "queue-empty":
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode) {
                            client.send(JSON.stringify({
                                type: "queue-empty"
                            }));
                        }
                    });
                    break;
                case "chat-message":
                    const chatUsername = message.username;
                    const chatMessage = message.message;
                    roomCode = message.roomCode;
                    // Broadcast chat message to all clients in the room
                    wss.clients.forEach((client) => {
                        if (client.roomCode === roomCode) {
                            client.send(JSON.stringify({
                                type: "chat-message",
                                username: chatUsername,
                                message: chatMessage
                            }));
                        }
                    });
                    break;
            }
        }));
    }
});
// MAKE THE ALGO FIRST INSERTING THE SONGS ON THE BASIS OF MONEY AND THEN PRIORITIZING ON THE BASIS OF VOTES THEN NORMALLY AND THEN JUST DOING THE GET SONGS -> NORMALLY -> COMPLETE 
