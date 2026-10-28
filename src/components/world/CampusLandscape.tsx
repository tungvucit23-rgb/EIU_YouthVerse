"use client";

import { useLayoutEffect, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";

export function CampusLandscape() {
  const curbs = useRef<InstancedMesh>(null);
  const hedges = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < 108; i++) {
      const angle = i / 108 * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * 4.3, 0.165, Math.sin(angle) * 3.5);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(0.13, 0.055, 0.055);
      dummy.updateMatrix();
      curbs.current?.setMatrixAt(i, dummy.matrix);
      curbs.current?.setColorAt(i, new Color(i % 3 === 0 ? "#d7b568" : "#f0e9d7"));
    }
    for (let i = 0; i < 46; i++) {
      const side = i < 23 ? -1 : 1;
      const step = i % 23;
      dummy.position.set(side * (3.7 - step * 0.052), 0.26, -2 + step * 0.17);
      dummy.rotation.set(0, step * 0.6, 0);
      dummy.scale.set(0.19, 0.15 + (i % 3) * 0.02, 0.2);
      dummy.updateMatrix();
      hedges.current?.setMatrixAt(i, dummy.matrix);
      hedges.current?.setColorAt(i, new Color(i % 3 === 0 ? "#7d8f42" : "#536c35"));
    }
    for (const mesh of [curbs.current, hedges.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, []);
  return <group>
    <group name="campus-reflecting-pool" position={[-1.45,.14,3.05]}>
      <mesh position={[0,.015,0]} receiveShadow><boxGeometry args={[1.9,.065,.95]}/><meshStandardMaterial color="#ded9c4" roughness={.93}/></mesh>
      <mesh position={[0,.052,0]} rotation={[-Math.PI / 2,0,0]}><planeGeometry args={[1.65,.7]}/><meshStandardMaterial color="#75b6c2" roughness={.24} metalness={.14}/></mesh>
      {[-1,1].map(side => <mesh key={side} position={[side * .88,.075,0]} receiveShadow><boxGeometry args={[.14,.055,.95]}/><meshStandardMaterial color="#e7e1cf" roughness={.9}/></mesh>)}
      <mesh position={[0,.1,0]} receiveShadow><boxGeometry args={[.19,.055,.96]}/><meshStandardMaterial color="#cfc9b6" roughness={.94}/></mesh>
    </group>
    <mesh name="campus-dock-footpath" position={[.3,.145,3.6]} receiveShadow><boxGeometry args={[.58,.025,2.35]}/><meshStandardMaterial color="#d6d0bb" roughness={.96}/></mesh>
    <instancedMesh ref={curbs} args={[undefined, undefined, 108]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.9} /></instancedMesh>
    <instancedMesh ref={hedges} args={[undefined, undefined, 46]} castShadow><icosahedronGeometry args={[1, 1]} /><meshStandardMaterial roughness={1} /></instancedMesh>
    {[-2.7, -0.7, 1.4, 3.5].map((x, i) => <group key={x} position={[x, 0.17, i % 2 ? 3.38 : -3.1]}>
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.012, 0.022, 0.68, 6]} /><meshStandardMaterial color="#5c6462" /></mesh>
      <mesh position={[0.06, 0.68, 0]} rotation={[0, 0, -0.4]}><boxGeometry args={[0.16, 0.035, 0.08]} /><meshStandardMaterial color="#dddcc9" /></mesh>
    </group>)}
  </group>;
}
