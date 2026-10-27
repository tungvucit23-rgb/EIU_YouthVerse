import type { Vector3Tuple } from "@/types";

/** Three.js Y rotation, shared by the registry, camera bounds and dock tests. */
export function transformWorldPoint(position:Vector3Tuple,scale:number,rotation:number,local:Vector3Tuple):Vector3Tuple {
  const c = Math.cos(rotation),s = Math.sin(rotation);
  return [position[0] + (local[0] * c + local[2] * s) * scale,position[1] + local[1] * scale,position[2] + (-local[0] * s + local[2] * c) * scale];
}
