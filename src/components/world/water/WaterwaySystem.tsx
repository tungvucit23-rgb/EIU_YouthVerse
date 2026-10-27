"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { cubicPoint, navigationGraph } from "@/lib/navigation-graph";
import type { JourneyState } from "@/lib/journey-machine";
import type { NavigationPlan } from "@/types/navigation";
import { useWorldQuality } from "../WorldQuality";
import { makeWaterway } from "./water-geometry";
import { createWaterMaterial } from "./water-material";

export function WaterwaySystem({state,plan}:{state:JourneyState;plan:NavigationPlan}) {
  const {preset,reducedMotion} = useWorldQuality();
  const waterways = useMemo(() => {
    const selected = new Map(plan.segments.map((edge) => [edge.id,edge]));
    return navigationGraph.edges.map((base) => {
      const edge = selected.get(base.id) ?? base;
      const near = makeWaterway(edge,Math.max(12,Math.min(preset.waterSegments,Math.ceil(edge.length * 2.5))));
      const far = makeWaterway(edge,8),material = createWaterMaterial(),mesh = new Mesh(near,material);
      mesh.name = "waterway:" + edge.id; mesh.visible = false;
      return {edge,near,far,material,mesh,midpoint:cubicPoint(edge,.5,[0,0,0])};
    });
  },[preset.waterSegments,plan]);
  const animated = useRef(waterways);
  useEffect(() => {
    animated.current = waterways;
    return () => { waterways.forEach(({near,far,material}) => { near.dispose(); far.dispose(); material.dispose(); }); };
  },[waterways]);
  useFrame(({clock,scene}) => {
    const boat = scene.getObjectByName("sailing-boat");
    if (!boat) return;
    const moving = ["SAILING","APPROACHING","DOCKING"].includes(state.phase);
    const route = new Set(moving ? plan.edgeIds : []);
    animated.current.forEach(({edge,near,far,mesh,midpoint}) => {
      const active = route.has(edge.id);
      const startDistance = Math.hypot(boat.position.x - edge.start[0],boat.position.y - edge.start[1],boat.position.z - edge.start[2]);
      const endDistance = Math.hypot(boat.position.x - edge.end[0],boat.position.y - edge.end[1],boat.position.z - edge.end[2]);
      const docked = edge.from === state.currentIsland || edge.to === state.currentIsland;
      mesh.visible = moving ? active : docked;
      const middleDistance = Math.hypot(boat.position.x - midpoint[0],boat.position.y - midpoint[1],boat.position.z - midpoint[2]);
      mesh.geometry = Math.min(startDistance,endDistance,middleDistance) < 13 ? near : far;
      mesh.material.uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
      mesh.material.uniforms.uActive.value = active ? .9 : .15;
      // Active edges already share the planner's travel orientation.
      mesh.material.uniforms.uDirection.value = 1;
    });
  });
  return <group name="connected-sky-waterways">{waterways.map(({edge,mesh}) => <primitive key={edge.id} object={mesh} dispose={null} />)}</group>;
}
