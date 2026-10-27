"use client";

import { useMemo } from "react";
import { Path, Shape } from "three";
import { CampusBuildings } from "./CampusBuildings";
import { CampusEntrance } from "./CampusEntrance";
import { FloatingIsland } from "./FloatingIsland";
import { Trees } from "./Trees";
import { CampusLandscape } from "./CampusLandscape";
import { campus } from "@/data/islands";
import { Bench, IslandDock, Lamp } from "./islands/Scenery";
import { ReplaceableIslandModel } from "./islands/IslandArt";
import { StaticSceneryBatch } from "./islands/StaticSceneryBatch";
import type { Vector3Tuple } from "@/types";

const trees: Vector3Tuple[] = [
  [-4.2, 0.15, 0.1], [-4, 0.15, 1.6], [-3.8, 0.15, -1.6], [-3.6, 0.15, -2.7],
  [-2.5, 0.15, -3.5], [-1.1, 0.15, -3.85], [0.3, 0.15, -3.8], [1.7, 0.15, -3.5],
  [3.4, 0.15, -2.8], [4.1, 0.15, -1.8], [4.35, 0.15, -0.45], [4.1, 0.15, 1],
  [3.6, 0.15, 2.4], [-3.7, 0.15, 2.8], [-2.5, 0.15, 3.6],
  [2.6, 0.15, 3.4], [-1.2, 0.15, -0.8], [1.1, 0.15, -0.5],
  [-4.35, 0.15, -0.8], [-3.25, 0.15, -3.35], [-1.8, 0.15, -3.9], [-0.5, 0.15, -4.2],
  [0.8, 0.15, -4.05], [2.3, 0.15, -3.6], [3.85, 0.15, -2.4], [4.55, 0.15, 0.3],
  [-4, 0.15, 2.25], [-3.1, 0.15, 3.2], [3.4, 0.15, 2.95],
];

export function CentralEIUIsland() {
  const road = useMemo(() => {
    const shape = new Shape();
    shape.absellipse(0, 0, 4.3, 3.5, 0, Math.PI * 2, false);
    const hole = new Path();
    hole.absellipse(0, 0, 3.75, 2.97, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, []);
  return (
    <group position={campus.position} rotation={[0,campus.rotation,0]} scale={campus.scale}>
      <FloatingIsland shape={campus.shape}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.121, 0]} receiveShadow>
          <shapeGeometry args={[road, 64]} />
          <meshStandardMaterial color="#969c8f" roughness={1} />
        </mesh>
        <mesh position={[0, 0.13, 1.6]} receiveShadow>
          <boxGeometry args={[6.7, 0.035, 1.9]} />
          <meshStandardMaterial color="#e5ddc7" />
        </mesh>
        <mesh position={[0, 0.14, 3.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.85, 40]} />
          <meshStandardMaterial color="#e4ddc8" />
        </mesh>
        <mesh position={[0, 0.16, 3.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.64, 40]} />
          <meshStandardMaterial color="#86bfcc" roughness={0.22} metalness={0.2} />
        </mesh>
        <ReplaceableIslandModel asset={campus.asset} fallback={<StaticSceneryBatch><CampusBuildings /><CampusEntrance /></StaticSceneryBatch>} />
        <CampusLandscape />
        <Trees positions={trees} scale={0.95} />
        <IslandDock position={campus.dock.position} heading={campus.dock.rotation} />
        <Bench position={[-1.7,0.13,2.9]} rotation={0.15} />
        <Bench position={[1.7,0.13,2.9]} rotation={-0.15} />
        <Lamp position={[-0.8,0.13,4]} /><Lamp position={[1.4,0.13,4]} />
      </FloatingIsland>
    </group>
  );
}
