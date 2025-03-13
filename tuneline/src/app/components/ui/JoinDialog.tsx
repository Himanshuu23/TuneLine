import useSocket from "@/app/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";

export default function Join() {
 const { data: session } = useSession();
 const [input, setInput] = useState<string>("");
 
 const socket = useSocket();
 const router = useRouter();

  function joinRoom(roomCode:string, username:string) {
    if(socket && socket.readyState === WebSocket.OPEN ) { // && status === "authenticated"
      socket.send(JSON.stringify({ type:"join-room", username: username, roomCode: roomCode }));
    } else {
      console.error("WebSocket is NOT Open!")
    }
  }

  useEffect(() => {
    if (!socket) {
      return
    }

      if(socket) {
        console.log(socket)
        socket.onmessage = async (event) => {
          const message = await JSON.parse(event.data);
          console.log(message, "this is the message recieved after doing join-room from the frontend")
          switch(message.type) {
            case "join-room":
              console.log(message)
              router.push(`/room?room_code=${message.roomCode}`);
              break;
          }
        }
      }
  
      return () => {
        if(socket) {
          socket.onmessage = null;
        }
      }
    }, [socket])

  return (
  
  <Dialog>
      <DialogTrigger className="px-4 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded-full hover:bg-gray-300"> 
        Join
      </DialogTrigger>
      <DialogContent className="bg-black flex justify-between">
      <DialogHeader>
        <DialogTitle className="text-3xl">Enter Room Code</DialogTitle>
      </DialogHeader>
     <div className="flex gap-10 my-2 mr-10">
        <Input className="mt-2 placeholder:text-gray-200 rounded-full w-4/5 focus:border-2 focus:border-gray-300 focus:outline-none" 
          type="text"
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Join using Code" 
        />
        <Button className="w-1/5 mt-2 rounded-full" onClick={() => joinRoom(input, session?.user?.email || "")}>Submit</Button>
    </div>
    </DialogContent>
  </Dialog>
  )
}
