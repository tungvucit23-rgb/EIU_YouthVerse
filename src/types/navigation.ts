import type { IslandId, Vector3Tuple } from "./index";

export interface NavigationNode { id: string; position: Vector3Tuple; kind: "channel" | "island"; islandId?: IslandId; heading?:number }
export interface ConnectionSpec { from: string; to: string; bend?: number; width?: number; c1?: Vector3Tuple; c2?: Vector3Tuple;directed?:boolean }
export interface NavigationEdge {
  id: string; from: string; to: string;
  start: Vector3Tuple; end: Vector3Tuple; c1: Vector3Tuple; c2: Vector3Tuple;
  width: number; length: number; arcLengths: number[];
  mapLane?:boolean;
}
export interface NavigationGraph { nodes: Record<string, NavigationNode>; edges: NavigationEdge[]; adjacency: Record<string, { node: string; edge: number }[]> }
export interface NavigationPlan { from: IslandId; to: IslandId; nodeIds: string[]; edgeIds: string[]; segments: NavigationEdge[]; distance: number; duration: number }
export interface RouteSample { position: Vector3Tuple; tangent: Vector3Tuple; edgeIndex: number }
