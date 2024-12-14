import { useSession } from "next-auth/react"
import useSocket from "../hooks";

export default function Song({song}:{song:any}) {
  const { data:session } = useSession();

//every time we vote we have to getSongs()? or it does the increment realtime on its own
  async function voteSong(admin:string, url:string) {
   if(socket && socket.readyState === WebSocket.OPEN){ 
    const newSocket = useSocket();
    newSocket?.send(JSON.stringify({message:"vote-song", admin:admin, url:url}));
   }
  }

  return (
    <div>
      {song.youtubeUrl}
      {JSON.stringify(song.money)}
      <button onClick={() => voteSong(session?.user?.email || "", song.youtubeUrl)}>vote</button>
    </div>
  )
}
