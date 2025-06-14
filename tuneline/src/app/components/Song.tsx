import { useSession } from "next-auth/react"
import useSocket from "../hooks";
import { SongType } from "../types";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Song({song, artist, removeSong, roomCode, isCurrentlyPlaying}:{song:SongType, artist: string, removeSong: any, roomCode: string, isCurrentlyPlaying?: boolean}) {
  const { data:session, status } = useSession();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousVotes, setPreviousVotes] = useState(song.votes);

  const socket = useSocket();

  // Check if current user has voted for this song
  const hasVoted = song.votedBy?.includes(session?.user?.email || "") || false;

  // Animate when votes change
  useEffect(() => {
    if (song.votes !== previousVotes) {
      setIsAnimating(true);
      setPreviousVotes(song.votes);
      
      // Reset animation after transition
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [song.votes, previousVotes]);

  async function voteSong(admin:string, url:string) {
   if(socket && socket.readyState === WebSocket.OPEN ){ // && status === "authenticated"
    socket.send(JSON.stringify({type:"vote-song", admin:admin, url:url, roomCode: roomCode}));
   }
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-md shadow-md transition-all duration-500 ease-in-out ${
      isCurrentlyPlaying 
        ? 'bg-green-800/30 border-2 border-green-500' 
        : 'bg-gray-800'
    } ${
      isAnimating ? 'scale-105 bg-red-900/20 shadow-lg' : ''
    }`}>
      {/* Thumbnail */}
      <div className="flex-shrink-0 mr-4 relative">
        {song.thumbnail ? (
          <Image 
            src={song.thumbnail} 
            alt={song.title || "Song thumbnail"} 
            width={60} 
            height={60} 
            className="rounded-md"
          />
        ) : (
          <div className="w-15 h-15 bg-gray-600 rounded-md flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
        {/* Currently playing indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-grow min-w-0">
        <h3 className={`font-semibold truncate ${
          isCurrentlyPlaying ? 'text-green-400' : 'text-white'
        }`}>
          {song.title || song.youtubeUrl}
          {isCurrentlyPlaying && <span className="ml-2 text-xs text-green-300">▶ Now Playing</span>}
        </h3>
        <p className="text-gray-400 text-sm truncate">
          {song.artist || artist || "Unknown Artist"}
        </p>
      </div>

      {/* Votes and Buttons */}
      <div className="flex flex-col items-end space-y-2 ml-4">
        {/* Vote Count with Animation */}
        <span className={`text-red-500 font-bold text-lg transition-all duration-300 ${
          isAnimating ? 'scale-125 text-red-400' : ''
        }`}>
          {song.votes} votes
        </span>
        
        {/* Buttons */}
        <div className="flex flex-col space-y-1">
          <button 
            onClick={() => voteSong(session?.user?.email || "someone", song.youtubeUrl)} 
            className={`text-xs font-bold px-3 py-1 rounded-full transition-all duration-200 ${
              hasVoted 
                ? "bg-red-500 text-white border border-red-500 hover:bg-red-600 transform hover:scale-105" 
                : "text-red-500 border border-red-500 hover:bg-red-500 hover:text-white transform hover:scale-105"
            }`}
          >
            {hasVoted ? "Unvote" : "Vote"}
          </button>
          <button 
            onClick={() => removeSong(song, roomCode)} 
            className="text-xs font-bold text-red-500 border border-red-500 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition-all duration-200 transform hover:scale-105"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
