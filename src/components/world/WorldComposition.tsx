"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Object3D } from "three";
import { allIslandIds } from "@/data/islands";
import { stageIslandIds } from "@/lib/world-framing";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";

/** Stage only the relevant islands; every destination stays in the shared world graph. */
export function WorldComposition({state,motion,mobile}: {state:JourneyState;motion:RefObject<JourneyMotion>;mobile:boolean}) {
  const roots = useRef(new Map<string,Object3D>());
  useFrame(({scene}) => {
    if (roots.current.size !== allIslandIds.length) for (const id of allIslandIds) { const root = scene.getObjectByName("island:" + id); if (root) roots.current.set(id,root); }
    const visible = new Set(stageIslandIds(state,mobile,motion.current.progress));
    roots.current.forEach((root,id) => { root.visible = visible.has(id as typeof allIslandIds[number]); });
  },-.5);
  return null;
}
