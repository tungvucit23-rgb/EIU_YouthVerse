"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import { Vector3 } from "three";
import { destinations } from "@/data/islands";
import { layoutIslandLabels,type IslandLabelCandidate,type ScreenRect } from "@/lib/island-label-layout";
import { transformWorldPoint } from "@/lib/world-transform";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";

/** HTML labels project the persistent scene, then avoid one another and the actual UI rectangles. */
export function IslandInteraction({state,motion,mobile}: {state:JourneyState;motion:RefObject<JourneyMotion>;mobile:boolean}) {
  const {size} = useThree();
  const point = useRef(new Vector3()),elapsed = useRef(1),phase = useRef(state.phase);
  const labels = useRef(new Map<string,HTMLElement>());
  const dimensions = useRef(new Map<string,{width:number;height:number}>());
  const reserved = useRef<ScreenRect[]>([]);
  useFrame(({camera},delta) => {
    elapsed.current += delta;
    if (elapsed.current > .25 || phase.current !== state.phase) {
      elapsed.current = 0; phase.current = state.phase;
      for (const island of destinations) {
        const element = document.getElementById("island-label-" + island.id);
        if (!element) continue;
        labels.current.set(island.id,element);
        dimensions.current.set(island.id,{width:element.offsetWidth,height:element.offsetHeight});
      }
      reserved.current = [...document.querySelectorAll<HTMLElement>(".site-header,.hero-introduction,.sky-note,.destination-hint,.scroll-to-explore,.destination-picker-trigger,.footer-signature,.sailing-status,.compact-mobile-hud,dialog[open]")].filter((element) => getComputedStyle(element).display !== "none").map((element) => {
        const rect = element.getBoundingClientRect();
        return {x:rect.x,y:rect.y,width:rect.width,height:rect.height};
      });
    }
    const candidates:IslandLabelCandidate[] = [];
    const focus = motion.current.position;
    if (state.phase !== "EXPLORING_CONTENT") for (const island of destinations) {
      const element = labels.current.get(island.id),dimension = dimensions.current.get(island.id);
      if (!element?.isConnected || !dimension) continue;
      const anchor = transformWorldPoint(island.position,island.scale,island.rotation,[0,-island.shape.depth * .68,0]);
      point.current.set(...anchor).project(camera);
      const x = (point.current.x * .5 + .5) * size.width,y = (-point.current.y * .5 + .5) * size.height;
      if (Math.abs(point.current.z) > 1 || x < 20 || x > size.width - 20 || y < 60 || y > size.height - 40) continue;
      candidates.push({id:island.id,x,y,...dimension,priority:island.id === (state.destination ?? state.currentIsland) ? 0 : 1,distance:Math.hypot(island.position[0] - focus[0],island.position[2] - focus[2])});
    }
    const placements = new Map(layoutIslandLabels(candidates,size,reserved.current,mobile ? 2 : 5).map((placement) => [placement.id,placement.rect]));
    for (const island of destinations) {
      const element = labels.current.get(island.id); if (!element) continue;
      const rect = placements.get(island.id),visible = Boolean(rect);
      if (rect) element.style.transform = "translate3d(" + rect.x + "px," + rect.y + "px,0)";
      element.style.visibility = visible ? "visible" : "hidden";
      element.setAttribute("aria-hidden",String(!visible)); element.tabIndex = visible && !element.hasAttribute("disabled") ? 0 : -1;
    }
  });
  return null;
}
