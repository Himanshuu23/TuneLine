import { Suspense } from "react";
import RoomContainer from "../components/Room";

export default function Room() {
  return (
    <Suspense fallback={null}>
      <RoomContainer />
    </Suspense>
  )
}
