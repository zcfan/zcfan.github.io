import { Color, DataTexture } from "three";

interface Step {
  /**
   * @example 0xffffff
   */
  color: number
  /**
   * in range [0, 1]
   * @example 0 / 1 / 0.5
   */
  pos: number
}

/**
 * @example
 * const colorPalette = new ColorRamp({
 *   name: 'uColorPalette',
 *   steps: [
 *     { color: 0x000000, pos: 0 },
 *     { color: 0xFF0000, pos: 0.5 },
 *     { color: 0xFFFFFF, pos: 0 },
 *   ]
 * })
 * 
 * 
 * shader.fragmentShader = shader.fragmentShader.replace(
 *   `#include <output_fragment>`,
 *   `#include <output_fragment>
 *     ${demo.shader}
 *   `
 * )
 * // assign `colorPalette.ramp` to uniform variable called `colorPalette.name`
 * // inject `colorPalette.shader` into fragment or vertex shader
 * // use it in shader code like this `vec3 color = colorRamp(0.2, ${colorPalette.name});`
 */
export default class ColorRamp {
  public shader: string;
  public name: string;
  public texture: DataTexture

  constructor({ name, steps }: { name: string, steps: Step[] }) {
    this.name = name;
    this.texture = this.getConstantRamp(steps)
    this.shader = /*glsl*/ `
      uniform sampler2D ${this.name};

      #ifndef COLOR_RAMP
        #define COLOR_RAMP

        vec4 colorRamp(float t, sampler2D ramp) {
          vec2 uv = vec2(t, 0.0);
          return texture2D(ramp, uv);
        }
      #endif
    `
  }

  set ramp(steps: Step[]) {
    this.texture = this.getConstantRamp(steps)
  }

  get ramp(): DataTexture {
    return this.texture
  }

  /**
   * credit to https://codesandbox.io/p/sandbox/threejs-color-ramp-7epeo9?file=%2Fsrc%2FApp.js%3A93%2C6-102%2C4
   */
  getConstantRamp(steps: Step[]) {
    const arr = [];
    const color = new Color();

    const sorted = [...steps].sort((a, b) => a.pos - b.pos);

    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < 256; j++) {
        let position = j / 256;
        const stop = sorted.reduce((prev, curr) => {
          if (curr.pos <= position && curr.pos > prev.pos) {
            return curr;
          }
          return prev;
        });

        if (stop) {
          color.set(stop.color);
          arr.push(color.r * 255, color.g * 255, color.b * 255, 255);
        }
      }
    }

    const texture = new DataTexture(
      new Uint8Array(arr),
      256,
      1
    );
    texture.needsUpdate = true;
    return texture;
  }
}