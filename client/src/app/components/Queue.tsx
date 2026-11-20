"use client";

import { useEffect, useState, useCallback } from "react";
import useSocket from "../hooks";
import { useSession } from "next-auth/react";
import { MessageType, SongType } from "../types";
import Song from "./Song";
import { Input } from "@/components/ui/input";
import Pay from "./ui/PayDialog";
import { useSearchParams } from "next/navigation";

export default function Queue({setVideoUrl}: {setVideoUrl: (url: string) => void}) {
  const [money] = useState<number>(0);
  const [url, setUrl] = useState<string>();
  const [songs, setSongs] = useState<SongType[]>([]); // { youtubeUrl: "songname", votes: 20, money: 30 } for testing purpose
  const [roomCode, setRoomCode] = useState<string>("");
  const [artist, setArtist] = useState<string>("")
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<SongType | null>(null);
  const [previousSongs, setPreviousSongs] = useState<SongType[]>([]);

  const { data: session } = useSession();
  const socket = useSocket();
  const searchParams = useSearchParams();

  const convertToEmbedURL = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/v\/|watch\?v=|&v=)([^?&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : "";
  };

  const startSong = useCallback((song: SongType, roomCode: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({
          type: "start-song",
          roomCode: roomCode,
          music: song,
        })
      );
    }
  }, [socket]);

  const getSongs = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN && roomCode) {
      socket?.send(
        JSON.stringify({ type: "get-songs", admin: "admin", roomCode: roomCode })
      );
    }
  }, [socket, roomCode]);

  useEffect(() => {
    if (!socket || !roomCode) {
      return
    }

    if (socket) {
      socket.addEventListener("message", async (event) => {
        const message: MessageType = JSON.parse(event.data);
        switch (message.type) {
          case "get-songs":
            if (message.songs) {
              setPreviousSongs(songs);
              setSongs(message.songs);
            }
            break;
          case "add-music":
            if (message.music && message.details) {
              setArtist(message.details.artist);
              // Only update video URL if no song is currently playing
              if (message.shouldUpdateVideo) {
                setVideoUrl(convertToEmbedURL(message.music.youtubeUrl));
                // Start the song automatically if it's the first one
                startSong(message.music, roomCode);
              }
              // Only call getSongs if we have roomCode
              if (roomCode) {
                getSongs();
              }
            }
            break;
          case "song-started":
            if (message.music) {
              setVideoUrl(convertToEmbedURL(message.music.youtubeUrl));
              setArtist(message.music.artist || "");
              setCurrentlyPlayingSong(message.music);
            }
            break;
          case "next-song":
            if (message.music) {
              setVideoUrl(convertToEmbedURL(message.music.youtubeUrl));
              setArtist(message.music.artist || "");
              setCurrentlyPlayingSong(message.music);
              // Refresh the queue to show updated order
              if (roomCode) {
                getSongs();
              }
            }
            break;
          case "queue-empty":
            setVideoUrl("");
            setArtist("");
            setCurrentlyPlayingSong(null);
            break;
          case "delete-music":
            if (message.music) setSongs((prev) => prev.filter((s) => s.youtubeUrl !== message.music?.youtubeUrl));
            break;
          case "remove-music":
            if (message.music) setSongs((prev) => prev.filter((s) => s.youtubeUrl !== message.music?.youtubeUrl));
            break;
          case "vote-updated":
            if (message.music) {
              // Refresh the songs list to get updated vote counts and order
              setPreviousSongs(songs);
              if (roomCode) {
                getSongs();
              }
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
  }, [socket, roomCode, getSongs, setVideoUrl, songs, startSong]);

  function addSong(url: string, money: number, roomCode: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({
          type: "add-music",
          admin: session?.user?.email,
          username: session?.user?.email || "Anonymous",
          roomCode: roomCode,
          music: { youtubeUrl: url, money: money, votes: 0 },
        })
      );
    }
  }

  function removeSong(song: SongType, roomCode: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket?.send(
        JSON.stringify({ type: "remove-song", music: song, roomCode: roomCode })
      );
    }
  }

  useEffect(() => {
    const roomCode = searchParams.get("room_code");
    
    if (roomCode) {
      setRoomCode(roomCode);
    }
  }, [searchParams])

  // Call getSongs when roomCode is set
  useEffect(() => {
    if (roomCode && socket) {
      getSongs();
    }
  }, [roomCode, socket, getSongs]);

  return (
    <div className="w-1/3 flex flex-col justify-between bg-black p-6 rounded-b-lg rounded-tl-lg shadow-lg">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Upcoming Songs</h2>
        <div className="overflow-y-auto max-h-[34rem] pr-2">
          <div className="space-y-4">
            {Array.isArray(songs) && songs.length > 0 ? 
            songs.map((song, index) => {
              const prevIndex = previousSongs.findIndex(s => s.youtubeUrl === song.youtubeUrl);
              const isMovingUp = prevIndex !== -1 && prevIndex > index;
              const isMovingDown = prevIndex !== -1 && prevIndex < index;
              
              return (
                <div
                  key={song.youtubeUrl}
                  className={`transition-all duration-500 ease-in-out ${
                    isMovingUp ? 'animate-slide-up' : ''
                  } ${
                    isMovingDown ? 'animate-slide-down' : ''
                  }`}
                  style={{
                    animation: isMovingUp || isMovingDown ? 'slideMove 0.5s ease-in-out' : 'none'
                  }}
                >
                  <Song 
                    song={song} 
                    artist={song.artist || artist} 
                    removeSong={removeSong} 
                    roomCode={roomCode}
                    isCurrentlyPlaying={currentlyPlayingSong?.youtubeUrl === song.youtubeUrl}
                  />
                </div>
              );
            }) : 
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
