import { describe,expect,it } from "vitest";
import { OrthographicCamera,Vector3 } from "three";
import { allIslandIds,campus,getIsland,islandRegistry,islands } from "../../src/data/islands";
import { worldSettings } from "../../src/data/world-settings";
import { getCameraFrame,islandBoundsPoints,boatBoundsPoints,projectWorldToScreen,heroIslandIds } from "../../src/lib/world-framing";
import { transformWorldPoint } from "../../src/lib/world-transform";
import { initialJourney,journeyReducer } from "../../src/lib/journey-machine";
import { navigationGraph,planRoute,samplePlan } from "../../src/lib/navigation-graph";
import { mapPoint,unmapPoint,MAP_WIDTH,MAP_HEIGHT } from "../../src/lib/map-projection";
import { makeWaterway } from "../../src/components/world/water/water-geometry";

const viewports = [{width:1440,height:900,mobile:false},{width:1920,height:1080,mobile:false},{width:390,height:844,mobile:true}];
describe("one world registry and dock transforms",() => {
  it("defines the complete render, access and content contract for all nine islands",() => {
    expect(islandRegistry.size).toBe(9);
    for (const island of islands) {
      expect(island.displayName).not.toBe(""); expect(island.category).toBe(island.id);
      expect(island.modelPath).toBe(island.asset.url); expect(island.requiresAuth).toBe(island.access !== "public");
      expect(Number.isFinite(island.rotation)).toBe(true);
      const {dock} = island;
      const pier = transformWorldPoint(island.position,island.scale,island.rotation,[dock.position[0] + Math.sin(dock.rotation) * dock.length,dock.position[1],dock.position[2] + Math.cos(dock.rotation) * dock.length]);
      const dx = island.dockingPoint[0] - pier[0],dz = island.dockingPoint[2] - pier[2];
      expect(Math.hypot(dx,dz)).toBeCloseTo(dock.clearance,8);
      expect(island.dockingPoint[1]).toBeCloseTo(pier[1] - dock.waterOffset,8);
      expect((dx * Math.sin(island.dockHeading) + dz * Math.cos(island.dockHeading)) / dock.clearance).toBeCloseTo(-1,8);
    }
  });
});

describe("camera-safe composition",() => {
  it.each(viewports)("fits the hero and boat at $width × $height",(viewport) => {
    const frame = getCameraFrame(initialJourney,campus.dockingPoint,0,viewport,viewport.mobile);
    const camera = new OrthographicCamera(-viewport.width / 2,viewport.width / 2,viewport.height / 2,-viewport.height / 2,.1,180);
    camera.position.set(...frame.target).add(new Vector3(...worldSettings.cameraOffset)); camera.lookAt(new Vector3(...frame.target)); camera.zoom = frame.zoom; camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const ids = heroIslandIds(viewport.mobile);
    expect(ids.length).toBe(viewport.mobile ? 4 : 6);
    for (const point of [...ids.flatMap((id) => islandBoundsPoints(getIsland(id))),...boatBoundsPoints(campus.dockingPoint)]) {
      const projected = new Vector3(...point).project(camera),screen = projectWorldToScreen(point,frame,viewport);
      expect((projected.x * .5 + .5) * viewport.width).toBeCloseTo(screen.x,5);
      expect((-projected.y * .5 + .5) * viewport.height).toBeCloseTo(screen.y,5);
      expect(screen.x).toBeGreaterThanOrEqual(frame.safeRect.left - .001); expect(screen.x).toBeLessThanOrEqual(frame.safeRect.right + .001);
      expect(screen.y).toBeGreaterThanOrEqual(frame.safeRect.top - .001); expect(screen.y).toBeLessThanOrEqual(frame.safeRect.bottom + .001);
    }
    expect(frame.zoom * 4).toBeGreaterThan(viewport.mobile ? 60 : 120);
  });
  it.each(viewports)("fits every destination and the boat above/beside its content panel at $width",(viewport) => {
    for (const id of allIslandIds) {
      const island = getIsland(id),state = journeyReducer(initialJourney,{type:"RESTORE",island:id,openContent:id !== "campus"});
      const frame = getCameraFrame(state,island.dockingPoint,1,viewport,viewport.mobile);
      for (const point of [...islandBoundsPoints(island),...boatBoundsPoints(island.dockingPoint)]) {
        const screen = projectWorldToScreen(point,frame,viewport);
        expect(screen.x).toBeGreaterThanOrEqual(frame.safeRect.left - .001); expect(screen.x).toBeLessThanOrEqual(frame.safeRect.right + .001);
        expect(screen.y).toBeGreaterThanOrEqual(frame.safeRect.top - .001); expect(screen.y).toBeLessThanOrEqual(frame.safeRect.bottom + .001);
      }
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
      const plan = {...planRoute("campus","news"),segments:[edge],distance:edge.length};
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
    expect(journeyReducer(planning,{type:"SAIL",destination:"news"})).toEqual(planning);
    expect(journeyReducer(planning,{type:"PLAN_READY",trip:planning.trip - 1})).toEqual(planning);
    const failed = journeyReducer(planning,{type:"PLAN_FAILED",trip:planning.trip,message:"Unavailable"});
    expect(failed.currentIsland).toBe("campus"); expect(failed.routeError).toBe("Unavailable");
    expect(journeyReducer(failed,{type:"SAIL",destination:"clubs"}).phase).toBe("ROUTE_PLANNING");
    const restored = journeyReducer(planning,{type:"RESTORE",island:"news",openContent:true});
    expect(journeyReducer(restored,{type:"PLAN_READY",trip:planning.trip})).toEqual(restored);
  });
});
