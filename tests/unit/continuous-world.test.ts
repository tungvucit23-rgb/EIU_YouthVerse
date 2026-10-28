import {describe,expect,it} from "vitest";
import {allIslandIds,getIsland,islands,HOME_BOAT_POSITION,islandLayers,destinationFromHash,islandSections} from "../../src/data/islands";
import {portalSections} from "../../src/data/portal-sections";
import {cameraFor} from "../helpers/chase-camera";
import {layoutIslandLabels,rectanglesOverlap,type IslandLabelCandidate} from "../../src/lib/island-label-layout";
import {shouldUseIslandDetail} from "../../src/lib/island-lod";
import {initialJourney,journeyReducer} from "../../src/lib/journey-machine";
import {observeIslandRoots} from "../../src/lib/world-observation";
import {Group,Scene} from "three";

function sceneWithRoots(){const scene=new Scene();for(const i of islands){const root=new Group();root.name="island:"+i.id;scene.add(root);}return scene;}
describe("five-island continuous world",()=>{
 it("contains one landmark, two medium and two farther destinations ahead of the launch",()=>{expect(islands).toHaveLength(5);expect(islandLayers.landmark).toEqual(["campus"]);expect(islandLayers.midground).toHaveLength(2);expect(islandLayers.background).toHaveLength(2);for(const i of islands)expect(i.position[2]).toBeLessThan(HOME_BOAT_POSITION[2]);expect(Math.min(...islandLayers.midground.map(id=>getIsland(id).position[2]))).toBeGreaterThan(Math.max(...islandLayers.background.map(id=>getIsland(id).position[2])));});
 it("preserves all portal domains through five parent islands and legacy hash mappings",()=>{expect(portalSections).toHaveLength(8);expect(Object.values(islandSections).flat().sort()).toEqual(portalSections.map(s=>s.id).sort());expect(destinationFromHash("#news")).toBe("campus");expect(destinationFromHash("#events")).toBe("activities");expect(destinationFromHash("#volunteer")).toBe("activities");expect(destinationFromHash("#resources")).toBe("clubs");});
 it("distinguishes offshore launch from a real campus arrival and opens its information",()=>{const p=journeyReducer(initialJourney,{type:"SAIL",destination:"campus"}),s=journeyReducer(p,{type:"PLAN_READY",trip:p.trip}),a=journeyReducer(s,{type:"ARRIVE",trip:s.trip});expect(a.atLaunch).toBe(false);expect(journeyReducer(a,{type:"OPEN_CONTENT",trip:a.trip}).phase).toBe("EXPLORING_CONTENT");});
 it("rejects inherited property names as legacy destinations",()=>{for(const hash of ["#constructor","#__proto__","#toString"])expect(destinationFromHash(hash)).toBeNull();});
 it.each([{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}])("keeps all five persistent roots enabled at $width",size=>{const scene=sceneWithRoots(),camera=cameraFor(initialJourney,HOME_BOAT_POSITION,Math.PI,size),a=observeIslandRoots(scene,camera,size);expect(a).toHaveLength(5);expect(a.every(i=>i.enabled)).toBe(true);expect(a.find(i=>i.id==="campus")!.inViewport).toBe(true);});
});

describe("screen-space labels",() => {
  const candidates:IslandLabelCandidate[] = allIslandIds.map((id,i) => ({id,x:180 + i * 220,y:450,width:120,height:36,priority:id === "office" ? 0 : 1,distance:i + 1}));
  it("supports five labels without overlap and prioritizes the destination",() => {
    const reserved = [{x:0,y:0,width:1440,height:120},{x:70,y:150,width:520,height:220}];
    const placed = layoutIslandLabels(candidates,{width:1440,height:900},reserved,5);
    expect(placed).toHaveLength(5); expect(placed[0].id).toBe("office");
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
