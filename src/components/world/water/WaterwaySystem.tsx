"use client";
import {useEffect,useMemo,useRef} from "react";
import {useFrame} from "@react-three/fiber";
import {Mesh,type ShaderMaterial} from "three";
import {planLaunchRoute} from "@/lib/navigation-graph";
import {straightRouteEdge} from "@/lib/heading-routes";
import {getIsland} from "@/data/islands";
import type {JourneyState} from "@/lib/journey-machine";
import type {NavigationPlan} from "@/types/navigation";
import {useWorldQuality} from "../WorldQuality";
import {makeWaterway} from "./water-geometry";
import {createWaterMaterial} from "./water-material";

function animateWater(material:ShaderMaterial,time:number,active:number) {
 material.uniforms.uTime.value = time;material.uniforms.uActive.value = active;material.uniforms.uDirection.value = 1;
}

export function WaterwaySystem({state,plan}:{state:JourneyState;plan:NavigationPlan}) {
 const {preset,reducedMotion} = useWorldQuality();
 const waterways = useMemo(() => {
  const berth = getIsland(state.currentIsland),p = berth.dockingPoint,h = berth.dockHeading;
  const idle = () => {const edge = straightRouteEdge([p[0] - Math.sin(h) * 8,p[1],p[2] - Math.cos(h) * 8],[p[0] + Math.sin(h) * 8,p[1],p[2] + Math.cos(h) * 8]);edge.id = "berth:" + berth.id;return [edge];};
  const edges = plan.segments.length ? plan.segments : state.atLaunch ? planLaunchRoute("campus").segments : idle();
  return edges.map(edge => {const geometry = makeWaterway(edge,Math.max(12,Math.min(preset.waterSegments,Math.ceil(edge.length * 4)))),material = createWaterMaterial(),mesh = new Mesh(geometry,material);mesh.name = "waterway:" + edge.id;return {mesh,geometry,material};});
 },[plan,preset.waterSegments,state.currentIsland,state.atLaunch]);
 const animated = useRef(waterways);
 useEffect(() => {animated.current = waterways;return () => waterways.forEach(w => {w.geometry.dispose();w.material.dispose();});},[waterways]);
 useFrame(({clock}) => {for(const w of animated.current) animateWater(w.material,reducedMotion ? 0 : clock.elapsedTime,state.phase === "SAILING" ? .9 : .15);});
 return <group name="connected-sky-waterways">{waterways.map(w => <primitive key={w.mesh.name} object={w.mesh} dispose={null}/>)}</group>;
}
