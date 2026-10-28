import {describe,expect,it} from "vitest";
import {allIslandIds,getIsland,HOME_BOAT_POSITION,islands} from "../../src/data/islands";
import {planRoute,planLaunchRoute,samplePlan,easeSailing,cubicPoint} from "../../src/lib/navigation-graph";
import {stepCameraYaw,wrappedAngle,preferredCameraYaw} from "../../src/lib/boat-camera";
import {worldSettings} from "../../src/data/world-settings";

const pairs = allIslandIds.flatMap(from => allIslandIds.filter(to => to !== from).map(to => ({from,to})));
describe("Phase 3 heading-aware lanes",() => {
 it.each(pairs)("$from -> $to: forward departure, continuous bounded-curvature route and exact berth",({from,to}) => {
  const plan = planRoute(from,to),start = getIsland(from),end = getIsland(to);
  expect(samplePlan(plan,0).position).toEqual(start.dockingPoint);
  samplePlan(plan,1).position.forEach((v,k) => expect(v).toBeCloseTo(end.dockingPoint[k],7));
  for(const [p,yaw] of [[0,start.dockHeading],[1,end.dockHeading]]) {const t = samplePlan(plan,p).tangent;expect(t[0] * Math.sin(yaw) + t[2] * Math.cos(yaw)).toBeGreaterThan(.99999);}
  for(const edge of plan.segments) for(let i = 0;i <= 32;i++) {
   const t = i / 32,s = 1 - t,p = cubicPoint(edge,t,[0,0,0]);
   for(const island of islands) {const dx = p[0] - island.position[0],dz = p[2] - island.position[2];expect(Math.hypot(dx / (island.shape.radius * island.shape.stretch[0] * island.scale * 1.1 + .69),dz / (island.shape.radius * island.shape.stretch[1] * island.scale * 1.1 + .69))).toBeGreaterThan(1);}
   const d = [0,2].map(k => 3 * s * s * (edge.c1[k] - edge.start[k]) + 6 * s * t * (edge.c2[k] - edge.c1[k]) + 3 * t * t * (edge.end[k] - edge.c2[k]));
   const dd = [0,2].map(k => 6 * s * (edge.c2[k] - 2 * edge.c1[k] + edge.start[k]) + 6 * t * (edge.end[k] - 2 * edge.c2[k] + edge.c1[k]));
   const curvature = Math.abs(d[0] * dd[1] - d[1] * dd[0]) / Math.hypot(...d) ** 3;expect(curvature).toBeLessThan(1 / worldSettings.navigation.turnRadius * 1.02);
  }
  let previous = samplePlan(plan,0);
  for(let time = 1 / 60;time <= plan.duration;time += 1 / 60) {const next = samplePlan(plan,easeSailing(time / plan.duration));expect(Math.hypot(...next.position.map((v,k) => v - previous.position[k]))).toBeLessThan(worldSettings.navigation.maxSpeed / 60 + .001);expect(next.tangent.reduce((n,v,k) => n + v * previous.tangent[k],0)).toBeGreaterThan(.999);previous = next;}
 });
 it("launches facing forward to each of the five islands",() => {for(const id of allIslandIds){const p = planLaunchRoute(id);expect(samplePlan(p,0).position).toEqual(HOME_BOAT_POSITION);expect(samplePlan(p,0).tangent[2]).toBeCloseTo(-1,8);}});
 it("bounds camera speed and acceleration for a 180 degree reversal at multiple frame rates",() => {
  for(const fps of [30,60,120]) {let yaw = Math.PI,velocity = 0;for(let i = 0;i < fps * 24;i++){const next = stepCameraYaw(yaw,velocity,0,1 / fps);expect(Math.abs(next.velocity)).toBeLessThanOrEqual(worldSettings.cameraComfort.maxYawSpeed + 1e-9);expect(Math.abs(next.velocity - velocity) * fps).toBeLessThanOrEqual(worldSettings.cameraComfort.maxYawAcceleration + 1e-9);yaw = next.yaw;velocity = next.velocity;}expect(Math.abs(wrappedAngle(yaw))).toBeLessThan(.03);}
 });
 it("takes the short wraparound and never requests a full orbit for an opposite route",() => {const next = stepCameraYaw(Math.PI - .01,0,-Math.PI + .01,1 / 60);expect(next.yaw).toBeGreaterThan(Math.PI - .01);for(const {from,to} of pairs)expect(Math.abs(wrappedAngle(preferredCameraYaw(planRoute(from,to)) - Math.PI))).toBeLessThanOrEqual(worldSettings.cameraComfort.yawCorridor + 1e-9);});
});
