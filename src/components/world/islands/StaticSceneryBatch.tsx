"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { BufferGeometry, Group, Material, Matrix4, Mesh, MeshStandardMaterial } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useSceneryMaterials } from "../SceneryMaterials";

function materialKey(material:Material) {
  if (!(material instanceof MeshStandardMaterial)) return material.uuid;
  return [material.type,material.color.getHexString(),material.roughness,material.metalness,material.opacity,material.transparent,material.side,material.vertexColors,material.map?.uuid,material.alphaTest,material.emissive.getHexString(),material.emissiveIntensity,material.customProgramCacheKey()].join("/");
}

/** Batch fixed architecture while retaining live instancing, fabric shaders and island hit areas. */
export function StaticSceneryBatch({children}: {children:ReactNode}) {
  const root = useRef<Group>(null);
  const palette = useSceneryMaterials();
  useEffect(() => {
    const parent = root.current;
    return () => { const geometries = new Set<BufferGeometry>(); parent?.traverse((object) => { if (object instanceof Mesh) geometries.add(object.geometry); }); geometries.forEach((geometry) => geometry.dispose()); };
  }, []);
  useLayoutEffect(() => {
    const parent = root.current; if (!parent) return;
    parent.updateWorldMatrix(true,true);
    const inverse = parent.matrixWorld.clone().invert();
    const buckets = new Map<string,{material:Material; geometries:BufferGeometry[]; cast:boolean; receive:boolean}>();
    const originals: {mesh:Mesh; raycast:Mesh["raycast"]}[] = [];
    parent.traverse((object) => {
      if (!(object instanceof Mesh) || "isInstancedMesh" in object || Array.isArray(object.material) || !object.visible) return;
      const geometry = object.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse,object.matrixWorld));
      for (const name of Object.keys(geometry.attributes)) if (!["position","normal","uv"].includes(name)) geometry.deleteAttribute(name);
      if (!geometry.attributes.normal || !geometry.attributes.uv) { geometry.dispose(); return; }
      const key = materialKey(object.material);
      if (!buckets.has(key)) buckets.set(key,{material:object.material,geometries:[],cast:false,receive:false});
      const bucket = buckets.get(key)!;
      bucket.geometries.push(geometry.index ? geometry.toNonIndexed() : geometry);
      if (geometry.index) geometry.dispose();
      bucket.cast ||= object.castShadow; bucket.receive ||= object.receiveShadow;
      originals.push({mesh:object,raycast:object.raycast}); object.visible = false; object.raycast = () => undefined;
    });
    const batch = new Group(); batch.name = "batched-scenery";
    for (const bucket of buckets.values()) {
      const geometry = mergeGeometries(bucket.geometries); bucket.geometries.forEach((part) => part.dispose());
      if (!geometry) continue;
      geometry.computeBoundingSphere(); const mesh = new Mesh(geometry,bucket.material); mesh.castShadow = bucket.cast; mesh.receiveShadow = bucket.receive; batch.add(mesh);
    }
    parent.add(batch);
    return () => { parent.remove(batch); batch.traverse((object) => { if (object instanceof Mesh) object.geometry.dispose(); }); originals.forEach(({mesh,raycast}) => { mesh.visible = true; mesh.raycast = raycast; }); };
  }, [palette]);
  return <group ref={root}>{children}</group>;
}
