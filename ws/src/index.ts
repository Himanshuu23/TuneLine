require('dotenv').config()
// INSIDE THE ADMIN FUNCTION MAKE IT LIKE -> SWITCH AND ACCEPT REQUEST TYPE AND SWITCH IT LIKE DELETE-SONG, MAKE-ROOM AND THEN DO THE THING WITH THAT --> WOULD AVIOD DOING ADMIN = KAFKA.ADMIN() MULTIPLE TIMES FOR THE SAME
import express from "express";
import { WebSocketServer } from "ws";
import { Kafka, KafkaMessage } from "kafkajs";

declare global {
    interface String {
        hashCode(): number
    }
}

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

type partitionType = {
    partitionId: number,
    data: partitionType[]
}

// PayPal payments and youtubeAPi part -> on the frontend -> the song returned by getSongs, addSongs -> use its ytUrl and send that to the ytApi 

let USERS:RateLimitingType[] = [];

const app = express();
const httpServer = app.listen(11011, () => {
  console.log(`Server Started at PORT:${11011}`);
});

const wss = new WebSocketServer({ server: httpServer });

const kafka = new Kafka({ // for the url for the broker use the .env later -> the port assigned to the website and not the one using kafka on -> as right now running on local machine so using ip address for the same
    clientId: "tune-line",
    brokers: ["192.168.29.23:9092"],
});

const numPartitons = 50; // planning to keep these 200
const TOPIC = "music-queues";

async function admin() {
    const admin = kafka.admin(); // -> make it as well a global variable as it is being used everywhere
    console.log("Admin connecting...");
    await admin.connect();
    console.log("Admin Connected!");

    console.log("Creating Topic...")
    await admin.createTopics({

       topics: [ 
        {        
            topic: TOPIC,
            numPartitions: 1,
        },
       ]
    });
    console.log("Topic Created!");

    console.log("Disconnecting admin...");
    await admin.disconnect();
    console.log("Admin Disconnected");
}

async function producer(roomCode: string, data: dataType) { // -> data would be of the type push(ROOMS, { roomCode: code, room: [], queue: [], admin });
    console.log("inside the producer function")
    const producer = kafka.producer();
    const partition = getPartitionForRoomCode(roomCode);

    console.log("Connecting Producer...")
    await producer.connect();
    console.log("Producer Connected!")

    await producer.send({
        topic: TOPIC,
        messages: [
            { key: "song", value: JSON.stringify(data), partition: partition }
        ]
    })

    await producer.disconnect();
}

async function consumer() {
    const consumer = kafka.consumer({ groupId: "something" }); // --> as we have no partition for the single topic so do i need to name the consumer-group?
    await consumer.connect();
    
    await consumer.subscribe({ topics: ["music-queues"], fromBeginning: true })

    await consumer.run({
        eachMessage: async ({ message}: {message: KafkaMessage}) => {
            console.log(`Message: ${message.value?.toString()}`)
        },
    });
}

String.prototype.hashCode = function () {
    let hash = 0
    for (let i = 0; i < this.length; i++){
        hash = (hash << 5) - hash + this.charCodeAt(i);
    }

    return hash;
}

function getPartitionForRoomCode(roomCode: string) {
    return Math.abs(roomCode.hashCode()) % numPartitons;
}

async function createPartition(roomCode:string) {
    const admin = kafka.admin();
    await admin.connect();
    try {
        const desiredPartition = getPartitionForRoomCode(roomCode);
        const partitionData = await getPartitionData(roomCode)
        const partition:dataType = JSON.parse(partitionData);
        if( partition.roomCode.length >= 1 ) {
           return "Room alreiady exists"
        }
        else {
            await admin.createPartitions({
                topicPartitions: [
                    {
                        topic: TOPIC,
                        count: desiredPartition
                    },
                ]
            })
            console.log("room created", roomCode, "inside the createPartiton function")
            return roomCode
        }
    } catch (error) {
       console.log(error);
       return JSON.stringify(error);
    } finally {
        await admin.disconnect();
    }
}

async function getPartitionData(roomCode: string): Promise<string> {
    const consumer = kafka.consumer({ groupId: "something" })
    await consumer.connect();

    const desiredPartition = getPartitionForRoomCode(roomCode);
    let lastMessage = JSON.stringify({ roomCode: "", queue: [], user: "" })

    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    
    return new Promise((resolve, reject) => {
        let resolved = false;

        consumer.run({
            eachMessage: async ({ partition, message}: { partition:number, message:KafkaMessage }) => {
                if (partition === desiredPartition) {
                    lastMessage = message.value?.toString() || lastMessage;
                    if(!resolved) {
                        resolved = true;
                        await consumer.disconnect();
                        resolve(lastMessage);
                    }
                }
            },
        }).catch(async (err) => {
                await consumer.disconnect()
                reject(err);
        });

        setTimeout(async () => {
            if (!resolved) {
                resolved = true;
                await consumer.disconnect();
                resolve(lastMessage);
            }
        }, 3000);
    })
}        

async function makeNewRoom(admin: string): Promise<string> { // returns string -> roomCode
  let code = Math.random().toString(36).substring(2, 8);
  const response = await createPartition(code)
  producer(code, { roomCode: code, queue: [], user: admin });
  console.log(response);
  return response;
}

async function joinRoom(roomCode: string, username: string): Promise<string> { // send response who joined the room and if could not then send the response back for the same
    const consumer = kafka.consumer({ groupId: "something" })
    const partitionIndex = getPartitionForRoomCode(roomCode)
    await consumer.connect()
    await consumer.subscribe({
        topic: TOPIC,
        fromBeginning: true
    })
    await consumer.run({
        eachMessage: async ({ partition, message }: { partition: number, message: KafkaMessage }) => {
            if (partition === partitionIndex) {
                console.log("Recieved Message", message.value?.toString())
            }
        }
    })
    await consumer.disconnect()
    return `${username} joined the room!`
}

async function insertMusicIntoQueue(roomCode:string, music: musicType, user: string): Promise<string> { // the response would be like this guy added this music 
    const admin = kafka.admin();
    await admin.connect();
        
    const newMessage = JSON.parse(await getPartitionData(roomCode))
    console.log(newMessage) 
    newMessage.queue.push(music)

    producer(roomCode, newMessage)
    await admin.disconnect()
    return `${user} added the song ${music.youtubeUrl} into the queue! vote it to play`
}

async function deleteMusicFromQueue(roomCode: string, music: musicType): Promise<string> { // this is if some user adds an inappropriate song inside the queue so the admin can remove the song directly from the queue, admin removed the music -> maybe donot show the music deleted by the admin on the UI since this would be bad for the streamer
   const admin = kafka.admin();
   await admin.connect();

   const newMessage = JSON.parse(await getPartitionData(roomCode))
   newMessage.queue.filter((song:musicType) => song !== music);

   producer(roomCode, newMessage);
   await admin.disconnect()
   return "admin deleted the song for the same"
}

async function getSongs(roomCode :string) { // we have to get all the sons from the room using the roomCode and return those
    const admin = kafka.admin();
    await admin.connect();

    const message = JSON.parse(await getPartitionData(roomCode));

    await admin.disconnect()
    return message.queue
}

async function voteSong(roomCode: string, url:string) { // just increase the vote and return the following user voted the followin song
    const admin = kafka.admin();
    await admin.connect();

    const message = JSON.parse(await getPartitionData(roomCode));
    const newMessage = JSON.parse(message);
    const newQueue = newMessage.queue.map((song:musicType) => {
        if (song.youtubeUrl === url) {
            song.votes + 1
            return song
        }
        return song
    })
    newMessage.queue = newQueue
    producer(roomCode, newMessage)
    await admin.disconnect()
}

async function closeRoom(roomCode: string): Promise<string> { // just close the room and show the response back to the admin for the same and remove the data for the following partition from the queue
    producer(roomCode, { roomCode: "", queue: [], user: "" })
    return `Room Closed!`
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
  admin();  
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
            let admin, roomCode, username, response, url, music;
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
                    roomCode = message.roomCode;
                    response = await insertMusicIntoQueue(roomCode, music, username);
                    socket.send(JSON.stringify({ type:"add-music", message: response, music: music }));
                    break;
                case "delete-music":
                    music = message.music;
                    roomCode = message.roomCode;
                    response = await deleteMusicFromQueue(roomCode, music);
                    socket.send(JSON.stringify({ type:"delete-music", message: response, music: music }));
                    break;
                case "close-room":
                    roomCode = message.roomCode;
                    response = await closeRoom(roomCode);
                    socket.send(JSON.stringify({ type:"close-room", message: response }));
                    break;
                case "get-songs":
                    roomCode = message.roomCode;
                    response = await getSongs(roomCode);
                    socket.send(JSON.stringify({ type:"get-songs", songs: response }));
                    break;
                case "vote-song":
                    roomCode = message.roomCode;
                    url = message.song.url;
                    response = await voteSong(roomCode, url);
                    socket.send(JSON.stringify({ type:"vote-song", message: response }));
                    break;
                default:
                    socket.send(JSON.stringify({ type: "error", message: "Please Try Again Later" }));
            } 
        });
    }
    
});

