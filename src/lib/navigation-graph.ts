import {navigationPoses,mapLanePairs} from "@/data/navigation";
import {headingRoute} from "./heading-routes";
import {ARC_SAMPLES,cubicPoint,measureEdge} from "./route-geometry";
import {createTravelTiming} from "./travel-timing";
import type {IslandId,Vector3Tuple} from "@/types";
import type {ConnectionSpec,NavigationEdge,NavigationGraph,NavigationNode,NavigationPlan,RouteSample} from "@/types/navigation";
export {cubicPoint} from "./route-geometry";
const distance = (a:Vector3Tuple,b:Vector3Tuple) => Math.hypot(...a.map((n,k) => n - b[k]));

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
    if (!connection.directed) adjacency[connection.to].push({ node: connection.from, edge: index });
    return edge;
  });
  return { nodes: registry, edges, adjacency };
}


function comfortGraph():NavigationGraph {
 const nodes:NavigationGraph["nodes"] = Object.fromEntries(navigationPoses.map(n => [n.id,n]));
 const edges:NavigationEdge[] = [],adjacency:NavigationGraph["adjacency"] = Object.fromEntries(navigationPoses.map(n => [n.id,[]]));
 for(const from of navigationPoses) for(const to of navigationPoses.filter(n => n.kind === "island" && n.id !== from.id)) {
  const key = from.id + ">" + to.id;
  const curves = headingRoute({position:from.position,heading:from.heading!},{position:to.position,heading:to.heading!});
  curves.forEach((curve,k) => {
   const a = k ? key + ":" + k + ":channel" : from.id,b = k === curves.length - 1 ? to.id : key + ":" + (k + 1) + ":channel";
   nodes[a] ??= {id:a,kind:"channel",position:curve.start};nodes[b] ??= {id:b,kind:"channel",position:curve.end};adjacency[a] ??= [];adjacency[b] ??= [];
   const edge = {...curve,id:key + ":" + k,from:a,to:b,mapLane:mapLanePairs.has(key)};
   adjacency[a].push({node:b,edge:edges.length});edges.push(edge);
  });
 }
 return {nodes,edges,adjacency};
}
export const navigationGraph = comfortGraph();
export function planRoute(from:IslandId,to:IslandId,graph:NavigationGraph = navigationGraph,startNode:string = from):NavigationPlan {
 if(!graph.nodes[startNode] || !graph.nodes[to]) throw new Error("Unknown route endpoint");
 if(startNode === to) return {from,to,nodeIds:[from],edgeIds:[],segments:[],distance:0,duration:0,timing:createTravelTiming([])};
 const costs:Record<string,number> = {[startNode]:0},previous:Record<string,{node:string;edge:number}> = {},pending = new Set(Object.keys(graph.nodes));
 while(pending.size) {
  let current:string|null = null;for(const id of pending) if(Number.isFinite(costs[id]) && (current === null || costs[id] < costs[current])) current = id;
  if(current === null) break;pending.delete(current);if(current === to) break;
  for(const n of graph.adjacency[current]) {const value = costs[current] + graph.edges[n.edge].length;if(value < (costs[n.node] ?? Infinity)){costs[n.node] = value;previous[n.node] = {node:current,edge:n.edge};}}
 }
 if(!Number.isFinite(costs[to])) throw new Error("No connected route from " + from + " to " + to);
 const segments:NavigationEdge[] = [],nodeIds:string[] = [to];let current:string = to;
 while(current !== startNode){const step = previous[current],edge = graph.edges[step.edge];segments.unshift(edge.from === step.node ? edge : measureEdge({...edge,from:edge.to,to:edge.from,start:edge.end,end:edge.start,c1:edge.c2,c2:edge.c1,arcLengths:[]}));current = step.node;nodeIds.unshift(current);}
 const routeDistance = segments.reduce((n,e) => n + e.length,0);
 const timing = createTravelTiming(segments);
 return {from,to,nodeIds,segments,edgeIds:segments.map(e => e.id),distance:routeDistance,duration:timing.times.at(-1)!,timing};
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
