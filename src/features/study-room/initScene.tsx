import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { ROOM_Y_ROTATION } from ".";
import {
  setupOnResize,
  setupWindowPointerOrTouchMove,
} from "../../common/three/setup-events";

export function initScene(container: HTMLDivElement, onLoad: () => void) {
  const { width, height } = container.getBoundingClientRect();
  const clock = new THREE.Clock();

  // setup scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1);

  // setup renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // setup camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 4, 15);
  camera.lookAt(0, 0, 0);

  // setup gltf loader
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  // load study room scene
  let mixer: THREE.AnimationMixer;
  let animOpenDoor: THREE.AnimationAction;
  let room: THREE.Group;
  loader.load("study room.glb", (gltf) => {
    const { scene: roomScene, animations } = gltf;
    room = roomScene;
    room.rotation.x = -Math.PI / 10;
    room.rotation.y = ROOM_Y_ROTATION;
    scene.add(room);
    mixer = new THREE.AnimationMixer(room);
    animOpenDoor = mixer.clipAction(animations[0]);
    const animFanRolling = mixer.clipAction(animations[1]);
    animOpenDoor.setLoop(THREE.LoopOnce, 1);
    animOpenDoor.clampWhenFinished = true;
    animFanRolling.play();
    container.style.opacity = "100%";
    onLoad();
  });

  const removeOnResize = setupOnResize(container, renderer, camera);

  // door onClick event
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function onPointerDown(event: PointerEvent) {
    pointer.x = ((event.clientX - container.offsetLeft) / width) * 2 - 1;
    pointer.y = -((event.clientY - container.offsetTop) / height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.findIndex((obj) => obj.object.name === "doorway001") >= 0) {
      animOpenDoor.reset();
      animOpenDoor.play();
    }
  }
  container.addEventListener("pointerdown", onPointerDown);

  // rotate room
  let targetX = 0;
  let targetY = ROOM_Y_ROTATION;
  const removeWindowPointerOrTouchMove = setupWindowPointerOrTouchMove(
    (x: number, y: number) => {
      if (x === -1 && y === -1) {
        targetX = 0;
        targetY = ROOM_Y_ROTATION;
        return;
      }
      targetY = ROOM_Y_ROTATION + (x - 0.5) * 2 * 0.7;
      targetX = (y - 0.5) * 2 * 0.4;
    }
  );

  // render loop
  function animate() {
    if (room) {
      room.rotation.x += (targetX - room.rotation.x) / 6;
      room.rotation.y += (targetY - room.rotation.y) / 6;
    }

    mixer?.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  return () => {
    renderer.dispose();
    removeOnResize();
    removeWindowPointerOrTouchMove();
    container.removeEventListener("pointerdown", onPointerDown);
  };
}
