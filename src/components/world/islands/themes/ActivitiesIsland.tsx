"use client";

import { Trees } from "../../Trees";
import { BannerLine, FestivalCanopy, FestivalStage } from "../FestivalStructures";
import { Bench, CurvedPath, NoticeBoard, TimberPlatform } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-2,0.12,-0.6],[-1.6,0.12,-1.7],[1.75,0.12,-1.2],[2.1,0.12,0.3],[-2.2,0.12,0.65]];
const path: Vector3Tuple[] = [[0.17,0.14,2.4],[0.1,0.14,1.3],[-0.2,0.14,0.4],[0,0.14,-0.4]];
export default function ActivitiesIsland() {
  return <group name="activities-festival-park">
    <FestivalStage position={[0,0.12,-0.85]} scale={0.94} />
    <TimberPlatform position={[0,0.03,0.6]} width={2.6} depth={1.5} />
    <BannerLine position={[0,0.12,0.5]} width={4.1} />
    <FestivalCanopy position={[-1.8,0.12,0.6]} width={0.8} depth={0.85} height={0.7} />
    <FestivalCanopy position={[1.75,0.12,0.65]} width={0.8} depth={0.85} height={0.7} />
    <Bench position={[-1.15,0.13,1.6]} rotation={-0.15} /><Bench position={[1.25,0.13,1.55]} rotation={0.15} />
    <NoticeBoard position={[-1.7,0.12,1.45]} text="CÙNG THAM GIA" scale={0.58} />
    <CurvedPath points={path} width={0.36} /><Trees positions={grove} scale={0.72} />
  </group>;
}
