"use client";

import type { DestinationId,IslandId } from "@/types";
import { useSceneryMaterials } from "../SceneryMaterials";

/** Small silhouettes are only used for distant LOD / chunk-loading previews. */
export function IslandSilhouette({ id }: { id: DestinationId|IslandId }) {
  const m = useSceneryMaterials();
  if (id === "news") return <group><mesh position={[0,1.05,0]} material={m.ivory}><cylinderGeometry args={[0.22,0.4,1.9,8]} /></mesh><mesh position={[0,2.1,0]} material={m.roof}><sphereGeometry args={[0.4,10,6,0,Math.PI * 2,0,Math.PI / 2]} /></mesh></group>;
  if (id === "achievements") return <group><mesh position={[0,0.4,0]} material={m.ivory}><boxGeometry args={[0.85,0.65,0.8]} /></mesh><mesh position={[0,1.08,0]} material={m.gold}><cylinderGeometry args={[0.5,0.13,0.8,12]} /></mesh></group>;
  if (id === "volunteer") return <group><mesh position={[0,0.6,0]} scale={[1.4,0.9,1.3]} material={m.glass}><sphereGeometry args={[0.8,12,8,0,Math.PI * 2,0,Math.PI / 2]} /></mesh><mesh position={[0,0.27,0]} material={m.wood}><boxGeometry args={[2.1,0.2,1.5]} /></mesh></group>;
  if (id === "office") return <group><mesh position={[-0.3,0.9,0]} material={m.ivory}><boxGeometry args={[1.6,1.6,1.1]} /></mesh><mesh position={[0.55,0.6,0.5]} material={m.window}><boxGeometry args={[1,0.9,1]} /></mesh><mesh position={[0,1.8,0]} material={m.roof}><boxGeometry args={[2.2,0.1,1.6]} /></mesh></group>;
  if (id === "events") return <group>{[0,1,2].map((i) => <mesh key={i} rotation={[Math.PI / 2,0,0]} position={[0,0.18 + i * 0.15,-0.3]} material={m.stone}><torusGeometry args={[1.1 + i * 0.25,0.09,4,20,Math.PI]} /></mesh>)}<mesh position={[0,0.55,0.5]} material={m.cloth}><boxGeometry args={[1.8,0.2,1]} /></mesh></group>;
  if (id === "clubs" || id === "resources") return <group>{[-1,0,1].map((x) => <group key={x} position={[x * 0.95,0,x === 0 ? -0.7 : 0.2]}><mesh position={[0,0.6,0]} material={m.ivory}><boxGeometry args={[0.8,0.9,0.8]} /></mesh><mesh position={[0,1.15,0]} rotation={[0,Math.PI / 4,0]} material={id === "resources" ? m.wood : m.roof}><coneGeometry args={[0.77,0.4,4]} /></mesh></group>)}</group>;
  return <group><mesh position={[0,0.22,0]} material={m.wood}><boxGeometry args={[2.3,0.2,1.5]} /></mesh><mesh position={[0,1.45,0]} scale={[1,0.5,1]} material={m.cloth}><coneGeometry args={[1.6,0.4,4]} /></mesh></group>;
}
