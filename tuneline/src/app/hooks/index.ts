import { useEffect, useRef } from "react";

let sharedSocket: WebSocket | null = null;

export default function useSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Check if there is an existing socket
    if (sharedSocket) {
      socketRef.current = sharedSocket;
      return; // Return early if socket already exists
    }

    // If no existing socket, create a new one
    const socket = new WebSocket("ws://localhost:11011");
    sharedSocket = socket;
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      sharedSocket = null; // Reset on close
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      sharedSocket = null; // Reset sharedSocket on cleanup
    };
  }, []); // Empty dependency array ensures this effect runs once on mount

  return socketRef.current;
}