"use client"

import { useState, useEffect } from "react";
import useSocket from "../hooks";
import Queue from "./Queue";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function RoomContainer() {
  const [roomCode, setRoomCode] = useState<string>("")
  const { data: session, status } = useSession();
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const socket = useSocket();
  const searchParams = useSearchParams();
    
  useEffect(() => {
    if (socket) {
      socket.onmessage = async (event) => {
        const message = await JSON.parse(event.data);
        switch(message.type) {
          case "make-room":
            setRoomCode(message.roomCode);
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

   useEffect(() => {
    const roomCode = searchParams.get("room_code");
    if (roomCode)
      setRoomCode(roomCode)
  }, [searchParams])

  function closeRoom(url:string ) {
   if(socket && socket.readyState === WebSocket.OPEN && status === "authenticated") {
    socket?.send(JSON.stringify({ type:"close-room", admin:session?.user?.email }));
   }
  }
  
  return (
    <div className="flex h-screen w-full bg-gray-900">
      <div className="flex flex-col h-full w-[70%] bg-[#101010] rounded-xl shadow-lg p-6 relative">
        <div className="flex items-center justify-between text-white mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 overflow-hidden">
              <img src="https://via.placeholder.com/150" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-medium">Penny Amberton {roomCode}</span>
          </div>
          <div className="text-lg font-semibold">42:04</div>
        </div>
        <div className="flex h-full items-center justify-between bg-[#151515] p-6 rounded-lg">
          <div className="w-1/2 h-full p-4 flex justify-center items-center">
            <div className="w-full h-full bg-gray-700 rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/300" alt="Penny" className="object-cover w-full h-full" />
            </div>
          </div>
          <div className="w-1/2 h-full p-4 flex justify-center items-center">
            <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden flex justify-center items-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex justify-center items-center">
                <span className="text-5xl">🐶</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3"></div>
        <div className="flex justify-center items-center mt-8 space-x-8">
          <button className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-800">
            <svg className="w-8 h-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12h.01M19 12h.01M12 12h.01M9 12h.01M6 12h.01M3 12h.01" />
            </svg>
          </button>
          <button className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-800">
            <svg className="w-8 h-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 16l4-4m0 0l-4-4m4 4H6" />
            </svg>
          </button>
          <button
            className="w-14 h-14 flex justify-center items-center rounded-full bg-red-500"
            onClick={() => setIsChatOpen((prev) => !prev)}
          >
            <svg className="w-8 h-8 text-white" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 16l4-4m0 0l-4-4m4 4H6" />
            </svg>
          </button>
        </div>
      </div>
      {isChatOpen ? (
        <div className="flex flex-col h-full w-1/3 bg-[#202020] shadow-lg p-6">
          <div className="flex justify-between items-center text-white mb-4">
            <span className="text-lg font-semibold">Chat</span>
            <button
              className="w-8 h-8 flex justify-center items-center bg-red-500 rounded-full"
              onClick={() => setIsChatOpen(false)}
            >
              <svg className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4">
            <div className="text-white">Chat content here...</div>
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none"
            />
          </div>
        </div>
      ) : <Queue />}
    </div>
  );
}
{/* on the end put the ... when you open you get to subscribe the socials of the streamer without opening the app itself like follow on twitch etc just using a modal, then share/invite then just leave the room and also one open chat which does the queue half the size and another half is the twitch/yt chat directly*/}