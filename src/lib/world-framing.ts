import { campus, destinations, getIsland, islands } from "@/data/islands";
import { worldSettings } from "@/data/world-settings";
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
export function heroIslandIds(mobile:boolean):IslandId[] { return ["campus",...destinations.filter((island) => island.nearOnIntro).slice(0,mobile ? 3 : 4).map((island) => island.id)]; }
export function stageIslandIds(state:JourneyState,mobile:boolean,progress:number):IslandId[] {
  if (state.phase === "EXPLORING_CONTENT" || state.phase === "ARRIVED") return [state.currentIsland];
  if (["SAILING","APPROACHING","DOCKING"].includes(state.phase) && state.destination) return [...(progress < .22 ? [state.origin] : []),...(progress > .5 ? [state.destination] : [])];
  if (state.currentIsland === "campus") return heroIslandIds(mobile);
  const current = getIsland(state.currentIsland);
  const nearby = islands.filter((island) => island.id !== current.id && Math.hypot(island.position[0] - current.position[0],island.position[2] - current.position[2]) < 12).sort((a,b) => Math.hypot(a.position[0] - current.position[0],a.position[2] - current.position[2]) - Math.hypot(b.position[0] - current.position[0],b.position[2] - current.position[2])).slice(0,2);
  return [current.id,...nearby.map((island) => island.id)];
}

export function fitOrthographicFrame(points:Vector3Tuple[],viewport:Viewport,safeRect:SafeRect,maxZoom:number):CameraFrame {
  const xs = points.map((p) => dot(p,cameraRight)),ys = points.map((p) => dot(p,cameraUp));
  const minX = Math.min(...xs),maxX = Math.max(...xs),minY = Math.min(...ys),maxY = Math.max(...ys);
  const zoom = Math.min(maxZoom,(safeRect.right - safeRect.left) / Math.max(1,maxX - minX),(safeRect.bottom - safeRect.top) / Math.max(1,maxY - minY));
  const x = (minX + maxX) / 2 - ((safeRect.left + safeRect.right) / 2 - viewport.width / 2) / zoom;
  const y = (minY + maxY) / 2 + ((safeRect.top + safeRect.bottom) / 2 - viewport.height / 2) / zoom;
  const depth = dot(campus.position,direction);
  return {target:cameraRight.map((value,i) => value * x + cameraUp[i] * y + direction[i] * depth) as Vector3Tuple,zoom,safeRect};
}
export function projectWorldToScreen(point:Vector3Tuple,frame:CameraFrame,viewport:Viewport) {
  const relative = point.map((value,i) => value - frame.target[i]) as Vector3Tuple;
  return {x:viewport.width / 2 + dot(relative,cameraRight) * frame.zoom,y:viewport.height / 2 - dot(relative,cameraUp) * frame.zoom};
}
export function getCameraFrame(state:JourneyState,position:Vector3Tuple,progress:number,viewport:Viewport,mobile:boolean):CameraFrame {
  const {width,height} = viewport;
  const focus = state.phase === "EXPLORING_CONTENT" || state.phase === "ARRIVED";
  const hero = state.phase === "IDLE" || state.phase === "SELECTING_DESTINATION" && state.currentIsland === "campus" || state.phase === "ROUTE_PLANNING" && state.origin === "campus";
  let ids = stageIslandIds(state,mobile,progress);
  if (["SAILING","APPROACHING","DOCKING"].includes(state.phase) && state.destination && progress > .35 && !ids.includes(state.destination)) ids = [...ids,state.destination];
  const points = [...ids.flatMap((id) => islandBoundsPoints(getIsland(id))),...boatBoundsPoints(position)];
  const safeRect:SafeRect = focus ? mobile
    ? {left:18,top:94,right:width - 18,bottom:Math.max(218,height * .27)}
    : {left:42,top:110,right:width - Math.min(380,width * .33) - width * .045 - 42,bottom:height - 95}
    : mobile ? {left:18,top:hero ? Math.max(340,height * .40) : 255,right:width - 18,bottom:height - 132}
    : {left:width * .10,top:Math.max(110,height * .125),right:width * .96,bottom:height - 100};
  const maxZoom = focus ? mobile ? 48 : Math.min(width / 15,height / 9.5) : hero ? Math.min(width / (mobile ? 18 : 26),height / 16.5) : Math.min(width / (mobile ? 15 : 24),height / 15);
  return fitOrthographicFrame(points,viewport,safeRect,maxZoom);
}
