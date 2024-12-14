"use client"

import { useEffect, useState } from "react";
import useSocket from "../hooks";
import Song from "./Songs";
import { useSession } from "next-auth/react";
import { MessageType } from "../types";

export default function Queue() {
  const [money, setMoney] = useState<number>(0);
  const [url, setUrl] = useState<string>("");
  const [songs, setSongs] = useState<string[]>([]);
  const { data: session } = useSession();
 // session.user.email -> email of the user 
  const socket = useSocket();

  if(socket) {
    socket.onmessage = async (data) => {
      const message:MessageType = await JSON.parse(JSON.stringify(data));
      switch(message.type) {
        case "get-songs":
          if(message.songs)
            setSongs(message.songs)
        case "add-music":
          console.log(message.message)
          if(message.music)
            songs.unshift(message.music)
        case "delete-music": // would be done by the admin -> if any inappropriate song is added in the queue
            if(message.music)
              songs.filter((song) => song != message.music)
        case "remove-music": // -> when the song has ended
          if(message.music)
            songs.filter((song) => song != message.music)
      }
    }
  }

  function addSong(url:string, money:number ) {
   socket?.send(JSON.stringify({ type:"add-music", admin:session?.user?.email, music: { youtubeUrl:url, money:money, votes:0 } }));
  }
  
  function getSongs() {
    socket?.send(JSON.stringify({ type:"get-songs", admin:session?.user?.email }))
  }

  useEffect(() => {
    getSongs() // also call this whenever someone votes - to update the number of votes on the song
  }, [songs])
  
  return (
    <div className="flex flex-col">
       <div>
        Songs Queue
        {songs.map((song) => {
          {return <Song song={song} />}
        })}
      </div>
       <div className="flex flex-col">
        <input onChange={(e) => setUrl(e.target.value)} type="text" placeholder="Enter YT Url"/>
        <input onChange={(e) => setMoney(JSON.parse(e.target.value))} type="text" placeholder="Want to pay?" />
        <button onClick={() => addSong(url, money)}>add</button>
       </div>
    </div>

  )
}

{/* Make it like a container with box shadow a rectanle with some bottom-left and right radius and headphones as its cover*/}
