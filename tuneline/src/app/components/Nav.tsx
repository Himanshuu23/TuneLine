"use client"

import { useSession } from "next-auth/react";
import useSocket from "../hooks";
import LoginDialog from "./ui/LoginDialog";
import { useState } from "react";

export default function Navbar() {
  const [input, setInput] = useState("");
  const { data: session } = useSession();
  const socket = useSocket();
  
  function createRoom(email:string) {
    if (socket) {
      socket.send(JSON.stringify({ type: "make-room", username: email }))
    window.location.href = "/room"
    } else {
      return "An error occurred"
    }
  }

  function joinRoom(roomCode:string, username:string) {
    if(socket) {
      socket.send(JSON.stringify({ type:"join-room", username:username, roomCode:roomCode }));
    } else {
      return "An error occurred"
    }
  }

  return (
    <div className="flex justify-between">
        <div className="flex justify-between gap-7">
            <p>Logo</p>
        </div>
        <div className="flex justify-between gap-9">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Join using Code" />
          <button onClick={() => joinRoom(input, session?.user?.email || "")}>Join</button>
          <button onClick={() => createRoom(session?.user?.email || "")}>Create Container</button>
        </div>
        <div>
          <LoginDialog />
        </div>
    </div>
  )
}
// Logo - some tune like icon like tiktok
