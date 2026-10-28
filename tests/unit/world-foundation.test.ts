import { describe,expect,it } from "vitest";
import {Vector3} from "three";
import { allIslandIds,getIsland,islandRegistry,islands,HOME_BOAT_POSITION } from "../../src/data/islands";
import {cameraFor,screen} from "../helpers/chase-camera";
import {boatBoundsPoints} from "../../src/lib/world-framing";
import { transformWorldPoint } from "../../src/lib/world-transform";
import { initialJourney,journeyReducer } from "../../src/lib/journey-machine";
import { navigationGraph,planRoute,samplePlan } from "../../src/lib/navigation-graph";
import { mapPoint,unmapPoint,MAP_WIDTH,MAP_HEIGHT } from "../../src/lib/map-projection";
import { makeWaterway } from "../../src/components/world/water/water-geometry";

const viewports = [{width:1440,height:900,mobile:false},{width:1920,height:1080,mobile:false},{width:390,height:844,mobile:true}];
describe("one world registry and dock transforms",() => {
  it("defines the complete render, access and content contract for all five islands",() => {
    expect(islandRegistry.size).toBe(5);
    for (const island of islands) {
      expect(island.displayName).not.toBe(""); expect(island.category).toBe(island.id);
      expect(island.modelPath).toBe(island.asset.url); expect(island.requiresAuth).toBe(island.access !== "public");
      expect(Number.isFinite(island.rotation)).toBe(true);
      const {dock} = island;
      const pier = transformWorldPoint(island.position,island.scale,island.rotation,[dock.position[0] + Math.sin(dock.rotation) * dock.length,dock.position[1],dock.position[2] + Math.cos(dock.rotation) * dock.length]);
      const dx = island.dockingPoint[0] - pier[0],dz = island.dockingPoint[2] - pier[2];
      expect(Math.hypot(dx,dz)).toBeCloseTo(dock.clearance,8);
      expect(island.dockingPoint[1]).toBeCloseTo(pier[1] - dock.waterOffset,8);
      expect((dx * Math.sin(island.rotation + island.dock.rotation) + dz * Math.cos(island.rotation + island.dock.rotation)) / dock.clearance).toBeCloseTo(1,8);
    }
  });
});

describe("third-person boat composition",() => {
 it.each(viewports)("keeps the camera behind the launch boat and its anchor in the lower middle at $width",size => {
  const p = HOME_BOAT_POSITION,camera = cameraFor(initialJourney,p,Math.PI,size),forward = new Vector3(0,0,-1);
  expect(camera.position.clone().sub(new Vector3(...p)).dot(forward)).toBeLessThan(-10);
  expect(camera.getWorldDirection(new Vector3()).dot(forward)).toBeGreaterThan(.9);
  const anchor = screen([p[0],p[1] + 1.3,p[2]],camera,size);
  expect(anchor.x / size.width).toBeGreaterThan(.4);expect(anchor.x / size.width).toBeLessThan(.6);
  expect(anchor.y / size.height).toBeGreaterThan(.48);expect(anchor.y / size.height).toBeLessThan(.78);
  for(const point of boatBoundsPoints(p)) {const v = screen(point,camera,size);expect(v.x).toBeGreaterThan(0);expect(v.x).toBeLessThan(size.width);expect(v.y).toBeGreaterThan(80);expect(v.y).toBeLessThan(size.height - 50);}
 });
 it.each(viewports)("keeps a docked vessel clear of its content panel at $width",size => {
  for(const id of allIslandIds.filter(id => id !== "campus")) {
   const island = getIsland(id),state = journeyReducer(initialJourney,{type:"RESTORE",island:id,openContent:true}),camera = cameraFor(state,island.dockingPoint,Math.PI,size);
   for(const point of boatBoundsPoints(island.dockingPoint)) {const v = screen(point,camera,size);expect(v.x).toBeGreaterThan(0);expect(v.x).toBeLessThan(size.width * (size.mobile ? 1 : .68));expect(v.y).toBeGreaterThan(80);expect(v.y).toBeLessThan(size.height * (size.mobile ? .45 : .9));}
  }
 });
});

describe("water and route geometry stay synchronized",() => {
  it("keeps every water centerline on the boat spline, with bounded width and upward faces",() => {
    const planned = allIslandIds.flatMap((from) => allIslandIds.filter((to) => to !== from).flatMap((to) => planRoute(from,to).segments));
    const unique = new Map([...navigationGraph.edges,...planned].map((edge) => [edge.from + edge.to + edge.c1.join(",") + edge.c2.join(","),edge]));
    const normalsBelow:Record<string,number> = {};
    for (const edge of unique.values()) {
      const geometry = makeWaterway(edge,24),positions = geometry.attributes.position,normals = geometry.attributes.normal;
      const plan = {...planRoute("campus","clubs"),segments:[edge],distance:edge.length};
      for (let row = 0; row <= 24; row++) {
        const expected = samplePlan(plan,row / 24).position;
        expect(positions.getX(row * 5 + 2)).toBeCloseTo(expected[0],4);
        expect(positions.getY(row * 5 + 2)).toBeCloseTo(expected[1] - .035,4);
        expect(positions.getZ(row * 5 + 2)).toBeCloseTo(expected[2],4);
        for (let col = 0; col <= 4; col++) {
          const index = row * 5 + col;
          expect(Math.hypot(positions.getX(index) - expected[0],positions.getZ(index) - expected[2])).toBeLessThanOrEqual(.551);
          if (normals.getY(index) <= .5) { const key = edge.from + " → " + edge.to; normalsBelow[key] = Math.min(normals.getY(index),normalsBelow[key] ?? .5); }
        }
      }
      geometry.dispose();
    }
    expect(normalsBelow).toEqual({});
  });
  it("keeps planned shipping lanes outside unrelated island footprints",() => {
    const collisions:Record<string,number> = {};
    for (const from of allIslandIds) for (const to of allIslandIds.filter((id) => id !== from)) {
      const plan = planRoute(from,to);
      for (let i = 0; i <= 150; i++) {
        const sample = samplePlan(plan,i / 150),p = sample.position;
        for (const island of islands.filter((island) => island.id !== from && island.id !== to)) {
          const x = p[0] - island.position[0],z = p[2] - island.position[2],c = Math.cos(island.rotation),s = Math.sin(island.rotation);
          const rx = island.shape.radius * island.shape.stretch[0] * island.scale * .9 + .3,rz = island.shape.radius * island.shape.stretch[1] * island.scale * .9 + .3;
          const clearance = Math.hypot((x * c - z * s) / rx,(x * s + z * c) / rz);
          if (clearance <= 1) { const key = plan.segments[sample.edgeIndex].id + " intersects " + island.id; collisions[key] = Math.min(clearance,collisions[key] ?? 1); }
        }
      }
    }
    expect(collisions).toEqual({});
  });
});

describe("map projection and safe planning",() => {
  it("projects the same registry/graph without coordinate distortion or off-map anchors",() => {
    const points = [...islands.flatMap((island) => [island.position,island.dockingPoint]),...navigationGraph.edges.flatMap((edge) => [edge.start,edge.c1,edge.c2,edge.end])];
    for (const point of points) {
      const projected = mapPoint(point),roundtrip = unmapPoint(projected);
      expect(roundtrip[0]).toBeCloseTo(point[0],8); expect(roundtrip[2]).toBeCloseTo(point[2],8);
      expect(projected.x).toBeGreaterThanOrEqual(45); expect(projected.x).toBeLessThanOrEqual(MAP_WIDTH - 45);
      expect(projected.y).toBeGreaterThanOrEqual(45); expect(projected.y).toBeLessThanOrEqual(MAP_HEIGHT - 45);
    }
    const a = mapPoint([0,0,0]),b = mapPoint([1,0,0]),c = mapPoint([0,0,1]);
    expect(b.x - a.x).toBeCloseTo(c.y - a.y,8);
  });
  it("locks planning, recovers from failure and ignores late readiness after history restore",() => {
    const planning = journeyReducer(initialJourney,{type:"SAIL",destination:"office"});
    expect(planning.phase).toBe("ROUTE_PLANNING");
    expect(journeyReducer(planning,{type:"SAIL",destination:"clubs"})).toEqual(planning);
    expect(journeyReducer(planning,{type:"PLAN_READY",trip:planning.trip - 1})).toEqual(planning);
    const failed = journeyReducer(planning,{type:"PLAN_FAILED",trip:planning.trip,message:"Unavailable"});
    expect(failed.currentIsland).toBe("campus"); expect(failed.routeError).toBe("Unavailable");
    expect(journeyReducer(failed,{type:"SAIL",destination:"clubs"}).phase).toBe("ROUTE_PLANNING");
    const restored = journeyReducer(planning,{type:"RESTORE",island:"clubs",openContent:true});
    expect(journeyReducer(restored,{type:"PLAN_READY",trip:planning.trip})).toEqual(restored);
  });
});
