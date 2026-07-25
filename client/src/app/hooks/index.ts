import { useEffect, useState } from "react";

let sharedSocket: WebSocket | null = null;

export default function useSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(sharedSocket);

  useEffect(() => {
    if (sharedSocket) {
      setSocket(sharedSocket);
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:11011/ws";
    const ws = new WebSocket(wsUrl);
    sharedSocket = ws;
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      sharedSocket = null;
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return socket;
}