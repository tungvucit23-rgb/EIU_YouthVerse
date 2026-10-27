"use client";

import { useSceneryMaterials } from "../../SceneryMaterials";
import { Trees } from "../../Trees";
import { Bench, Building, CurvedPath, Lamp, Sign } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-2,0.12,-1.1],[-1.1,0.12,-1.9],[1.8,0.12,-1.35],[2.1,0.12,0.6],[-1.9,0.12,1.5]];
const path: Vector3Tuple[] = [[0.1,0.14,3],[0.2,0.14,1.4],[0,0.14,0.6]];
export default function OfficeIsland() {
  const m = useSceneryMaterials();
  return <group name="digital-office-service-center">
    <Building position={[-0.55,0.12,-0.65]} width={1.9} depth={1.5} height={1.7} roof="flat" />
    <Building position={[1,0.12,-0.25]} width={1.05} depth={1.35} height={1.1} roof="flat" />
    <mesh position={[0,1.25,0.6]} rotation={[0,0,-0.04]} material={m.ivory} castShadow><boxGeometry args={[2.6,0.085,0.8]} /></mesh>
    {[-0.95,0,0.95].map((x) => <mesh key={x} position={[x,0.69,0.85]} material={m.metal}><cylinderGeometry args={[0.023,0.025,1.1,8]} /></mesh>)}
    <Sign text="VĂN PHÒNG ĐOÀN – HỘI" width={1.8} height={0.27} position={[-0.4,1.5,0.13]} />
    <group position={[-1.5,0.14,1.05]}><mesh position={[0,0.25,0]} material={m.stone}><boxGeometry args={[0.5,0.5,0.4]} /></mesh>{[0,1,2].map((i) => <mesh key={i} position={[i * 0.03,0.6 + i * 0.13,0]} rotation={[0,0,-0.15]} material={i === 1 ? m.blueCloth : m.ivory}><boxGeometry args={[0.38,0.055,0.3]} /></mesh>)}</group>
    <Lamp position={[1.3,0.12,1.5]} /><Bench position={[1.3,0.12,1.9]} /><CurvedPath points={path} width={0.43} /><Trees positions={grove} scale={0.8} />
  </group>;
}
