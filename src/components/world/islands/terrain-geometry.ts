import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import type { IslandShape } from "@/types";

export function shoreline(angle: number, shape: IslandShape) {
  return 1 + Math.sin(angle * 3 + shape.seed) * 0.085 + Math.cos(angle * 7 - shape.seed * 0.7) * 0.06 + Math.sin(angle * 13 + shape.seed) * 0.026;
}

export function makeTerrain(shape: IslandShape, segments: number,polished = false) {
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rings = 7;
  const color = new Color();
  for (let ring = 0; ring <= rings; ring++) {
    const fraction = ring / rings;
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const radius = fraction * shape.radius * shoreline(angle, shape);
      const x = Math.cos(angle) * radius * shape.stretch[0], z = Math.sin(angle) * radius * shape.stretch[1];
      const rise = fraction < .58 ? 0 : Math.sin(x * (polished ? .87 : 2.1) + shape.seed) * Math.cos(z * (polished ? 1.13 : 1.7)) * (polished ? .16 * Math.sin((fraction - .58) / .42 * Math.PI) : .075 * fraction);
      positions.push(x, 0.11 + rise - Math.pow(fraction, 10) * 0.08, z);
      color.set(fraction > 0.91 ? polished ? "#a5a473" : "#99a16b" : polished ? "#8eaa62" : "#819950").offsetHSL(0, Math.sin(angle * 4) * 0.03, Math.sin(x * (polished ? .8 : 3) + z * (polished ? 1.3 : 2)) * (polished ? .055 : .025));
      colors.push(color.r, color.g, color.b); uvs.push(x / shape.radius * 0.5 + 0.5, z / shape.radius * 0.5 + 0.5);
      if (ring < rings && i < segments) { const a = ring * (segments + 1) + i, b = a + segments + 1; indices.push(a, b + 1, b, a, a + 1, b + 1); }
    }
  }
  if(polished) {
    const skirt = positions.length / 3;
    for(let i = 0;i <= segments;i++) {const a = (rings * (segments + 1) + i) * 3;positions.push(positions[a],-.055,positions[a + 2]);colors.push(.52,.56,.32);uvs.push(i / segments,0);}
    for(let i = 0;i < segments;i++) {const a = rings * (segments + 1) + i,b = skirt + i;indices.push(a,a + 1,b,a + 1,b + 1,b);}
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

export function makeCliff(shape: IslandShape, segments: number,polished = false) {
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const layers = polished ? [0,.035,.13,.19,.31,.39,.56,.62,.78,.9,1] : [0, 0.08, 0.2, 0.39, 0.61, 0.82, 1];
  const radii = polished ? [1,1.015,.98,1.0,.88,.92,.73,.76,.51,.29,.06] : [1, 1.025, 0.97, 0.83, 0.66, 0.38, 0.08];
  const palette = ["#d5d3c6", "#c7ccbf", "#d0cbbb", "#c2ccc6", "#d7d4c5"];
  for (let layer = 0; layer < layers.length; layer++) for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    const erosion = 1 + (layer === 0 ? 0 : Math.sin(angle * (polished ? 7 : 17) + layer * (polished ? .42 : 1.2) + shape.seed) * (polished ? .025 : .04));
    const radius = shape.radius * shoreline(angle, shape) * radii[layer] * erosion;
    const y = -layers[layer] * shape.depth + Math.sin(angle * (polished ? 4 : 9) + shape.seed + (polished ? layer * .2 : layer)) * (polished ? .09 : .13) * layers[layer];
    positions.push(Math.cos(angle) * radius * shape.stretch[0], y, Math.sin(angle) * radius * shape.stretch[1]);
    const color = new Color(polished ? ["#d9d7c4","#c1c5b3","#b4bbaa","#d5d4bd"][layer % 4] : palette[(layer + Math.floor(shape.seed)) % palette.length]).multiplyScalar(1 - layers[layer] * (polished ? .23 : .18) + Math.sin(angle * 5 + shape.seed) * .035);
    colors.push(color.r, color.g, color.b); uvs.push(i / segments, layers[layer]);
    if (layer < layers.length - 1 && i < segments) { const a = layer * (segments + 1) + i, b = a + segments + 1; indices.push(a,a + 1,b,a + 1,b + 1,b); }
  }
  const bottom = positions.length / 3;positions.push(0,-shape.depth - .06,0);colors.push(.5,.54,.47);uvs.push(.5,1);
  for(let i = 0;i < segments;i++) {const a = (layers.length - 1) * (segments + 1) + i;indices.push(bottom,a,a + 1);}
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}
