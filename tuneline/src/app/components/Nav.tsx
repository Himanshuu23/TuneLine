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
    <div className="flex mx-3 py-4 fixed h-13 w-full place-content-around backdrop-blur-md bg-black/50">
        <div className="flex justify-between gap-7">
            <p>Logo</p>
        </div>
        <div className="flex justify-between gap-6">
          <Input className="border-0 focus:border focus:border-gray-300 focus:outline-none" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Join using Code" />
          <Button className="w-1/3" variant="secondary" onClick={() => joinRoom(input, session?.user?.email || "")}>Join</Button>
          <Button variant="destructive" onClick={() => createRoom(session?.user?.email || "")}>Create Room</Button>
        </div>
        <div>
          <LoginDialog />
        </div>
    </div>
  )
}
// Logo - some tune like icon like tiktok
