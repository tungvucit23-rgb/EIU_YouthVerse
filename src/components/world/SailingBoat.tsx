"use client";

import { Suspense, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { HOME_BOAT_POSITION } from "@/data/islands";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";
import { BoatLoadingProxy, ExplorerBoatAsset } from "./boat/ExplorerBoatAsset";
import { useWorldQuality } from "./WorldQuality";
import { worldSettings } from "@/data/world-settings";

export function SailingBoat({ motion, onReady }: { state: JourneyState; motion: RefObject<JourneyMotion>; onReady: () => void }) {
  const group = useRef<Group>(null);
  const { reducedMotion } = useWorldQuality();
  const previousSpeed = useRef(0);
  useFrame(({clock},delta) => {
    if (!group.current) return;
    const current = motion.current;
    const heading = Math.atan2(current.tangent[0],current.tangent[2]);
    const turn = Math.atan2(Math.sin(heading - group.current.rotation.y),Math.cos(heading - group.current.rotation.y));
    group.current.rotation.y += reducedMotion ? turn : turn * (1 - Math.exp(-delta * 8));
    group.current.position.set(...current.position);
    const scale = worldSettings.boatScale;
    group.current.scale.setScalar(reducedMotion ? scale : group.current.scale.x + (scale - group.current.scale.x) * (1 - Math.exp(-delta * 3)));
    const acceleration = (current.speed - previousSpeed.current) / Math.max(delta,0.016);
    previousSpeed.current = current.speed;
    if (!reducedMotion) {
      group.current.position.y += Math.sin(clock.elapsedTime * 1.2) * 0.035;
      group.current.rotation.z += (Math.sin(clock.elapsedTime * 1.5) * 0.016 - Math.max(-0.065,Math.min(0.065,turn * 0.08)) - group.current.rotation.z) * Math.min(1,delta * 4);
      group.current.rotation.x += (Math.max(-0.025,Math.min(0.025,acceleration * -0.0015)) - group.current.rotation.x) * Math.min(1,delta * 3);
    } else { group.current.rotation.z = 0; group.current.rotation.x = 0; }
  }, -1);
  return <group ref={group} name="sailing-boat" position={HOME_BOAT_POSITION} rotation={[0,worldSettings.launchHeading,0]} scale={worldSettings.boatScale}>
    <Suspense fallback={<BoatLoadingProxy />}><ExplorerBoatAsset onReady={onReady} /></Suspense>
  </group>;
}
