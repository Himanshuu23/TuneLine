import { useSession } from "next-auth/react"
import useSocket from "../hooks";
import { SongType } from "../types";

export default function Song({song, artist}:{song:SongType, artist: string}) {
  const { data:session, status } = useSession();

  const socket = useSocket();
//every time we vote we have to getSongs()? or it does the increment realtime on its own
  async function voteSong(admin:string, url:string) {
   if(socket && socket.readyState === WebSocket.OPEN ){ // && status === "authenticated"
    const newSocket = useSocket();
    newSocket?.send(JSON.stringify({message:"vote-song", admin:admin, url:url}));
   }
  }

  return (
    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-md shadow-md">
      <div className="flex items-center">
        <span className="text-red-500 font-bold text-lg mr-4">{song.votes}</span>
        <div>
          <h3 className="text-white font-semibold">{song.youtubeUrl}</h3>
          <p className="text-gray-400 text-sm">{artist}</p>
        </div>
      </div>
      <button onClick={() => voteSong(session?.user?.email || "someone", song.youtubeUrl)} className="text-sm font-bold text-red-500 border border-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white">
        Vote
      </button>
    </div>
  )
}
