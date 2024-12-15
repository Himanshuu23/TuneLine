import { useSession } from "next-auth/react";
import useSocket from "../hooks";
import { MessageType } from "../types";
import { useEffect } from "react";

export default function Song({name}: {name:string}) {
    const socket = useSocket();
    const { data: session, status } = useSession();

useEffect(() => {
    if(socket) {
        socket.onmessage = async (data) => {
          const message:MessageType = await JSON.parse(JSON.stringify(data));
          if (message.type == "vote-song") {
            console.log(message.message)
          }
        }
    }

    return () => {
     if(socket){
        socket.onmessage = null;
     }
    }
})

    function voteSong() { // -> when you will be using this component in the Queue -> pass the songs as props to this and pass the song with the socket message as well
      if(socket && socket.readyState === WebSocket.OPEN && status === "authenticated"){
        socket?.send(JSON.stringify({ type:"vote-song", admin:session?.user?.email }))
      } 
    }

    return (
        <div>
            <p>{name}</p>
            <button onClick={() => voteSong()}>Vote</button>
        </div>
    )
}
