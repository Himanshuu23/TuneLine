"use client";

import Login from "./ui/LoginDialog";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Join from "./ui/JoinDialog";
import Create from "./ui/CreateDialog";
import useSocket from "../hooks";

export default function Navbar() {
  const [input, setInput] = useState<string>("");
  const [creators, setCreators] = useState<string[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<string[]>([]);

  const socket = useSocket();

  function getCreators() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "get-creators" })
      );
    }
  }

  useEffect(() => {
    if (socket) {
      socket.onmessage = async (event) => {
        const message = await JSON.parse(event.data);
        if (message.type === "get-creators") {
          setCreators(message.response);
        }
      };
    }
    return () => {
      if (socket) {
        socket.onmessage = null;
      }
    };
  }, [socket]);

  useEffect(() => {
    getCreators();
  }, []);

  useEffect(() => {
    setFilteredCreators(
      creators.filter((creator) =>
        creator.toLowerCase().includes(input.toLowerCase())
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
          <div className="absolute top-12 left-0 bg-black w-1/2 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredCreators.map((creator, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-700/40 cursor-pointer"
              >
                {creator}
              </div>
            ))}
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