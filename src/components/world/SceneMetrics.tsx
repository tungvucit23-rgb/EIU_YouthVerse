"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh,OrthographicCamera,Vector3 } from "three";
import { getIsland } from "@/data/islands";
import { islandBoundsPoints,boatBoundsPoints } from "@/lib/world-framing";
import type { Vector3Tuple } from "@/types";
import { useWorldQuality } from "./WorldQuality";

/** Opt-in QA data only. Bounds use the actual rendered camera, independently of its fit solver. */
export function SceneMetrics() {
  const elapsed = useRef(0),point = useRef(new Vector3());
  const {quality} = useWorldQuality();
  useFrame(({gl,scene,camera,size},delta) => {
    if (!window.location.search.includes("inspect=1")) return;
    elapsed.current += delta; if (elapsed.current < .25) return; elapsed.current = 0;
    const canvas = gl.domElement,vessel = scene.getObjectByName("sailing-boat");
    let count = 0,waterCount = 0,waterVertices = 0,waterDistance = Infinity;
    const detailed:string[] = [],visible:{id:string;x:number;y:number;width:number;height:number}[] = [];
    const bounds = (points:Vector3Tuple[]) => {
      const projected = points.map((p) => { point.current.set(...p).project(camera); return {x:(point.current.x * .5 + .5) * size.width,y:(-point.current.y * .5 + .5) * size.height}; });
      const x = Math.min(...projected.map((p) => p.x)),y = Math.min(...projected.map((p) => p.y));
      return {x,y,width:Math.max(...projected.map((p) => p.x)) - x,height:Math.max(...projected.map((p) => p.y)) - y};
    };
    scene.traverse((object) => {
      if (object.name.startsWith("island:")) { count++; if (object.visible) { const id = object.name.slice(7); visible.push({id,...bounds(islandBoundsPoints(getIsland(id as Parameters<typeof getIsland>[0])))}); } }
      if (object.name.startsWith("island-art:")) detailed.push(object.name.slice(11));
      if (object instanceof Mesh && object.name.startsWith("waterway:") && object.visible) {
        waterCount++; const vertices = object.geometry.attributes.position; waterVertices += vertices.count;
        if (vessel) for (let i = 2; i + 5 < vertices.count; i += 5) {
          const ax = vertices.getX(i),az = vertices.getZ(i),dx = vertices.getX(i + 5) - ax,dz = vertices.getZ(i + 5) - az;
          const t = Math.max(0,Math.min(1,((vessel.position.x - ax) * dx + (vessel.position.z - az) * dz) / Math.max(.000001,dx * dx + dz * dz)));
          waterDistance = Math.min(waterDistance,Math.hypot(vessel.position.x - ax - dx * t,vessel.position.z - az - dz * t));
        }
      }
    });
    canvas.dataset.islands = String(count); canvas.dataset.quality = quality; canvas.dataset.detailedIslands = detailed.sort().join(",");
    canvas.dataset.visibleIslands = JSON.stringify(visible);
    canvas.dataset.drawCalls = String(gl.info.render.calls); canvas.dataset.triangles = String(gl.info.render.triangles);
    canvas.dataset.waterMeshes = String(waterCount); canvas.dataset.waterVertices = String(waterVertices); canvas.dataset.boatWaterDistance = waterDistance.toFixed(4);
    canvas.dataset.boatLoaded = String(Boolean(scene.getObjectByName("YouthVerse_Explorer")));
    if (camera instanceof OrthographicCamera) canvas.dataset.cameraZoom = camera.zoom.toFixed(3);
    if (vessel) { canvas.dataset.boatPosition = vessel.position.toArray().map((value) => value.toFixed(3)).join(","); canvas.dataset.boatHeading = vessel.rotation.y.toFixed(3); canvas.dataset.boatScreen = JSON.stringify(bounds(boatBoundsPoints(vessel.position.toArray() as Vector3Tuple))); }
  });
  return null;
}
