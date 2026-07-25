'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogTrigger } from "@radix-ui/react-dialog"
import GoogleLogo from "../logos/Google";
import GithubLogo from "../logos/Github";

export default function Socials() {

  return (
  
  <Dialog>
      <DialogTrigger className="w-14 h-14 text-4xl flex justify-center items-center rounded-full bg-gray-800"> 
        <div style={{transform: 'translateY(-30%)'}}>...</div>
      </DialogTrigger>
      <DialogContent className="bg-black flex justify-between">
      <DialogHeader>
        <DialogTitle className="text-3xl">Follow</DialogTitle>
      </DialogHeader>
     <div className="flex gap-10 my-2 mr-10">
        <button style={{transform: "scale(150%)"}}><GoogleLogo /></button>
        <button style={{transform: "scale(150%)"}}><GithubLogo /></button>
    </div>
    </DialogContent>
  </Dialog>
  )
}