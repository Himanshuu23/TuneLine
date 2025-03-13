"use client";

import { useState, useEffect } from "react";
import useSocket from "../hooks";
import Queue from "./Queue";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Socials from "./ui/SocialsDialog";

export default function RoomContainer() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [viewOption, setViewOption] = useState<number>(1);
  const { data: session, status } = useSession();

  const socket = useSocket();
  

  useEffect(() => {
    if (!socket) {
      return
    }

    if (socket) {
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "make-room":
            setRoomCode(message.roomCode);
          case "join-room":
            setRoomCode(message.roomCode);
          case "close-room":
            setRoomCode("");
            window.location.href = "/";
        }
      });
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  function closeRoom(url: string) {
    if (socket && socket.readyState === WebSocket.OPEN) { //  && status === "authenticated"
      socket?.send(JSON.stringify({ type: "close-room", admin: session?.user?.email }));
    }
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".view-options")) {
      setIsViewOpen(false);
      document.removeEventListener("click", handleClickOutside);
    }
  }

  function handleViewOption(option: number) {
    setViewOption(option);
    setIsViewOpen(false);
    document.removeEventListener("click", handleClickOutside);
  }

  return (
    <div className="flex h-screen w-full bg-gray-900">
      <div className="flex flex-col h-full w-[70%] bg-black rounded-xl shadow-lg p-6 relative">
        <div className="flex items-center justify-between text-white mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 overflow-hidden">
              <Image
                src="/test.jpg"
                alt="Penny"
                className="object-cover w-full h-full"
                width={300}
                height={300}
              />
            </div>
            <span className="text-lg font-medium">Penny Amberton</span>
          </div>
          <div className="text-2xl font-bold">{roomCode}</div>
          <div className="text-lg font-semibold">42:04</div>
        </div>
        <div
          className={`flex h-full items-center justify-between bg-black p-6 rounded-lg ${
            viewOption === 2 ? "h-full" : ""
          }`}
        >
          {viewOption !== 3 && (
            <div
              className={`${
                viewOption === 2 ? "w-full" : "w-1/2 p-4"
              } h-full flex justify-center items-center`}
            >
              <div className="w-full h-full bg-gray-700 rounded-lg overflow-hidden">
                <video src="/video1.mp4" className="w-full h-full object-cover" controls />
              </div>
            </div>
          )}
          {viewOption !== 2 && (
            <div
              className={`${
                viewOption === 3 ? "w-full" : "w-1/2"
              } h-full p-4 flex justify-center items-center`}
            >
              <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden flex justify-center items-center">
                <video src="/video2.mp4" className="w-full h-full object-cover" controls />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-3"></div>
        <div className="flex justify-center items-center mt-8 space-x-8">
          <Socials />
          <div className="relative">
            <button
              className="w-14 h-14 flex justify-center items-center rounded-full bg-gray-800"
              onClick={() => {
                setIsViewOpen((prev) => !prev);
                if (!isViewOpen) {
                  document.addEventListener("click", handleClickOutside);
                }
              }}
            >
              view
            </button>
            {isViewOpen && (
              <div className="view-options absolute bottom-full mt-2 left-0 bg-gray-700 text-white rounded-lg shadow-lg w-36">
                <button
                  className="block w-full px-4 py-2 hover:bg-gray-600"
                  onClick={() => handleViewOption(1)}
                >
                  Both Visible
                </button>
                <button
                  className="block w-full px-4 py-2 hover:bg-gray-600"
                  onClick={() => handleViewOption(2)}
                >
                  First Only
                </button>
                <button
                  className="block w-full px-4 py-2 hover:bg-gray-600"
                  onClick={() => handleViewOption(3)}
                >
                  Second Only
                </button>
              </div>
            )}
          </div>
          <button
            className="w-14 h-14 flex justify-center items-center rounded-full bg-gray-800"
            onClick={() => setIsChatOpen((prev) => !prev)}
          >
            <Image
              src="/Comment.png"
              alt="Penny"
              className="object-cover w-full h-full invert"
              width={300}
              height={300}
              style={{ transform: "scale(150%)" }}
            />
          </button>
          <button className="w-14 h-14 flex justify-center items-center rounded-full bg-red-500">
            <Image
              src="/phone.png"
              alt="Penny"
              className="object-cover w-1/2 h-1/2 invert"
              width={300}
              height={300}
            />
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
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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
      ) : (
        <Queue />
      )}
    </div>
  );    
}

{/* on the end put the ... when you open you get to subscribe the socials of the streamer without opening the app itself like follow on twitch etc just using a modal, then share/invite then just leave the room and also one open chat which does the queue half the size and another half is the twitch/yt chat directly*/}