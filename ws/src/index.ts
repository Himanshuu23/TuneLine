import express from "express";
import { FirebaseOptions, initializeApp } from "firebase/app";
import { DataSnapshot, equalTo, get, getDatabase, orderByChild, push, query, ref, remove, update } from "firebase/database";
import { WebSocketServer } from "ws";

type musicType = {
  youtubeUrl: string,
  money: number,
  votes: number
};

type RateLimitingType = {
    ip: string,
    count: number,
    time: Date 
};

// PayPal payments and youtubeAPi part -> on the frontend -> the song returned by getSongs, addSongs -> use its ytUrl and send that to the ytApi 
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
};

const fapp = initializeApp(firebaseConfig);
const db = getDatabase(fapp);
const ROOMS = ref(db, "rooms");

let USERS:RateLimitingType[] = [];

const app = express();
const httpServer = app.listen(process.env.PORT, () => {
  console.log(`Server Started at PORT:${process.env.PORT}`);
});

const wss = new WebSocketServer({ server: httpServer });

async function makeNewRoom(admin: string): Promise<string> {
  let code = Math.random().toString(36).substring(2, 8);
  const roomQuery = query(ROOMS, orderByChild("roomCode"), equalTo(code));
  const snapshot = await get(roomQuery);
  
  if (snapshot.exists()) {
    return makeNewRoom(admin);
  } else {
    await push(ROOMS, { roomCode: code, room: [], queue: [], admin });
    return code;
  }
}

async function joinRoom(roomCode: string, username: string): Promise<string> {
  const roomQuery = query(ROOMS, orderByChild("roomCode"), equalTo(roomCode));
  const snapshot = await get(roomQuery);

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const roomRef = childSnapshot.ref;
      const currentRoom = childSnapshot.val().room;
      update(roomRef, { room: [...currentRoom, username] });
      return `${username} joined the room.`;
    });
  } else {
    return "Could not join. Room not found.";
  }
}

async function insertMusicIntoQueue(music: musicType, admin: string): Promise<string> {
  const room = query(ROOMS, orderByChild("admin"), equalTo(admin));
  const snapshot = await get(room);

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      const roomRef = childSnapshot.ref;
      const currentQueue = childSnapshot.val().queue || [];
      
      const isMusicInQueue = currentQueue.some(
        (item: musicType) => item.youtubeUrl === music.youtubeUrl
      );
      
      if (isMusicInQueue) {
        return "Song already exists in the queue.";
      } else {
        const updatedQueue = [music, ...currentQueue];
        update(roomRef, { queue: updatedQueue });
        return "Music added successfully.";
      }
    });
  } else {
    return "Room not found.";
  }
}

async function deleteMusicFromQueue(admin: string, music: musicType): Promise<string> { // this is if some user adds an inappropriate song inside the queue so the admin can remove the song directly from the queue
  const room = query(ROOMS, orderByChild("admin"), equalTo(admin));
  const snapshot = await get(room);

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      const roomRef = childSnapshot.ref;
      const updatedQueue = (childSnapshot.val().queue || []).filter(
        (song: musicType) => song.youtubeUrl !== music.youtubeUrl
      );
      update(roomRef, { queue: updatedQueue });
    });
    return "Music removed successfully.";
  } else {
    return "Room not found.";
  }
}

async function removeMusic(admin: string) {
  const room = query(ROOMS, orderByChild("admin"), equalTo(admin));
  const snapshot = await get(room);

  if(snapshot.exists()) {
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      const roomRef = childSnapshot.ref;
      update(roomRef, { queue: childSnapshot.val().queue.pop() })
    })
    return "Removed successfully."
  } else {
    return "Some error occurred."
  }
}

async function getSongs(admin:string) {
  const room = query(ROOMS, orderByChild("admin"), equalTo(admin));
  const snapshot = await get(room);

  if(snapshot.exists()) {
    const songs:musicType[] = [];
    snapshot.forEach((childSnapshot:DataSnapshot) => {
      const currentRoom = childSnapshot.val();
      songs.push(...currentRoom.queue);
    })
    songs.sort((a, b) => {
        if(a.money == b.money) {
            return b.votes - a.votes
        } else {
            return b.money - a.money
        }
    })
    return songs;
  } else {
    return "Could not get the songs";
  }
}

async function voteSong(admin:string, url:string) {
  const room = query(ROOMS, orderByChild("admin"), equalTo(admin));
  const snapshot = await get(room);

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      const roomRef = childSnapshot.ref;
      const updatedQueue = (childSnapshot.val().queue || []).map(
        (song:musicType) => {
          if(song.youtubeUrl === url){
            return {...song, votes: song.votes + 1}
          }
      });
      update(roomRef, { queue: updatedQueue });
    });
    return "Voted!";
  } else {
    return "Room not found.";
  }
}

async function closeRoom(admin: string): Promise<string> {
  const room = query(ROOMS, orderByChild("admin"), equalTo(admin));
  const snapshot = await get(room);

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot: DataSnapshot) => {
      remove(childSnapshot.ref);
    });
    return "Room deleted!";
  } else {
    return "Room not found.";
  }
}

function rateLimitByIp(ip:string) {
    USERS.forEach((user) => {
        if(user.ip === ip) {
            const currentTime = Date.now();
            if(currentTime - user.time >= 600000) {
                USERS.filter((user) => user.ip !== ip)
                return false;
            }
            else {
                if(user.count < 10) {
                    return false;
                }
                else {
                    user.count += 1;
                    return true;
                }
            }
        }
        else {
            USERS.push({ ip:ip, count: 1, time: Date.now() });
        }
    })
}

wss.on("connection", (socket, request) => {
  console.log("WebSocket Connection established!");
  
  socket.on("error", console.error);

  const dontLetHimGo = rateLimitByIp(request.socket.remoteAddress);

  if(){
    // user has the money then also let him go -> donot increase the counter -> they can send infinite request with money but no money increases the counter and all
  }
  } else if(dontLetHimGo) {
    socket.send(JSON.stringify({ type:"rate-limited", message: "Honey! You have been rate limited. Please try again after a while." }))
  } else {
        socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());
            switch(message.type) {
                case "make-room": 
                    const admin = message.username;
                    const roomCode = await makeNewRoom(admin);
                    socket.send(JSON.stringify({ type:"make-room", message: "created-room", roomCode:roomCode }));
                    break;
                case "join-room":
                    const roomCode = message.roomCode;
                    const username = message.username;
                    const response = await joinRoom(roomCode, username);
                    socket.send(JSON.stringify({ type:"join-room", message: response }));
                    break;
                case "add-music":
                    const username = message.username;
                    const music = message.music;
                    const response = await insertMusicIntoQueue(music, username);
                    socket.send(JSON.stringify({ type:"add-music", message: response, music: music }));
                    break;
                case "delete-music":
                    const music = message.music;
                    const username = message.username;
                    const response = await deleteMusicFromQueue(username, music);
                    socket.send(JSON.stringify({ type:"delete-music", message: response, music: music }));
                    break;
                case "close-room":
                    const admin = message.username;
                    const response = await closeRoom(admin);
                    socket.send(JSON.stringify({ type:"close-room", message: response }));
                    break;
                case "remove-music":
                    const admin = message.username;
                    const response = removeMusic(admin);
                    socket.send(JSON.stringify({ type:"remove-music", message: response }));
                    break;
                case "get-songs":
                    const admin = message.username;
                    const response = await getSongs(admin);
                    socket.send(JSON.stringify({ type:"get-songs", message: response }));
                    break;
                case "vote-song":
                    const admin = message.username;
                    const url = message.url;
                    const response = await voteSong(admin, url);
                    socket.send(JSON.stringify({ type:"vote-song", message: response }));
                    break;
                default:
                    socket.send(JSON.stringify({ type: "error", message: "Please Try Again Later" }));
            } 
        });
    }
    
});

