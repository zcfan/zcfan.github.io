import { Color, DataTexture } from "three";

type InterpolationFunction = (a: number, b: number, x: number) => number

interface Stop {
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

interface Options {
  interpolation: InterpolationFunction
  textureSize: number
}

/**
 * Partially implement the functionality of blender color ramp widget.
 * https://docs.blender.org/manual/en/latest/interface/controls/templates/color_ramp.html
 * 
 * Want customize interpolation? check this easing cheat sheet:
 * https://easings.net/
 * 
 * @example
 * const colorPalette = new ColorRamp({
 *   name: 'uColorPalette',
 *   stops: [
 *     { color: 0x000000, pos: 0 },
 *     { color: 0xFF0000, pos: 0.5 },
 *     { color: 0xFFFFFF, pos: 0.75 },
 *     // without pos 1, it will take the color of prev stop, in this case, 0xFFFFFF
 *     // { color: 0xFFFFFF, pos: 1 },
 *   ]
 * })
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
  public texture: DataTexture
  public options: Options

  constructor(public name: string, public stops: Stop[], options?: Partial<Options>) {
    this.options = {
      interpolation: linear,
      textureSize: 256,
      ...options
    }
    this.texture = this.getRamp(this.stops)
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

  set ramp(stops: Stop[]) {
    this.texture = this.getRamp(stops)
  }

  get ramp(): DataTexture {
    return this.texture
  }

  getRamp(stops: Stop[]) {
    const arr = [];
    const curColor = new Color();
    const nextColor = new Color();

    const sorted = stops.slice().sort((a, b) => a.pos - b.pos);
    let curStopIndex = 0
    for (let i = 0; i < this.options.textureSize; i++) {
      const position = i / this.options.textureSize;
      const curStop = sorted[curStopIndex]!
      const nextStop = sorted[curStopIndex + 1]
      const curPos = curStop.pos
      const nextPos = nextStop?.pos || 1
      curColor.set(curStop.color)
      nextColor.set(nextStop?.color || curStop.color)

      console.log(position, curPos, nextPos, curColor, nextColor)

      if (position < curPos) {
        arr.push(curColor.r * 255, curColor.g * 255, curColor.b * 255, 255)
      } else if (position >= curPos && position < nextPos) {
        const progress = (position - curPos) / (nextPos - curPos)
        arr.push(
          this.options.interpolation(curColor.r, nextColor.r, progress) * 255,
          this.options.interpolation(curColor.g, nextColor.g, progress) * 255,
          this.options.interpolation(curColor.b, nextColor.b, progress) * 255,
          255,
        )
      } else {
        arr.push(nextColor.r * 255, nextColor.g * 255, nextColor.b * 255, 255)
        curStopIndex++
      }
    }

    const texture = new DataTexture(
      new Uint8Array(arr),
      this.options.textureSize,
      1
    );
    texture.needsUpdate = true;
    return texture;
  }

  dispose() {
    this.texture.dispose()
  }
}

export const linear: InterpolationFunction = function linear(a, b, x) {
  return a + (b - a) * x
}

export const constant: InterpolationFunction = function constant(a, _b, _x) {
  return a
}