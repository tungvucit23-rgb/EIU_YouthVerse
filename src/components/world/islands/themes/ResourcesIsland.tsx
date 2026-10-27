"use client";

import { Trees } from "../../Trees";
import { FestivalCanopy } from "../FestivalStructures";
import { Bench, Building, CurvedPath, GardenBed, NoticeBoard, TimberPlatform } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-2.2,0.12,-1.2],[-0.7,0.12,-2.1],[1.65,0.12,-1.75],[2.2,0.12,0.15],[-2,0.12,1.15],[1.8,0.12,1.55]];
const path: Vector3Tuple[] = [[0.1,0.14,2.6],[0.2,0.14,1.1],[-0.4,0.14,0],[-0.65,0.14,-0.7]];
export default function ResourcesIsland() {
  return <group name="cloud-library-and-community-courtyard">
    <Building position={[-0.7,0.12,-0.75]} width={1.9} depth={1.3} height={1.12} roof="curved" sign="THƯ VIỆN TRÊN MÂY" />
    <TimberPlatform position={[1.1,0.04,0.3]} width={1.25} depth={1.4} />
    <FestivalCanopy position={[1.1,0.14,0.3]} width={1.35} depth={1.5} height={1.15} />
    <Bench position={[1.1,0.25,0.2]} /><Bench position={[-1.3,0.12,1.25]} rotation={0.3} /><Bench position={[0.3,0.12,1.6]} rotation={-0.1} />
    <GardenBed position={[-1.9,0.12,0.4]} scale={0.65} />
    <NoticeBoard position={[-0.7,0.12,1.4]} scale={0.6} text="CHIA SẺ ĐỂ CÙNG LỚN" />
    <CurvedPath points={path} width={0.37} /><Trees positions={grove} scale={1.03} />
  </group>;
}
