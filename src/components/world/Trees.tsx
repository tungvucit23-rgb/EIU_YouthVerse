"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import type { Vector3Tuple } from "@/types";
import { useWorldQuality } from "./WorldQuality";

const treeColors = ["#526e37", "#6c8240", "#8c9b4d", "#486f40", "#78934d"];
const canopyClusters = [[-0.25,0.9,0,0.38],[0.24,1,0.09,0.4],[0,1.34,-0.06,0.36],[0,1.04,0.3,0.35],[0.02,1.03,-0.29,0.36],[-0.12,1.25,0.19,0.32],[-0.4,1.1,0.1,0.19],[0.38,1.25,-0.09,0.2],[-0.17,1.55,-0.1,0.2],[0.11,1.4,0.27,0.22]];

export function Trees({ positions, scale = 1 }: { positions: Vector3Tuple[]; scale?: number }) {
  const trunks = useRef<InstancedMesh>(null), crowns = useRef<InstancedMesh>(null);
  const { preset, reducedMotion } = useWorldQuality();
  const clusters = preset.treeClusters;
  const wind = useRef({ value: 0 });
  const material = useMemo(() => {
    const leaf = new MeshStandardMaterial({ roughness: 0.96 });
    if (preset.foliageMotion && !reducedMotion) {
      leaf.onBeforeCompile = (shader) => {
        shader.uniforms.uWindTime = wind.current;
        shader.vertexShader = "uniform float uWindTime;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.x += sin(uWindTime * 0.7 + instanceMatrix[3].x * 1.9 + instanceMatrix[3].z) * 0.018 * max(position.y + 0.5, 0.0);\n#endif");
      };
      leaf.customProgramCacheKey = () => "youthverse-tree-wind";
    }
    return leaf;
  }, [preset.foliageMotion, reducedMotion]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => { if (!reducedMotion && preset.foliageMotion) wind.current.value = clock.elapsedTime; });
  useLayoutEffect(() => {
    const dummy = new Object3D();
    positions.forEach(([x,y,z], i) => {
      const variation = (Math.sin(x * 12.31 + z * 9.27) + 1) / 2;
      const height = (.73 + variation * .45) * scale,type = i % 3;
      for (let branch = 0; branch < 3; branch++) {
        dummy.position.set(x + (branch ? (branch === 1 ? -0.11 : 0.1) * height : 0), y + height * (branch ? 0.72 : 0.42), z);
        dummy.scale.set(0.04 * scale * (branch ? 0.55 : 1), height * (branch ? 0.55 : 1), 0.04 * scale * (branch ? 0.55 : 1));
        dummy.rotation.set(0, i * 0.2, branch ? (branch === 1 ? 0.55 : -0.55) : 0);
        dummy.updateMatrix(); trunks.current?.setMatrixAt(i * 3 + branch, dummy.matrix);
      }
      for (let cluster = 0; cluster < clusters; cluster++) {
        const [cx,cy,cz,size] = canopyClusters[cluster];
        const spread = type === 0 ? 1.28 : type === 1 ? .88 : 1.08;
        dummy.position.set(x + cx * height * spread, y + cy * height * (type === 0 ? .84 : 1), z + cz * height * spread);
        dummy.scale.set(height * size * spread, height * size * (type === 0 ? .72 : type === 1 ? 1.25 : 1.02), height * size * spread);
        dummy.rotation.set(cluster * 0.7, i * 0.74, cluster * 0.4);
        dummy.updateMatrix(); const index = i * clusters + cluster;
        crowns.current?.setMatrixAt(index, dummy.matrix);
        crowns.current?.setColorAt(index, new Color(treeColors[(i + cluster) % treeColors.length]));
      }
      dummy.rotation.set(0,0,0);
    });
    if (trunks.current) {trunks.current.instanceMatrix.needsUpdate = true;trunks.current.computeBoundingSphere();}
    if (crowns.current) { crowns.current.instanceMatrix.needsUpdate = true; if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true;crowns.current.computeBoundingSphere(); }
  }, [positions, scale, clusters]);
  return <group>
    <instancedMesh ref={trunks} args={[undefined,undefined,positions.length * 3]} castShadow><cylinderGeometry args={[0.7,1,1,6]} /><meshStandardMaterial color="#796447" /></instancedMesh>
    <instancedMesh ref={crowns} args={[undefined,undefined,positions.length * clusters]} material={material} castShadow><icosahedronGeometry args={[1,1]} /></instancedMesh>
  </group>;
}
