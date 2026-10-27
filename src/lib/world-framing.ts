import { campus, destinations, getIsland, islands } from "@/data/islands";
import { worldSettings } from "@/data/world-settings";
import { samplePlan } from "./navigation-graph";
import type { NavigationPlan } from "@/types/navigation";
import type { IslandId, Vector3Tuple, WorldIsland } from "@/types";
import type { JourneyState } from "./journey-machine";
import { transformWorldPoint } from "./world-transform";

export interface Viewport { width:number; height:number }
export interface SafeRect { left:number; top:number; right:number; bottom:number }
export interface CameraFrame { target:Vector3Tuple; zoom:number; safeRect:SafeRect }
const dot = (a:Vector3Tuple,b:Vector3Tuple) => a.reduce((sum,value,i) => sum + value * b[i],0);
const normalize = (v:Vector3Tuple):Vector3Tuple => { const length = Math.hypot(...v); return v.map((n) => n / length) as Vector3Tuple; };
const direction = normalize(worldSettings.cameraOffset);
export const cameraRight = normalize([direction[2],0,-direction[0]]);
export const cameraUp:Vector3Tuple = [direction[1] * cameraRight[2],direction[2] * cameraRight[0] - direction[0] * cameraRight[2],-direction[1] * cameraRight[0]];

export function islandBoundsPoints(island:WorldIsland):Vector3Tuple[] {
  const {min,max} = island.viewBounds;
  return [min[0],max[0]].flatMap((x) => [min[1],max[1]].flatMap((y) => [min[2],max[2]].map((z) => transformWorldPoint(island.position,island.scale,island.rotation,[x,y,z]))));
}
export function boatBoundsPoints(p:Vector3Tuple):Vector3Tuple[] {
  const radius = 2.6 * worldSettings.boatScale;
  return [-radius,radius].flatMap((x) => [-.6 * worldSettings.boatScale,4.1 * worldSettings.boatScale].flatMap((y) => [-radius,radius].map((z):Vector3Tuple => [p[0] + x,p[1] + y,p[2] + z])));
}
/** Camera landmarks only. Rendering never consults these IDs. */
export function heroIslandIds(mobile:boolean):IslandId[] {
  const nearby = destinations.filter((island) => island.nearOnIntro);
  return ["campus",...(mobile ? nearby.filter((island) => island.id !== "events").slice(0,3) : nearby.slice(0,5)).map((island) => island.id)];
}
const clamp = (t:number) => Math.max(0,Math.min(1,t));
const smooth = (t:number) => { const value = clamp(t); return value * value * (3 - 2 * value); };
const lerpPoint = (a:Vector3Tuple,b:Vector3Tuple,t:number):Vector3Tuple => a.map((value,i) => value + (b[i] - value) * t) as Vector3Tuple;
const landmark = (island:WorldIsland):Vector3Tuple => [island.position[0],island.position[1] + .6 * island.scale,island.position[2]];
const distance = (a:Vector3Tuple,b:Vector3Tuple) => Math.hypot(a[0] - b[0],a[2] - b[2]);

/** Continuous distance weights guide the camera; none of them alter scene visibility. */
function neighborhoodPoints(position:Vector3Tuple,reach:number):Vector3Tuple[] {
  const nearest = [...islands].sort((a,b) => distance(a.position,position) - distance(b.position,position))[0];
  const points:Vector3Tuple[] = [landmark(nearest)];
  for (const island of islands) {
    const weight = 1 - smooth((distance(position,island.position) - 5) / (reach - 5));
    if (weight > 0) points.push(...islandBoundsPoints(island).map((point) => lerpPoint(position,point,weight)));
  }
  return points;
}
function dockedNeighbor(island:WorldIsland,mobile:boolean):Vector3Tuple[] {
  const neighbor = [...islands].filter((other) => other.id !== island.id).sort((a,b) => distance(a.position,island.position) - distance(b.position,island.position))[0];
  return distance(neighbor.position,island.position) < (mobile ? 10 : 22) ? [landmark(neighbor)] : [];
}
export function cameraFocusPoints(state:JourneyState,position:Vector3Tuple,progress:number,mobile:boolean,plan?:NavigationPlan):Vector3Tuple[] {
  const focus = state.phase === "EXPLORING_CONTENT" || state.phase === "ARRIVED";
  const hero = state.phase === "IDLE" || state.currentIsland === "campus" && ["SELECTING_DESTINATION","ROUTE_PLANNING"].includes(state.phase);
  const points = boatBoundsPoints(position);
  if (hero) return [...points,...heroIslandIds(mobile).flatMap((id) => islandBoundsPoints(getIsland(id)))];
  if (focus) {
    const island = getIsland(state.currentIsland);
    points.push(...islandBoundsPoints(island));
    points.push(...dockedNeighbor(island,mobile));
    return points;
  }
  if (["SAILING","APPROACHING","DOCKING"].includes(state.phase) && plan?.segments.length) {
    const ahead = samplePlan(plan,Math.min(1,progress + (mobile ? 4.5 : 7) / plan.distance)).position;
    points.push(ahead,...neighborhoodPoints(position,mobile ? 12 : 18));
    return points;
  }
  const current = getIsland(state.currentIsland);
  return [...points,...islandBoundsPoints(current),...dockedNeighbor(current,mobile),...neighborhoodPoints(position,mobile ? 12 : 18)];
}

export function fitOrthographicFrame(points:Vector3Tuple[],viewport:Viewport,safeRect:SafeRect,maxZoom:number,depthAnchor:Vector3Tuple = campus.position):CameraFrame {
  const xs = points.map((p) => dot(p,cameraRight)),ys = points.map((p) => dot(p,cameraUp));
  const minX = Math.min(...xs),maxX = Math.max(...xs),minY = Math.min(...ys),maxY = Math.max(...ys);
  const zoom = Math.min(maxZoom,(safeRect.right - safeRect.left) / Math.max(1,maxX - minX),(safeRect.bottom - safeRect.top) / Math.max(1,maxY - minY));
  const x = (minX + maxX) / 2 - ((safeRect.left + safeRect.right) / 2 - viewport.width / 2) / zoom;
  const y = (minY + maxY) / 2 + ((safeRect.top + safeRect.bottom) / 2 - viewport.height / 2) / zoom;
  const depth = dot(depthAnchor,direction);
  return {target:cameraRight.map((value,i) => value * x + cameraUp[i] * y + direction[i] * depth) as Vector3Tuple,zoom,safeRect};
}
export function projectWorldToScreen(point:Vector3Tuple,frame:CameraFrame,viewport:Viewport) {
  const relative = point.map((value,i) => value - frame.target[i]) as Vector3Tuple;
  return {x:viewport.width / 2 + dot(relative,cameraRight) * frame.zoom,y:viewport.height / 2 - dot(relative,cameraUp) * frame.zoom};
}
export function getCameraFrame(state:JourneyState,position:Vector3Tuple,progress:number,viewport:Viewport,mobile:boolean,plan?:NavigationPlan):CameraFrame {
  const {width,height} = viewport;
  const focus = state.phase === "EXPLORING_CONTENT" || state.phase === "ARRIVED";
  const hero = state.phase === "IDLE" || state.currentIsland === "campus" && ["SELECTING_DESTINATION","ROUTE_PLANNING"].includes(state.phase);
  const points = cameraFocusPoints(state,position,progress,mobile,plan);
  const safeRect:SafeRect = focus ? mobile
    // Match the mobile sheet's 72svh/650px maximum, with its 10px bottom inset and camera breathing room.
    ? {left:18,top:94,right:width - 18,bottom:Math.max(118,height - Math.min(height * .72,650) - 34)}
    : {left:42,top:110,right:width - Math.min(380,width * .33) - width * .045 - 42,bottom:height - 95}
    : mobile ? {left:18,top:hero ? Math.max(340,height * .40) : 135,right:width - 18,bottom:height - 132}
    : {left:width * (hero ? .20 : .08),top:Math.max(110,height * .125),right:width * .96,bottom:height - 105};
  const maxZoom = focus ? mobile ? 48 : Math.min(width / 18,height / 12.5) : hero ? Math.min(width / (mobile ? 18 : 25.5),height / 16.5) : Math.min(width / (mobile ? 15 : 24),height / 15);
  return fitOrthographicFrame(points,viewport,safeRect,maxZoom,hero ? campus.position : position);
}
