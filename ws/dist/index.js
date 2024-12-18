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
// INSIDE THE ADMIN FUNCTION MAKE IT LIKE -> SWITCH AND ACCEPT REQUEST TYPE AND SWITCH IT LIKE DELETE-SONG, MAKE-ROOM AND THEN DO THE THING WITH THAT --> WOULD AVIOD DOING ADMIN = KAFKA.ADMIN() MULTIPLE TIMES FOR THE SAME
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const kafkajs_1 = require("kafkajs");
// PayPal payments and youtubeAPi part -> on the frontend -> the song returned by getSongs, addSongs -> use its ytUrl and send that to the ytApi 
let USERS = [];
const app = (0, express_1.default)();
const httpServer = app.listen(11011, () => {
    console.log(`Server Started at PORT:${11011}`);
});
const wss = new ws_1.WebSocketServer({ server: httpServer });
const kafka = new kafkajs_1.Kafka({
    clientId: "tune-line",
    brokers: ["192.168.29.23:9092"],
});
const numPartitons = 50; // planning to keep these 200
const TOPIC = "music-queues";
function admin() {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = kafka.admin(); // -> make it as well a global variable as it is being used everywhere
        console.log("Admin connecting...");
        yield admin.connect();
        console.log("Admin Connected!");
        console.log("Creating Topic...");
        yield admin.createTopics({
            topics: [
                {
                    topic: TOPIC,
                    numPartitions: 1,
                },
            ]
        });
        console.log("Topic Created!");
        console.log("Disconnecting admin...");
        yield admin.disconnect();
        console.log("Admin Disconnected");
    });
}
function producer(roomCode, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const producer = kafka.producer();
        const partition = getPartitionForRoomCode(roomCode);
        console.log("Connecting Producer...");
        yield producer.connect();
        console.log("Producer Connected!");
        yield producer.send({
            topic: TOPIC,
            messages: [
                { key: "song", value: JSON.stringify(data), partition: partition }
            ]
        });
        yield producer.disconnect();
    });
}
function consumer() {
    return __awaiter(this, void 0, void 0, function* () {
        const consumer = kafka.consumer({ groupId: "something" }); // --> as we have no partition for the single topic so do i need to name the consumer-group?
        yield consumer.connect();
        yield consumer.subscribe({ topics: ["music-queues"], fromBeginning: true });
        yield consumer.run({
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ message }) {
                var _b;
                console.log(`Message: ${(_b = message.value) === null || _b === void 0 ? void 0 : _b.toString()}`);
            }),
        });
    });
}
String.prototype.hashCode = function () {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        hash = (hash << 5) - hash + this.charCodeAt(i);
    }
    return hash;
};
function getPartitionForRoomCode(roomCode) {
    return Math.abs(roomCode.hashCode()) % numPartitons;
}
function createPartition(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = kafka.admin();
        yield admin.connect();
        try {
            const desiredPartition = getPartitionForRoomCode(roomCode);
            const partitionData = yield getPartitionData(roomCode);
            console.log("this the daaata ->>>>>>", desiredPartition, partitionData);
            const partition = JSON.parse(partitionData);
            console.log(partition, "inside the createPartition function 🥶🚣");
            if (partition.roomCode.length >= 1) {
                return "Room alreiady exists";
            }
            else {
                yield admin.createPartitions({
                    topicPartitions: [
                        {
                            topic: TOPIC,
                            count: desiredPartition
                        },
                    ]
                });
                console.log("room created", roomCode, "inside the createPartiton function");
                return roomCode;
            }
        }
        catch (error) {
            console.log(error);
            return JSON.stringify(error);
        }
        finally {
            yield admin.disconnect();
        }
    });
}
function getPartitionData(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const consumer = kafka.consumer({ groupId: "something" });
        yield consumer.connect();
        const desiredPartition = getPartitionForRoomCode(roomCode);
        let lastMessage = JSON.stringify({ roomCode: "", queue: [], user: "" });
        yield consumer.subscribe({ topic: TOPIC, fromBeginning: true });
        yield consumer.run({
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ partition, message }) {
                if (partition === desiredPartition) {
                    lastMessage = message.value ? JSON.parse(message.value.toString()) : lastMessage;
                }
            })
        });
        yield consumer.disconnect();
        return lastMessage;
    });
}
function makeNewRoom(admin) {
    return __awaiter(this, void 0, void 0, function* () {
        let code = Math.random().toString(36).substring(2, 8);
        const response = yield createPartition(code);
        producer(code, { roomCode: code, queue: [], user: admin });
        return response;
    });
}
function joinRoom(roomCode, username) {
    return __awaiter(this, void 0, void 0, function* () {
        const consumer = kafka.consumer({ groupId: "something" });
        const partitionIndex = getPartitionForRoomCode(roomCode);
        yield consumer.connect();
        yield consumer.subscribe({
            topic: TOPIC,
            fromBeginning: true
        });
        yield consumer.run({
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ partition, message }) {
                var _b;
                if (partition === partitionIndex) {
                    console.log("Recieved Message", (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString());
                }
            })
        });
        yield consumer.disconnect();
        return `${username} joined the room!`;
    });
}
function insertMusicIntoQueue(roomCode, music, user) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = kafka.admin();
        yield admin.connect();
        const newMessage = JSON.parse(yield getPartitionData(roomCode));
        console.log(newMessage);
        newMessage.queue.push(music);
        producer(roomCode, newMessage);
        yield admin.disconnect();
        return `${user} added the song ${music.youtubeUrl} into the queue! vote it to play`;
    });
}
function deleteMusicFromQueue(roomCode, music) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = kafka.admin();
        yield admin.connect();
        const newMessage = JSON.parse(yield getPartitionData(roomCode));
        newMessage.queue.filter((song) => song !== music);
        producer(roomCode, newMessage);
        yield admin.disconnect();
        return "admin deleted the song for the same";
    });
}
function getSongs(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = kafka.admin();
        yield admin.connect();
        const message = JSON.parse(yield getPartitionData(roomCode));
        yield admin.disconnect();
        return message.queue;
    });
}
function voteSong(roomCode, url) {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = kafka.admin();
        yield admin.connect();
        const message = JSON.parse(yield getPartitionData(roomCode));
        const newMessage = JSON.parse(message);
        const newQueue = newMessage.queue.map((song) => {
            if (song.youtubeUrl === url) {
                song.votes + 1;
                return song;
            }
            return song;
        });
        newMessage.queue = newQueue;
        producer(roomCode, newMessage);
        yield admin.disconnect();
    });
}
function closeRoom(roomCode) {
    return __awaiter(this, void 0, void 0, function* () {
        producer(roomCode, { roomCode: "", queue: [], user: "" });
        return `Room Closed!`;
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
    admin();
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
            let admin, roomCode, username, response, url, music;
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
                    console.log(roomCode);
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
                case "vote-song":
                    roomCode = message.roomCode;
                    url = message.song.url;
                    response = yield voteSong(roomCode, url);
                    socket.send(JSON.stringify({ type: "vote-song", message: response }));
                    break;
                default:
                    socket.send(JSON.stringify({ type: "error", message: "Please Try Again Later" }));
            }
        }));
    }
});
