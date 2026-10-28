"use client";

import { Component, lazy, Suspense, useEffect,useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import {Mesh,MeshStandardMaterial} from "three";
import {useTerrainTextures} from "../TerrainTextures";
import type { Destination, IslandAsset } from "@/types";
import { IslandSilhouette } from "./IslandSilhouette";
import { StaticSceneryBatch } from "./StaticSceneryBatch";

const art = {
  activities: lazy(() => import("./themes/ActivitiesIsland")), news: lazy(() => import("./themes/NewsIsland")),
  clubs: lazy(() => import("./themes/ClubsIsland")), events: lazy(() => import("./themes/EventsIsland")),
  volunteer: lazy(() => import("./themes/VolunteerIsland")), office: lazy(() => import("./themes/OfficeIsland")),
  achievements: lazy(() => import("./themes/AchievementsIsland")), resources: lazy(() => import("./themes/ResourcesIsland")),
};

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode },{ failed: boolean }> {
  state = { failed:false };
  static getDerivedStateFromError() { return { failed:true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Model({ url }: { url: string }) {
  const gltf = useGLTF(url,false);
  const textures = useTerrainTextures();
  const asset = useMemo(() => {
    const root = gltf.scene.clone(true),materials = new Map<string,MeshStandardMaterial>();
    root.userData.sourceAsset = url;
    root.traverse(object => {
      if (!(object instanceof Mesh) || !(object.material instanceof MeshStandardMaterial)) return;
      const original = object.material;
      if(!materials.has(original.uuid)) {const m = original.clone();if(m.name.startsWith("Wood")){m.map = textures?.wood ?? null;m.bumpMap = textures?.wood ?? null;m.bumpScale = .012;}materials.set(original.uuid,m);}
      object.material = materials.get(original.uuid)!;object.castShadow = object.receiveShadow = true;
    });return {root,materials:[...materials.values()]};
  },[gltf.scene,textures,url]);
  useEffect(() => () => asset.materials.forEach(m => m.dispose()),[asset]);
  return <primitive object={asset.root} dispose={null} />;
}
export function ReplaceableIslandModel({ asset,fallback }: { asset:IslandAsset; fallback:ReactNode }) {
  return asset.kind === "glb" ? <Suspense fallback={fallback}><ModelBoundary key={asset.url} fallback={fallback}><Model url={asset.url} /></ModelBoundary></Suspense> : fallback;
}
export function IslandArt({ destination }: { destination: Destination }) {
  const Theme = art[destination.id];
  const fallback = destination.id === "activities" ? <Theme/> : <StaticSceneryBatch><Theme/></StaticSceneryBatch>;
  return <Suspense fallback={<IslandSilhouette id={destination.id} />}>
    <group name={"island-art:" + destination.id}><ReplaceableIslandModel asset={destination.asset} fallback={fallback} /></group>
  </Suspense>;
}
