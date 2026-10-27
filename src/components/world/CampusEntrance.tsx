"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, Path, Shape, SRGBColorSpace } from "three";

export interface CampusEntranceProps {
  width?: number;
  height?: number;
  position?: [number, number, number];
}

function SignWall() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#faf7ed";
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = "#073b71";
    context.textAlign = "center";
    context.font = "bold 112px Georgia";
    context.fillText("EIU", 256, 139);
    context.font = "16px Arial";
    context.fillText("EASTERN INTERNATIONAL", 256, 184);
    context.fillText("UNIVERSITY", 256, 209);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={[2.5, 0.66, 0.58]}>
      <mesh castShadow>
        <boxGeometry args={[1.7, 1.4, 0.2]} />
        <meshStandardMaterial color="#f9f5e9" />
      </mesh>
      <mesh position={[0, 0.02, 0.106]}>
        <planeGeometry args={[1.5, 0.75]} />
        <meshStandardMaterial map={texture} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Reference-informed placeholder. Replace this group with an approved, optimized GLB. */
export function CampusEntrance({ width = 7.2, height = 1.55, position = [0, 0.14, 1.6] }: CampusEntranceProps) {
  const canopy = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-3.6, -0.7);
    shape.bezierCurveTo(-1.4, -0.18, 0.8, -0.5, 3.6, -1.05);
    shape.lineTo(3.6, 1.05);
    shape.bezierCurveTo(1.1, 1.35, -1.1, 0.7, -3.6, 0.45);
    shape.closePath();
    const skylight = new Path();
    skylight.absellipse(1.5, 0.08, 0.85, 0.48, 0, Math.PI * 2, true);
    shape.holes.push(skylight);
    return shape;
  }, []);

  return (
    <group name="EIU-entrance-placeholder" position={position} scale={[width / 7.2, height / 1.55, 1]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.4, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[canopy, { depth: 0.12, bevelEnabled: false, curveSegments: 24 }]} />
        <meshStandardMaterial color="#fffdf3" roughness={0.75} />
      </mesh>
      {[-3.2, -2.1, -1, 0.1, 1.25, 3.25].map((x, i) => (
        <mesh key={x} position={[x, 0.69, i > 3 ? 0.58 : 0.22]} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 1.4, 8]} />
          <meshStandardMaterial color="#fffdf5" />
        </mesh>
      ))}
      <SignWall />
    </group>
  );
}
