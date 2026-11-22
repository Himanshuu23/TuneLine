'use client';

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
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; 

const socialMediaSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (val) =>
        val.includes("youtube.com") ||
        val.includes("twitch.tv") ||
        val.includes("twitter.com") ||
        val.includes("linkedin.com"),
      {
        message: "Please enter a valid URL for YouTube, Twitch, Twitter, or LinkedIn.",
      }
    ),
});

export default function Create() {
  const [ytUrl, setYtUrl] = useState<string>(""); // url of the stream which would be played in the room later
  const [streamUrl, setStreamUrl] = useState<string>(""); // url of the streamer's live stream
  const channelName = "";
  const channelProfile = "/test.jpg";

  const socket = useSocket();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    url: string;
    streamUrl: string;
  }>({
    resolver: zodResolver(socialMediaSchema),
  });

  const onSubmit: SubmitHandler<{ url: string; streamUrl: string }> = () => {
    createRoom();
  };  


  function createRoom() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ 
          type: "make-room", 
          details: { 
            name: channelName, 
            profilePic: channelProfile, 
            videoUrl: ytUrl,
            streamUrl: streamUrl 
          } 
        })
      );
    } else {
      console.error("WebSocket is NOT Open!");
    }
  }

  useEffect(() => {
    if (socket) {
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "make-room") {
          document.cookie = `stream=${encodeURIComponent(message.videoUrl)}; path=/; max-age=10`;
          router.push(`/room?room_code=${message.roomCode}`);
        }
      });
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket, router]);

  return (
    <Dialog>
      <DialogTrigger className="px-6 text-sm font-medium text-white bg-[#1e9b5b] rounded-full opacity-80 hover:opacity-100 transition-opacity">
        Create
      </DialogTrigger>
      <DialogContent className="bg-black flex flex-col gap-4 p-6">
        <DialogHeader>
          <DialogTitle className="text-3xl text-white">Create Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 my-2 mr-10">
          <div className="w-full">
            <label className="text-white text-sm mb-2 block">Channel Link</label>
            <Input
              {...register("url")}
              className="placeholder:text-gray-200 rounded-full w-full border-gray-300 focus:border-2 focus:border-gray-300 focus:outline-none"
              type="text"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="Enter Channel Link"
            />
            {errors.url && (
              <p className="text-sm text-red-500 m-2">{errors.url?.message as string}</p>
            )}
          </div>
          
          <div className="w-full">
            <label className="text-white text-sm mb-2 block">Stream Link (Optional)</label>
            <Input
              {...register("streamUrl")}
              className="placeholder:text-gray-200 rounded-full w-full border-gray-300 focus:border-2 focus:border-gray-300 focus:outline-none"
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="Enter Live Stream URL (YouTube/Twitch)"
            />
            {errors.streamUrl && (
              <p className="text-sm text-red-500 m-2">{errors.streamUrl?.message as string}</p>
            )}
          </div>
          
          <Button variant="secondary" type="submit" className="w-full mt-2 rounded-full">
            Create Room
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
