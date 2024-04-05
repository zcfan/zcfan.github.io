import { useState } from "react";
import Navigator from "./navigator";
import StudyRoom from "./features/study-room";
import DisplacedTorus from "./features/displaced-torus";

export default function App() {
  return (
    <>
      <Navigator />
      <Scenes />
    </>
  );
}

const SCENES = [StudyRoom, DisplacedTorus];

function Scenes() {
  const [ind, setInd] = useState(0);

  const Scene = SCENES[ind];
  return (
    <>
      {ind > 0 && (
        <div
          onClick={() => setInd((ind) => ind - 1)}
          className="navScene prevScene"
        />
      )}
      {ind < SCENES.length - 1 && (
        <div
          onClick={() => setInd((ind) => ind + 1)}
          className="navScene nextScene"
        />
      )}
      <Scene />
    </>
  );
}
