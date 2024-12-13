"use client"

import { useState } from "react";
import useSocket from "../hooks";

export default function Room() {
  const [roomCode, setRoomCode] = useState<string>("")

  const socket = useSocket();
    if (socket) {
      socket.onmessage = async (data) => {
        const message = await JSON.parse(JSON.stringify(data));
        if (message.type == "make-room") {
          const roomCode = message.roomCode;
          setRoomCode(roomCode);
        }
      }
  }
  
  return (
    <div>
      {roomCode}
      {/* a grid with two columns -> first column would have the container and second would play the video of the song , top of the container would show the roomCode and bottom would show the features to add the songs by paying and you can vote by interacting with the song item on the container itself and bottom of the video of the song would have chat which would show who joined the room and which song started playing and commands like please play "/play[youtube-url of the video]" - which would be displayed as x user requested to play (title of the song using the youtubeLib) --> maybe improve the UI a bit? */}
      <div>Song Container</div>
      <div className="h-full w-screen">
        <youtube-video controls src="https://www.youtube.com/live/wCMO-N2Cb_0?si=U0--UD7OqjMr4sJZ" ></youtube-video>
      </div>
    </div>
  )

}
