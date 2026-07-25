"use client";

import Login from "./ui/LoginDialog";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import Join from "./ui/JoinDialog";
import Create from "./ui/CreateDialog";
import useSocket from "../hooks";
import Image from "next/image";

type CreatorType = {
  creator: string;
  channelProfile: string;
};

export default function Navbar() {
  const [input, setInput] = useState<string>("");
  const [creators, setCreators] = useState<CreatorType[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<CreatorType[]>([]);

  const socket = useSocket();

  const getCreators = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "get-creators" })
      );
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) {
      return
    }

    if (socket) {
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "get-creators") {
          try {
            const parsedCreators = JSON.parse(message.response);
            setCreators(parsedCreators);
          } catch (error) {
            console.error("Error parsing creators:", error);
            setCreators([]);
          }
        }
      });
    }
    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  useEffect(() => {
    getCreators();
  }, [getCreators]);

  useEffect(() => {
    setFilteredCreators(
      creators.filter((creator) =>
        creator.creator.toLowerCase().includes(input.toLowerCase())
      )
    );
  }, [input, creators]);

  return (
    <div className="flex mr-3 py-4 px-6 fixed top-0 left-0 right-0 z-50 h-16 justify-between backdrop-blur-md">
      <div className="flex justify-between gap-7">
        <p className="text-white text-3xl font-semibold select-none">🎶</p>
      </div>
      <div className="flex justify-between gap-6 relative">
        <Input
          className="placeholder:text-gray-200 rounded-full border-2 border-gray-300 focus:border focus:border-gray-300 focus:outline-none"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Find your fav creator"
        />
        {input && (
          <div className="absolute top-12 left-0 bg-black w-1/2 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-700">
            {filteredCreators.length > 0 ? (
              filteredCreators.map((creator, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-700/40 cursor-pointer flex items-center space-x-3"
                >
                  <div className="flex-shrink-0">
                    {creator.channelProfile ? (
                      <Image
                        src={creator.channelProfile}
                        alt={creator.creator}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">?</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm">{creator.creator}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-400 text-sm">
                No creators found
              </div>
            )}
          </div>
        )}
        <Join />
        <Create />
      </div>
      <div>
        <Login />
      </div>
    </div>
  );
}