"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { GraphicsQuality, IslandId } from "@/types";
import type { NavigationPlan, RouteSample } from "@/types/navigation";
import { destinations, getIsland } from "@/data/islands";
import { worldSettings } from "@/data/world-settings";
import { easeSailing, samplePlanInto } from "@/lib/navigation-graph";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";
import { CameraController } from "./CameraController";
import { CentralEIUIsland } from "./CentralEIUIsland";
import { DestinationIsland } from "./DestinationIsland";
import { IslandInteraction } from "./IslandInteraction";
import { SailingBoat } from "./SailingBoat";
import { SkyEnvironment } from "./SkyEnvironment";
import { WorldLighting } from "./WorldLighting";
import { TerrainTextures } from "./TerrainTextures";
import { SceneryMaterials } from "./SceneryMaterials";
import { WorldQuality } from "./WorldQuality";
import { SceneMetrics } from "./SceneMetrics";
import { WaterwaySystem } from "./water/WaterwaySystem";
import { BoatWake } from "./boat/BoatWake";
import { AtmosphericMotes } from "./AtmosphericMotes";
import { WorldComposition } from "./WorldComposition";

export interface WorldProps {
  state: JourneyState; plan: NavigationPlan; motion: RefObject<JourneyMotion>;
  quality: GraphicsQuality; reducedMotion: boolean; mobile: boolean;
  onSelect: (id: IslandId) => void; onComplete: (trip: number) => void;
  onStage: (phase: "APPROACHING" | "DOCKING", trip: number) => void; onReady: () => void;
}

function SailingClock({ state,plan,motion:motionRef,onComplete,onStage,reducedMotion }: Pick<WorldProps,"state"|"plan"|"motion"|"onComplete"|"onStage"|"reducedMotion">) {
  const sample = useRef<RouteSample>({position:[0,0,0],tangent:[0,0,-1],edgeIndex:0});
  const stage = useRef(0);
  useFrame((_,delta) => {
    const current = motionRef.current;
    if (["SAILING","APPROACHING","DOCKING"].includes(state.phase)) {
      if (current.trip !== state.trip) { current.trip = state.trip; current.elapsed = 0; current.progress = 0; current.completed = false; stage.current = 0; }
      if (current.completed) return;
      current.elapsed += Math.min(delta,0.1);
      const raw = Math.min(1,current.elapsed / (reducedMotion ? worldSettings.reducedMotionSeconds : plan.duration));
      const progress = easeSailing(raw), previous = current.progress;
      samplePlanInto(plan,progress,sample.current);
      for (let axis = 0; axis < 3; axis++) { current.position[axis] = sample.current.position[axis]; current.tangent[axis] = sample.current.tangent[axis]; }
      current.progress = progress; current.speed = Math.max(0,(progress - previous) * plan.distance / Math.max(delta,0.001));
      if (progress >= worldSettings.approachAt && stage.current < 1) { stage.current = 1; onStage("APPROACHING",state.trip); }
      if (progress >= worldSettings.dockingAt && stage.current < 2) { stage.current = 2; onStage("DOCKING",state.trip); }
      if (raw >= 1) { current.completed = true; current.speed = 0; onComplete(state.trip); }
    } else {
      const island = getIsland(state.currentIsland); const heading = island.dockHeading;
      for (let axis = 0; axis < 3; axis++) current.position[axis] = island.dockingPoint[axis];
      current.tangent[0] = Math.sin(heading); current.tangent[1] = 0; current.tangent[2] = Math.cos(heading); current.speed = 0;
    }
  }, -2);
  return null;
}

export function WorldScene(props: WorldProps) {
  const { state,plan,motion,quality,reducedMotion,mobile,onSelect,onComplete,onStage,onReady } = props;
  const selectable = state.phase === "SELECTING_DESTINATION";
  const active = state.destination ?? state.currentIsland;
  const scene = useMemo(() => <SkyEnvironment reducedMotion={reducedMotion} />, [reducedMotion]);
  return <WorldQuality quality={quality} reducedMotion={reducedMotion}><TerrainTextures><SceneryMaterials>
    <WorldLighting motion={motion} />
    {scene}
    <SailingClock state={state} plan={plan} motion={motion} onComplete={onComplete} onStage={onStage} reducedMotion={reducedMotion} />
    <group name="island:campus" onClick={(event) => { event.stopPropagation(); if (selectable) onSelect("campus"); }}><CentralEIUIsland /></group>
    {destinations.map((island) => <DestinationIsland key={island.id} destination={island} enabled={selectable && island.isAvailable} selected={active === island.id} onSelect={onSelect} />)}
    <WaterwaySystem state={state} plan={plan} />
    <AtmosphericMotes />
    <WorldComposition state={state} motion={motion} mobile={mobile} />
    <BoatWake motion={motion} />
    <SailingBoat state={state} motion={motion} onReady={onReady} />
    <CameraController state={state} motion={motion} mobile={mobile} reducedMotion={reducedMotion} />
    <IslandInteraction state={state} />
    <SceneMetrics />
  </SceneryMaterials></TerrainTextures></WorldQuality>;
}
