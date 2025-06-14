"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import useSocket from "../hooks";

type ChatMessage = {
  id: string;
  type: "user" | "system";
  username: string;
  message: string;
  timestamp: number;
};

export default function Chat({ roomCode, isOpen, onClose }: { 
  roomCode: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: session } = useSession();
  const socket = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !roomCode) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case "join-room":
          // Add system message for user joining
          if (message.username && message.username !== session?.user?.email) {
            addSystemMessage(`${message.username} joined the room`);
          }
          break;
        case "add-music":
          // Add system message for song added
          if (message.username) {
            addSystemMessage(`${message.username} added "${message.details?.title || 'a song'}" to the queue! Vote now to play it!`);
          }
          break;
        case "chat-message":
          // Add user message
          addUserMessage(message.username, message.message);
          break;
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, roomCode, session?.user?.email]);

  const addSystemMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "system",
      username: "System",
      message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (username: string, message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      username,
      message,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    const message = inputMessage.trim();
    socket.send(JSON.stringify({
      type: "chat-message",
      roomCode,
      username: session?.user?.email || "Anonymous",
      message,
    }));

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-1/3 bg-[#202020] shadow-lg p-6">
      <div className="flex justify-between items-center text-white mb-4">
        <span className="text-lg font-semibold">Chat</span>
        <button
          className="w-8 h-8 flex justify-center items-center bg-red-500 rounded-full hover:bg-red-600 transition-colors"
          onClick={onClose}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4 mb-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.type === "system" ? "items-center" : "items-start"}`}>
              {msg.type === "system" ? (
                <div className="bg-blue-900/30 text-blue-300 text-sm px-3 py-1 rounded-full border border-blue-500/30">
                  {msg.message}
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-3 max-w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 font-semibold text-sm">
                      {msg.username}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-white text-sm break-words">
                    {msg.message}
                  </p>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim()}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
} 