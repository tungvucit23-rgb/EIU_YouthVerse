import type {Vector3Tuple} from "@/types";
import type {NavigationEdge} from "@/types/navigation";
import {islands} from "@/data/islands";
import {worldSettings} from "@/data/world-settings";
import {cubicPoint,measureEdge} from "./route-geometry";

export interface RoutePose {position:Vector3Tuple;heading:number}
type Word = {types:string;lengths:number[]};
const tau = Math.PI * 2;
const mod = (n:number) => ((n % tau) + tau) % tau;
// CSC Dubins formulas adapted from Andrew Walker's MIT-licensed Dubins-Curves.
// See THIRD-PARTY-NOTICES.md. Cubic conversion, clearance and height profiles are local.
function words(start:RoutePose,end:RoutePose,r:number):Word[] {
 const dx = end.position[0] - start.position[0],dz = end.position[2] - start.position[2],d = Math.hypot(dx,dz) / r,theta = Math.atan2(dz,dx);
 const a = mod(Math.PI / 2 - start.heading - theta),b = mod(Math.PI / 2 - end.heading - theta);
 const sa = Math.sin(a),sb = Math.sin(b),ca = Math.cos(a),cb = Math.cos(b),cab = Math.cos(a - b),out:Word[] = [];
 let p2 = 2 + d * d - 2 * cab + 2 * d * (sa - sb);
 if(p2 >= 0){const v = Math.atan2(cb - ca,d + sa - sb);out.push({types:"LSL",lengths:[mod(v - a),Math.sqrt(p2),mod(b - v)]});}
 p2 = 2 + d * d - 2 * cab + 2 * d * (sb - sa);
 if(p2 >= 0){const v = Math.atan2(ca - cb,d - sa + sb);out.push({types:"RSR",lengths:[mod(a - v),Math.sqrt(p2),mod(v - b)]});}
 p2 = -2 + d * d + 2 * cab + 2 * d * (sa + sb);
 if(p2 >= 0){const p = Math.sqrt(p2),v = Math.atan2(-ca - cb,d + sa + sb) - Math.atan2(-2,p);out.push({types:"LSR",lengths:[mod(v - a),p,mod(v - b)]});}
 p2 = -2 + d * d + 2 * cab - 2 * d * (sa + sb);
 if(p2 >= 0){const p = Math.sqrt(p2),v = Math.atan2(ca + cb,d - sa - sb) - Math.atan2(2,p);out.push({types:"RSL",lengths:[mod(a - v),p,mod(b - v)]});}
 return out;
}
function line(a:Vector3Tuple,b:Vector3Tuple):NavigationEdge {
 return measureEdge({id:"",from:"",to:"",start:[...a],end:[...b],c1:a.map((n,k) => n + (b[k] - n) / 3) as Vector3Tuple,c2:a.map((n,k) => n + (b[k] - n) * 2 / 3) as Vector3Tuple,width:.52,length:0,arcLengths:[]});
}
export const straightRouteEdge = line;
function convert(start:RoutePose,word:Word,r:number) {
 const edges:NavigationEdge[] = [];let p:Vector3Tuple = [...start.position],theta = Math.PI / 2 - start.heading;
 for(let i = 0;i < 3;i++) {
  const value = word.lengths[i];if(value < 1e-7) continue;
  if(word.types[i] === "S") {const q:Vector3Tuple = [p[0] + Math.cos(theta) * value * r,p[1],p[2] + Math.sin(theta) * value * r];edges.push(line(p,q));p = q;continue;}
  const sign = word.types[i] === "L" ? 1 : -1,count = Math.ceil(value / (Math.PI / 4)),angle = value / count;
  for(let j = 0;j < count;j++) {
   const next = theta + sign * angle,cx = p[0] - sign * r * Math.sin(theta),cz = p[2] + sign * r * Math.cos(theta),h = 4 * r / 3 * Math.tan(angle / 4);
   const q:Vector3Tuple = [cx + sign * r * Math.sin(next),p[1],cz - sign * r * Math.cos(next)];
   edges.push(measureEdge({id:"",from:"",to:"",start:[...p],end:q,c1:[p[0] + Math.cos(theta) * h,p[1],p[2] + Math.sin(theta) * h],c2:[q[0] - Math.cos(next) * h,p[1],q[2] - Math.sin(next) * h],width:.52,length:0,arcLengths:[]}));p = q;theta = next;
  }
 }
 return edges;
}
export function pointIsNavigable(p:Vector3Tuple) {
 return islands.every(island => {const x = p[0] - island.position[0],z = p[2] - island.position[2],c = Math.cos(island.rotation),s = Math.sin(island.rotation),margin = worldSettings.navigation.clearance;
  return Math.hypot((x * c - z * s) / (island.shape.radius * island.shape.stretch[0] * island.scale * 1.1 + margin),(x * s + z * c) / (island.shape.radius * island.shape.stretch[1] * island.scale * 1.1 + margin)) > 1;
 });
}
const clear = (edges:NavigationEdge[]) => edges.every(e => {for(let i = 0,n = Math.max(24,Math.ceil(e.length * 4));i <= n;i++) if(!pointIsNavigable(cubicPoint(e,i / n,[0,0,0]))) return false;return true;});
const move = (p:RoutePose,d:number):RoutePose => ({position:[p.position[0] + Math.sin(p.heading) * d,p.position[1],p.position[2] + Math.cos(p.heading) * d],heading:p.heading});

function candidates(start:RoutePose,end:RoutePose,lead:number) {
 const a = move(start,lead),b = move(end,-lead),found:NavigationEdge[][] = [];
 for(const r of [worldSettings.navigation.turnRadius,8,10,12]) for(const word of words(a,b,r)) {
  const curves = convert(a,word,r),last = curves.at(-1);
  if(!last || Math.hypot(last.end[0] - b.position[0],last.end[2] - b.position[2]) > .001) continue;
  const edges = [...(lead ? [line(start.position,a.position)] : []),...curves,...(lead ? [line(b.position,end.position)] : [])];
  if(clear(edges)) found.push(edges);
 }
 return found;
}
/** Forward-only, heading-constrained lanes. Reverse trips are generated independently. */
export function headingRoute(start:RoutePose,end:RoutePose):NavigationEdge[] {
 const found = candidates(start,end,worldSettings.navigation.departureLead);
 if(!found.length) {
  // A safe outer pose is a real maneuver, never an in-place heading reset.
  for(const x of [-36,36]) for(const z of [26,-48]) {
   const gate:RoutePose = {position:[x,start.position[1],z],heading:Math.PI / 2};
   const first = candidates(start,gate,6).sort((a,b) => total(a) - total(b))[0],last = candidates(gate,end,6).sort((a,b) => total(a) - total(b))[0];
   if(first && last) found.push([...first,...last]);
  }
 }
 const result = found.sort((a,b) => total(a) - total(b))[0];if(!result) throw new Error("No clear heading-aware route");
 // Smooth elevation along total distance, with flat arrival/departure tangents.
 const length = total(result),dy = end.position[1] - start.position[1];let accumulated = 0;
 const height = (s:number) => {const t = s / length;return start.position[1] + dy * t ** 3 * (10 - 15 * t + 6 * t * t);};
 const slope = (s:number) => {const t = s / length;return dy * 30 * t * t * (1 - t) ** 2 / length;};
 for(const e of result) {const next = accumulated + e.length,h1 = Math.hypot(e.c1[0] - e.start[0],e.c1[2] - e.start[2]),h2 = Math.hypot(e.end[0] - e.c2[0],e.end[2] - e.c2[2]);e.start[1] = height(accumulated);e.end[1] = height(next);e.c1[1] = e.start[1] + slope(accumulated) * h1;e.c2[1] = e.end[1] - slope(next) * h2;measureEdge(e);accumulated = next;}
 result[0].start = [...start.position];result[result.length - 1].end = [...end.position];
 for(let i = 1;i < result.length;i++) result[i].start = [...result[i - 1].end];
 result.forEach(measureEdge);return result;
}
const total = (edges:NavigationEdge[]) => edges.reduce((n,e) => n + e.length,0);
