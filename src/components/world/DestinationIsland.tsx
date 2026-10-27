"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrthographicCamera, Vector3 } from "three";
import type { Destination, IslandId } from "@/types";
import { FloatingIsland } from "./FloatingIsland";
import { useWorldQuality } from "./WorldQuality";
import { IslandArt } from "./islands/IslandArt";
import { IslandSilhouette } from "./islands/IslandSilhouette";
import { IslandDock } from "./islands/Scenery";

export function DestinationIsland({ destination, enabled, selected, hidden = false, onSelect }: { destination: Destination; enabled: boolean; selected: boolean; hidden?:boolean; onSelect: (id: IslandId) => void }) {
  const [hovered,setHovered] = useState(false);
  const [detailed,setDetailed] = useState(destination.nearOnIntro || selected);
  const { preset } = useWorldQuality();
  const elapsed = useRef(0);
  const position = useRef(new Vector3(...destination.position));
  useFrame(({camera},delta) => {
    elapsed.current += delta; if (elapsed.current < 0.6) return; elapsed.current = 0;
    const distance = camera.position.distanceTo(position.current);
    const projected = position.current.clone().project(camera);
    const onScreen = Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2 && Math.abs(projected.z) <= 1;
    const screenRadius = camera instanceof OrthographicCamera ? destination.shape.radius * (destination.scale ?? 1) * camera.zoom : 0;
    const shouldDetail = selected || onScreen && (destination.nearOnIntro || distance < preset.detailDistance + (detailed ? 2 : -2) || screenRadius > 90);
    if (shouldDetail !== detailed) setDetailed(shouldDetail);
  });
  useEffect(() => { if (!hovered || !enabled) return; document.body.style.cursor = "pointer"; return () => { document.body.style.cursor = ""; }; }, [hovered,enabled]);
  return <group name={"island:" + destination.id} visible={!hidden} position={destination.position} rotation={[0,destination.rotation,0]} scale={destination.scale}
    onClick={(event) => { event.stopPropagation(); if (enabled) onSelect(destination.id); }}
    onPointerOver={(event) => { event.stopPropagation(); if (enabled) setHovered(true); }} onPointerOut={() => setHovered(false)}>
    <FloatingIsland shape={destination.shape} simple={!detailed}>
      {detailed ? <IslandArt destination={destination} /> : <IslandSilhouette id={destination.id} />}
      <IslandDock position={destination.dock.position} heading={destination.dock.rotation} />
      {(selected || hovered) && <mesh position={[destination.dock.position[0] + Math.sin(destination.dock.rotation) * .7,destination.dock.position[1] + .035,destination.dock.position[2] + Math.cos(destination.dock.rotation) * .7]} rotation={[-Math.PI / 2,0,0]}><ringGeometry args={[0.48,0.53,32]} /><meshBasicMaterial color={destination.theme} transparent opacity={0.7} depthWrite={false} /></mesh>}
    </FloatingIsland>
  </group>;
}
