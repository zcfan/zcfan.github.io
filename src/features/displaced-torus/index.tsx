/**
 * Credit to Visionary 3D, This scene is created by following this tutorial
 * https://www.youtube.com/watch?v=ixEPBzrhgTg&list=PLTEbuqk52pICikiHfD-a52dxEav5UqMLy
 */

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

import {
  setupOnResize,
  setupWindowPointerOrTouchMove,
} from "../../common/three/setup-events";
import pnoiseGLSL from "../../common/three/pnoise.glsl";
import { isMatarialWithMap, isMesh } from "../../common/three/utils";
import ColorRamp from "../../common/three/color-ramp";

const DEFAULT_Z = 0;

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
  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,
    0.1,
    0.87,
  );
  composer.addPass(bloomPass);

  scene.background = new THREE.Color(0xffffff);
  camera.position.set(0, 0, 7);
  camera.lookAt(0, 0, 0);

  // #region Customize MeshStandardMaterial
  // based on builtin MeshStandardMaterial to get "free" shadow and specular
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0,
    metalness: 0,
  });

  let customizedShader: THREE.WebGLProgramParametersWithUniforms;
  material.onBeforeCompile = (shader) => {
    customizedShader = shader;
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uPointing = { value: DEFAULT_Z };
    shader.uniforms.uIntensity = { value: 0 };

    const noiseMultiplierRamp = new ColorRamp("uRange", [
      { color: 0xff0000, pos: 0 },
      { color: 0x330000, pos: 0.2 },
      { color: 0x000000, pos: 0.25 },
      { color: 0x000000, pos: 0.8 },
      { color: 0x330000, pos: 0.85 },
      { color: 0xff00ff, pos: 1 },
    ]);

    shader.uniforms[noiseMultiplierRamp.name] = {
      value: noiseMultiplierRamp.texture,
    };

    // customize vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      /*glsl*/ `#include <common>`,
      /*glsl*/ `#include <common>
        ${pnoiseGLSL}
        ${noiseMultiplierRamp.shader}
        uniform float uPointing;
        uniform float uIntensity;
        uniform float uTime;
        `
    );
    shader.vertexShader = shader.vertexShader.replace(
      /*glsl*/ `#include <displacementmap_vertex>`,
      /*glsl*/ `#include <displacementmap_vertex>
        float noiseMultiplier = colorRamp(fract(uv.x + uPointing / (2. * PI)), ${noiseMultiplierRamp.name}).r;
        float noise = pnoise(position * 3. + uTime / 6.);
        float displacement = noise * noiseMultiplier * uIntensity;
        vec3 newPosition = position + normal * displacement;
        transformed = newPosition;
      `
    );

    // customize fragment shader
    shader.fragmentShader = shader.fragmentShader.replace(
      /*glsl*/ `#include <clipping_planes_pars_fragment>`,
      /*glsl*/ `#include <clipping_planes_pars_fragment>
        ${pnoiseGLSL}
        uniform float uTime;
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      /*glsl*/ `#include <color_fragment>`,
      /*glsl*/ `#include <color_fragment>
       float noise = abs(pnoise(vec3(vViewPosition.z * 40. + uTime / 10.)) - 1.);
       vec3 color = vec3(step(1., noise));
       diffuseColor = vec4(color, 1.0);
      `
    );
  };
  // #endregion

  // #region Setup scene
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.3, 200, 200),
    material
  );
  scene.add(torus);

  const light = new THREE.RectAreaLight(0xffffff, 1.2, 15, 15);
  light.position.set(0, 3, 5);
  light.lookAt(0, 0, 0);
  scene.add(light);

  var pointLight = new THREE.PointLight(0xffffff, 200, 0, 4);
  pointLight.position.set(1, 3, 5);
  scene.add(pointLight);
  // #endregion

  // #region Setup events
  const removeOnResize = setupOnResize(container, renderer, camera);

  let targetZ = DEFAULT_Z;
  let targetIndensity = 0;
  const remoteWindowPointOrTouchMove = setupWindowPointerOrTouchMove((x, y) => {
    if (x === -1 && y === -1) {
      targetIndensity = 0;
      return;
    }
    targetZ = -Math.atan2(-(y - 0.5) * 2, (x - 0.5) * 2);
    targetIndensity =
      Math.sqrt(Math.pow(y - 0.5, 2) + Math.pow(x - 0.5, 2)) * 1.7;
  });
  // #endregion

  let stopped = false;
  function animate() {
    if (stopped) return;
    if (customizedShader) {
      const elapsedTime = clock.getElapsedTime();
      customizedShader.uniforms.uTime!.value = elapsedTime;
      customizedShader.uniforms.uPointing!.value = targetZ;
      customizedShader.uniforms.uIntensity!.value +=
        (targetIndensity - customizedShader.uniforms.uIntensity!.value) / 6;
    }
    // renderer.render(scene, camera);
    composer.render();
    requestAnimationFrame(animate);
  }
  animate();

  return () => {
    stopped = true;
    pointLight.dispose();
    scene.remove(pointLight);
    light.dispose();
    scene.remove(light);
    torus.geometry.dispose();
    torus.material.dispose();
    scene.remove(torus);
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
    composer.dispose();
    renderPass.dispose();
    bloomPass.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    removeOnResize();
    remoteWindowPointOrTouchMove();
  };
}
