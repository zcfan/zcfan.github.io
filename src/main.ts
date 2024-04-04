import './style.css'
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var scene = new THREE.Scene();
scene.background = new THREE.Color(100, 100, 100)

var camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const clock = new THREE.Clock()

var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls( camera, renderer.domElement );

camera.position.set( 5, 10, -15 );
controls.update();

const loader = new GLTFLoader() 
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '/draco/' );
loader.setDRACOLoader( dracoLoader );

let mixer: THREE.AnimationMixer

loader.load('study room.glb', (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene)
  const action0 = mixer.clipAction(gltf.animations[0])
  const action1 = mixer.clipAction(gltf.animations[1])
  action0.setLoop(THREE.LoopOnce, 1)
  action0.clampWhenFinished = true;
  action1.play()

  scene.add(gltf.scene)

  
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerDown(event: PointerEvent) {
      pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( scene.children );
    if (intersects.findIndex((obj) => obj.object.name === 'doorway001') >= 0) {
      action0.reset()
      action0.play()
    }
  }
  window.addEventListener('pointerdown', onPointerDown)
})

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);
  controls.update()
  const delta = clock.getDelta()
  if (mixer) mixer.update(delta)
  renderer.render(scene, camera);
}
animate();
