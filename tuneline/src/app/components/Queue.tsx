"use client"

import { useState } from "react";
import useSocket from "../hooks";
import Song from "./Song";
import { useSession } from "next-auth/react";

export default function Queue() {
  const [money, setMoney] = useState<number>(0);
  const [url, setUrl] = useState<string>("");
  const [songs, setSongs] = useState([]);  
  const { data: session } = useSession();
 // session.user.email -> email of the user 
  const newSocket = useSocket();

  function addSong(url:string, money:number ) {
   newSocket?.send(JSON.stringify({ type:"add-music", admin:session?.user?.email, music: { youtubeUrl:url, money:money, votes:0 } }));
  }
  
  function getSongs() {
    newSocket?.send(JSON.stringify({ type:"get-songs", admin:session?.user?.email }))
  }

  if(newSocket) {
    newSocket.onmessage = (data:string) => {
      const message = JSON.parse(data);
      if(message.type === "get-songs") {
        setSongs(message.response);
        console.log("got the songs")
      } else {
        console.log("could not get the songs")
      }
    }
  }
  
  return (
    <div>
       <div>
        Queue
        {songs.map((song) => {
          {return <Song song={song} />}
        })}
      </div>
       <div>
        <input onChange={(e) => setUrl(e.target.value)} type="text" placeholder="Enter YT Url"/>
        <input onChange={(e) => setMoney(JSON.parse(e.target.value))} type="text" placeholder="Want to pay?" />
        <button onClick={() => addSong(url, money)}>add</button>
       </div>
    </div>

  )
}

{/* Make it like a container with box shadow a rectanle with some bottom-left and right radius and headphones as its cover*/}
