"use client";

import { createContext, useContext, type ReactNode } from "react";
import { qualityPresets } from "@/data/world-settings";
import type { GraphicsQuality } from "@/types";

const QualityContext = createContext({ quality: "balanced" as GraphicsQuality, reducedMotion: false });
export function WorldQuality({ quality, reducedMotion, children }: { quality: GraphicsQuality; reducedMotion: boolean; children: ReactNode }) {
  return <QualityContext.Provider value={{ quality, reducedMotion }}>{children}</QualityContext.Provider>;
}
export function useWorldQuality() { const context = useContext(QualityContext); return { ...context, preset: qualityPresets[context.quality] }; }
