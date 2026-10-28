import type { GraphicsQuality } from "@/types";

export const qualityPresets = {
  low: { dpr: 1, shadows: false, shadowSize: 512, terrainSegments: 32, rockCount: 14, treeClusters: 4, waterSegments: 30, detailDistance: 27, foliageMotion: false },
  balanced: { dpr: 1.25, shadows: true, shadowSize: 1024, terrainSegments: 56, rockCount: 24, treeClusters: 7, waterSegments: 48, detailDistance: 36, foliageMotion: true },
  high: { dpr: 1.75, shadows: true, shadowSize: 2048, terrainSegments: 80, rockCount: 36, treeClusters: 10, waterSegments: 72, detailDistance: 44, foliageMotion: true },
} as const;

export function effectiveQuality(requested: GraphicsQuality, mobile: boolean, constrained = false): GraphicsQuality {
  return mobile || constrained ? "low" : requested;
}

export const worldSettings = {
  boatScale: 0.82,
  launchPosition: [0,-.3,34] as [number,number,number],
  chase: {distance:12.5,height:6.2,lookAhead:10,shoulder:1.2,fov:50,mobileFov:72,mobileLookAhead:14},
  departureTurnMs: 700,
  minSailingSeconds: 3.8,
  maxSailingSeconds: 8.5,
  reducedMotionSeconds: 0.45,
  approachAt: 0.78,
  dockingAt: 0.94,
  assetTimeoutMs: 22000,
};
