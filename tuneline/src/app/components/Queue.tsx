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
  <div className="w-1/3 bg-black p-6 rounded-lg shadow-lg">
  <h2 className="text-xl font-bold text-white mb-4">Our Upcoming Events</h2>
  <div className="space-y-4">
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md shadow-md">
      <div className="flex items-center">
        <span className="text-red-500 font-bold text-lg mr-4">07</span>
        <div>
          <h3 className="text-white font-semibold">Shangela Shuffle: Desert Edition</h3>
          <p className="text-gray-400 text-sm">Live At Coca-Cola Arena</p>
        </div>
      </div>
      <button className="text-sm font-bold text-red-500 border border-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white">
        Book Now
      </button>
    </div>
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md shadow-md">
      <div className="flex items-center">
        <span className="text-red-500 font-bold text-lg mr-4">10</span>
        <div>
          <h3 className="text-white font-semibold">Amr Diab</h3>
          <p className="text-gray-400 text-sm">Live At Etihad Arena</p>
        </div>
      </div>
      <button className="text-sm font-bold text-red-500 border border-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white">
        Book Now
      </button>
    </div>
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md shadow-md">
      <div className="flex items-center">
        <span className="text-red-500 font-bold text-lg mr-4">25</span>
        <div>
          <h3 className="text-white font-semibold">The Ocean</h3>
          <p className="text-gray-400 text-sm">Live At Coca-Cola Arena</p>
        </div>
      </div>
      <button className="text-sm font-bold text-red-500 border border-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white">
        Book Now
      </button>
    </div>
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md shadow-md">
      <div className="flex items-center">
        <span className="text-red-500 font-bold text-lg mr-4">05</span>
        <div>
          <h3 className="text-white font-semibold">Cigarettes After Sex</h3>
          <p className="text-gray-400 text-sm">Live At Etihad Arena</p>
        </div>
      </div>
      <button className="text-sm font-bold text-red-500 border border-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white">
        Book Now
      </button>
    </div>
  </div>
</div>
  )
}

{/* Make it like a container with box shadow a rectanle with some bottom-left and right radius and headphones as its cover*/}
