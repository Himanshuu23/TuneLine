'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogTrigger } from "@radix-ui/react-dialog"
import { signIn, signOut, useSession } from "next-auth/react"
import GoogleLogo from "../logos/Google";
import GithubLogo from "../logos/Github";

export default function LoginDialog() {
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
      <DialogTrigger className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"> 
        Login
      </DialogTrigger>
      <DialogContent className="bg-black flex justify-between">
      <DialogHeader>
        <DialogTitle className="text-3xl">Using</DialogTitle>
      </DialogHeader>
     <div className="flex gap-10 my-2 mr-10">
        <button style={{transform: "scale(150%)"}} onClick={() => handleLogin('google')}><GoogleLogo /></button>
        <button style={{transform: "scale(150%)"}} onClick={() => handleLogin('github')}><GithubLogo /></button>
    </div>
    </DialogContent>
  </Dialog>
  )
}
