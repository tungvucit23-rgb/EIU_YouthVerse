"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, MeshStandardMaterial } from "three";
import { useTerrainTextures } from "./TerrainTextures";
import { useWorldQuality } from "./WorldQuality";

function createPalette(woodMap: ReturnType<typeof useTerrainTextures>, moving: boolean) {
  const breeze = { value:0 };
  const cloth = (color: string) => {
    const material = new MeshStandardMaterial({ color, roughness: 0.92, side: DoubleSide });
    if (moving) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uBreeze = breeze;
        shader.vertexShader = "uniform float uBreeze;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.z += sin(uBreeze * 1.1 + position.x * 5.0 + position.y * 2.0) * 0.035 * uv.x;");
      };
      material.customProgramCacheKey = () => "youthverse-festival-cloth";
    }
    return material;
  };
  return { breeze, materials: {
    ivory: new MeshStandardMaterial({ color: "#f4eddc", roughness: 0.85 }),
    white: new MeshStandardMaterial({ color: "#fffaf0", roughness: 0.72 }),
    wood: new MeshStandardMaterial({ color: "#b18b5d", roughness: 0.78, map: woodMap?.wood }),
    darkWood: new MeshStandardMaterial({ color: "#6c5139", roughness: 0.85, map: woodMap?.wood }),
    roof: new MeshStandardMaterial({ color: "#587b7c", roughness: 0.7, metalness: 0.15 }),
    navy: new MeshStandardMaterial({ color: "#214b63", roughness: 0.65 }),
    glass: new MeshStandardMaterial({ color: "#97bfbb", transparent: true, opacity: 0.47, roughness: 0.2, metalness: 0.1, side: DoubleSide, depthWrite: false }),
    window: new MeshStandardMaterial({ color: "#486e79", roughness: 0.24, metalness: 0.25 }),
    metal: new MeshStandardMaterial({ color: "#7b8987", roughness: 0.38, metalness: 0.7 }),
    gold: new MeshStandardMaterial({ color: "#cdb77a", roughness: 0.28, metalness: 0.66 }),
    path: new MeshStandardMaterial({ color: "#d1c7ab", roughness: 0.96 }),
    stone: new MeshStandardMaterial({ color: "#cac8b7", roughness: 0.95 }),
    soil: new MeshStandardMaterial({ color: "#78664b", roughness: 1 }),
    green: new MeshStandardMaterial({ color: "#688748", roughness: 1 }),
    lamp: new MeshStandardMaterial({ color: "#fff1cd", emissive: "#ffe5ab", emissiveIntensity: 0.35, roughness: 0.65 }),
    cloth: cloth("#f7efd8"), blueCloth: cloth("#527f9a"), goldCloth: cloth("#d8b97b"), roseCloth: cloth("#bb9692"),
  } };
}
const PaletteContext = createContext<ReturnType<typeof createPalette>["materials"] | null>(null);
export function SceneryMaterials({ children }: { children: ReactNode }) {
  const textures = useTerrainTextures();
  const { reducedMotion, preset } = useWorldQuality();
  const animated = useRef<ReturnType<typeof createPalette>|null>(null);
  const resources = useMemo(() => createPalette(textures,!reducedMotion && preset.foliageMotion), [textures,reducedMotion,preset.foliageMotion]);
  useEffect(() => { animated.current = resources; return () => { animated.current = null; Object.values(resources.materials).forEach((material) => material.dispose()); }; }, [resources]);
  useFrame(({ clock }) => { if (animated.current && !reducedMotion && preset.foliageMotion) animated.current.breeze.value = clock.elapsedTime; });
  return <PaletteContext.Provider value={resources.materials}>{children}</PaletteContext.Provider>;
}
export function useSceneryMaterials() { const palette = useContext(PaletteContext); if (!palette) throw new Error("World scenery requires its material provider"); return palette; }
