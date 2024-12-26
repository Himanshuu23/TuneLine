"use client"

import { useSession } from "next-auth/react";
import useSocket from "../hooks";
import LoginDialog from "./ui/LoginDialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const [input, setInput] = useState("");
  const { data: session, status } = useSession();
  const socket = useSocket();

  useEffect(() => {
    if(socket) {
      socket.onmessage = async (data) => {
        const message = await JSON.parse(JSON.stringify(data));
        switch(message.type) {
          case "join-room":
            console.log(message.message)
            window.location.href = `/room/${input}`
            break;
          case "make-room":
            console.log(message.message)
            window.location.href = `/room/${input}`
            break;
        }
      }
    }

    return () => {
      if(socket) {
        socket.onmessage = null;
      }
    }
  }, [socket, input])
  
  function createRoom(email:string) {
    if (socket && socket.readyState === WebSocket.OPEN && status === "authenticated") {
      socket.send(JSON.stringify({ type: "make-room", username: email }))
      window.location.href = "/room"
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }

  function joinRoom(roomCode:string, username:string) {
    if(socket && socket.readyState === WebSocket.OPEN && status === "authenticated") {
      socket.send(JSON.stringify({ type:"join-room", username:username, roomCode:roomCode }));
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }

  return (
    <div className="flex mr-3 py-4 px-6 fixed top-0 left-0 right-0 z-50 h-16 justify-between backdrop-blur-md">
      <div className="flex justify-between gap-7">
        <p className="text-white text-3xl font-semibold select-none">🎶</p>
      </div>
      <div className="flex justify-between gap-6">
        <Input className="placeholder:text-gray-200 rounded-full border-2 border-gray-300 focus:border focus:border-gray-300 focus:outline-none" 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Join using Code" 
        />
        <Button className="w-1/3 rounded-full" variant="secondary" onClick={() => joinRoom(input, session?.user?.email || "")}>Join</Button>
        <Button className="rounded-full" onClick={() => createRoom(session?.user?.email || "")}>Create Room</Button>
      </div>
      <div>
        <LoginDialog />
      </div>
    </div>
  );
  
}