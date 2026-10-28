import { describe,expect,it } from "vitest";
import { Group,Scene,Vector3 } from "three";
import { allIslandIds,getIsland,islands,HOME_BOAT_POSITION,islandLayers } from "../../src/data/islands";
import {cameraFor,screen} from "../helpers/chase-camera";
import {dampAngle} from "../../src/lib/boat-camera";

import { observeIslandRoots } from "../../src/lib/world-observation";
import { initialJourney,journeyReducer,type JourneyState } from "../../src/lib/journey-machine";
import { planLaunchRoute,planRoute,samplePlan } from "../../src/lib/navigation-graph";
import { layoutIslandLabels,rectanglesOverlap,type IslandLabelCandidate } from "../../src/lib/island-label-layout";
import { shouldUseIslandDetail } from "../../src/lib/island-lod";

function sceneWithRoots() {
  const scene = new Scene();
  for (const island of islands) { const root = new Group(); root.name = "island:" + island.id; scene.add(root); }
  return scene;
}
const milestones = [.1,.3,.45,.6,.85,1];
describe("a continuous frontal archipelago",() => {
 it("distinguishes launching toward campus from being docked there, including restored history",() => {
  const planning = journeyReducer(initialJourney,{type:"SAIL",destination:"campus"});expect(planning.phase).toBe("ROUTE_PLANNING");
  const sailing = journeyReducer(planning,{type:"PLAN_READY",trip:planning.trip}),arrived = journeyReducer(sailing,{type:"ARRIVE",trip:sailing.trip});expect(arrived.atLaunch).toBe(false);
  expect(journeyReducer(arrived,{type:"RESTORE",island:"campus",openContent:false,atLaunch:true}).atLaunch).toBe(true);
  expect(journeyReducer(initialJourney,{type:"RESTORE",island:"campus",openContent:false}).atLaunch).toBe(false);
 });
 it("sails from the separate launch to every island, including campus, without crossing other islands",() => {
  for(const to of allIslandIds) {
   const plan = planLaunchRoute(to);expect(plan.nodeIds[0]).toBe("launch-channel");expect(plan.distance).toBeGreaterThan(20);
   expect(samplePlan(plan,0).position).toEqual(HOME_BOAT_POSITION);
   samplePlan(plan,1).position.forEach((n,i) => expect(n).toBeCloseTo(getIsland(to).dockingPoint[i],6));
   expect(samplePlan(plan,0).tangent[2]).toBeLessThan(-.99);
   for(let i = 0;i <= 150;i++) {const p = samplePlan(plan,i / 150).position;
    for(const island of islands.filter(island => island.id !== to)) {
     const x = p[0] - island.position[0],z = p[2] - island.position[2],c = Math.cos(island.rotation),s = Math.sin(island.rotation);
     expect(Math.hypot((x * c - z * s) / (island.shape.radius * island.shape.stretch[0] * island.scale * .9 + .3),(x * s + z * c) / (island.shape.radius * island.shape.stretch[1] * island.scale * .9 + .3))).toBeGreaterThan(1);
    }
   }
  }
 });
 it.each([{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}])("keeps nine roots and a boat anchor for all routes at $width",size => {
  const scene = sceneWithRoots();
  for(const from of allIslandIds) for(const to of allIslandIds.filter(id => id !== from)) {
   const plan = planRoute(from,to);
   for(const progress of milestones) {
    const sample = samplePlan(plan,progress),heading = Math.atan2(sample.tangent[0],sample.tangent[2]);
    const state:JourneyState = {...initialJourney,atLaunch:false,phase:progress === 1 ? "ARRIVED" : "SAILING",origin:from,currentIsland:progress === 1 ? to : from,destination:to};
    const camera = cameraFor(state,sample.position,heading,size,8),observations = observeIslandRoots(scene,camera,size);
    expect(observations).toHaveLength(9);expect(observations.every(island => island.enabled)).toBe(true);
    const anchor = screen([sample.position[0],sample.position[1] + 1.3,sample.position[2]],camera,size);
    expect(anchor.x / size.width).toBeGreaterThan(.4);expect(anchor.x / size.width).toBeLessThan(.6);
    expect(anchor.y / size.height).toBeGreaterThan(.45);expect(anchor.y / size.height).toBeLessThan(.8);
    expect(camera.position.clone().sub(new Vector3(...sample.position)).dot(new Vector3(Math.sin(heading),0,Math.cos(heading)))).toBeLessThan(-10);
   }
  }
 });
 it("places exactly 2/3/4 islands in successive forward layers, with campus the visual landmark",() => {
  expect(islandLayers.foreground).toHaveLength(2);expect(islandLayers.midground).toHaveLength(3);expect(islandLayers.background).toHaveLength(4);
  const distances = Object.values(islandLayers).map(ids => ids.map(id => Math.hypot(getIsland(id).position[0],getIsland(id).position[2] - HOME_BOAT_POSITION[2])));
  expect(Math.max(...distances[0])).toBeLessThan(Math.min(...distances[1]));expect(Math.max(...distances[1])).toBeLessThan(Math.min(...distances[2]));
  for(const island of islands) expect(island.position[2]).toBeLessThan(HOME_BOAT_POSITION[2]);
  const size = {width:1440,height:900},camera = cameraFor(initialJourney,HOME_BOAT_POSITION,Math.PI,size),view = observeIslandRoots(sceneWithRoots(),camera,size);
  expect(view.find(island => island.id === "campus")!.inViewport).toBe(true);
  expect(view.find(island => island.id === "campus")!.width).toBeGreaterThan(Math.max(...view.filter(island => island.id !== "campus").map(island => island.width)) * 1.3);
 });
 it("turns continuously across the heading wrap",() => {
  const yaw = dampAngle(Math.PI - .01,-Math.PI + .01,.016);
  expect(yaw).toBeGreaterThan(Math.PI - .01);expect(yaw).toBeLessThan(Math.PI + .01);
 });
});

describe("screen-space labels",() => {
  const ids = allIslandIds.filter((id) => id !== "campus");
  const candidates:IslandLabelCandidate[] = ids.map((id,i) => ({id,x:180 + i % 4 * 220,y:300 + Math.floor(i / 4) * 140,width:120,height:36,priority:id === "resources" ? 0 : 1,distance:i + 1}));
  it("supports five labels without overlap and prioritizes the destination",() => {
    const reserved = [{x:0,y:0,width:1440,height:120},{x:70,y:150,width:520,height:220}];
    const placed = layoutIslandLabels(candidates,{width:1440,height:900},reserved,5);
    expect(placed).toHaveLength(5); expect(placed[0].id).toBe("resources");
    for (const label of placed) {
      expect(reserved.some((rect) => rectanglesOverlap(label.rect,rect,7))).toBe(false);
      for (const other of placed.filter((other) => other.id !== label.id)) expect(rectanglesOverlap(label.rect,other.rect,6)).toBe(false);
    }
  });
  it("keeps coincident markers separate and limits mobile labels",() => {
    const nearby = candidates.map((candidate) => ({...candidate,x:180,y:450,width:110}));
    const placed = layoutIslandLabels(nearby,{width:390,height:844},[],2);
    expect(placed).toHaveLength(2); expect(rectanglesOverlap(placed[0].rect,placed[1].rect,6)).toBe(false);
  });
});

describe("spatial LOD",() => {
  it("uses hysteresis without removing roots or depending on route progress",() => {
    const input = {distance:13,screenRadius:30,inViewport:true,detailed:true,selected:false,detailDistance:27};
    expect(shouldUseIslandDetail(input)).toBe(true);
    expect(shouldUseIslandDetail({...input,detailed:false})).toBe(false);
    expect(shouldUseIslandDetail({...input,distance:40})).toBe(false);
    expect(shouldUseIslandDetail({...input,distance:40,selected:true})).toBe(true);
  });
});
