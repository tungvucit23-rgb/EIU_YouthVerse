import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import type { IslandShape } from "@/types";

export function shoreline(angle: number, shape: IslandShape) {
  return 1 + Math.sin(angle * 3 + shape.seed) * 0.085 + Math.cos(angle * 7 - shape.seed * 0.7) * 0.06 + Math.sin(angle * 13 + shape.seed) * 0.026;
}

export function makeTerrain(shape: IslandShape, segments: number) {
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rings = 7;
  const color = new Color();
  for (let ring = 0; ring <= rings; ring++) {
    const fraction = ring / rings;
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      const radius = fraction * shape.radius * shoreline(angle, shape);
      const x = Math.cos(angle) * radius * shape.stretch[0], z = Math.sin(angle) * radius * shape.stretch[1];
      const rise = fraction < 0.58 ? 0 : Math.sin(x * 2.1 + shape.seed) * Math.cos(z * 1.7) * 0.075 * fraction;
      positions.push(x, 0.11 + rise - Math.pow(fraction, 10) * 0.08, z);
      color.set(fraction > 0.91 ? "#99a16b" : "#819950").offsetHSL(0, Math.sin(angle * 4) * 0.03, Math.sin(x * 3 + z * 2) * 0.025);
      colors.push(color.r, color.g, color.b); uvs.push(x / shape.radius * 0.5 + 0.5, z / shape.radius * 0.5 + 0.5);
      if (ring < rings && i < segments) { const a = ring * (segments + 1) + i, b = a + segments + 1; indices.push(a, b + 1, b, a, a + 1, b + 1); }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

export function makeCliff(shape: IslandShape, segments: number) {
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  const layers = [0, 0.08, 0.2, 0.39, 0.61, 0.82, 1];
  const radii = [1, 1.025, 0.97, 0.83, 0.66, 0.38, 0.08];
  const palette = ["#d5d3c6", "#c7ccbf", "#d0cbbb", "#c2ccc6", "#d7d4c5"];
  for (let layer = 0; layer < layers.length; layer++) for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    const erosion = 1 + Math.sin(angle * 17 + layer * 1.2 + shape.seed) * 0.04;
    const radius = shape.radius * shoreline(angle, shape) * radii[layer] * erosion;
    const y = -layers[layer] * shape.depth + Math.sin(angle * 9 + shape.seed + layer) * 0.13 * layers[layer];
    positions.push(Math.cos(angle) * radius * shape.stretch[0], y, Math.sin(angle) * radius * shape.stretch[1]);
    const color = new Color(palette[(layer + Math.floor(shape.seed)) % palette.length]).multiplyScalar(1 - layer * 0.03 + Math.sin(angle * 5 + shape.seed) * 0.035);
    colors.push(color.r, color.g, color.b); uvs.push(i / segments, layers[layer]);
    if (layer < layers.length - 1 && i < segments) { const a = layer * (segments + 1) + i, b = a + segments + 1; indices.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); geometry.setAttribute("color", new Float32BufferAttribute(colors, 3)); geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}
