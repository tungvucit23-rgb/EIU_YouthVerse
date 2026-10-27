import { describe,expect,it } from "vitest";
import { Group,OrthographicCamera,Scene,Vector3 } from "three";
import { allIslandIds,campus,getIsland,islands } from "../../src/data/islands";
import { worldSettings } from "../../src/data/world-settings";
import { getCameraFrame,boatBoundsPoints,projectWorldToScreen } from "../../src/lib/world-framing";
import { observeIslandRoots } from "../../src/lib/world-observation";
import { initialJourney,type JourneyState } from "../../src/lib/journey-machine";
import { planRoute,samplePlan } from "../../src/lib/navigation-graph";
import { layoutIslandLabels,rectanglesOverlap,type IslandLabelCandidate } from "../../src/lib/island-label-layout";
import { shouldUseIslandDetail } from "../../src/lib/island-lod";

function sceneWithRoots() {
  const scene = new Scene();
  for (const island of islands) { const root = new Group(); root.name = "island:" + island.id; scene.add(root); }
  return scene;
}
function cameraFor(frame:ReturnType<typeof getCameraFrame>,size:{width:number;height:number}) {
  const camera = new OrthographicCamera(-size.width / 2,size.width / 2,size.height / 2,-size.height / 2,.1,180);
  camera.position.set(...frame.target).add(new Vector3(...worldSettings.cameraOffset)); camera.lookAt(new Vector3(...frame.target)); camera.zoom = frame.zoom; camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  return camera;
}
const milestones = [.1,.3,.45,.6,.85,1];
describe("a continuous, enabled archipelago",() => {
  it.each([{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}])("keeps roots enabled and some land in view for all routes at $width",(size) => {
    const scene = sceneWithRoots();
    for (const from of allIslandIds) for (const to of allIslandIds.filter((id) => id !== from)) {
      const plan = planRoute(from,to);
      for (const progress of milestones) for (const closed of progress === 1 ? [false,true] : [false]) {
        const position = samplePlan(plan,progress).position;
        const state:JourneyState = {...initialJourney,phase:progress === 1 ? closed ? "SELECTING_DESTINATION" : "ARRIVED" : "SAILING",origin:from,currentIsland:progress === 1 ? to : from,destination:to};
        const frame = getCameraFrame(state,position,progress,size,size.width < 768,plan);
        const observations = observeIslandRoots(scene,cameraFor(frame,size),size);
        expect(observations).toHaveLength(9); expect(observations.filter((island) => island.enabled)).toHaveLength(9);
        expect(observations.filter((island) => island.inViewport).length,from + " → " + to + " at " + progress).toBeGreaterThan(0);
        for (const point of boatBoundsPoints(position)) {
          const screen = projectWorldToScreen(point,frame,size);
          expect(screen.x).toBeGreaterThanOrEqual(frame.safeRect.left - .001); expect(screen.x).toBeLessThanOrEqual(frame.safeRect.right + .001);
          expect(screen.y).toBeGreaterThanOrEqual(frame.safeRect.top - .001); expect(screen.y).toBeLessThanOrEqual(frame.safeRect.bottom + .001);
        }
      }
    }
  });
  it("distinguishes root existence, enabled state and camera intersection",() => {
    const scene = sceneWithRoots(),size = {width:1440,height:900};
    const state:JourneyState = {...initialJourney,phase:"EXPLORING_CONTENT",currentIsland:"office"};
    const position = getIsland("office").dockingPoint;
    const frame = getCameraFrame(state,position,1,size,false),camera = cameraFor(frame,size);
    const observations = observeIslandRoots(scene,camera,size);
    expect(observations).toHaveLength(9); expect(observations.every((island) => island.enabled)).toBe(true);
    expect(observations.some((island) => !island.inViewport)).toBe(true);
    scene.getObjectByName("island:office")!.visible = false;
    const disabled = observeIslandRoots(scene,camera,size).find((island) => island.id === "office")!;
    expect(disabled.enabled).toBe(false); expect(disabled.inViewport).toBe(false);
  });
  it("places five identifiable destination bounds in the desktop hero",() => {
    const size = {width:1440,height:900},scene = sceneWithRoots();
    const frame = getCameraFrame(initialJourney,campus.dockingPoint,0,size,false);
    const visible = observeIslandRoots(scene,cameraFor(frame,size),size).filter((island) => island.inViewport && island.id !== "campus" && island.visibleFraction > .85 && island.width > 60);
    expect(visible.length).toBeGreaterThanOrEqual(5);
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
