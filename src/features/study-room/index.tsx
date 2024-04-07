import { useEffect, useRef, useState } from "react";
import Loading from "../../components/loading";
import { initScene } from "./initScene";

export default function StudyRoom() {
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return initScene(canvasRef.current, () => setLoading(false));
  }, []);

  return (
    <>
      <div id="study-room" ref={canvasRef} />
      <Loading loading={loading} />
    </>
  );
}

export const ROOM_Y_ROTATION = -Math.PI / 4;
