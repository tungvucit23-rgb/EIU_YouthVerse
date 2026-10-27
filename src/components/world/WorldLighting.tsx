"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight } from "three";
import type { JourneyMotion } from "@/lib/journey-runtime";
import { useWorldQuality } from "./WorldQuality";

export function WorldLighting({ motion }: { motion: RefObject<JourneyMotion> }) {
  const sunlight = useRef<DirectionalLight>(null);
  const { preset } = useWorldQuality();
  useFrame((_,delta) => {
    const light = sunlight.current; if (!light) return;
    const p = motion.current.position; const alpha = Math.min(1,delta * 1.5);
    light.target.position.lerp({x:p[0],y:0,z:p[2] - 4},alpha);
    light.position.set(light.target.position.x - 6,light.target.position.y + 18,light.target.position.z - 10);
    light.target.updateMatrixWorld();
  });
  return <>
    <ambientLight intensity={0.55} color="#e4f1ff" />
    <hemisphereLight args={["#cee9ff","#75805e",0.85]} />
    <directionalLight ref={sunlight} position={[-6,18,-10]} intensity={2.7} color="#ffe9bc" castShadow={preset.shadows} shadow-mapSize={[preset.shadowSize,preset.shadowSize]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-normalBias={0.04} shadow-bias={-0.0005} />
    <directionalLight position={[8,7,18]} intensity={0.85} color="#d4eaff" />
  </>;
}
