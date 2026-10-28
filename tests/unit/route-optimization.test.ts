import {it,expect} from "vitest";
import {readFileSync,writeFileSync} from "node:fs";
import {allIslandIds,getIsland} from "../../src/data/islands";
import {planRoute,planLaunchRoute} from "../../src/lib/navigation-graph";
import {sampleTravelTiming,elapsedAtProgress} from "../../src/lib/travel-timing";
import {worldSettings} from "../../src/data/world-settings";
it("shortens the original heading-aware navigation baseline",() => {
 const rows = allIslandIds.flatMap(from => allIslandIds.filter(to => to !== from).map(to => {const p = planRoute(from,to),a = getIsland(from).dockingPoint,b = getIsland(to).dockingPoint;return {from,to,distance:p.distance,duration:p.duration,direct:Math.hypot(a[0] - b[0],a[2] - b[2]),segments:p.segments.length};}));
 const before = JSON.parse(readFileSync("artifacts/route-optimization/before.json","utf8")) as {routes:typeof rows};
 for(const row of rows){const previous = before.routes.find(r=>r.from === row.from && r.to === row.to)!;expect(row.distance).toBeLessThanOrEqual(previous.distance + .001);expect(row.duration).toBeLessThan(previous.duration);expect(row.duration).toBeLessThan(14);}
 expect(rows.reduce((n,r)=>n+r.distance,0)).toBeLessThan(before.routes.reduce((n,r)=>n+r.distance,0) * .6);
 expect(rows.reduce((n,r)=>n+r.duration,0)).toBeLessThan(before.routes.reduce((n,r)=>n+r.duration,0) * .4);
 if(process.env.CAPTURE_ROUTE_METRICS === "1") writeFileSync("artifacts/route-optimization/after.json",JSON.stringify({routes:rows,launches:allIslandIds.map(to => {const p = planLaunchRoute(to);return {to,distance:p.distance,duration:p.duration};})},null,2));expect(rows).toHaveLength(20);
});

it("keeps route timing continuous, acceleration bounded and milestone time invertible",() => {
 for(const from of allIslandIds) for(const to of allIslandIds.filter(id=>id!==from)) {
  const plan = planRoute(from,to),timing = plan.timing;
  expect(timing.speeds[0]).toBe(0);expect(timing.speeds.at(-1)).toBe(0);expect(timing.times.at(-1)).toBe(plan.duration);
  for(let i = 1;i < timing.times.length;i++){const dt = timing.times[i] - timing.times[i - 1];expect(dt).toBeGreaterThan(0);expect(timing.distances[i]).toBeGreaterThan(timing.distances[i - 1]);expect(Math.abs(timing.speeds[i] - timing.speeds[i - 1]) / dt).toBeLessThanOrEqual(worldSettings.navigation.acceleration + 1e-7);expect(timing.speeds[i]).toBeLessThanOrEqual(worldSettings.navigation.maxSpeed);}
  for(const progress of [0,.1,.3,.5,.8,.96,1]) expect(sampleTravelTiming(timing,elapsedAtProgress(timing,progress)).progress).toBeCloseTo(progress,7);
 }
});
