"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import { useTerrainTextures } from "../TerrainTextures";
import { useWorldQuality } from "../WorldQuality";

const MODEL_URL = "/models/youthverse-explorer.glb";

function fabricTexture(mark = false) {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = mark ? 384 : 1024;
  const context = canvas.getContext("2d")!;
  if (mark) {
    context.fillStyle = "#194f70"; context.textAlign = "center"; context.font = "bold 108px Georgia"; context.fillText("EIU",256,232);
    context.font = "23px Georgia"; context.fillText("HOIST THE SAILS",256,285);
    context.beginPath(); context.moveTo(256,28); context.lineTo(270,72); context.lineTo(315,86); context.lineTo(270,100); context.lineTo(256,145); context.lineTo(242,100); context.lineTo(197,86); context.lineTo(242,72); context.closePath(); context.fill();
  } else {
    const gradient = context.createLinearGradient(0,0,512,0); gradient.addColorStop(0,"#e9ddc1"); gradient.addColorStop(0.45,"#fff9e7"); gradient.addColorStop(1,"#dfd3b7"); context.fillStyle = gradient; context.fillRect(0,0,512,1024);
    for (let y = 0; y < 1024; y += 81) { context.strokeStyle = "#a9987559"; context.lineWidth = 1.5; context.beginPath(); context.moveTo(0,y); context.lineTo(512,y + 13); context.stroke(); }
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.flipY = false; return texture;
}

function animateCloth(mesh:Mesh,base:Float32Array,time:number) {
  const position = mesh.geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setZ(i,base[i * 3 + 2] + Math.sin(time * 1.5 + base[i * 3 + 1] * 3.4 + base[i * 3] * 2.1) * 0.025 * Math.min(1,Math.abs(base[i * 3])));
  position.needsUpdate = true;
}

export function ExplorerBoatAsset({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(MODEL_URL,false);
  const terrain = useTerrainTextures();
  const { reducedMotion, quality } = useWorldQuality();
  const lastHeading = useRef(0);
  const maps = useMemo(() => ({ fabric:fabricTexture(), mark:fabricTexture(true) }), []);
  useEffect(onReady, [onReady]);
  const asset = useMemo(() => {
    const root = scene.clone(true); const materials = new Map<string,MeshStandardMaterial>();
    const sails: { mesh: Mesh; base: Float32Array }[] = [];
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = object.receiveShadow = true;
      const original = object.material as MeshStandardMaterial;
      if (!materials.has(original.uuid)) {
        const material = original.clone();
        if (original.name.startsWith("Wood")) material.map = terrain?.wood ?? null;
        if (original.name === "Ivory_Fabric") material.map = maps.fabric;
        if (original.name === "Sail_Mark") { material.map = maps.mark; material.transparent = true; material.depthWrite = false; }
        material.needsUpdate = true; materials.set(original.uuid,material);
      }
      object.material = materials.get(original.uuid)!;
      if (object.name === "MainSail" || object.name === "JibSail" || object.name === "Mast_Pennant") { object.geometry = object.geometry.clone(); sails.push({ mesh:object,base:Float32Array.from(object.geometry.attributes.position.array) }); }
    });
    return { root, materials:[...materials.values()], sails, rig:root.getObjectByName("SailRig"),wheel:root.getObjectByName("Wheel") };
  }, [scene,terrain,maps]);
  const animated = useRef<typeof asset|null>(null);
  useEffect(() => { animated.current = asset; return () => { animated.current = null; asset.materials.forEach((material) => material.dispose()); asset.sails.forEach(({mesh}) => mesh.geometry.dispose()); }; }, [asset]);
  useEffect(() => () => { maps.fabric.dispose(); maps.mark.dispose(); }, [maps]);
  useFrame(({clock},delta) => {
    const active = animated.current;
    if (!active) return;
    const heading = active.root.parent?.rotation.y ?? 0;
    const turn = Math.atan2(Math.sin(heading - lastHeading.current),Math.cos(heading - lastHeading.current));
    lastHeading.current = heading;
    if (active.rig) active.rig.rotation.y += ((reducedMotion ? -0.18 : -0.18 + Math.sin(clock.elapsedTime * 0.7 + heading) * 0.04 - turn * 0.8) - active.rig.rotation.y) * Math.min(1,delta * 4);
    if (active.wheel) active.wheel.rotation.z += (turn * 8 - active.wheel.rotation.z) * Math.min(1,delta * 4);
    if (reducedMotion || quality === "low") return;
    for (const {mesh,base} of active.sails) animateCloth(mesh,base,clock.elapsedTime);
  });
  return <primitive object={asset.root} dispose={null} />;
}

export function BoatLoadingProxy() {
  return <group name="boat-loading-proxy"><mesh scale={[0.45,0.2,1]}><sphereGeometry args={[1,10,6]} /><meshStandardMaterial color="#9d794f" /></mesh><mesh position={[0,1.3,0]}><planeGeometry args={[0.8,2]} /><meshStandardMaterial color="#f5ecd6" /></mesh></group>;
}

useGLTF.preload(MODEL_URL,false);
