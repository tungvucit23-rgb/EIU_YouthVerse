"use client";

import { Trees } from "../../Trees";
import { RecognitionMonument } from "../FestivalStructures";
import { Bench, Building, CurvedPath, Lamp, NoticeBoard } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-1.8,0.12,-1.6],[0,0.12,-2.3],[1.9,0.12,-1.1],[-2,0.12,0.45],[1.9,0.12,1.4]];
const path: Vector3Tuple[] = [[0,0.14,2.7],[0.4,0.14,1.4],[0,0.14,0.5]];
export default function AchievementsIsland() {
  return <group name="recognition-exhibition-island">
    <RecognitionMonument position={[0,0.12,0]} scale={1.1} />
    <Building position={[-0.65,0.12,-1.4]} width={1.6} depth={0.8} height={0.8} roof="curved" sign="HÀNH TRÌNH GHI NHẬN" />
    <NoticeBoard position={[-1.3,0.12,0.95]} scale={0.62} rotation={0.25} text="KHÁM PHÁ" />
    <NoticeBoard position={[1.35,0.12,0.5]} scale={0.62} rotation={-0.25} text="CỐNG HIẾN" />
    <Lamp position={[-0.7,0.12,1.55]} /><Lamp position={[0.7,0.12,1.55]} />
    <Bench position={[-1.3,0.12,1.7]} rotation={0.15} /><CurvedPath points={path} width={0.4} /><Trees positions={grove} scale={0.83} />
  </group>;
}
