"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Sailboat } from "lucide-react";
import { getIsland } from "@/data/islands";
import type { JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";
import type { NavigationPlan } from "@/types/navigation";

export function JourneyStatus({ state,plan,motion }: { state:JourneyState; plan:NavigationPlan; motion:RefObject<JourneyMotion> }) {
  const progress = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const animate = () => { if (progress.current) progress.current.style.transform = "scaleX(" + motion.current.progress + ")"; frame = requestAnimationFrame(animate); };
    frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame);
  }, [motion]);
  const island = getIsland(state.destination ?? state.currentIsland);
  const label = state.phase === "ROUTE_PLANNING" ? "Chuẩn bị hành trình đến" : state.phase === "DOCKING" ? "Đang cập bến" : state.phase === "APPROACHING" ? "Đang đến gần" : state.phase === "ARRIVED" ? "Đã cập bến" : "Căng buồm đến";
  return <div className="sailing-status" role="status"><Sailboat size={19} strokeWidth={1.4} /><div><span>{label} {island.title}</span><small>{plan.segments.length > 1 ? "Hải trình " + plan.segments.length + " chặng · " : ""}{state.phase === "DOCKING" ? "Thuyền đang giảm tốc" : "Theo dòng nước trên mây"}</small></div><span ref={progress} className="journey-progress" /></div>;
}
