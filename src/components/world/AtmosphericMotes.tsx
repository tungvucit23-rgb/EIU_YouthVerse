"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Points } from "three";
import { useWorldQuality } from "./WorldQuality";

/** One draw call for a sparse, quiet dust layer; skipped on low quality. */
export function AtmosphericMotes() {
  const points = useRef<Points>(null);
  const { quality,reducedMotion } = useWorldQuality();
  const geometry = useMemo(() => {
    const values = Array.from({length:14},(_,i) => [Math.sin(i * 2.4) * (4 + i * 0.7),0.3 + Math.sin(i * 1.7) * 1.2,Math.cos(i * 3.7) * (4 + i * 0.8)]).flat();
    return new BufferGeometry().setAttribute("position",new Float32BufferAttribute(values,3));
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({clock}) => { if (points.current && !reducedMotion) points.current.position.y = Math.sin(clock.elapsedTime * 0.14) * 0.18; });
  if (quality === "low") return null;
  return <points ref={points} geometry={geometry}><pointsMaterial color="#fff2cf" size={0.025} transparent opacity={0.45} depthWrite={false} sizeAttenuation /></points>;
}
