"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { OrthographicCamera, Vector3 } from "three";
import type { Destination, IslandId } from "@/types";
import type { JourneyMotion } from "@/lib/journey-runtime";
import { shouldUseIslandDetail } from "@/lib/island-lod";
import { FloatingIsland } from "./FloatingIsland";
import { useWorldQuality } from "./WorldQuality";
import { IslandArt } from "./islands/IslandArt";
import { IslandSilhouette } from "./islands/IslandSilhouette";
import { IslandDock } from "./islands/Scenery";

export function DestinationIsland({destination,motion,enabled,selected,onSelect}: {destination:Destination;motion:RefObject<JourneyMotion>;enabled:boolean;selected:boolean;onSelect:(id:IslandId) => void}) {
  const [hovered,setHovered] = useState(false);
  const [detailed,setDetailed] = useState(destination.nearOnIntro || selected);
  const [detailLoaded,setDetailLoaded] = useState(destination.nearOnIntro || selected);
  const {preset} = useWorldQuality();
  const elapsed = useRef(0),position = useRef(new Vector3(...destination.position)),projected = useRef(new Vector3());
  useFrame(({camera},delta) => {
    elapsed.current += delta; if (elapsed.current < .4) return; elapsed.current = 0;
    const focus = motion.current.position;
    const distance = Math.hypot(focus[0] - destination.position[0],focus[1] - destination.position[1],focus[2] - destination.position[2]);
    projected.current.copy(position.current).project(camera);
    const inViewport = Math.abs(projected.current.x) < 1.25 && Math.abs(projected.current.y) < 1.25 && Math.abs(projected.current.z) <= 1;
    const screenRadius = camera instanceof OrthographicCamera ? destination.shape.radius * destination.scale * camera.zoom : 0;
    const next = shouldUseIslandDetail({distance,screenRadius,inViewport,detailed,selected,detailDistance:preset.detailDistance});
    if (next && !detailLoaded) setDetailLoaded(true);
    if (next !== detailed) setDetailed(next);
  });
  useEffect(() => { if (!hovered || !enabled) return; document.body.style.cursor = "pointer"; return () => { document.body.style.cursor = ""; }; },[hovered,enabled]);
  const showDetail = selected || detailed;
  return <group name={"island:" + destination.id} position={destination.position} rotation={[0,destination.rotation,0]} scale={destination.scale}
    onClick={(event) => { event.stopPropagation(); if (enabled) onSelect(destination.id); }}
    onPointerOver={(event) => { event.stopPropagation(); if (enabled) setHovered(true); }} onPointerOut={() => setHovered(false)}>
    <FloatingIsland shape={destination.shape} simple={!showDetail} polished={destination.id === "activities"}>
      <group name={"island-lod-detailed:" + destination.id} visible={showDetail}>{(detailLoaded || selected) && <IslandArt destination={destination} />}</group>
      <group name={"island-lod-simplified:" + destination.id} visible={!showDetail}><IslandSilhouette id={destination.id} /></group>
      <IslandDock position={destination.dock.position} heading={destination.dock.rotation} />
      {(selected || hovered) && <mesh position={[destination.dock.position[0] + Math.sin(destination.dock.rotation) * .7,destination.dock.position[1] + .035,destination.dock.position[2] + Math.cos(destination.dock.rotation) * .7]} rotation={[-Math.PI / 2,0,0]}><ringGeometry args={[.48,.53,32]} /><meshBasicMaterial color={destination.theme} transparent opacity={.7} depthWrite={false} /></mesh>}
    </FloatingIsland>
  </group>;
}
