"use client";

import { useEffect, useRef, type RefObject } from "react";
import { campus, destinations } from "@/data/islands";
import { navigationGraph } from "@/lib/navigation-graph";
import { mapEdgePath, mapPoint } from "@/lib/map-projection";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";
import type { IslandId } from "@/types";
import { DestinationIcon } from "./DestinationIcon";

export function LightweightWorld({ state,motion,onSelect }: { state:JourneyState; motion:RefObject<JourneyMotion>; onSelect:(id:IslandId) => void }) {
  const boat = useRef<SVGGElement>(null);
  const enabled = state.phase === "SELECTING_DESTINATION";
  useEffect(() => {
    let frame = 0;
    const move = () => { const point = mapPoint(motion.current.position); boat.current?.setAttribute("transform","translate(" + point.x + " " + point.y + ")"); frame = requestAnimationFrame(move); };
    frame = requestAnimationFrame(move); return () => cancelAnimationFrame(frame);
  }, [motion]);
  return <div className="scene-fallback lightweight-world">
    <svg viewBox="0 0 640 340" className="lightweight-archipelago" aria-label="Quần đảo EIU ở chế độ nhẹ" role="group">
      <defs><linearGradient id="light-rock" x2="0" y2="1"><stop stopColor="#bacac3" /><stop offset="1" stopColor="#789aaa" /></linearGradient></defs>
      {navigationGraph.edges.filter(edge => edge.mapLane).map((edge) => <path key={edge.id} d={mapEdgePath(edge)} fill="none" stroke="#8cc7d5" strokeWidth="2.5" opacity="0.55" />)}
      {[campus,...destinations].map((island) => {
        const point = mapPoint(island.position), radius = island.id === "campus" ? 38 : 18;
        return <g key={island.id} transform={"translate(" + point.x + " " + point.y + ")"} role="button" tabIndex={enabled ? 0 : -1} aria-label={"Ghé đảo " + island.title} aria-disabled={!enabled} onClick={() => { if (enabled) onSelect(island.id); }} onKeyDown={(event) => { if (enabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(island.id); } }} className="lightweight-island">
          <path d={"M " + -radius + " 0 L " + -radius * 0.45 + " " + radius * 0.7 + " L " + radius * 0.3 + " " + radius * 0.9 + " L " + radius + " 0 Z"} fill="url(#light-rock)" />
          <ellipse rx={radius} ry={radius * 0.4} fill={state.currentIsland === island.id ? "#b9c694" : "#a9bd8c"} />
          {island.id === "campus" ? <g><path d="M-24-4v-17M-9 0v-20M7 0v-20M23-3v-18" stroke="#f9f6e7" strokeWidth="3" /><path d="M-29-25Q0-11 29-25v6Q0-7-29-19Z" fill="#fff9e9" /><text y="-28" textAnchor="middle" fill="#073b71" fontSize="10" fontFamily="Georgia">EIU</text></g> : <g transform="translate(-8 -16)" color="#355d70"><DestinationIcon id={island.id} size={16} /></g>}
          <text y={radius * 0.9 + 13} textAnchor="middle" fill="#224e69" fontSize="8" fontFamily="Arial">{island.title}</text>
        </g>;
      })}
      <g ref={boat} aria-hidden="true"><path d="M-6 3 0 7 7 3Z" fill="#6d573c" /><path d="M0-13V2H7Z" fill="#fff8e5" /><path d="M-1-11-6 1h5Z" fill="#2d7195" /></g>
    </svg>
    <span className="fallback-caption">Chế độ nhẹ · Dùng Hải đồ hoặc chạm vào đảo</span>
  </div>;
}
