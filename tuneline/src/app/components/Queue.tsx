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
  const { data: session, status } = useSession();
 // session.user.email -> email of the user 
  const socket = useSocket();

 useEffect(() => {
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


    return () => {
     if(socket) {
        socket.onmessage = null;
     }
    } 
 }, [socket, songs, setSongs])
  
  function addSong(url:string, money:number ) {
    if (socket && socket.readyState === WebSocket.OPEN && status === "authenticated") {
      socket?.send(JSON.stringify({ type:"add-music", admin:session?.user?.email, music: { youtubeUrl:url, money:money, votes:0 } }));
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }
  
  function getSongs() {
    if (socket && socket.readyState === WebSocket.OPEN && status === "authenticated") {
      socket?.send(JSON.stringify({ type:"get-songs", admin:session?.user?.email }))
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }

  useEffect(() => {
    getSongs() // also call this whenever someone votes - to update the number of votes on the song
  }, [songs])
  
  return (
    <div style={{transform: 'translate(-6%, -2.4%)'}} className="w-1/5 flex flex-col h-screen gap-4">
       <div className="text-3xl border-b-2 mx-4 p-2 mt-4 border-green">Music Queue</div> {/* put some logo or something */}
       <div className="mx-4 p-2 mb-4 h-3/5">
        Songs Queue
        {songs.map((song) => {
          {return <Song song={song} />}
        })}
      </div>
       <div className="flex flex-col">
        <input onChange={(e) => setUrl(e.target.value)} type="text" placeholder="Enter YT Url"/> {/* make it like inside a form and on submit call add song and remove the add button and on the input for money put button with $? sign instead and if clicked open a modal -> and add payment and then done */}
        <input onChange={(e) => setMoney(JSON.parse(e.target.value))} type="text" placeholder="Want to pay?" />
        <button onClick={() => addSong(url, money)}>add</button>
       </div>
    </div>

  )
}

{/* Make it like a container with box shadow a rectanle with some bottom-left and right radius and headphones as its cover*/}
