import { useSession } from "next-auth/react";
import useSocket from "../hooks";
import { MessageType } from "../types";

export default function Song({name}: {name:string}) {
    const socket = useSocket();
    const { data: session } = useSession();

    if(socket) {
        socket.onmessage = async (data) => {
          const message:MessageType = await JSON.parse(JSON.stringify(data));
          if (message.type == "vote-song") {
            console.log(message.message)
          }
        }
    }

    function voteSong() { // -> when you will be using this component in the Queue -> pass the songs as props to this and pass the song with the socket message as well
        socket?.send(JSON.stringify({ type:"vote-song", admin:session?.user?.email }))
    }

    return (
        <div>
            <p>{name}</p>
            <button onClick={() => voteSong()}>Vote</button>
        </div>
    )
}