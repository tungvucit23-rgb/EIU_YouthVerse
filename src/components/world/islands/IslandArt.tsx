"use client";

import { Component, lazy, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
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
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={scene} dispose={null} />;
}
export function ReplaceableIslandModel({ asset,fallback }: { asset:IslandAsset; fallback:ReactNode }) {
  return asset.kind === "glb" ? <Suspense fallback={fallback}><ModelBoundary key={asset.url} fallback={fallback}><Model url={asset.url} /></ModelBoundary></Suspense> : fallback;
}
export function IslandArt({ destination }: { destination: Destination }) {
  const Theme = art[destination.id];
  const fallback = <StaticSceneryBatch><group name={"island-art:" + destination.id}><Theme /></group></StaticSceneryBatch>;
  return <Suspense fallback={<IslandSilhouette id={destination.id} />}>
    <ReplaceableIslandModel asset={destination.asset} fallback={fallback} />
  </Suspense>;
}
