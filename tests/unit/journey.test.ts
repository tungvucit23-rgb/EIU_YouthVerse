import { describe,expect,it } from "vitest";
import { allIslandIds,campus,destinations,destinationFromHash,getIsland } from "../../src/data/islands";
import { buildGraph,cubicPoint,easeSailing,navigationGraph,planRoute,samplePlan } from "../../src/lib/navigation-graph";
import { initialJourney,journeyReducer,isTransitioning } from "../../src/lib/journey-machine";
import { anonymousPrincipal,canAccess,loginPreviewUrl } from "../../src/lib/access-policy";
import type { IslandId } from "../../src/types";

describe("nine-island registry",() => {
  it("contains one campus and eight unique, connected destination configurations",() => {
    expect(allIslandIds).toHaveLength(9);
    expect(new Set(allIslandIds).size).toBe(9);
    expect(new Set(destinations.map((island) => island.contentRoute)).size).toBe(8);
    expect(destinations.filter((island) => island.nearOnIntro).length).toBe(2);
    expect(destinations.filter((island) => island.nearOnIntro).length).toBeLessThanOrEqual(8);
    for (const island of destinations) {
      expect(island.connections.length).toBeGreaterThan(0);
      expect(island.shape.radius * (island.scale ?? 1)).toBeLessThan(campus.shape.radius);
      expect(destinationFromHash("#" + island.slug)).toBe(island.id);
    }
    expect(destinationFromHash("#unknown")).toBeNull();
    expect(destinationFromHash("#<script>")).toBeNull();
  });
});

const pairs = allIslandIds.flatMap((from) => allIslandIds.filter((to) => to !== from).map((to) => ({from,to})));
describe("route graph and arc-length sampling",() => {
  it.each(pairs)("$from can sail to $to with finite, exact dock endpoints",({from,to}) => {
    const plan = planRoute(from,to);
    expect(plan.nodeIds[0]).toBe(from); expect(plan.nodeIds.at(-1)).toBe(to);
    expect(plan.segments.length).toBeGreaterThan(0);
    expect(plan.duration).toBeGreaterThanOrEqual(3.8); expect(plan.duration).toBeLessThanOrEqual(8.5);
    samplePlan(plan,0).position.forEach((value,index) => expect(value).toBeCloseTo(getIsland(from).dockingPoint[index],6));
    samplePlan(plan,1).position.forEach((value,index) => expect(value).toBeCloseTo(getIsland(to).dockingPoint[index],6));
    for (let i = 0; i <= 30; i++) {
      const sample = samplePlan(plan,i / 30);
      expect(sample.position.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...sample.tangent)).toBeCloseTo(1,5);
    }
    for (let i = 0; i < plan.segments.length - 1; i++) {
      const a = plan.segments[i],b = plan.segments[i + 1];
      expect(a.end).toEqual(b.start);
      const incoming = a.end.map((value,axis) => value - a.c2[axis]);
      const outgoing = b.c1.map((value,axis) => value - b.start[axis]);
      const dot = incoming.reduce((sum,value,axis) => sum + value * outgoing[axis],0) / (Math.hypot(...incoming) * Math.hypot(...outgoing));
      expect(dot).toBeGreaterThan(0.999);
    }
  });
  it("plans multi-edge routes without mutating the shared shipping lanes",() => {
    const before = JSON.stringify(navigationGraph);
    expect(planRoute("resources","office").segments.length).toBeGreaterThan(4);
    planRoute("office","achievements"); planRoute("clubs","events");
    expect(JSON.stringify(navigationGraph)).toBe(before);
    expect(planRoute("campus","campus").distance).toBe(0);
  });
  it("routes the main channels outside the campus footprint",() => {
    for (const edge of navigationGraph.edges.filter((edge) => edge.from.endsWith("channel") && edge.to.endsWith("channel"))) {
      for (let i = 0; i <= 40; i++) {
        const point = cubicPoint(edge,i / 40,[0,0,0]);
        expect(Math.hypot((point[0] - campus.position[0]) / (campus.shape.radius * campus.scale),(point[2] - campus.position[2]) / (campus.shape.radius * campus.shape.stretch[1] * campus.scale))).toBeGreaterThan(1);
      }
    }
  });
  it("rejects disconnected and unknown routes",() => {
    const disconnected = buildGraph([{id:"campus",position:[0,0,0],kind:"island"},{id:"news",position:[3,0,0],kind:"island"}],[]);
    expect(() => planRoute("campus","news",disconnected)).toThrow("No connected route");
    expect(() => planRoute("missing" as IslandId,"news")).toThrow("Unknown route endpoint");
  });
  it("eases acceleration and docking with clamped, zero-slope endpoints",() => {
    expect(easeSailing(-1)).toBe(0); expect(easeSailing(2)).toBe(1); expect(easeSailing(0.5)).toBe(0.5);
    expect(easeSailing(0.01)).toBeLessThan(0.00002);
    expect(1 - easeSailing(0.99)).toBeLessThan(0.00002);
  });
});

describe("sailing state and history",() => {
  it("visits every deliberate phase, locks conflicting commands and stays at the dock after closing",() => {
    const selecting = journeyReducer(initialJourney,{type:"START"});
    const planning = journeyReducer(selecting,{type:"SAIL",destination:"events"});
    const sailing = journeyReducer(planning,{type:"PLAN_READY",trip:planning.trip});
    expect(planning.phase).toBe("ROUTE_PLANNING");
    expect(journeyReducer(planning,{type:"SAIL",destination:"office"})).toEqual(planning);
    expect(sailing.phase).toBe("SAILING"); expect(isTransitioning(sailing)).toBe(true);
    expect(journeyReducer(sailing,{type:"SAIL",destination:"office"})).toEqual(sailing);
    const approach = journeyReducer(sailing,{type:"PROGRESS",phase:"APPROACHING",trip:sailing.trip});
    const docking = journeyReducer(approach,{type:"PROGRESS",phase:"DOCKING",trip:sailing.trip});
    const arrived = journeyReducer(docking,{type:"ARRIVE",trip:sailing.trip});
    const content = journeyReducer(arrived,{type:"OPEN_CONTENT",trip:sailing.trip});
    expect([selecting.phase,approach.phase,docking.phase,arrived.phase,content.phase]).toEqual(["SELECTING_DESTINATION","APPROACHING","DOCKING","ARRIVED","EXPLORING_CONTENT"]);
    const world = journeyReducer(content,{type:"CLOSE_CONTENT"});
    expect(world.currentIsland).toBe("events"); expect(world.phase).toBe("SELECTING_DESTINATION");
    const next = journeyReducer(world,{type:"SAIL",destination:"volunteer"});
    expect(next.origin).toBe("events"); expect(next.destination).toBe("volunteer");
  });
  it("sails home through the same state machine",() => {
    const docked = journeyReducer(initialJourney,{type:"RESTORE",island:"resources",openContent:true});
    const planning = journeyReducer(docked,{type:"SAIL",destination:"campus"});
    const sailing = journeyReducer(planning,{type:"PLAN_READY",trip:planning.trip});
    const arrived = journeyReducer(sailing,{type:"ARRIVE",trip:sailing.trip});
    const world = journeyReducer(arrived,{type:"OPEN_CONTENT",trip:sailing.trip});
    expect(world.phase).toBe("SELECTING_DESTINATION"); expect(world.currentIsland).toBe("campus");
  });
  it("ignores stale completions and phase regressions after history interrupts a trip",() => {
    const planning = journeyReducer(initialJourney,{type:"SAIL",destination:"office"});
    const sailing = journeyReducer(planning,{type:"PLAN_READY",trip:planning.trip});
    const restored = journeyReducer(sailing,{type:"RESTORE",island:"clubs",openContent:true});
    expect(journeyReducer(restored,{type:"ARRIVE",trip:sailing.trip})).toEqual(restored);
    expect(journeyReducer(restored,{type:"PROGRESS",phase:"DOCKING",trip:sailing.trip})).toEqual(restored);
    expect(journeyReducer(restored,{type:"OPEN_CONTENT",trip:sailing.trip})).toEqual(restored);
    const newPlanning = journeyReducer(restored,{type:"SAIL",destination:"news"});
    const newTrip = journeyReducer(newPlanning,{type:"PLAN_READY",trip:newPlanning.trip});
    const docking = journeyReducer(newTrip,{type:"PROGRESS",phase:"DOCKING",trip:newTrip.trip});
    expect(journeyReducer(docking,{type:"PROGRESS",phase:"APPROACHING",trip:newTrip.trip})).toEqual(docking);
  });
});

describe("protected service UI boundaries",() => {
  it("denies guests and wrong roles; distinguishes student and staff access",() => {
    expect(canAccess(anonymousPrincipal,"public")).toBe(true);
    expect(canAccess(anonymousPrincipal,"student")).toBe(false);
    expect(canAccess(anonymousPrincipal,"staff")).toBe(false);
    expect(canAccess({authenticated:true,roles:["student"]},"staff")).toBe(false);
    expect(canAccess({authenticated:true,roles:["student"]},"student")).toBe(true);
    expect(canAccess({authenticated:true,roles:["union_staff"]},"staff")).toBe(true);
    expect(canAccess({authenticated:true,roles:["admin"]},"staff")).toBe(true);
  });
  it("keeps login preview return locations on the local site",() => {
    expect(loginPreviewUrl("//example.com")).toBe("/login?returnTo=%2Fjourney");
    expect(loginPreviewUrl("/office")).toBe("/login?returnTo=%2Foffice");
  });
});
