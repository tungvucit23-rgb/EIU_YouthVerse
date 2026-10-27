"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial } from "three";
import type { JourneyMotion } from "@/lib/journey-runtime";
import { useWorldQuality } from "../WorldQuality";

export function BoatWake({ motion }: { motion: RefObject<JourneyMotion> }) {
  const mesh = useRef<Mesh<BufferGeometry,ShaderMaterial>>(null);
  const { reducedMotion } = useWorldQuality();
  const geometry = useMemo(() => {
    const positions: number[] = [], uv: number[] = [], indices: number[] = [];
    for (let row = 0; row <= 20; row++) {
      const t = row / 20, width = 0.3 + t * 0.68;
      positions.push(-width,0,-0.7 - t * 3,width,0,-0.7 - t * 3); uv.push(0,t,1,t);
      if (row < 20) indices.push(row * 2,row * 2 + 1,row * 2 + 2,row * 2 + 1,row * 2 + 3,row * 2 + 2);
    }
    const result = new BufferGeometry(); result.setAttribute("position",new Float32BufferAttribute(positions,3)); result.setAttribute("uv",new Float32BufferAttribute(uv,2)); result.setIndex(indices); result.computeVertexNormals(); return result;
  }, []);
  const material = useMemo(() => new ShaderMaterial({ transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:0}},vertexShader:"varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:"uniform float uTime; uniform float uOpacity; varying vec2 vUv; void main(){float x=abs(vUv.x*2.0-1.0);float edge=exp(-pow((x-0.74)*9.0,2.0));float rings=pow(max(0.0,sin(vUv.y*39.0-uTime*7.0+x*8.0)),5.0);float alpha=(edge*0.65+rings*0.14)*(1.0-vUv.y)*uOpacity;gl_FragColor=vec4(0.9,0.98,1.0,alpha);}" }), []);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry,material]);
  useFrame(({clock}) => {
    if (!mesh.current) return;
    const current = motion.current;
    mesh.current.position.set(current.position[0],current.position[1] + 0.015,current.position[2]);
    mesh.current.rotation.y = Math.atan2(current.tangent[0],current.tangent[2]);
    mesh.current.material.uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    mesh.current.material.uniforms.uOpacity.value = reducedMotion ? 0 : Math.min(0.72,current.speed * 0.1);
  });
  return <mesh ref={mesh} name="boat-foam-wake" geometry={geometry} material={material} dispose={null} />;
}
