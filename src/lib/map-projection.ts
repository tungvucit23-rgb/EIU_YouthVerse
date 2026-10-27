import { islands } from "@/data/islands";
import { navigationGraph } from "./navigation-graph";
import type { Vector3Tuple } from "@/types";
import type { NavigationEdge } from "@/types/navigation";

export const MAP_WIDTH = 640,MAP_HEIGHT = 340;
const anchors = [...islands.flatMap((island) => [island.position,island.dockingPoint]),...navigationGraph.edges.flatMap((edge) => [edge.start,edge.c1,edge.c2,edge.end])];
export const mapBounds = {minX:Math.min(...anchors.map((p) => p[0])),maxX:Math.max(...anchors.map((p) => p[0])),minZ:Math.min(...anchors.map((p) => p[2])),maxZ:Math.max(...anchors.map((p) => p[2]))};
const padding = 46;
const scale = Math.min((MAP_WIDTH - padding * 2) / (mapBounds.maxX - mapBounds.minX),(MAP_HEIGHT - padding * 2) / (mapBounds.maxZ - mapBounds.minZ));
const centerX = (mapBounds.minX + mapBounds.maxX) / 2,centerZ = (mapBounds.minZ + mapBounds.maxZ) / 2;
export function mapPoint(point:Vector3Tuple) { return {x:MAP_WIDTH / 2 + (point[0] - centerX) * scale,y:MAP_HEIGHT / 2 + (point[2] - centerZ) * scale}; }
export function unmapPoint(point:{x:number;y:number}):Vector3Tuple { return [centerX + (point.x - MAP_WIDTH / 2) / scale,0,centerZ + (point.y - MAP_HEIGHT / 2) / scale]; }
export function mapEdgePath(edge:NavigationEdge) {
  const a = mapPoint(edge.start),b = mapPoint(edge.c1),c = mapPoint(edge.c2),d = mapPoint(edge.end);
  return "M " + a.x + " " + a.y + " C " + b.x + " " + b.y + ", " + c.x + " " + c.y + ", " + d.x + " " + d.y;
}
