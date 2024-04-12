/**
 * Credit to Visionary 3D, This scene is created by following this tutorial
 * https://www.youtube.com/watch?v=ixEPBzrhgTg&list=PLTEbuqk52pICikiHfD-a52dxEav5UqMLy
 */

import * as THREE from "three";
import { useEffect, useRef } from "react";
import {
  setupOnResize,
  setupWindowPointerOrTouchMove,
} from "../../common/three/setup-events";

import pnoiseGLSL from "../../common/three/pnoise.glsl";
import { isMatarialWithMap, isMesh } from "../../common/three/utils";

export default function DisplacedTorus() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return initScene(canvasRef.current);
  }, []);

  return <div className="three-scene" ref={canvasRef} />;
}

function initScene(container: HTMLDivElement) {
  const { width, height } = container.getBoundingClientRect();
  const scene = new THREE.Scene();
  const clock = new THREE.Clock();
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  scene.background = new THREE.Color(0xffffff);
  camera.position.set(-3, 3, 7);
  camera.lookAt(0, 0, 0);

  // #region Customize MeshStandardMaterial
  // based on builtin MeshStandardMaterial to get "free" shadow and specular
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0,
    metalness: 0,
    transparent: true,
  });

  let customizedShader: THREE.WebGLProgramParametersWithUniforms;
  material.onBeforeCompile = (shader) => {
    customizedShader = shader;
    shader.uniforms.uNoise = {
      value: new THREE.TextureLoader().load("textures/noise.png"),
    };
    shader.uniforms.uTime = {
      value: 0,
    };

    shader.vertexShader = shader.vertexShader.replace(
      /*glsl*/ `#include <common>`,
      /*glsl*/ `#include <common>
        varying vec2 vUv;
      `
    );
    shader.vertexShader = shader.vertexShader.replace(
      /*glsl*/ `#include <displacementmap_vertex>`,
      /*glsl*/ `#include <displacementmap_vertex>
        vUv = uv;
      `
    );

    // customize fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      /*glsl*/ `#include <clipping_planes_pars_fragment>`,
      /*glsl*/ `#include <clipping_planes_pars_fragment>
        ${pnoiseGLSL}
        uniform float uTime;
        uniform sampler2D uNoise;
        varying vec2 vUv;
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      /*glsl*/ `#include <dithering_fragment>`,
      /*glsl*/ `#include <dithering_fragment>
       
       float threshold = clamp(texture2D(uNoise, vUv).r * 1.2, 0., 1.);
       float bright = (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b + gl_FragColor.a) / 4. / 2.;
       gl_FragColor = vec4(gl_FragColor.rgb, ((bright > threshold) || (uTime * 10. > vViewPosition.z)) ? 1.0 : 0.);
      `
    );
  };
  // #endregion

  // #region Setup scene
  const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
  scene.add(cube);

  const light = new THREE.RectAreaLight(0xffffff, 0.4, 15, 15);
  light.position.set(0, 3, 0);
  light.lookAt(0, 0, 0);
  scene.add(light);

  var pointLight = new THREE.PointLight(0xffffff, 200, 0, 4);
  pointLight.position.set(2, 3, 5);
  scene.add(pointLight);
  // #endregion

  // #region Setup events
  const removeOnResize = setupOnResize(container, renderer, camera);

  let targetX = 0;
  let targetY = 0;
  const remoteWindowPointOrTouchMove = setupWindowPointerOrTouchMove(
    (x: number, y: number) => {
      if (x === -1 && y === -1) {
        targetX = 0;
        targetY = 0;
        return;
      }
      targetY = (x - 0.5) * 2 * 0.7;
      targetX = (y - 0.5) * 2 * 0.4;
    }
  );
  // #endregion

  let stopped = false;
  function animate() {
    if (stopped) return;
    if (cube) {
      cube.rotation.x += (targetX - cube.rotation.x) / 6;
      cube.rotation.y += (targetY - cube.rotation.y) / 6;
    }
    if (customizedShader) {
      customizedShader.uniforms.uTime!.value = clock.getElapsedTime();
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  return () => {
    stopped = true;
    pointLight.dispose();
    scene.remove(pointLight);
    light.dispose();
    scene.remove(light);
    cube.geometry.dispose();
    cube.material.dispose();
    scene.remove(cube);
    scene.traverse((obj) => {
      if (isMesh(obj)) {
        obj.geometry.dispose();
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(
          (material) => {
            if (isMatarialWithMap(material)) {
              material.map.dispose();
            }
            material.dispose();
          }
        );
      }
    });
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    removeOnResize();
    remoteWindowPointOrTouchMove();
  };
}
