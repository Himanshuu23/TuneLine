"use client";

import { useState, useEffect, useCallback } from "react";
import useSocket from "../hooks";
import Queue from "./Queue";
import Chat from "./Chat";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Socials from "./ui/SocialsDialog";

export default function RoomContainer() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [viewOption, setViewOption] = useState<number>(1);
  const [channelName, setChannelName] = useState<string>("Test Channel");
  const [channelProfile, setChannelProfile] = useState<string>("/test.jpg");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string>("");

  const { data: session } = useSession();
  const socket = useSocket();
  const searchParams = useSearchParams();

  // Fetch room details to get channel information
  const fetchRoomDetails = useCallback(async (roomCode: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type: "get-room-details", 
        roomCode: roomCode 
      }));
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      return
    }

    if (socket) {
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "close-room":
            setRoomCode("");
            window.location.href = "/";
            break;
          case "room-details":
            if (message.details) {
              setChannelName(message.details.creator || "Unknown Channel");
              setChannelProfile(message.details.channelProfile || "/test.jpg");
              setStreamUrl(message.details.streamUrl || "");
            }
            break;
        }
      });
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);


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

  useEffect(() => {
    const roomCode = searchParams.get("room_code");
    
    if (roomCode) {
      setRoomCode(roomCode);
      // Fetch room details to get channel information
      fetchRoomDetails(roomCode);
    }
  }, [searchParams, fetchRoomDetails])

  useEffect(() => {
    if (session?.accessToken) {
      const value = document.cookie.split('; ').find(row => row.startsWith("steam" + '='))?.split('=')[1];
      document.cookie = `${name}=; path=/; max-age=0`;
      if (value) {
        setVideoUrl(decodeURIComponent(value));
      }
      if (roomCode) {
        fetchRoomDetails(roomCode);
      }
    }
  }, [session?.accessToken, fetchRoomDetails, roomCode]);  

  return (
    <div className="flex h-screen w-full bg-gray-900">
      <div className="flex flex-col h-full w-[70%] bg-black rounded-xl shadow-lg p-6 relative">
        <div className="flex items-center justify-between text-white mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 overflow-hidden">
              <Image
                src={channelProfile}
                alt="Penny"
                className="object-cover w-full h-full"
                width={300}
                height={300}
              />
            </div>
            <span className="text-lg font-medium">{channelName}</span>
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
                {streamUrl ? (
                  <iframe 
                    src={streamUrl}
                    className="w-full h-full object-cover" 
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📺</div>
                      <p>No stream available</p>
                      <p className="text-sm">Streamer hasn&apos;t set a live stream URL</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {viewOption !== 2 && (
            <div className={`${viewOption === 3 ? "w-full" : "w-1/2"} h-full p-4 flex justify-center items-center`}>
              <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden flex justify-center items-center">
                <iframe 
                  src={videoUrl}
                  className="w-full h-full object-cover" 
                  allowFullScreen
                />
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
        <Chat 
          roomCode={roomCode} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      ) : (
        <Queue setVideoUrl={setVideoUrl} />
      )}
    </div>
  );    
}

{/* on the end put the ... when you open you get to subscribe the socials of the streamer without opening the app itself like follow on twitch etc just using a modal, then share/invite then just leave the room and also one open chat which does the queue half the size and another half is the twitch/yt chat directly*/}