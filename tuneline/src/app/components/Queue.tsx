"use client"

import { useEffect, useState } from "react";
import useSocket from "../hooks";
import { useSession } from "next-auth/react";
import { MessageType, SongType } from "../types";
import Song from "./Song";
import { Input } from "@/components/ui/input";
import Pay from "./ui/PayDialog";

export default function Queue() {
  const [money, setMoney] = useState<number>(0);
  const [url, setUrl] = useState<string>();
  const [songs, setSongs] = useState<SongType[]>([{"url":"songname", "votes":20, "money":30}]);
  const { data: session, status } = useSession();
 // session.user.email -> email of the user 
  const socket = useSocket();

 useEffect(() => {
  if(socket) {
    socket.onmessage = async (event) => {
      const message:MessageType = await JSON.parse(JSON.stringify(event.data));
      console.log(message)
      switch(message.type) {
        case "get-songs":
          if(message.songs)
            setSongs(message.songs);
          break;
        case "add-music":
          if(message.song)
            songs.unshift(message.song)
          break
        case "delete-music": // would be done by the admin -> if any inappropriate song is added in the queue
            if(message.song)
              songs.filter((song) => song != message.song)
            break
        case "remove-music": // -> when the song has ended
          if(message.song)
            songs.filter((song) => song != message.song)
          break
      }
    }
  }


    return () => {
     if(socket) {
        socket.onmessage = null;
     }
    } 
 }, [socket, songs, setSongs])
  
  function addSong(url:string, money:number ) {
    if (socket && socket.readyState === WebSocket.OPEN ) { // && status === "authenticated"
      socket?.send(JSON.stringify({ type:"add-music", admin:session?.user?.email, music: { youtubeUrl:url, money:money, votes:0 } }));
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }
  
  function getSongs() {
    if (socket && socket.readyState === WebSocket.OPEN) { //  && status === "authenticated"
      socket?.send(JSON.stringify({ type:"get-songs", admin:session?.user?.email }))
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }

  useEffect(() => {
    getSongs() // also call this whenever someone votes - to update the number of votes on the song
  }, [songs])
  
  return (
    <div className="w-1/3 bg-black p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-white mb-4">Upcoming Songs</h2>
      <div className="space-y-4">
        {songs.map((song) => <Song song={song} />)}
      </div>
      <div className="flex space-x-2">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter music url"
          className="placeholder:text-gray-200 my-4 focus:border-2 focus:border-gray-300 focus:outline-none"
        />
        <button
          onClick={() => addSong(url || "", money)}
        >
          <Pay />
        </button>
      </div>
    </div>
  )  
   
}

{/* Make it like a container with box shadow a rectanle with some bottom-left and right radius and headphones as its cover*/}
