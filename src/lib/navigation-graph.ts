import { islands } from "@/data/islands";
import { channelConnections, channelNodes } from "@/data/navigation";
import { worldSettings } from "@/data/world-settings";
import type { IslandId, Vector3Tuple } from "@/types";
import type { ConnectionSpec, NavigationEdge, NavigationGraph, NavigationNode, NavigationPlan, RouteSample } from "@/types/navigation";

const ARC_SAMPLES = 64;
const distance = (a: Vector3Tuple, b: Vector3Tuple) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function cubicPoint(edge: NavigationEdge, t: number, target: Vector3Tuple) {
  const s = 1 - t;
  for (let axis = 0; axis < 3; axis++) target[axis] = s * s * s * edge.start[axis] + 3 * s * s * t * edge.c1[axis] + 3 * s * t * t * edge.c2[axis] + t * t * t * edge.end[axis];
  return target;
}

function measureEdge(edge: NavigationEdge) {
  const point: Vector3Tuple = [0, 0, 0];
  const previous: Vector3Tuple = [...edge.start];
  edge.arcLengths = [0];
  let length = 0;
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    cubicPoint(edge, i / ARC_SAMPLES, point);
    length += distance(point, previous);
    edge.arcLengths.push(length);
    for (let axis = 0; axis < 3; axis++) previous[axis] = point[axis];
  }
  edge.length = length;
  return edge;
}

export function buildGraph(nodes: NavigationNode[], connections: ConnectionSpec[]): NavigationGraph {
  const registry = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const adjacency: NavigationGraph["adjacency"] = Object.fromEntries(nodes.map((node) => [node.id, []]));
  const edges = connections.map((connection, index) => {
    const start = registry[connection.from]?.position;
    const end = registry[connection.to]?.position;
    if (!start || !end) throw new Error("Unknown navigation connection: " + connection.from + " / " + connection.to);
    const length = Math.max(0.001, distance(start, end));
    const bend = connection.bend ?? Math.min(0.8, length * 0.1);
    const perpendicular: Vector3Tuple = [-(end[2] - start[2]) / length * bend, 0, (end[0] - start[0]) / length * bend];
    const control = (fraction: number): Vector3Tuple => [start[0] + (end[0] - start[0]) * fraction + perpendicular[0], start[1] + (end[1] - start[1]) * fraction, start[2] + (end[2] - start[2]) * fraction + perpendicular[2]];
    const edge = measureEdge({ id: [connection.from, connection.to].sort().join("~"), from: connection.from, to: connection.to, start, end, c1: connection.c1 ?? control(0.33), c2: connection.c2 ?? control(0.67), width: connection.width ?? 0.5, length: 0, arcLengths: [] });
    adjacency[connection.from].push({ node: connection.to, edge: index });
    adjacency[connection.to].push({ node: connection.from, edge: index });
    return edge;
  });
  return { nodes: registry, edges, adjacency };
}

const islandNodes: NavigationNode[] = islands.map((island) => ({ id: island.id, position: island.dockingPoint, kind: "island", islandId: island.id }));
const dockConnections: ConnectionSpec[] = islands.flatMap((island) => island.connections.map((channel) => ({
  from: channel, to: island.id, bend: 0, width: island.id === "campus" ? 0.52 : 0.46,
  c2: [island.dockingPoint[0] - Math.sin(island.dockHeading) * 1.1, island.dockingPoint[1], island.dockingPoint[2] - Math.cos(island.dockHeading) * 1.1] as Vector3Tuple,
})));
export const navigationGraph = buildGraph([...islandNodes, ...channelNodes], [...channelConnections, ...dockConnections]);

export function planRoute(from: IslandId, to: IslandId, graph: NavigationGraph = navigationGraph,startNode:string = from): NavigationPlan {
  if (!graph.nodes[startNode] || !graph.nodes[to]) throw new Error("Unknown route endpoint");
  if (startNode === to) return { from, to, nodeIds: [from], edgeIds: [], segments: [], distance: 0, duration: 0 };
  const unvisited = new Set(Object.keys(graph.nodes));
  const costs: Record<string, number> = { [startNode]: 0 };
  const previous: Record<string, { node: string; edge: number }> = {};
  while (unvisited.size) {
    let closest: string | null = null;
    for (const id of unvisited) if (Number.isFinite(costs[id]) && (closest === null || costs[id] < costs[closest])) closest = id;
    if (closest === null) break;
    unvisited.delete(closest);
    if (closest === to) break;
    for (const neighbor of graph.adjacency[closest]) {
      const candidate = costs[closest] + graph.edges[neighbor.edge].length;
      if (candidate < (costs[neighbor.node] ?? Infinity)) { costs[neighbor.node] = candidate; previous[neighbor.node] = { node: closest, edge: neighbor.edge }; }
    }
  }
  if (!Number.isFinite(costs[to])) throw new Error("No connected route from " + from + " to " + to);
  const nodeIds: string[] = [to];
  const segments: NavigationEdge[] = [];
  let cursor: string = to;
  while (cursor !== startNode) {
    const step = previous[cursor];
    const edge = graph.edges[step.edge];
    segments.unshift(edge.from === step.node ? { ...edge, arcLengths:[...edge.arcLengths] } : measureEdge({ ...edge, from: edge.to, to: edge.from, start: edge.end, end: edge.start, c1: edge.c2, c2: edge.c1, arcLengths: [] }));
    cursor = step.node;
    nodeIds.unshift(cursor);
  }
  // Share horizontal junction tangents and cap the grade; a near-U-turn must not become a vertical water sheet.
  for (let i = 0; i < segments.length - 1; i++) {
    const a = segments[i], b = segments[i + 1], junction = a.end;
    const incoming = junction.map((value,axis) => value - a.c2[axis]) as Vector3Tuple;
    const outgoing = b.c1.map((value,axis) => value - junction[axis]) as Vector3Tuple;
    const inLength = Math.hypot(incoming[0],incoming[2]) || 1, outLength = Math.hypot(outgoing[0],outgoing[2]) || 1;
    const direction:Vector3Tuple = [incoming[0] / inLength + outgoing[0] / outLength,0,incoming[2] / inLength + outgoing[2] / outLength];
    const magnitude = Math.hypot(...direction) || 1;
    const handle = Math.min(2.2,a.length * 0.3,b.length * 0.3);
    const slope = Math.max(-.18,Math.min(.18,(incoming[1] / inLength + outgoing[1] / outLength) * .5));
    const tangent:Vector3Tuple = [direction[0] / magnitude,slope,direction[2] / magnitude];
    a.c2 = junction.map((value,axis) => value - tangent[axis] * handle) as Vector3Tuple;
    b.c1 = junction.map((value,axis) => value + tangent[axis] * handle) as Vector3Tuple;
  }
  segments.forEach(measureEdge);
  const routeDistance = segments.reduce((total,segment) => total + segment.length,0);
  return { from, to, nodeIds, edgeIds: segments.map((segment) => segment.id), segments, distance: routeDistance, duration: Math.min(worldSettings.maxSailingSeconds, Math.max(worldSettings.minSailingSeconds, routeDistance / 9 + 2)) };
}

export const planLaunchRoute = (to:IslandId) => planRoute("campus",to,navigationGraph,"launch-channel");

export function samplePlanInto(plan: NavigationPlan, progress: number, target: RouteSample) {
  if (!plan.segments.length) {
    const point = navigationGraph.nodes[plan.to].position;
    for (let axis = 0; axis < 3; axis++) { target.position[axis] = point[axis]; target.tangent[axis] = axis === 2 ? -1 : 0; }
    target.edgeIndex = 0;
    return target;
  }
  let remaining = Math.min(1, Math.max(0, progress)) * plan.distance;
  let index = 0;
  while (index < plan.segments.length - 1 && remaining > plan.segments[index].length) { remaining -= plan.segments[index].length; index++; }
  const edge = plan.segments[index];
  let sample = 1;
  while (sample < edge.arcLengths.length - 1 && edge.arcLengths[sample] < remaining) sample++;
  const local = (remaining - edge.arcLengths[sample - 1]) / Math.max(0.00001, edge.arcLengths[sample] - edge.arcLengths[sample - 1]);
  const t = Math.min(1, Math.max(0, (sample - 1 + local) / ARC_SAMPLES));
  cubicPoint(edge, t, target.position);
  const s = 1 - t;
  for (let axis = 0; axis < 3; axis++) target.tangent[axis] = 3 * s * s * (edge.c1[axis] - edge.start[axis]) + 6 * s * t * (edge.c2[axis] - edge.c1[axis]) + 3 * t * t * (edge.end[axis] - edge.c2[axis]);
  const magnitude = Math.hypot(...target.tangent) || 1;
  for (let axis = 0; axis < 3; axis++) target.tangent[axis] /= magnitude;
  target.edgeIndex = index;
  return target;
}

export function samplePlan(plan: NavigationPlan, progress: number) { return samplePlanInto(plan, progress, { position: [0, 0, 0], tangent: [0, 0, -1], edgeIndex: 0 }); }
export function easeSailing(value: number) { const t = Math.min(1, Math.max(0, value)); return t * t * t * (t * (t * 6 - 15) + 10); }
