"use client"

import { useSession } from "next-auth/react";
import useSocket from "../hooks";
import LoginDialog from "./ui/LoginDialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import JoinDialog from "./ui/JoinDialog";

export default function Navbar() {
  const [input, setInput] = useState<string>("");
  const { data: session, status } = useSession();
  const socket = useSocket();

  useEffect(() => {
    if(socket) {
      socket.onmessage = async (event) => {
        const message = await JSON.parse(event.data);
        switch(message.type) {
          case "make-room":
            window.location.href = `/room?room_code=${message.roomCode}`
            break;
        }
      }
    }

    return () => {
      if(socket) {
        socket.onmessage = null;
      }
    }
  }, [socket])
  
  function createRoom(email:string) {
    if (socket && socket.readyState === WebSocket.OPEN ) { // && status === "authenticated"
      socket.send(JSON.stringify({ type: "make-room", username: email }))
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }
  // keep the logins -> google, X, twitch and github
// for the join room, we can open a modal where the users can enter roomCode and their username would be the one using their signed in credentials using nextAuth and for the search bar we can search on the basis of the youtuber's name which we would be asking either way to show on /room path

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
          placeholder="Find your fav creator" 
        />
        <JoinDialog />
        <Button className="rounded-full" onClick={() => createRoom(session?.user?.email || "")}>Create Room</Button>
      </div>
      <div>
        <LoginDialog />
      </div>
    </div>
  );
  
}