"use client";

import { useSyncExternalStore } from "react";
import type { GraphicsQuality } from "@/types";

const key = "youthverse.graphics-quality";
const event = "youthverse:graphics-quality";
let memoryQuality:GraphicsQuality = "balanced";
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener); window.addEventListener(event, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(event, listener); };
};
const snapshot = (): GraphicsQuality => {
  try { const quality = localStorage.getItem(key); return quality === "low" || quality === "high" || quality === "balanced" ? quality : memoryQuality; } catch { return memoryQuality; }
};
export function useGraphicsQuality() {
  const quality = useSyncExternalStore(subscribe, snapshot, () => "balanced" as GraphicsQuality);
  const setQuality = (next: GraphicsQuality) => { memoryQuality = next; try { localStorage.setItem(key, next); } catch { /* Private browsing can deny storage; the in-memory preference still works. */ } window.dispatchEvent(new Event(event)); };
  return { quality, setQuality };
}
