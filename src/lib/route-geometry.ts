import type {Vector3Tuple} from "@/types";
import type {NavigationEdge} from "@/types/navigation";
export const ARC_SAMPLES = 64;
export function cubicPoint(edge:NavigationEdge,t:number,target:Vector3Tuple) {
 const s = 1 - t;
 for(let axis = 0;axis < 3;axis++) target[axis] = s ** 3 * edge.start[axis] + 3 * s * s * t * edge.c1[axis] + 3 * s * t * t * edge.c2[axis] + t ** 3 * edge.end[axis];
 return target;
}
export function measureEdge(edge:NavigationEdge) {
 const point:Vector3Tuple = [0,0,0],previous:Vector3Tuple = [...edge.start];let length = 0;edge.arcLengths = [0];
 for(let i = 1;i <= ARC_SAMPLES;i++){cubicPoint(edge,i / ARC_SAMPLES,point);length += Math.hypot(...point.map((n,k) => n - previous[k]));edge.arcLengths.push(length);previous.splice(0,3,...point);}
 edge.length = length;return edge;
}
