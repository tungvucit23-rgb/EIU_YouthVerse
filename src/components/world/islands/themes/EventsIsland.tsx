"use client";

import { useSceneryMaterials } from "../../SceneryMaterials";
import { Trees } from "../../Trees";
import { Amphitheater, BannerLine, FestivalStage } from "../FestivalStructures";
import { CurvedPath, Lamp, NoticeBoard } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-2.7,0.12,-0.4],[-2.2,0.12,-1.6],[2.25,0.12,-1.6],[2.7,0.12,0.35]];
const path: Vector3Tuple[] = [[-0.1,0.14,2.85],[-0.4,0.14,1.6],[0,0.14,0.7],[0,0.14,0]];
export default function EventsIsland() {
  const m = useSceneryMaterials();
  return <group name="events-amphitheater">
    <Amphitheater position={[0,0.12,-0.3]} />
    <FestivalStage position={[0,0.12,0.1]} concert scale={0.83} />
    <BannerLine position={[0,0.12,1.4]} width={4.1} scale={0.84} />
    <NoticeBoard position={[-1.85,0.12,1.2]} text="LỊCH SỰ KIỆN" scale={0.8} rotation={0.2} />
    <group position={[-1.85,1.1,1.2]}>{[-0.18,0.18].map((x) => <mesh key={x} position={[x,0.01,0.04]} rotation={[Math.PI / 2,0,0]} material={m.gold}><torusGeometry args={[0.065,0.016,5,12]} /></mesh>)}</group>
    <Lamp position={[-1.3,0.12,1.85]} /><Lamp position={[1.3,0.12,1.85]} />
    <CurvedPath points={path} width={0.4} /><Trees positions={grove} scale={0.83} />
  </group>;
}
