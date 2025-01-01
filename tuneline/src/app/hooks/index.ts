import { useEffect, useRef } from "react";

export default function useSocket() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      const socket = new WebSocket("ws://localhost:11011");

      socket.onopen = () => {
        if (!socketRef.current) {
          console.log("WS Connection Established ~client");
        }
        socketRef.current = socket;
      };

      socket.onclose = () => {
        console.log("WS Connection Closed ~client");
      };

      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, []);

  return socketRef.current;
}
