"use client";

import { useMemo } from "react";
import { BoxGeometry, BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Shape, TubeGeometry, Vector2, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Vector3Tuple } from "@/types";
import { useSceneryMaterials } from "../SceneryMaterials";
import { Sign, TimberPlatform } from "./Scenery";

type Placement = { position?: Vector3Tuple; rotation?: number; scale?: number };

export function FestivalCanopy({ width = 2, depth = 1.3, height = 1.4, ...placement }: Placement & { width?: number; depth?: number; height?: number }) {
  const m = useSceneryMaterials();
  const cloth = useMemo(() => {
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let z = 0; z <= 8; z++) for (let x = 0; x <= 12; x++) {
      const u = x / 12, v = z / 8;
      vertices.push((u - 0.5) * width, height + Math.pow(Math.abs(u - 0.5) * 2,2) * 0.3 - Math.sin(v * Math.PI) * 0.1, (v - 0.5) * depth);
      uvs.push(u,v);
      if (z < 8 && x < 12) { const a = z * 13 + x; indices.push(a,a + 13,a + 1,a + 1,a + 13,a + 14); }
    }
    const result = new BufferGeometry(); result.setAttribute("position",new Float32BufferAttribute(vertices,3)); result.setAttribute("uv",new Float32BufferAttribute(uvs,2)); result.setIndex(indices); result.computeVertexNormals(); return result;
  }, [width,depth,height]);
  const poles = useMemo(() => mergeGeometries([-1,1].flatMap((x) => [-1,1].map((z) => new BoxGeometry(0.035,height + 0.3,0.035).translate(x * width / 2,(height + 0.3) / 2,z * depth / 2)))), [width,depth,height]);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}><mesh geometry={cloth} material={m.cloth} castShadow /><mesh geometry={poles} material={m.wood} castShadow /></group>;
}

export function BannerLine({ width = 3.8, ...placement }: Placement & { width?: number }) {
  const m = useSceneryMaterials();
  const rope = useMemo(() => new CatmullRomCurve3([new Vector3(-width / 2,1.7,0),new Vector3(0,1.4,0),new Vector3(width / 2,1.7,0)]), [width]);
  const pennants = useMemo(() => [0,1,2].map((color) => {
    const pieces: BufferGeometry[] = [];
    for (let i = color; i < 9; i += 3) {
      const x = -width * 0.44 + i / 8 * width * 0.88, y = 1.42 + Math.pow(x / (width / 2),2) * 0.25;
      const shape = new Shape(); shape.moveTo(-0.11,0).lineTo(0.11,0).lineTo(0,-0.25).closePath();
      // Indexed shape geometry is supplied by a small triangle buffer for batching.
      const piece = new BufferGeometry(); piece.setAttribute("position",new Float32BufferAttribute([x - 0.11,y,0,x + 0.11,y,0,x,y - 0.25,0],3)); piece.setAttribute("uv",new Float32BufferAttribute([0,1,1,1,0.5,0],2)); piece.computeVertexNormals(); pieces.push(piece);
    }
    return mergeGeometries(pieces);
  }), [width]);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}>
    <mesh><tubeGeometry args={[rope,24,0.012,4,false]} /><primitive object={m.darkWood} attach="material" /></mesh>
    {pennants.map((geometry,i) => <mesh key={i} geometry={geometry} material={[m.cloth,m.goldCloth,m.blueCloth][i]} />)}
    {[-1,1].map((side) => <mesh key={side} position={[side * width / 2,0.85,0]} material={m.wood}><cylinderGeometry args={[0.025,0.04,1.7,6]} /></mesh>)}
  </group>;
}

export function FestivalStage({ concert = false, ...placement }: Placement & { concert?: boolean }) {
  const m = useSceneryMaterials();
  const arch = useMemo(() => new CatmullRomCurve3(Array.from({length:21},(_,i) => { const a = i / 20 * Math.PI; return new Vector3(Math.cos(a) * 1.28,0.4 + Math.sin(a) * 1.55,-0.36); })), []);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}>
    <TimberPlatform width={2.5} depth={1.3} />
    {concert ? <><mesh material={m.ivory} castShadow><tubeGeometry args={[arch,32,0.055,8,false]} /></mesh>{[-1,1].map((side) => <mesh key={side} position={[side * 1.09,0.94,-0.3]} material={m.roseCloth}><planeGeometry args={[0.26,1.1,3,8]} /></mesh>)}</> : <FestivalCanopy width={2.7} depth={1.6} height={1.5} />}
    {[-1,1].map((side) => <group key={side} position={[side * 1.1,0.48,0.45]}><mesh material={m.navy}><boxGeometry args={[0.18,0.5,0.2]} /></mesh><mesh position={[0,0,0.107]} material={m.metal}><torusGeometry args={[0.055,0.01,5,12]} /></mesh></group>)}
    <Sign text={concert ? "MOMENTS TOGETHER" : "HOIST THE SAILS"} width={1.5} height={0.21} position={[0,0.78,-0.4]} />
    <mesh position={[0,0.07,0.9]} material={m.stone}><boxGeometry args={[0.8,0.12,0.25]} /></mesh>
  </group>;
}

export function Amphitheater(placement: Placement) {
  const m = useSceneryMaterials();
  const tiers = useMemo(() => Array.from({length:4},(_,i) => {
    const inner = 1.1 + i * 0.27, outer = inner + 0.2;
    const shape = new Shape(); shape.absarc(0,0,outer,0,Math.PI,false); shape.lineTo(-inner,0); shape.absarc(0,0,inner,Math.PI,0,true); shape.closePath(); return shape;
  }), []);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}>{tiers.map((shape,i) => <mesh key={i} position={[0,0.2 + i * 0.13,0]} rotation={[-Math.PI / 2,0,0]} material={i % 2 ? m.wood : m.stone} receiveShadow><extrudeGeometry args={[shape,{depth:0.1,bevelEnabled:false,curveSegments:32}]} /></mesh>)}</group>;
}

export function Greenhouse(placement: Placement) {
  const m = useSceneryMaterials();
  const roof = useMemo(() => {
    const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
    for (let row = 0; row <= 4; row++) for (let i = 0; i <= 20; i++) {
      const a = i / 20 * Math.PI; vertices.push(Math.cos(a) * 0.72,0.55 + Math.sin(a) * 0.72,(row / 4 - 0.5) * 1.6); uv.push(i / 20,row / 4);
      if (row < 4 && i < 20) { const k = row * 21 + i; indices.push(k,k + 1,k + 21,k + 1,k + 22,k + 21); }
    }
    const result = new BufferGeometry(); result.setAttribute("position",new Float32BufferAttribute(vertices,3)); result.setAttribute("uv",new Float32BufferAttribute(uv,2)); result.setIndex(indices); result.computeVertexNormals(); return result;
  }, []);
  const frame = useMemo(() => mergeGeometries(Array.from({length:5},(_,row) => {
    const arc = new CatmullRomCurve3(Array.from({length:13},(_,i) => new Vector3(Math.cos(i / 12 * Math.PI) * 0.72,0.55 + Math.sin(i / 12 * Math.PI) * 0.72,(row / 4 - 0.5) * 1.6)));
    return new TubeGeometry(arc,24,0.018,5,false);
  })), []);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}><TimberPlatform width={1.6} depth={1.85} /><mesh geometry={roof} material={m.glass} /><mesh geometry={frame} material={m.ivory} castShadow />{[-1,1].map((side) => <mesh key={side} position={[side * 0.72,0.4,0]} material={m.glass}><boxGeometry args={[0.025,0.4,1.6]} /></mesh>)}<mesh position={[0,0.5,0.81]} material={m.wood}><boxGeometry args={[0.45,0.6,0.04]} /></mesh><Sign text="GROW TOGETHER" width={0.9} height={0.18} position={[0,0.97,0.83]} /></group>;
}

export function RecognitionMonument(placement: Placement) {
  const m = useSceneryMaterials();
  const profile = useMemo(() => [[0.14,0],[0.27,0.08],[0.14,0.18],[0.08,0.5],[0.3,0.61],[0.42,0.94],[0.4,1.04]].map(([x,y]) => new Vector2(x,y)), []);
  const handle = useMemo(() => new CatmullRomCurve3([new Vector3(0.35,0.95,0),new Vector3(0.65,1.03,0),new Vector3(0.68,0.73,0),new Vector3(0.24,0.59,0)]), []);
  return <group position={placement.position} rotation={[0,placement.rotation ?? 0,0]} scale={placement.scale ?? 1}><mesh position={[0,0.16,0]} material={m.stone}><boxGeometry args={[1.05,0.3,0.95]} /></mesh><mesh position={[0,0.43,0]} material={m.ivory}><boxGeometry args={[0.68,0.35,0.62]} /></mesh><Sign text="GHI DẤU" width={0.58} height={0.21} position={[0,0.44,0.318]} /><group position={[0,0.61,0]}><mesh material={m.gold} castShadow><latheGeometry args={[profile,32]} /></mesh>{[-1,1].map((side) => <mesh key={side} scale={[side,1,1]} material={m.gold}><tubeGeometry args={[handle,24,0.03,6,false]} /></mesh>)}</group></group>;
}
