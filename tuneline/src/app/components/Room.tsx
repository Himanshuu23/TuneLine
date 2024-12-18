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
   <div>
     {roomCode}roomCode
     <button onClick={() => closeRoom(roomCode)}>Close Room</button>
     <div className="flex">
       {/* a grid with two columns -> first column would have the container and second would play the video of the song , top of the container would show the roomCode and bottom would show the features to add the songs by paying and you can vote by interacting with the song item on the container itself and bottom of the video of the song would have chat which would show who joined the room and which song started playing and commands like please play "/play[youtube-url of the video]" - which would be displayed as x user requested to play (title of the song using the youtubeLib) --> maybe improve the UI a bit? */}
       <div className="h-full w-screen">
          <p>Video Playing</p>
          <youtube-video controls src="https://www.youtube.com/live/wCMO-N2Cb_0?si=U0--UD7OqjMr4sJZ" ></youtube-video>
       </div>
       <div>
         <Queue />
       </div>
     </div>
   </div>
  )
}
