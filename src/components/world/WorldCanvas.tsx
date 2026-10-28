"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useState } from "react";
import { effectiveQuality, qualityPresets, worldSettings } from "@/data/world-settings";
import { WorldScene, type WorldProps } from "./WorldScene";

export default function WorldCanvas(props: WorldProps & { onUnavailable: () => void }) {
  const [resolution,setResolution] = useState(1);
  const [constrained,setConstrained] = useState(false);
  const quality = effectiveQuality(props.quality,props.mobile,constrained);
  const preset = qualityPresets[quality];
  return <Canvas camera={{position:[-worldSettings.chase.shoulder,worldSettings.launchPosition[1] + worldSettings.chase.height,worldSettings.launchPosition[2] + worldSettings.chase.distance],fov:worldSettings.chase.fov,near:0.1,far:260}}
    dpr={[0.65,Math.max(0.75,preset.dpr * resolution)]} shadows={preset.shadows}
    gl={{antialias:quality !== "low",alpha:true,powerPreference:"default"}}
    onCreated={({gl}) => { gl.domElement.setAttribute("aria-label","Quần đảo EIU gồm chín đảo. Có thể điều hướng bằng Hải đồ hoặc danh sách điểm đến."); gl.domElement.setAttribute("role","img"); }}
    fallback={null}>
    <PerformanceMonitor onDecline={() => setResolution(0.8)} flipflops={2} onFallback={() => { setResolution(0.8); setConstrained(true); }} />
    <ContextRecovery onUnavailable={props.onUnavailable} />
    <WorldScene {...props} quality={quality} />
  </Canvas>;
}
function ContextRecovery({onUnavailable}: {onUnavailable:() => void}) {
  const gl = useThree((state) => state.gl);
  useEffect(() => { const lost = (event:Event) => { event.preventDefault(); onUnavailable(); }; gl.domElement.addEventListener("webglcontextlost",lost); return () => gl.domElement.removeEventListener("webglcontextlost",lost); }, [gl,onUnavailable]);
  return null;
}
