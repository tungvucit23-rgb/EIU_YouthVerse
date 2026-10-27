import type { DestinationId } from "@/types";

export interface ScreenRect { x:number;y:number;width:number;height:number }
export interface IslandLabelCandidate { id:DestinationId; x:number;y:number;width:number;height:number;priority:number;distance:number }
export interface IslandLabelPlacement { id:DestinationId; rect:ScreenRect }
export function rectanglesOverlap(a:ScreenRect,b:ScreenRect,gap = 0) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

/** Resolve labels in screen space, independently of world rendering and camera focus. */
export function layoutIslandLabels(candidates:IslandLabelCandidate[],viewport:{width:number;height:number},reserved:ScreenRect[],limit:number):IslandLabelPlacement[] {
  const placed:IslandLabelPlacement[] = [];
  const ordered = [...candidates].sort((a,b) => a.priority - b.priority || a.distance - b.distance || a.id.localeCompare(b.id));
  for (const candidate of ordered) {
    if (placed.length >= limit) break;
    const {width,height,x,y} = candidate;
    const offsets = [[-width / 2,8],[-width / 2,-height - 10],[12,4],[-width - 12,4],[-width / 2,height + 16]];
    for (const [dx,dy] of offsets) {
      const rect = {x:x + dx,y:y + dy,width,height};
      if (rect.x < 12 || rect.y < 12 || rect.x + width > viewport.width - 12 || rect.y + height > viewport.height - 12) continue;
      if (reserved.some((other) => rectanglesOverlap(rect,other,8)) || placed.some((other) => rectanglesOverlap(rect,other.rect,7))) continue;
      placed.push({id:candidate.id,rect}); break;
    }
  }
  return placed;
}
