"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { destinations, getIsland } from "@/data/islands";
import type { JourneyState } from "@/lib/journey-machine";

export function IslandInteraction({ state }: { state:JourneyState }) {
  const { size } = useThree();
  const point = useRef(new Vector3());
  const labels = useRef<Map<string,HTMLElement>>(new Map());
  useFrame(({camera,scene}) => {
    const origin = getIsland(state.currentIsland).position;
    const candidates = destinations.filter((island) => island.id !== state.currentIsland).sort((a,b) => Math.hypot(a.position[0]-origin[0],a.position[2]-origin[2]) - Math.hypot(b.position[0]-origin[0],b.position[2]-origin[2]));
    let visibleCount = 0;
    for (const island of candidates) {
      let element = labels.current.get(island.id);
      if (!element?.isConnected) { element = document.getElementById("island-label-" + island.id) ?? undefined; if (element) labels.current.set(island.id,element); }
      if (!element) continue;
      point.current.set(island.position[0],island.position[1] - Math.min(2.1,island.shape.depth * 0.6) * (island.scale ?? 1),island.position[2]).project(camera);
      const x = (point.current.x * 0.5 + 0.5) * size.width, y = (-point.current.y * 0.5 + 0.5) * size.height;
      const visible = state.phase === "SELECTING_DESTINATION" && Boolean(scene.getObjectByName("island:" + island.id)?.visible) && x > 48 && x < size.width - 48 && y > size.height * 0.32 && y < size.height * 0.82 && visibleCount < 3;
      if (visible) { visibleCount++; element.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,0)"; }
      element.style.visibility = visible ? "visible" : "hidden"; element.setAttribute("aria-hidden",String(!visible)); element.tabIndex = visible ? 0 : -1;
    }
    const current = document.getElementById("island-label-" + state.currentIsland); if (current) { current.style.visibility = "hidden"; current.tabIndex = -1; }
  });
  return null;
}
