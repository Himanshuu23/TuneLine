'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { signIn, signOut, useSession } from "next-auth/react"
import Image from "next/image";

export default function Pay({addSong, url, roomCode}: any) {
 const { data: session } = useSession();

  const handleLogin = (provider:string) => {
    signIn(provider)
  }

  if (session) {
    return (
      <div>
        <button onClick={() => signOut()}>Logout</button>
      </div>
    );
  } 

  return (
  
  <Dialog>
      <DialogTrigger className="px-4 py-2"> 
        <Image height={32} width={32} src="/send.png" alt="Nextjs" className="h-8 w-8 mr-2" />
      </DialogTrigger>
      <DialogContent className="bg-black flex justify-between">
      <DialogHeader>
        <DialogTitle className="text-3xl">Wanna Pay?
        </DialogTitle>
      </DialogHeader>
     <div className="flex gap-10 my-2 mr-10">
        <button style={{transform: "scale(150%)"}}>Yes</button>
        <button onClick={() => addSong(url, 0, roomCode)} style={{transform: "scale(150%)"}}>No</button>
    </div>
    </DialogContent>
  </Dialog>
  )
}
