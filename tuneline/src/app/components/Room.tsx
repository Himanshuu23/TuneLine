"use client"

import { useState, useEffect } from "react";
import useSocket from "../hooks";
import Queue from "./Queue";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Chat from "./logos/Chat";

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
      <div className="flex justify-between gap-3 mx-4 items-center justify-center">
  <div className="w-10 h-10 rounded-full overflow-hidden relative">
    <Image
      src="/test.jpg"
      alt="YouTube Logo"
      fill
      className="object-cover"
    />
  </div>
  <pre className="text-lg pl-2"><span className="text-sm">⬤</span> Channel Name</pre>
</div>
      <div className="border border-gray-300 rounded-lg p-4 mx-4 my-2">
        <button>roomCode{roomCode}</button>
      </div>{/* on click copy the roomCode for sharing */}
      <div
  onClick={() => closeRoom(roomCode)}
  className="w-10 h-10 rounded-full overflow-hidden relative cursor-pointer bg-gray-700"
>
  <Chat />
</div>{/* this would open a modal which shows the chat going onnnnnn */}

      </div>
      <div className="flex h-4/5 w-full flex-col gap-16">
      <div className="h-4/5 w-full flex justify-center items-center gap-12">
  <div className="relative w-64 h-64 bg-gray-800 rounded-lg overflow-hidden">
    <div className="absolute top-2 right-2 bg-gray-700 text-white p-2 rounded-full cursor-pointer">🔲</div>
    <p className="absolute bottom-2 left-2 text-white text-sm">Video Playing</p>
    <youtube-video controls src="https://www.youtube.com/live/wCMO-N2Cb_0?si=U0--UD7OqjMr4sJZ" className="w-full h-full"></youtube-video>
  </div>
  <div className="relative w-64 h-64 bg-gray-800 rounded-lg overflow-hidden">
    <div className="absolute top-2 right-2 bg-gray-700 text-white p-2 rounded-full cursor-pointer">🔲</div>
    <div className="absolute bottom-2 left-2 text-white text-sm">streamer's video</div>
    <iframe className="w-full h-full" src="https://www.youtube.com/live/something" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
  </div>
</div>
<div className="flex justify-between items-center px-4 py-2">
  <p className="text-sm">time</p>
  <div className="flex gap-2 items-center">
    <input
      type="text"
      placeholder="chat"
      className="border border-gray-300 p-2 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none">
      send
    </button>
  </div>
  <button className="bg-red-600 text-white py-3 px-5 rounded-full hover:bg-red-700 focus:outline-none">
    ❌
  </button>
</div>

     </div>
     </div>
       <Queue />
   </div>
  )
}
