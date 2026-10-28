import {worldSettings} from "@/data/world-settings";
import type {Vector3Tuple,WorldIsland} from "@/types";
import {transformWorldPoint} from "./world-transform";
/** Conservative asset bounds for observations; these never decide world visibility or camera focus. */
export function islandBoundsPoints(island:WorldIsland):Vector3Tuple[] {
 const {min,max} = island.viewBounds;
 return [min[0],max[0]].flatMap(x => [min[1],max[1]].flatMap(y => [min[2],max[2]].map(z => transformWorldPoint(island.position,island.scale,island.rotation,[x,y,z]))));
}
export function boatBoundsPoints(p:Vector3Tuple):Vector3Tuple[] {
 const radius = 2.6 * worldSettings.boatScale;
 return [-radius,radius].flatMap(x => [-.6 * worldSettings.boatScale,4.1 * worldSettings.boatScale].flatMap(y => [-radius,radius].map((z):Vector3Tuple => [p[0] + x,p[1] + y,p[2] + z])));
}
