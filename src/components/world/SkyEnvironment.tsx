"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, Group } from "three";
import { useWorldQuality } from "./WorldQuality";

const clouds: [number, number, number, number][] = [
  [-19, -4, -14, 2.8], [-11, -4.8, -12, 3], [1, -5.5, -14, 4], [15, -3, -14, 3.2],
  [19, -3.9, 1, 3], [-16, -4.5, 6, 2.7], [-10, -5.4, 13, 4], [5, -5.4, 15, 3.7], [17, -5.1, 12, 3.1],
  [-1.1, -2.6, 4.8, 0.75], [2.4, -2, 4.3, 0.6], [-4.1, -1.6, 2.4, 0.55],
];

function useCloudTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    [[64, 73, 48], [106, 56, 49], [151, 64, 55], [193, 78, 43], [129, 83, 47]].forEach(([x, y, radius]) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(255, 255, 252, 0.65)");
      gradient.addColorStop(0.4, "rgba(255, 255, 252, 0.32)");
      gradient.addColorStop(1, "rgba(255, 255, 252, 0)");
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function CloudLayer({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const texture = useCloudTexture();
  const { quality } = useWorldQuality();
  useFrame(({ clock }) => {
    if (group.current && !reducedMotion) group.current.position.x = Math.sin(clock.elapsedTime * 0.025) * 0.45;
  });
  return (
    <group ref={group}>
      {clouds.slice(0,quality === "low" ? 4 : quality === "high" ? clouds.length : 8).map(([x, y, z, scale], i) => <sprite key={i} position={[x, y, z]} scale={[scale * 5, scale * 2.1, 1]}><spriteMaterial map={texture} transparent opacity={0.65} depthWrite={false} /></sprite>)}
    </group>
  );
}

export function SkyEnvironment({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <fog attach="fog" args={["#b9d8f4", 52, 150]} />
      <CloudLayer reducedMotion={reducedMotion} />
    </>
  );
}
