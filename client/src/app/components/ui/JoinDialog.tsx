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
import { useEffect, useState, useCallback } from "react";

export default function Join() {
  const { data: session } = useSession();
  const [input, setInput] = useState<string>("");

  const socket = useSocket();
  const router = useRouter();

  function joinRoom(roomCode: string, username: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "join-room", username: username, roomCode: roomCode }));
    } else {
      console.error("WebSocket is NOT Open!");
    }
  }

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = JSON.parse(event.data);
    if (message.type === "join-room") {
      router.push(`/room?room_code=${message.roomCode}`);
    }
  }, [router]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, handleMessage]);

  return (
    <Dialog>
    <DialogTrigger className="px-6 h-11 text-base font-medium text-gray-800 bg-gray-200 border border-gray-300 rounded-full hover:bg-gray-300">
    Join
    </DialogTrigger>
    <DialogContent className="bg-black flex flex-col gap-4 p-6">
    <DialogHeader>
    <DialogTitle className="text-3xl">Enter Room Code</DialogTitle>
    </DialogHeader>
    <div className="flex flex-col gap-4 my-2">
    <Input
    className="placeholder:text-gray-200 rounded-full w-full border-gray-300 focus:border-2 focus:border-gray-300 focus:outline-none"
    type="text"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Join using Code"
    />
    <Button
    variant="secondary"
    className="w-full rounded-full"
    onClick={() => joinRoom(input, session?.user?.email || "")}
    >
    Submit
    </Button>
    </div>
    </DialogContent>
    </Dialog>
  );
}
