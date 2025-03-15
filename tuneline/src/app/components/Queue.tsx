"use client";

import { useEffect, useState } from "react";
import useSocket from "../hooks";
import { useSession } from "next-auth/react";
import { MessageType, SongType } from "../types";
import Song from "./Song";
import { Input } from "@/components/ui/input";
import Pay from "./ui/PayDialog";
import { useSearchParams } from "next/navigation";

export default function Queue() {
  const [money, setMoney] = useState<number>(0);
  const [url, setUrl] = useState<string>();
  const [songs, setSongs] = useState<SongType[]>([
  { youtubeUrl: "songname", votes: 20, money: 30 },
  ]);
  const [roomCode, setRoomCode] = useState<string>("");

  const { data: session } = useSession();
  const socket = useSocket();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!socket) {
      return
    }

    if (socket) {
      socket.addEventListener("message", (event) => {
        const message: MessageType = JSON.parse(event.data);
        switch (message.type) {
          case "get-songs":
            if (message.songs) setSongs(message.songs);
            break;
          case "add-music":
            if (message.music) setSongs((prevSongs:any) => [message.music, ...prevSongs]);
            break;
          case "delete-music":
            if (message.music) setSongs((prev) => prev.filter((s) => s.youtubeUrl !== message.music?.youtubeUrl));
            break;
          case "remove-music":
            if (message.music) setSongs((prev) => prev.filter((s) => s.youtubeUrl !== message.music?.youtubeUrl));
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

  function addSong(url: string, money: number, roomCode: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({
          type: "add-music",
          admin: session?.user?.email,
          roomCode: roomCode,
          music: { youtubeUrl: url, money: money, votes: 0 },
        })
      );
    }
  }

  function getSongs() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({ type: "get-songs", admin: "admin", roomCode: roomCode })
      );
    }
  }

  useEffect(() => {
    getSongs();
  }, []);

  useEffect(() => {
    const roomCode = searchParams.get("room_code");
    
    if (roomCode) {
      setRoomCode(roomCode);
    }
  }, [])

  return (
    <div className="w-1/3 flex flex-col justify-between bg-black p-6 rounded-b-lg rounded-tl-lg shadow-lg">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Upcoming Songs</h2>
        <div className="overflow-y-auto max-h-[34rem] pr-2">
          <div className="space-y-4">
            {songs.length > 0 ? 
            songs.map((song, idx) => (
              <Song key={idx} song={song} />
            )) : 
            <div className="text-center mt-[17rem] mr-10 text-gray-400 text-lg">Add songs</div>}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter music url"
          className="placeholder:text-gray-200 my-4 focus:border-2 focus:border-gray-300 focus:outline-none"
        />
        <button>
          <Pay addSong={addSong} url={url} roomCode={roomCode} money={money} />
        </button>
      </div>
    </div>
  );
}