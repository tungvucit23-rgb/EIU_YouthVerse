"use client";

import { useMemo } from "react";
import { BoxGeometry, BufferGeometry, CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useSceneryMaterials } from "../../SceneryMaterials";
import { Trees } from "../../Trees";
import { Bench, Building, CurvedPath, NoticeBoard, Sign } from "../Scenery";
import type { Vector3Tuple } from "@/types";

const grove: Vector3Tuple[] = [[-1.7,0.12,-0.9],[-1.1,0.12,-1.9],[1.3,0.12,-1.6],[1.6,0.12,0.7]];
const path: Vector3Tuple[] = [[0.12,0.14,2.7],[0.4,0.14,1.4],[-0.5,0.14,0.8],[-0.9,0.14,0.15]];
export default function NewsIsland() {
  const m = useSceneryMaterials();
  const lattice = useMemo(() => {
    const beams: BufferGeometry[] = [-1,1].flatMap((x) => [-1,1].map((z) => new BoxGeometry(0.045,1.9,0.045).translate(x * 0.24,1.25,z * 0.24)));
    for (let row = 0; row < 3; row++) for (const side of [-1,1]) {
      const line = new CatmullRomCurve3([new Vector3(-0.24,0.35 + row * 0.57,side * 0.24),new Vector3(0.24,0.92 + row * 0.57,side * 0.24)]);
      beams.push(new TubeGeometry(line,1,0.018,4,false));
    }
    return mergeGeometries(beams.map((beam) => beam.toNonIndexed()));
  }, []);
  return <group name="news-observation-station">
    <group position={[0.45,0.12,-0.7]}>
      <mesh position={[0,0.15,0]} material={m.stone}><cylinderGeometry args={[0.53,0.62,0.22,12]} /></mesh>
      <mesh geometry={lattice} material={m.metal} />
      <mesh position={[0,2.1,0]} material={m.ivory}><cylinderGeometry args={[0.49,0.49,0.13,12]} /></mesh>
      <mesh position={[0,2.38,0]} material={m.glass}><cylinderGeometry args={[0.35,0.35,0.46,12]} /></mesh>
      <mesh position={[0,2.64,0]} material={m.roof}><sphereGeometry args={[0.43,16,8,0,Math.PI * 2,0,Math.PI / 2]} /></mesh>
      <mesh position={[0,3,0]} material={m.gold}><cylinderGeometry args={[0.012,0.018,0.5,6]} /></mesh>
      <mesh position={[0.15,2.98,0]} rotation={[0,0,0.35]} material={m.ivory}><torusGeometry args={[0.16,0.018,6,20,Math.PI * 1.6]} /></mesh>
      <Sign text="TRẠM TIN" position={[0,1.4,0.265]} width={0.5} height={0.21} />
    </group>
    <Building position={[-0.85,0.12,0]} width={1.05} depth={1.05} height={0.85} roof="curved" sign="BƯU TRẠM" />
    <NoticeBoard position={[0.9,0.12,1.2]} scale={0.65} text="TIN MỚI · DEMO" rotation={-0.18} />
    <Bench position={[-1.15,0.12,1.2]} rotation={-0.1} />
    <CurvedPath points={path} width={0.31} /><Trees positions={grove} scale={0.7} />
  </group>;
}
