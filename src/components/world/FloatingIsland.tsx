"use client";

import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import type { ThreeElements } from "@react-three/fiber";
import type { IslandShape } from "@/types";
import { useTerrainTextures } from "./TerrainTextures";
import { IslandRockStrata } from "./IslandRockStrata";
import { useWorldQuality } from "./WorldQuality";
import { makeCliff, makeTerrain, shoreline } from "./islands/terrain-geometry";

type Props = ThreeElements["group"] & { radius?: number; depth?: number; grass?: string; shape?: IslandShape; simple?: boolean;polished?:boolean };

export function FloatingIsland({ radius = 5.3, depth = 3.8, grass = "#ffffff", shape: configured, simple = false,polished = false, children, ...props }: Props) {
  const { preset,quality } = useWorldQuality();
  const shape = useMemo(() => configured ?? { radius, depth, seed: 1.2, stretch: [1, 0.94] as [number, number] }, [configured, radius, depth]);
  const segments = preset.terrainSegments;
  const cliff = useMemo(() => makeCliff(shape, segments,polished), [shape, segments,polished]);
  const terrain = useMemo(() => makeTerrain(shape, segments,polished), [shape, segments,polished]);
  const distantCliff = useMemo(() => makeCliff(shape,24,polished), [shape,polished]);
  const distantTerrain = useMemo(() => makeTerrain(shape,24,polished), [shape,polished]);
  const vines = useMemo(() => {
    const positions: number[] = [];
    for (let root = 0; root < 8; root++) {
      const angle = root / 8 * Math.PI * 2 + shape.seed;
      const edge = shape.radius * shoreline(angle, shape);
      let previous = [Math.cos(angle) * edge * shape.stretch[0], -0.03, Math.sin(angle) * edge * shape.stretch[1]];
      for (let step = 1; step <= 4; step++) {
        const next = [previous[0] * 0.975 + Math.sin(root + step) * 0.03, -step * 0.17, previous[2] * 0.977];
        positions.push(...previous, ...next); previous = next;
      }
    }
    const geometry = new BufferGeometry(); geometry.setAttribute("position", new Float32BufferAttribute(positions, 3)); return geometry;
  }, [shape]);
  const textures = useTerrainTextures();
  useEffect(() => () => { cliff.dispose(); terrain.dispose(); }, [cliff,terrain]);
  useEffect(() => () => { distantCliff.dispose(); distantTerrain.dispose(); vines.dispose(); }, [distantCliff,distantTerrain,vines]);
  return <group {...props}>
    <mesh geometry={simple ? distantCliff : cliff} receiveShadow><meshStandardMaterial vertexColors map={textures?.stone} bumpMap={quality === "low" ? null : textures?.stone} bumpScale={polished ? .045 : .075} roughness={0.97} /></mesh>
    <mesh geometry={simple ? distantTerrain : terrain} receiveShadow><meshStandardMaterial color={grass} vertexColors map={textures?.grass} roughness={1} /></mesh>
    <group visible={!simple}><IslandRockStrata polished={polished} shape={shape} radius={shape.radius} depth={shape.depth} /><lineSegments geometry={vines}><lineBasicMaterial color="#647044" transparent opacity={0.75} /></lineSegments></group>
    {children}
  </group>;
}
