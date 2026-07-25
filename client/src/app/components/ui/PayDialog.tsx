import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";

type PayProps = {
  addSong: (url: string, money: number, roomCode: string) => void;
  url: string | undefined;
  roomCode: string;
  money: number;
};

export default function Pay({ addSong, url, roomCode, money }: PayProps) {
  const [open, setOpen] = useState(false);

  function handleSong(url: string, roomCode: string, money: number) {
    addSong(url, money, roomCode); 
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="px-4 py-2">
        <Image height={32} width={32} src="/send.png" alt="send icon" className="h-8 w-8 mr-2" />
      </DialogTrigger>
      <DialogContent className="bg-black flex justify-between">
        <DialogHeader>
          <DialogTitle className="text-3xl">Wanna Pay?</DialogTitle>
        </DialogHeader>
        <div className="flex gap-10 my-2 mr-10">
          <button onClick={() => setOpen(false)} style={{ transform: "scale(150%)" }}>Yes</button>
          <button onClick={() => handleSong(url, roomCode, money)} style={{ transform: "scale(150%)" }}>No</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}