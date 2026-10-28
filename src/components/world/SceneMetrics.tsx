"use client";

import { useFrame } from "@react-three/fiber";
import { Mesh,OrthographicCamera,type Vector3 } from "three";
import type { RefObject } from "react";
import type { Vector3Tuple } from "@/types";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";
import type { NavigationPlan } from "@/types/navigation";
import { boatBoundsPoints } from "@/lib/world-framing";
import { observeIslandRoots,projectScreenBounds } from "@/lib/world-observation";
import { useWorldQuality } from "./WorldQuality";

/** Opt-in QA observations: enabled roots are separate from camera intersections and active LODs. */
export function SceneMetrics({state,motion,plan}: {state:JourneyState;motion:RefObject<JourneyMotion>;plan:NavigationPlan}) {
  const {quality} = useWorldQuality();
  useFrame(({gl,scene,camera,size}) => {
    if (!window.location.search.includes("inspect=1")) return;
    const canvas = gl.domElement,vessel = scene.getObjectByName("sailing-boat");
    const observations = observeIslandRoots(scene,camera,size);
    const viewport = observations.filter((island) => island.inViewport);
    const ids = (items:typeof observations) => items.map((island) => island.id).sort().join(",");
    canvas.dataset.islands = String(observations.length);
    canvas.dataset.enabledIslandCount = String(observations.filter((island) => island.enabled).length);
    canvas.dataset.enabledIslands = ids(observations.filter((island) => island.enabled));
    canvas.dataset.islandStates = JSON.stringify(observations);
    canvas.dataset.islandRootIds = JSON.stringify(Object.fromEntries(observations.map((island) => [island.id,island.uuid])));
    canvas.dataset.viewportIslands = ids(viewport);
    canvas.dataset.visibleIslands = JSON.stringify(viewport);
    canvas.dataset.detailedIslands = ids(observations.filter((island) => island.lod === "detailed"));
    canvas.dataset.simplifiedIslands = ids(observations.filter((island) => island.lod !== "detailed"));
    canvas.dataset.loadedDetailedIslands = ids(observations.filter((island) => island.detailLoaded));
    canvas.dataset.viewportDetailedIslands = ids(viewport.filter((island) => island.lod === "detailed"));
    canvas.dataset.quality = quality;
    const modelAssets = new Set<string>();scene.traverse(object => {if(typeof object.userData.sourceAsset === "string") modelAssets.add(object.userData.sourceAsset);});
    canvas.dataset.modelAssets = JSON.stringify([...modelAssets].sort());
    canvas.dataset.campusArchitecture = String(Boolean(scene.getObjectByName("EIU_Academic_Quarter")));
    const main = scene.getObjectByName("MainSail"),jib = scene.getObjectByName("JibSail");
    const cloth = (mesh:typeof main) => mesh instanceof Mesh ? mesh.geometry.attributes.position.getZ(Math.floor(mesh.geometry.attributes.position.count / 2)) : null;
    canvas.dataset.boatAnimation = JSON.stringify({main:cloth(main),jib:cloth(jib),rig:scene.getObjectByName("SailRig")?.rotation.y,wheel:scene.getObjectByName("Wheel")?.rotation.z});
    canvas.dataset.phase = state.phase;
    canvas.dataset.journeyProgress = String(motion.current.progress);
    canvas.dataset.journeyElapsed = String(motion.current.elapsed);
    canvas.dataset.journeyDuration = String(plan.duration);
    canvas.dataset.drawCalls = String(gl.info.render.calls);
    canvas.dataset.triangles = String(gl.info.render.triangles);
    canvas.dataset.geometries = String(gl.info.memory.geometries);
    canvas.dataset.cameraPosition = camera.position.toArray().map((value) => value.toFixed(4)).join(",");
    if (camera instanceof OrthographicCamera) canvas.dataset.cameraZoom = camera.zoom.toFixed(4);
    let waterCount = 0,waterVertices = 0,waterDistance = Infinity;
    for (const object of scene.getObjectByName("connected-sky-waterways")?.children ?? []) {
      if (!(object instanceof Mesh) || !object.visible) continue;
      waterCount++;
      const vertices = object.geometry.attributes.position; waterVertices += vertices.count;
      if (vessel) for (let i = 2; i + 5 < vertices.count; i += 5) {
        const ax = vertices.getX(i),az = vertices.getZ(i),dx = vertices.getX(i + 5) - ax,dz = vertices.getZ(i + 5) - az;
        const t = Math.max(0,Math.min(1,((vessel.position.x - ax) * dx + (vessel.position.z - az) * dz) / Math.max(.000001,dx * dx + dz * dz)));
        waterDistance = Math.min(waterDistance,Math.hypot(vessel.position.x - ax - dx * t,vessel.position.z - az - dz * t));
      }
    }
    canvas.dataset.waterMeshes = String(waterCount); canvas.dataset.waterVertices = String(waterVertices); canvas.dataset.boatWaterDistance = waterDistance.toFixed(4);
    canvas.dataset.boatLoaded = String(Boolean(scene.getObjectByName("YouthVerse_Explorer")));
    if (vessel) {
      canvas.dataset.boatPosition = vessel.position.toArray().map((value) => value.toFixed(4)).join(",");
      canvas.dataset.boatHeading = vessel.rotation.y.toFixed(4);
      canvas.dataset.boatScreen = JSON.stringify(projectScreenBounds(boatBoundsPoints((vessel.position as Vector3).toArray() as Vector3Tuple),camera,size));
    }
  });
  return null;
}
