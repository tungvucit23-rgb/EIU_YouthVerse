"use client";

import { useLayoutEffect, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import type { IslandShape } from "@/types";
import { useTerrainTextures } from "./TerrainTextures";
import { useWorldQuality } from "./WorldQuality";
import { shoreline } from "./islands/terrain-geometry";

export function IslandRockStrata({ radius, depth, shape }: { radius: number; depth: number; shape: IslandShape }) {
  const rocks = useRef<InstancedMesh>(null);
  const textures = useTerrainTextures();
  const { preset } = useWorldQuality();
  const count = preset.rockCount * 2;
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < count; i++) {
      const level = i < count / 2 ? 0 : 1;
      const angle = (i % (count / 2)) / (count / 2) * Math.PI * 2 + shape.seed;
      const variation = (Math.sin(i * 3.17 + shape.seed) + 1) / 2;
      const band = (level ? 0.6 : 0.87) * shoreline(angle, shape);
      dummy.position.set(Math.cos(angle) * radius * band * shape.stretch[0], -depth * (level ? 0.62 : 0.24) + (variation - 0.5) * 0.3, Math.sin(angle) * radius * band * shape.stretch[1]);
      dummy.scale.set(radius * (0.052 + variation * 0.035), depth * (level ? 0.12 : 0.15 + variation * 0.03), radius * 0.065);
      dummy.rotation.set((variation - 0.5) * 0.7, -angle + i * 0.2, (variation - 0.5) * 0.45);
      dummy.updateMatrix(); rocks.current?.setMatrixAt(i, dummy.matrix);
      rocks.current?.setColorAt(i, new Color(i % 4 ? "#c8ccc1" : "#e0dfce").multiplyScalar(level ? 0.87 : 1));
    }
    if (rocks.current) { rocks.current.instanceMatrix.needsUpdate = true; if (rocks.current.instanceColor) rocks.current.instanceColor.needsUpdate = true; }
  }, [radius, depth, count, shape]);
  return <instancedMesh ref={rocks} args={[undefined, undefined, count]}><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial map={textures?.stone} roughness={0.98} flatShading /></instancedMesh>;
}
