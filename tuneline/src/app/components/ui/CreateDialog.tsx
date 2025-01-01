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
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; // Fixed the import to match Next.js 13+ router API

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
  const { data: session } = useSession();
  const [ytUrl, setYtUrl] = useState<string>("");

  const socket = useSocket();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    url: string;
  }>({
    resolver: zodResolver(socialMediaSchema),
  });

  const onSubmit: SubmitHandler<{ url: string }> = (data) => {
    createRoom(session?.user?.email || "");
    console.log(data);
  };

  function createRoom(email: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "make-room", username: email, details: ytUrl })
      );
    } else {
      console.error("WebSocket is NOT Open!");
    }
  }

  useEffect(() => {
    if (socket) {
      socket.onmessage = async (event) => {
        const message = await JSON.parse(event.data);
        if (message.type === "make-room") {
          router.push(`/room?room_code=${message.roomCode}`);
        }
      };
    }

    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  return (
    <Dialog>
      <DialogTrigger className="px-4 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-900">
        Create
      </DialogTrigger>
      <DialogContent className="bg-black flex flex-col gap-4 p-6">
        <DialogHeader>
          <DialogTitle className="text-3xl text-white">Create Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-10 my-2 mr-10">
          <div className="w-5/6">
            <Input
              {...register("url")}
              className="mt-2 placeholder:text-gray-200 rounded-full w-full border-gray-300 focus:border-2 focus:border-gray-300 focus:outline-none"
              type="text"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="Enter Channel Link"
            />
            {errors.url && (
              <p className="text-sm text-red-500 m-2">{errors.url?.message as string}</p>
            )}
          </div>
          <Button variant="secondary" type="submit" className="w-1/6 mt-2 rounded-full">
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
