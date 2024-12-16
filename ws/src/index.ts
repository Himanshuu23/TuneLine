require('dotenv').config()

import express from "express";
import { CLOSING, WebSocketServer } from "ws";
import { Kafka } from "kafkajs";

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

// PayPal payments and youtubeAPi part -> on the frontend -> the song returned by getSongs, addSongs -> use its ytUrl and send that to the ytApi 

let USERS:RateLimitingType[] = [];

const app = express();
const httpServer = app.listen(11011, () => {
  console.log(`Server Started at PORT:${11011}`);
});

const wss = new WebSocketServer({ server: httpServer });

const kafka = new Kafka({ // for the url for the broker use the .env later -> the port assigned to the website and not the one using kafka on -> as right now running on local machine so using ip address for the same
    clientId: "tune-line",
    brokers: ["192.168.29.23"],
});

async function admin() {
    const admin = kafka.admin();
    console.log("Admin connecting...");
    await admin.connect();
    console.log("Admin Connected!");

    console.log("Creating Topic...")
    await admin.createTopics({

       topics: [ 
        {        
            topic: 'music-queues',
            numPartitions: 1,
        },
       ]
    });
    console.log("Topic Created!");

    console.log("Disconnecting admin...");
    await admin.disconnect();
    console.log("Admin Disconnected");
}

async function producer() {
    const producer = kafka.producer();

    console.log("Connecting Producer...")
    await producer.connect();
    console.log("Producer Connected!")

    await producer.send({
        topic: 'music-queues',
        partition: 0,
        messages: [
            { key: "song", value: JSON.stringify({ roomCode: "ABCD", ytUrl: "https://youtube.com/song", votes: "0", admin: "user123" }) }
        ]
    })

    await producer.disconnect();
}

async function consumer() {
    const consumer = kafka.consumer({ groupId: "something" }); // --> as we have no partition for the single topic so do i need to name the consumer-group?
    await consumer.connect();
    
    await consumer.subscribe({ topics: ["music-queues"], fromBeginning: true })

    await consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
            console.log(`${topic}: Part:${partition}: ${message.data.toString()}`)
        };
    });
}

async function makeNewRoom(admin: string): Promise<string> {
  let code = Math.random().toString(36).substring(2, 8);
  // push(ROOMS, { roomCode: code, room: [], queue: [], admin });
}

async function joinRoom(roomCode: string, username: string): Promise<string> {
}

async function insertMusicIntoQueue(music: musicType, admin: string): Promise<string> {
}

async function deleteMusicFromQueue(admin: string, music: musicType): Promise<string> { // this is if some user adds an inappropriate song inside the queue so the admin can remove the song directly from the queue
}

async function removeMusic(admin: string) {
}

async function getSongs(admin:string) {
}

async function voteSong(admin:string, url:string) {
}

async function closeRoom(admin: string): Promise<string> {
}

function rateLimitByIp(ip:string):boolean {
    let toBeRateLimited:boolean = false;
    USERS.forEach((user) => {
        if(user.ip === ip) {
            const currentTime = Date.now();
            if(currentTime - user.time >= 600000) {
                USERS.filter((user) => user.ip !== ip)
                toBeRateLimited = false;
            }
            else {
                if(user.count < 10) {
                    toBeRateLimited = false;
                }
                else {
                    user.count += 1;
                    toBeRateLimited = true;
                }
            }
        }
        else {
            USERS.push({ ip:ip, count: 1, time: Date.now() });
            toBeRateLimited = false;
        }
    })
    return toBeRateLimited;
}

wss.on("connection", (socket, request) => {
  console.log("WebSocket Connection established!");
  socket.on("error", console.error);

  const ip = request.socket.remoteAddress?.replace(/^::ffff:/, '') || "";
  const dontLetHimGo:boolean = rateLimitByIp(ip);

  if(dontLetHimGo){ 
    // user has the money then also let him go -> donot increase the counter -> they can send infinite request with money but no money increases the counter and all
  } else if(dontLetHimGo) {
    socket.send(JSON.stringify({ type:"rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }))
  } else {
        socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());
            let admin, roomCode, username, response, url, music, songs;
            switch(message.type) {
                case "make-room": 
                    admin = message.username;
                    roomCode = await makeNewRoom(admin);
                    socket.send(JSON.stringify({ type:"make-room", message: "created-room", roomCode:roomCode }));
                    break;
                case "join-room":
                    roomCode = message.roomCode;
                    username = message.username;
                    response = await joinRoom(roomCode, username);
                    socket.send(JSON.stringify({ type:"join-room", message: response }));
                    console.log(roomCode)
                    break;
                case "add-music":
                    username = message.username;
                    music = message.music;
                    response = await insertMusicIntoQueue(music, username);
                    socket.send(JSON.stringify({ type:"add-music", message: response, music: music }));
                    break;
                case "delete-music":
                    music = message.music;
                    username = message.username;
                    response = await deleteMusicFromQueue(username, music);
                    socket.send(JSON.stringify({ type:"delete-music", message: response, music: music }));
                    break;
                case "close-room":
                    admin = message.username;
                    response = await closeRoom(admin);
                    socket.send(JSON.stringify({ type:"close-room", message: response }));
                    break;
                case "remove-music":
                    admin = message.username;
                    response = removeMusic(admin);
                    socket.send(JSON.stringify({ type:"remove-music", message: response }));
                    break;
                case "get-songs":
                    admin = message.username;
                    response = await getSongs(admin);
                    socket.send(JSON.stringify({ type:"get-songs", songs: response }));
                    break;
                case "vote-song":
                    admin = message.username;
                    url = message.url;
                    response = await voteSong(admin, url);
                    socket.send(JSON.stringify({ type:"vote-song", message: response }));
                    break;
                default:
                    socket.send(JSON.stringify({ type: "error", message: "Please Try Again Later" }));
            } 
        });
    }
    
});

