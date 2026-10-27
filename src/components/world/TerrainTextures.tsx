"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const TerrainContext = createContext<{ stone: CanvasTexture; grass: CanvasTexture; wood: CanvasTexture } | null>(null);
const noise = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

function makeSurface(kind: "stone" | "grass" | "wood") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const pixels = context.createImageData(512, 512);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const grain = noise(x, y);
      const broad = noise(Math.floor(x / 17), Math.floor(y / 25));
      const stratum = Math.sin(y * 0.14 + Math.sin(x * 0.025) * 2) * 11 + Math.sin(x * 0.17 + y * 0.04) * 6;
      const light = kind === "stone" ? 203 + grain * 35 + broad * 17 + stratum : kind === "wood" ? 194 + grain * 14 + Math.sin(y * 0.27 + Math.sin(x * 0.018) * 2) * 22 : 207 + grain * 35 + broad * 9;
      const index = (y * 512 + x) * 4;
      pixels.data[index] = light;
      pixels.data[index + 1] = light + (kind === "grass" ? 8 : kind === "wood" ? -9 : 1);
      pixels.data[index + 2] = light - (kind === "grass" ? 24 : kind === "wood" ? 24 : 8);
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  if (kind === "stone") {
    for (let i = 0; i < 26; i++) {
      const start = noise(i, 7) * 512;
      const firstY = noise(i,13) * 400;
      context.beginPath();
      context.moveTo(start, firstY);
      for (let y = firstY; y <= Math.min(512,firstY + 30 + noise(i,5) * 180); y += 11) context.lineTo(start + Math.sin(y * 0.025 + i) * 8 + noise(i, y) * 6 + (y - firstY) * 0.12, y);
      context.strokeStyle = `rgba(71, 88, 93, ${0.05 + noise(i, 9) * 0.12})`;
      context.lineWidth = 0.4 + noise(i, 3) * 2.5;
      context.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(kind === "stone" ? 3 : 5, kind === "stone" ? 1 : 5);
  texture.anisotropy = 4;
  return texture;
}

export function TerrainTextures({ children }: { children: ReactNode }) {
  const textures = useMemo(() => ({ stone: makeSurface("stone"), grass: makeSurface("grass"), wood: makeSurface("wood") }), []);
  useEffect(() => () => { textures.stone.dispose(); textures.grass.dispose(); textures.wood.dispose(); }, [textures]);
  return <TerrainContext.Provider value={textures}>{children}</TerrainContext.Provider>;
}

export function useTerrainTextures() { return useContext(TerrainContext); }
