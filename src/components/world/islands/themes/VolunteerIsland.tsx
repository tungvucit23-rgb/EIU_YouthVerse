"use client";

import { useSceneryMaterials } from "../../SceneryMaterials";
import { Trees } from "../../Trees";
import { Greenhouse } from "../FestivalStructures";
import { Bench, CurvedPath, GardenBed, NoticeBoard, TimberPlatform } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-1.8,0.12,-1.6],[-0.3,0.12,-2.2],[1.2,0.12,-1.7],[1.9,0.12,-0.8],[-2.2,0.12,0.5],[1.8,0.12,1.8]];
const path: Vector3Tuple[] = [[0.25,0.14,3],[0.25,0.14,1.7],[-0.3,0.14,0.7],[-0.6,0.14,-0.6]];
export default function VolunteerIsland() {
  const m = useSceneryMaterials();
  return <group name="volunteer-community-garden">
    <Greenhouse position={[-0.65,0.12,-0.75]} rotation={-0.12} />
    <GardenBed position={[1.1,0.12,-0.45]} rotation={0.1} /><GardenBed position={[1.1,0.12,0.55]} rotation={0.1} />
    <GardenBed position={[-1.2,0.12,1.1]} rotation={0.3} scale={0.85} />
    <TimberPlatform position={[0,0.02,1.3]} width={0.66} depth={1.2} rotation={-0.18} />
    <group position={[0.35,0.22,1.2]}>{[-1,1].map((side) => <mesh key={side} position={[side * 0.36,0.23,0]} rotation={[0,0,side * 0.03]} material={m.wood}><boxGeometry args={[0.03,0.05,1.2]} /></mesh>)}</group>
    <NoticeBoard position={[-1.7,0.12,1.8]} text="GIEO ĐIỀU TỐT" scale={0.63} />
    <Bench position={[0.95,0.12,1.9]} rotation={0.2} /><CurvedPath points={path} /><Trees positions={grove} scale={0.88} />
  </group>;
}
