import type {NavigationEdge,TravelTiming} from "@/types/navigation";
import {worldSettings} from "@/data/world-settings";

/** Speed follows path curvature: brisk straights, bounded turns and a slow final berth. */
export function createTravelTiming(edges:NavigationEdge[]):TravelTiming {
 if(!edges.length) return {distances:[0],times:[0],speeds:[0]};
 const settings = worldSettings.navigation,total = edges.reduce((n,e) => n + e.length,0),distances:number[] = [],speeds:number[] = [];
 let offset = 0;
 for(const edge of edges) {
  const count = edge.arcLengths.length - 1;
  for(let j = 0;j <= count;j++) {
   const t = j / count,s = 1 - t,d = offset + edge.arcLengths[j];
   const derivative = [0,2].map(k => 3 * s * s * (edge.c1[k] - edge.start[k]) + 6 * s * t * (edge.c2[k] - edge.c1[k]) + 3 * t * t * (edge.end[k] - edge.c2[k]));
   const second = [0,2].map(k => 6 * s * (edge.c2[k] - 2 * edge.c1[k] + edge.start[k]) + 6 * t * (edge.end[k] - 2 * edge.c2[k] + edge.c1[k]));
   const curvature = Math.abs(derivative[0] * second[1] - derivative[1] * second[0]) / Math.max(1e-12,Math.hypot(...derivative) ** 3);
   const approachLimit = Math.sqrt(settings.dockingSpeed ** 2 + 2 * settings.acceleration * Math.max(0,total - d - settings.dockingDistance));
   const limit = Math.min(settings.maxSpeed,curvature > 1e-7 ? settings.maxTurnRate / curvature : settings.maxSpeed,approachLimit);
   if(distances.length && d - distances.at(-1)! < 1e-7) speeds[speeds.length - 1] = Math.min(speeds.at(-1)!,limit);
   else {distances.push(d);speeds.push(limit);}
  }
  offset += edge.length;
 }
 speeds[0] = 0;speeds[speeds.length - 1] = 0;
 for(let i = 1;i < speeds.length;i++) speeds[i] = Math.min(speeds[i],Math.sqrt(speeds[i - 1] ** 2 + 2 * settings.acceleration * (distances[i] - distances[i - 1])));
 for(let i = speeds.length - 2;i >= 0;i--) speeds[i] = Math.min(speeds[i],Math.sqrt(speeds[i + 1] ** 2 + 2 * settings.acceleration * (distances[i + 1] - distances[i])));
 const times = [0];for(let i = 1;i < distances.length;i++) times.push(times[i - 1] + 2 * (distances[i] - distances[i - 1]) / (speeds[i - 1] + speeds[i]));
 const stretch = Math.max(1,worldSettings.minSailingSeconds / times.at(-1)!);
 return {distances,times:times.map(t => t * stretch),speeds:speeds.map(v => v / stretch)};
}
function interval(values:number[],value:number) {
 let low = 0,high = values.length - 1;while(high - low > 1){const mid = (low + high) >>> 1;if(values[mid] <= value) low = mid;else high = mid;}return low;
}
export function sampleTravelTiming(timing:TravelTiming,elapsed:number) {
 const {times,distances,speeds} = timing,total = distances.at(-1)!;
 if(!total || elapsed >= times.at(-1)!) return {progress:1,speed:0};
 if(elapsed <= 0) return {progress:0,speed:0};
 const i = interval(times,elapsed),dt = times[i + 1] - times[i],local = elapsed - times[i],acceleration = (speeds[i + 1] - speeds[i]) / dt;
 const distance = distances[i] + speeds[i] * local + .5 * acceleration * local * local;
 return {progress:Math.max(0,Math.min(1,distance / total)),speed:Math.max(0,speeds[i] + acceleration * local)};
}
/** Exact milestone time, used by QA and compatible with the actual route speed profile. */
export function elapsedAtProgress(timing:TravelTiming,progress:number) {
 if(progress <= 0) return 0;if(progress >= 1) return timing.times.at(-1)!;
 const target = progress * timing.distances.at(-1)!,i = interval(timing.distances,target),distance = target - timing.distances[i];
 const dt = timing.times[i + 1] - timing.times[i],a = (timing.speeds[i + 1] - timing.speeds[i]) / dt;
 const finalSpeed = Math.sqrt(Math.max(0,timing.speeds[i] ** 2 + 2 * a * distance));
 return timing.times[i] + (distance ? 2 * distance / (timing.speeds[i] + finalSpeed) : 0);
}
