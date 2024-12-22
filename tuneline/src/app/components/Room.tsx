"use client"

import { useState, useEffect } from "react";
import useSocket from "../hooks";
import Queue from "./Queue";
import { useSession } from "next-auth/react";

export default function RoomContainer() {
  const [roomCode, setRoomCode] = useState<string>("")
  const { data: session, status } = useSession();

  const socket = useSocket();
    
  useEffect(() => {
    if (socket) {
      socket.onmessage = async (data) => {
        const message = await JSON.parse(JSON.stringify(data));
        switch(message.type) {
          case "make-room":
            const roomCode = message.roomCode;
            setRoomCode(roomCode);
          case "close-room":
            setRoomCode("")
            window.location.href = '/'
        }
      }
    }

    return () => {
        if (socket){
            socket.onmessage = null;
        }
    }
   }, [socket, setRoomCode])

  function closeRoom(url:string ) {
   if(socket && socket.readyState === WebSocket.OPEN && status === "authenticated") {
    socket?.send(JSON.stringify({ type:"close-room", admin:session?.user?.email }));
   }
  }
  
  return (
   <div className="flex w-screen h-screen gap-4">
    <div className="flex flex-col w-4/5 h-screen my-4 mx-2">
      <div className="flex justify-between w-full">
      <div className="flex justify-between gap-6 mx-4">
        <div>ytber logo</div>
        <h2>ytber username</h2>
      </div>
      <div>RoomCode{roomCode}</div>
      <button onClick={() => closeRoom(roomCode)}>Close Room</button>
      </div>
        <div className="h-4/5 w-full flex justify-center items-center gap-12">
          <p>Video Playing</p>
          <youtube-video controls src="https://www.youtube.com/live/wCMO-N2Cb_0?si=U0--UD7OqjMr4sJZ" ></youtube-video>
          <div>streamer's video</div> {/* iframe most prolly */}
       </div>
       <div>
        chat iframe for the yt or twitch
       </div>
     </div>
       <Queue />
   </div>
  )
}
