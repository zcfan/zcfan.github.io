import { useState } from "react";
import Navigator from "./navigator";
import StudyRoom from "./features/study-room";
import Demo from "./features/demo";
import DisplacedTorus from "./features/displaced-torus";
import queryString from "query-string";

export default function App() {
  return (
    <>
      <Navigator />
      <Scenes />
    </>
  );
}

// const SCENES = [StudyRoom, DisplacedTorus];
const SCENES = [DisplacedTorus, StudyRoom, Demo];

function Scenes() {
  const [ind, setInd] = useState(
    parseInt((queryString.parse(location.search).scene ?? "0") as string, 10)
  );

  const Scene = SCENES[ind]!;
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
