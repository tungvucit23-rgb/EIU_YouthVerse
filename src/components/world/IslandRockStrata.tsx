"use client";

import { useLayoutEffect, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import type { IslandShape } from "@/types";
import { useTerrainTextures } from "./TerrainTextures";
import { useWorldQuality } from "./WorldQuality";
import { shoreline } from "./islands/terrain-geometry";

export function IslandRockStrata({ radius, depth, shape,polished = false }: { radius: number; depth: number; shape: IslandShape;polished?:boolean }) {
  const rocks = useRef<InstancedMesh>(null);
  const textures = useTerrainTextures();
  const { preset } = useWorldQuality();
  const count = preset.rockCount * (polished ? 1 : 2);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < count; i++) {
      const level = polished ? i % 3 === 0 ? 1 : 0 : i < count / 2 ? 0 : 1;
      const angle = polished ? i * 2.39996 + shape.seed : (i % (count / 2)) / (count / 2) * Math.PI * 2 + shape.seed;
      const variation = (Math.sin(i * 3.17 + shape.seed) + 1) / 2;
      const band = (level ? 0.6 : 0.87) * shoreline(angle, shape);
      dummy.position.set(Math.cos(angle) * radius * band * shape.stretch[0], -depth * (level ? 0.62 : 0.24) + (variation - 0.5) * 0.3, Math.sin(angle) * radius * band * shape.stretch[1]);
      dummy.scale.set(radius * (polished ? .04 + variation * .035 : .052 + variation * .035), depth * (polished ? .025 + variation * .025 : level ? .12 : .15 + variation * .03), radius * (polished ? .055 : .065));
      dummy.rotation.set((variation - 0.5) * (polished ? .16 : .7), -angle + i * .2, (variation - .5) * (polished ? .1 : .45));
      dummy.updateMatrix(); rocks.current?.setMatrixAt(i, dummy.matrix);
      rocks.current?.setColorAt(i, new Color(polished ? "#b6beac" : i % 4 ? "#c8ccc1" : "#e0dfce").multiplyScalar(level ? .87 : 1));
    }
    if (rocks.current) { rocks.current.instanceMatrix.needsUpdate = true; if (rocks.current.instanceColor) rocks.current.instanceColor.needsUpdate = true;rocks.current.computeBoundingSphere(); }
  }, [radius, depth, count, shape,polished]);
  return <instancedMesh ref={rocks} args={[undefined, undefined, count]}>{polished ? <sphereGeometry args={[1,8,5]}/> : <dodecahedronGeometry args={[1,0]}/>}<meshStandardMaterial map={textures?.stone} roughness={.98} flatShading={!polished} /></instancedMesh>;
}
