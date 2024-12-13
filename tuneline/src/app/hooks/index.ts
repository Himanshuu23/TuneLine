import { useEffect, useState } from "react";

export default function useSocket() {
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
      const newSocket = new WebSocket('ws://localhost:11011');
      newSocket.onopen = () => {
        console.log("WS Connection Established ~server")
      }
      setSocket(newSocket);

      return () => newSocket.close();
    })
    
    return socket;
}
