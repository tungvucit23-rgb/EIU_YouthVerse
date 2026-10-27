"use client";

import { Map, Settings2 } from "lucide-react";
import type { RefObject } from "react";
import { getIsland } from "@/data/islands";
import type { IslandId } from "@/types";

export function MobileDestinationSheet({ current,onMap,onSettings,buttonRef }: { current:IslandId; onMap:() => void; onSettings:() => void; buttonRef:RefObject<HTMLButtonElement|null> }) {
  return <nav className="mobile-destination-sheet compact-mobile-hud" aria-label="Điều hướng quần đảo">
    <div className="mobile-current-location"><small>BẠN ĐANG Ở</small><span>{getIsland(current).title}</span></div>
    <button ref={buttonRef} className="mobile-map-button" onClick={onMap}><Map size={16} /> Hải đồ</button>
    <button className="icon-button" onClick={onSettings} aria-label="Cài đặt đồ họa"><Settings2 size={18} /></button>
  </nav>;
}
