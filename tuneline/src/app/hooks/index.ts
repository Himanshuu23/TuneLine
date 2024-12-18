import { useEffect, useState } from "react";

export default function useSocket() {
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
      const newSocket = new WebSocket('ws://localhost:11011');
      newSocket.onopen = () => {
        console.log("WS Connection Established ~client")
      }
      newSocket.onmessage = (mssg) => {
        console.log(mssg.data)
      }
      setSocket(newSocket);

<<<<<<< HEAD
      return () => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.close();
        }
      }
=======
      return () => newSocket.close();
>>>>>>> 25e9b3ada077d865eefb9df0d6ab8a5eb414075f
    }, [])
    
    return socket;
}
