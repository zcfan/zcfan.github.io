import { Material, Mesh, Object3D, Object3DEventMap, Texture } from "three"

export function isMesh(obj: Object3D<Object3DEventMap>): obj is Mesh {
  return obj.type === 'Mesh'
}

export function isMatarialWithMap(material: Material): material is Material & { map: Texture } {
  return (material as any).map?.isTexture
}