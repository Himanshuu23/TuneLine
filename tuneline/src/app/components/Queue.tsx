"use client"

import { useEffect, useState } from "react";
import useSocket from "../hooks";
import Song from "./Songs";
import { useSession } from "next-auth/react";
import { MessageType } from "../types";

export default function Queue() {
  const [money, setMoney] = useState<number>(0);
  const [url, setUrl] = useState<string>();
  const [songs, setSongs] = useState<string[]>(["someting", "sojeofj"]);
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
    <div
      style={{
        transform: 'translate(-6%, -2.4%)',
      }}
      className="w-1/5 flex flex-col h-screen gap-4 bg-black p-4 shadow-lg rounded-lg"
    >
      <div className="mx-4 mb-4 h-full overflow-y-auto rounded-lg">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-700 p-2 mb-2 rounded-md shadow-sm hover:bg-gray-600"
            >
              <span className="text-white font-medium">{song}</span>
              <button className="text-red-500 text-sm">Remove</button>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">No songs in the queue</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          onChange={(e) => setUrl(e.target.value)}
          type="text"
          placeholder="Enter Song Name"
          className="flex-grow border-2 border-gray-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
        />
        <button className="bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-all">
          $
        </button>
      </div>
    </div>
  );
  
  
}

{/* Make it like a container with box shadow a rectanle with some bottom-left and right radius and headphones as its cover*/}
