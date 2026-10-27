"use client";

import { Shape } from "three";
import { useMemo } from "react";
import { useSceneryMaterials } from "../../SceneryMaterials";
import { Trees } from "../../Trees";
import { Bench, Building, CurvedPath, GardenBed, Sign } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-2.15,0.12,-0.5],[-1.65,0.12,-1.7],[1.4,0.12,-1.7],[2.2,0.12,-0.3],[1.95,0.12,1.4]];
const path: Vector3Tuple[] = [[-0.1,0.14,2.65],[0,0.14,1.3],[-0.25,0.14,0.5],[0,0.14,-0.6]];
export default function ClubsIsland() {
  const m = useSceneryMaterials();
  const guitar = useMemo(() => { const shape = new Shape(); shape.moveTo(0,0); shape.bezierCurveTo(-0.38,0,-0.36,0.3,-0.13,0.38); shape.bezierCurveTo(-0.3,0.67,0.3,0.67,0.13,0.38); shape.bezierCurveTo(0.36,0.3,0.38,0,0,0); return shape; }, []);
  return <group name="creative-student-village">
    <Building position={[-1.25,0.12,-0.65]} rotation={0.18} width={1.1} height={1.02} depth={1.15} sign="MUSIC" />
    <Building position={[0.55,0.12,-1.1]} width={1.15} depth={0.95} height={0.9} roof="curved" sign="STUDIO" />
    <Building position={[1.5,0.12,0.15]} rotation={-0.3} width={1} height={1.1} depth={1} roof="flat" sign="TECH LAB" />
    <group position={[-0.9,0.28,0.75]} rotation={[0,0.2,-0.12]}><mesh material={m.gold}><extrudeGeometry args={[guitar,{depth:0.06,bevelEnabled:true,bevelSize:0.025,bevelThickness:0.02,bevelSegments:2,steps:1,curveSegments:12}]} /></mesh><mesh position={[0,0.78,0.04]} material={m.darkWood}><boxGeometry args={[0.065,0.55,0.045]} /></mesh><mesh position={[0,0.33,0.075]} material={m.navy}><circleGeometry args={[0.07,16]} /></mesh></group>
    <group position={[0.65,0.5,0.65]}>{[0,1,2].map((i) => <mesh key={i} rotation={[i * 0.8,i * 0.6,0.3]} material={m.metal}><torusGeometry args={[0.22,0.014,5,24]} /></mesh>)}<mesh material={m.gold}><sphereGeometry args={[0.055,8,6]} /></mesh></group>
    <Sign text="CREATE TOGETHER" width={1.3} height={0.21} position={[0,0.37,1.05]} />
    <GardenBed position={[-1.55,0.12,1.25]} scale={0.67} rotation={0.25} /><Bench position={[0.65,0.12,1.55]} rotation={-0.15} />
    <CurvedPath points={path} width={0.39} /><Trees positions={grove} scale={0.8} />
  </group>;
}
