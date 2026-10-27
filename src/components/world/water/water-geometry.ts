import { BufferGeometry, Float32BufferAttribute } from "three";
import { cubicPoint } from "@/lib/navigation-graph";
import type { NavigationEdge } from "@/types/navigation";
import type { Vector3Tuple } from "@/types";

/** Bounded, upward-facing cross-sections. No endpoint flares or double-sided sky sheets. */
export function makeWaterway(edge:NavigationEdge,segments:number) {
  const positions:number[] = [],uv:number[] = [],indices:number[] = [];
  const point:Vector3Tuple = [0,0,0],lanes = 4,halfWidth = Math.min(.55,Math.max(.34,edge.width));
  for (let row = 0; row <= segments; row++) {
    const arc = row / segments * edge.length;
    let sample = 1;
    while (sample < edge.arcLengths.length - 1 && edge.arcLengths[sample] < arc) sample++;
    const local = (arc - edge.arcLengths[sample - 1]) / Math.max(.00001,edge.arcLengths[sample] - edge.arcLengths[sample - 1]);
    const t = Math.max(0,Math.min(1,(sample - 1 + local) / (edge.arcLengths.length - 1))),s = 1 - t;
    cubicPoint(edge,t,point);
    const dx = 3 * s * s * (edge.c1[0] - edge.start[0]) + 6 * s * t * (edge.c2[0] - edge.c1[0]) + 3 * t * t * (edge.end[0] - edge.c2[0]);
    const dz = 3 * s * s * (edge.c1[2] - edge.start[2]) + 6 * s * t * (edge.c2[2] - edge.c1[2]) + 3 * t * t * (edge.end[2] - edge.c2[2]);
    const length = Math.hypot(dx,dz) || 1;
    for (let column = 0; column <= lanes; column++) {
      const across = column / lanes * 2 - 1;
      positions.push(point[0] - dz / length * halfWidth * across,point[1] - .035 - Math.abs(across) ** 4 * .018,point[2] + dx / length * halfWidth * across);
      uv.push(column / lanes,arc);
      if (row < segments && column < lanes) { const a = row * (lanes + 1) + column,b = a + lanes + 1; indices.push(a,a + 1,b,a + 1,b + 1,b); }
    }
  }
  const geometry = new BufferGeometry().setAttribute("position",new Float32BufferAttribute(positions,3)).setAttribute("uv",new Float32BufferAttribute(uv,2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}
