"use client";

import { useEffect, useMemo } from "react";
import { BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, Float32BufferAttribute, Shape, SRGBColorSpace, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Vector3Tuple } from "@/types";
import { useSceneryMaterials } from "../SceneryMaterials";

type Placement = { position?: Vector3Tuple; rotation?: number; scale?: number };
const box = (size: Vector3Tuple, at: Vector3Tuple) => new BoxGeometry(...size).translate(...at);

export function Sign({ text, width = 1, height = 0.35, color = "#214b63", background = "#f7f0dd", ...placement }: Placement & { text: string; width?: number; height?: number; color?: string; background?: string }) {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = Math.round(512 * height / width);
    const context = canvas.getContext("2d")!; context.fillStyle = background; context.fillRect(0,0,canvas.width,canvas.height);
    context.fillStyle = color; context.textAlign = "center"; context.textBaseline = "middle";
    context.font = "600 " + Math.min(canvas.height * 0.42, 512 / Math.max(3, text.length) * 1.35) + "px Arial";
    context.fillText(text, 256, canvas.height / 2, 470);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
  }, [text, width, height, color, background]);
  useEffect(() => () => map.dispose(), [map]);
  return <mesh position={placement.position} rotation={[0, placement.rotation ?? 0, 0]} scale={placement.scale ?? 1}><planeGeometry args={[width,height]} /><meshStandardMaterial map={map} roughness={0.85} /></mesh>;
}

export function Building({ width = 1.4, depth = 1.15, height = 1.1, roof = "gable", sign, ...placement }: Placement & { width?: number; depth?: number; height?: number; roof?: "gable" | "flat" | "curved"; sign?: string }) {
  const m = useSceneryMaterials();
  const parts = useMemo(() => {
    const frames: BufferGeometry[] = [], panes: BufferGeometry[] = [], stairs: BufferGeometry[] = [];
    const columns = width > 1.8 ? 3 : 2;
    for (let floor = 0; floor < (height > 1.5 ? 2 : 1); floor++) for (let i = 0; i < columns; i++) {
      const x = -width * 0.32 + i / Math.max(1, columns - 1) * width * 0.64, y = 0.7 + floor * 0.65;
      panes.push(box([0.25,0.32,0.025],[x,y,depth / 2 + 0.02]));
      for (const side of [-1,1]) { frames.push(box([0.025,0.37,0.055],[x + side * 0.145,y,depth / 2 + 0.025])); frames.push(box([0.3,0.025,0.055],[x,y + side * 0.18,depth / 2 + 0.025])); }
    }
    for (const z of [-0.28,0.28]) { panes.push(box([0.025,0.32,0.25],[width / 2 + 0.02,0.7,z])); for (const side of [-1,1]) frames.push(box([0.05,0.37,0.025],[width / 2 + 0.025,0.7,z + side * 0.145])); }
    for (let step = 0; step < 3; step++) stairs.push(box([0.62 - step * 0.05,0.055,0.14],[0,0.045 + step * 0.05,depth / 2 + 0.4 - step * 0.12]));
    return { frames: mergeGeometries(frames), panes: mergeGeometries(panes), stairs: mergeGeometries(stairs) };
  }, [width,depth,height]);
  const profile = useMemo(() => {
    const shape = new Shape(); const half = width / 2 + 0.16;
    shape.moveTo(-half,0); if (roof === "curved") shape.quadraticCurveTo(0,0.9,half,0); else shape.lineTo(0,roof === "flat" ? 0.12 : 0.48).lineTo(half,0);
    shape.lineTo(half,-0.07).lineTo(-half,-0.07).closePath(); return shape;
  }, [width,roof]);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}>
    <mesh position={[0,0.12,0]} material={m.stone} receiveShadow><boxGeometry args={[width + 0.18,0.2,depth + 0.18]} /></mesh>
    <mesh position={[0,height / 2 + 0.2,0]} material={m.ivory} castShadow receiveShadow><boxGeometry args={[width,height,depth]} /></mesh>
    <mesh position={[0,height + 0.22,-depth / 2 - 0.13]} material={roof === "curved" ? m.wood : m.roof} castShadow><extrudeGeometry args={[profile,{ depth: depth + 0.26, bevelEnabled: false, curveSegments: 16 }]} /></mesh>
    <mesh geometry={parts.frames} material={m.wood} /><mesh geometry={parts.panes} material={m.window} />
    <mesh position={[0,0.48,depth / 2 + 0.035]} material={m.darkWood}><boxGeometry args={[0.26,0.56,0.05]} /></mesh>
    <mesh position={[0.075,0.46,depth / 2 + 0.07]} material={m.gold}><sphereGeometry args={[0.018,6,4]} /></mesh>
    <mesh geometry={parts.stairs} material={m.stone} />
    {sign && <Sign text={sign} position={[0,height + 0.02,depth / 2 + 0.04]} width={Math.min(1,width * 0.8)} height={0.2} />}
  </group>;
}

export function TimberPlatform({ width = 1.5, depth = 1.2, ...placement }: Placement & { width?: number; depth?: number }) {
  const m = useSceneryMaterials();
  const boards = useMemo(() => mergeGeometries(Array.from({ length: 12 }, (_,i) => box([width,0.065,depth / 12 * 0.91],[0,0.18,-depth / 2 + (i + 0.5) * depth / 12]))), [width,depth]);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}><mesh geometry={boards} material={m.wood} receiveShadow />{[-1,1].flatMap((x) => [-1,1].map((z) => <mesh key={x + ":" + z} position={[x * width * 0.42,0.04,z * depth * 0.4]} material={m.darkWood}><cylinderGeometry args={[0.045,0.055,0.3,6]} /></mesh>))}</group>;
}

export function Bench(placement: Placement) {
  const m = useSceneryMaterials();
  const slats = useMemo(() => mergeGeometries([box([0.65,0.045,0.11],[0,0.25,-0.07]),box([0.65,0.045,0.11],[0,0.25,0.07]),box([0.65,0.1,0.03],[0,0.43,-0.14]),box([0.65,0.08,0.03],[0,0.33,-0.14])]), []);
  const supports = useMemo(() => mergeGeometries([-0.24,0.24].flatMap((x) => [box([0.035,0.26,0.035],[x,0.12,0.09]),box([0.035,0.47,0.035],[x,0.23,-0.12])])), []);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}><mesh geometry={slats} material={m.wood} castShadow /><mesh geometry={supports} material={m.metal} /></group>;
}

export function NoticeBoard({ text, ...placement }: Placement & { text: string }) {
  const m = useSceneryMaterials();
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}>
    {[-0.38,0.38].map((x) => <mesh key={x} position={[x,0.49,0]} material={m.wood}><boxGeometry args={[0.065,1,0.07]} /></mesh>)}
    <mesh position={[0,0.78,0]} material={m.darkWood}><boxGeometry args={[0.91,0.6,0.08]} /></mesh>
    <Sign text={text} width={0.78} height={0.46} position={[0,0.79,0.046]} />
    <mesh position={[0,1.12,0]} rotation={[0.12,0,0]} material={m.roof}><boxGeometry args={[1.03,0.055,0.3]} /></mesh>
  </group>;
}

export function GardenBed(placement: Placement) {
  const m = useSceneryMaterials();
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}>
    <mesh position={[0,0.15,0]} material={m.darkWood}><boxGeometry args={[1,0.2,0.6]} /></mesh>
    <mesh position={[0,0.255,0]} material={m.soil}><boxGeometry args={[0.89,0.025,0.49]} /></mesh>
    {Array.from({length:6},(_,i) => <mesh key={i} position={[-0.3 + (i % 3) * 0.3,0.34,i < 3 ? -0.15 : 0.15]} scale={[0.1,0.12,0.11]} material={m.green}><icosahedronGeometry args={[1,1]} /></mesh>)}
  </group>;
}

export function Lamp(placement: Placement) {
  const m = useSceneryMaterials();
  return <group position={placement.position} scale={placement.scale ?? 1}><mesh position={[0,0.37,0]} material={m.metal}><cylinderGeometry args={[0.015,0.025,0.72,6]} /></mesh><mesh position={[0,0.75,0]} material={m.lamp}><sphereGeometry args={[0.07,8,6]} /></mesh><mesh position={[0,0.83,0]} material={m.roof}><cylinderGeometry args={[0.07,0.1,0.06,8]} /></mesh></group>;
}

export function CurvedPath({ points, width = 0.3 }: { points: Vector3Tuple[]; width?: number }) {
  const m = useSceneryMaterials();
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    const up = new Vector3(0,1,0);
    for (let i = 0; i <= 30; i++) {
      const point = curve.getPoint(i / 30), side = curve.getTangent(i / 30).cross(up).normalize().multiplyScalar(width / 2);
      vertices.push(point.x + side.x,point.y,point.z + side.z,point.x - side.x,point.y,point.z - side.z); uvs.push(0,i / 30,1,i / 30);
      if (i < 30) indices.push(i * 2,i * 2 + 2,i * 2 + 1,i * 2 + 1,i * 2 + 2,i * 2 + 3);
    }
    const result = new BufferGeometry(); result.setAttribute("position",new Float32BufferAttribute(vertices,3)); result.setAttribute("uv",new Float32BufferAttribute(uvs,2)); result.setIndex(indices); result.computeVertexNormals(); return result;
  }, [points,width]);
  return <mesh geometry={geometry} material={m.path} receiveShadow />;
}

export function IslandDock({ position = [0,0.12,2.4], heading = 0 }: { position?: Vector3Tuple; heading?: number }) {
  const m = useSceneryMaterials();
  const rails = useMemo(() => mergeGeometries([-1,1].flatMap((side) => [box([0.025,0.025,1.23],[side * 0.38,0.52,0.6]),...Array.from({length:3},(_,i) => box([0.03,0.45,0.03],[side * 0.38,0.31,i * 0.57]))])), []);
  return <group name="landing-dock" position={position} rotation={[0,heading,0]}><TimberPlatform width={0.86} depth={1.5} position={[0,0,0.55]} /><mesh geometry={rails} material={m.wood} /><Lamp position={[-0.4,0,0.08]} scale={0.7} /><mesh position={[0.3,0.25,1.15]} rotation={[Math.PI / 2,0,0]} material={m.metal}><torusGeometry args={[0.065,0.015,5,12]} /></mesh></group>;
}
