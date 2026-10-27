"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { OrthographicCamera, Vector3 } from "three";
import { worldSettings } from "@/data/world-settings";
import { getCameraFrame } from "@/lib/world-framing";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";

const OFFSET = new Vector3(...worldSettings.cameraOffset);
export function CameraController({state,motion,mobile,reducedMotion}: {state:JourneyState;motion:RefObject<JourneyMotion>;mobile:boolean;reducedMotion:boolean}) {
  const initialized = useRef(false),target = useRef(new Vector3()),desired = useRef(new Vector3());
  useFrame(({camera,size},delta) => {
    if (!(camera instanceof OrthographicCamera)) return;
    const frame = getCameraFrame(state,motion.current.position,motion.current.progress,size,mobile);
    desired.current.set(...frame.target);
    const alpha = !initialized.current || reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta,.1) * 3.2);
    target.current.lerp(desired.current,alpha);
    camera.position.copy(target.current).add(OFFSET);
    camera.lookAt(target.current);
    camera.zoom += (frame.zoom - camera.zoom) * alpha;
    camera.updateProjectionMatrix();
    initialized.current = true;
  });
  return null;
}
