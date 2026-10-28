import {expect,test,type Page} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import {allIslandIds,getDestination,getIsland,HOME_BOAT_POSITION,islands,islandSections} from "../../src/data/islands";
import {portalSections} from "../../src/data/portal-sections";
import {mapPoint,MAP_WIDTH,MAP_HEIGHT} from "../../src/lib/map-projection";
import {elapsedAtProgress} from "../../src/lib/travel-timing";
import type {TravelTiming} from "../../src/types/navigation";
import type {IslandId} from "../../src/types";

const sizes = [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}];
const chain:{from:IslandId;to:IslandId}[] = [{from:"campus",to:"activities"},{from:"activities",to:"office"},{from:"office",to:"clubs"},{from:"clubs",to:"achievements"},{from:"achievements",to:"campus"}];
const pairs = allIslandIds.flatMap(from => allIslandIds.filter(to => to !== from).map(to => ({from,to})));
const routes = [...chain,...pairs.filter(p => !chain.some(c => c.from === p.from && c.to === p.to))];
const degrees = 180 / Math.PI;
interface Frame {phase:string;progress:number;elapsed:number;duration:number;roots:string;enabled:number;anchor:{x:number;y:number};boat:{x:number;y:number;width:number;height:number};position:number[];heading:number;viewYaw:number;yaw:number;velocity:number;acceleration:number;pitch:number;roll:number;fov:number;water:number;targetVisible:boolean}
interface Audit {frames:number;rootErrors:number;anchorErrors:number;maxStep:number;maxBoatRate:number;maxCameraRate:number;maxYawVelocity:number;maxYawAcceleration:number;maxRoll:number;minPitch:number;maxPitch:number;empty:number;emptyRun:number;maxEmptyRun:number}
type QAWindow = Window & {comfortAudit?:Audit;recorder?:MediaRecorder;recordingChunks?:Blob[]};
test.use({trace:"off"});
async function frame(page:Page):Promise<Frame> {return page.locator("canvas").evaluate(c => ({phase:c.dataset.phase!,progress:+c.dataset.journeyProgress!,elapsed:+c.dataset.journeyElapsed!,duration:+c.dataset.journeyDuration!,roots:c.dataset.islandRootIds!,enabled:+c.dataset.enabledIslandCount!,anchor:JSON.parse(c.dataset.boatAnchor!),boat:JSON.parse(c.dataset.boatScreen!),position:JSON.parse(c.dataset.motionPosition!),heading:+c.dataset.boatHeading!,viewYaw:+c.dataset.cameraViewYaw!,yaw:+c.dataset.cameraYaw!,velocity:+c.dataset.cameraYawVelocity!,acceleration:+c.dataset.cameraYawAcceleration!,pitch:+c.dataset.cameraPitch!,roll:+c.dataset.cameraRoll!,fov:+c.dataset.cameraFov!,water:+c.dataset.boatWaterDistance!,targetVisible:JSON.parse(c.dataset.islandStates!).some((i:{id:string;inViewport:boolean}) => i.id === document.querySelector("main")!.getAttribute("data-current-island") && i.inViewport)}));}
async function map(page:Page) {await page.locator(".mobile-map-button:visible,.destination-picker-trigger:visible").first().click();await page.clock.runFor(500);await page.getByRole("dialog").evaluate(e => {for(const a of e.getAnimations({subtree:true})) if(a.effect?.getComputedTiming().iterations !== Infinity) a.finish();});}
async function restore(page:Page,id:IslandId) {await page.evaluate(island => {history.pushState({youthverse:true,view:"world",atLaunch:false},"","/?inspect=1#" + island);dispatchEvent(new PopStateEvent("popstate"));},id);await page.clock.runFor(1800);await expect(page.locator("main")).toHaveAttribute("data-current-island",id);}
async function milestoneTime(page:Page,progress:number) {const timing = await page.locator("canvas").evaluate(c => JSON.parse(c.dataset.journeyTiming!) as TravelTiming);return elapsedAtProgress(timing,progress);}
async function installAudit(page:Page,roots:string) {
 await page.evaluate(expected => {
  const wrap = (v:number) => Math.atan2(Math.sin(v),Math.cos(v));let previous:{p:number[];h:number;y:number;t:number}|null = null;
  const tick = () => {const c = document.querySelector("canvas"),a = (window as QAWindow).comfortAudit;if(c && a && ["SAILING","APPROACHING","DOCKING"].includes(c.dataset.phase!)){
   const p = JSON.parse(c.dataset.motionPosition!),h = +c.dataset.boatHeading!,y = +c.dataset.cameraViewYaw!,t = performance.now(),anchor = JSON.parse(c.dataset.boatAnchor!);a.frames++;
   if(c.dataset.enabledIslandCount !== "5" || c.dataset.islandRootIds !== expected) a.rootErrors++;
   if(anchor.x < 0 || anchor.x > innerWidth || anchor.y < 80 || anchor.y > innerHeight - 50) a.anchorErrors++;
   a.maxYawVelocity = Math.max(a.maxYawVelocity,Math.abs(+c.dataset.cameraYawVelocity!));a.maxYawAcceleration = Math.max(a.maxYawAcceleration,Math.abs(+c.dataset.cameraYawAcceleration!));a.maxRoll = Math.max(a.maxRoll,Math.abs(+c.dataset.cameraRoll!));a.minPitch = Math.min(a.minPitch,+c.dataset.cameraPitch!);a.maxPitch = Math.max(a.maxPitch,+c.dataset.cameraPitch!);if(!c.dataset.viewportIslands){a.empty++;a.emptyRun++;a.maxEmptyRun = Math.max(a.maxEmptyRun,a.emptyRun);}else a.emptyRun = 0;
   if(previous && t > previous.t){const dt = (t - previous.t) / 1000;a.maxStep = Math.max(a.maxStep,Math.hypot(...p.map((v:number,k:number) => v - previous!.p[k])));a.maxBoatRate = Math.max(a.maxBoatRate,Math.abs(wrap(h - previous.h)) / dt);a.maxCameraRate = Math.max(a.maxCameraRate,Math.abs(wrap(y - previous.y)) / dt);}previous = {p,h,y,t};
  }else previous = null;requestAnimationFrame(tick);};requestAnimationFrame(tick);
 },roots);
}
async function resetAudit(page:Page) {await page.evaluate(() => {(window as QAWindow).comfortAudit = {frames:0,rootErrors:0,anchorErrors:0,maxStep:0,maxBoatRate:0,maxCameraRate:0,maxYawVelocity:0,maxYawAcceleration:0,maxRoll:0,minPitch:Infinity,maxPitch:-Infinity,empty:0,emptyRun:0,maxEmptyRun:0};});}
async function featureLinks(page:Page,id:IslandId) {for(const sectionId of islandSections[id]) {const section = portalSections.find(s => s.id === sectionId)!;await expect(page.locator(".island-feature-links a[href='" + section.contentRoute + "']")).toBeVisible();}}

for(const size of sizes) test("stable five-island sailing: all 20 pairs at " + size.width,async ({page}) => {
 test.setTimeout(1200000);await page.setViewportSize(size);await page.clock.install();await page.addInitScript(() => {localStorage.setItem("youthverse.navigation-mode","sail");window.requestAnimationFrame = cb => window.setTimeout(() => cb(performance.now()),100);window.cancelAnimationFrame = id => clearTimeout(id);});
 const errors:string[] = [];page.on("pageerror",e => errors.push(e.message));page.on("console",m => {if(m.type() === "error") errors.push(m.text());});
 await page.goto("/?inspect=1");await expect(page.locator("canvas")).toHaveAttribute("data-boat-loaded","true",{timeout:30000});await page.waitForTimeout(1800);const canvas = await page.locator("canvas").elementHandle(),initial = await frame(page);
 expect(initial.enabled).toBe(5);await expect(page.locator("canvas")).toHaveAttribute("data-camera-type","PerspectiveCamera");
 if(size.width > 768) expect(await page.locator("canvas").evaluate(c => JSON.parse(c.dataset.islandStates!).filter((i:{inViewport:boolean}) => i.inViewport).length)).toBe(5);
 const dir = "artifacts/route-optimization/" + size.width;await mkdir(dir,{recursive:true});const capture = async (name:string) => {if(name === "office-clubs-sailing" || name === "office-clubs-arrived" || size.width === 1440 && name === "activities-office-sailing") await page.screenshot({path:dir + "/" + name + ".png",animations:"disabled"});};await capture("initial");
 await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 2000);await page.locator(".hero-introduction .primary-button").click();await page.clock.runFor(1000);await capture("selection");await map(page);await expect(page.locator(".map-island-node")).toHaveCount(5);
 const diagram = (await page.locator(".archipelago-diagram").boundingBox())!;for(const island of islands){const r = (await page.locator('[data-island-id="' + island.id + '"]').boundingBox())!,p = mapPoint(island.position);expect(r.x + r.width / 2).toBeCloseTo(diagram.x + p.x / MAP_WIDTH * diagram.width,0);expect(r.y + r.height / 2).toBeCloseTo(diagram.y + p.y / MAP_HEIGHT * diagram.height,0);}
 const marker = page.getByTestId("map-boat-marker"),launch = mapPoint(HOME_BOAT_POSITION);expect(+(await marker.getAttribute("cx"))!).toBeCloseTo(launch.x,1);expect(+(await marker.getAttribute("cy"))!).toBeCloseTo(launch.y,1);await capture("map");await page.keyboard.press("Escape");await page.clock.runFor(400);
 await installAudit(page,initial.roots);const evidence:{route:typeof routes[number];samples:Frame[];arrived:Frame;audit:Audit}[] = [];
 await map(page);await resetAudit(page);await page.locator('[data-island-id="campus"]').click();await page.clock.runFor(500);await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
 const departure = await frame(page);await page.clock.runFor((departure.duration - departure.elapsed + 1.5) * 1000);await expect(page.locator("main")).toHaveAttribute("data-at-launch","false");await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");await capture("launch-campus-arrived");
 const launchAudit = await page.evaluate(() => (window as QAWindow).comfortAudit!);expect(launchAudit.rootErrors).toBe(0);expect(launchAudit.anchorErrors).toBe(0);expect(launchAudit.maxStep).toBeLessThan(.87);await writeFile(dir + "/launch-navigation.json",JSON.stringify({departure,arrived:await frame(page),audit:launchAudit},null,2));
 for(let index = 0;index < routes.length;index++) {
  const route = routes[index];if(index >= chain.length) await restore(page,route.from);
  else {await page.keyboard.press("Escape");await page.clock.runFor(1300);}
  await map(page);await resetAudit(page);await page.locator('[data-island-id="' + route.to + '"]').click();await page.clock.runFor(500);await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
  const samples:Frame[] = [];
  for(const progress of [.1,.3,.5,.8,.96,1]) {const before = await frame(page),time = await milestoneTime(page,progress) + (progress === 1 ? .1 : 0);await page.clock.runFor(Math.max(0,(time - before.elapsed) * 1000));const s = await frame(page);samples.push(s);expect(s.enabled).toBe(5);expect(s.roots).toBe(initial.roots);expect(s.progress).toBeCloseTo(progress,1);expect(s.fov).toBe(size.width < 768 ? 72 : 50);expect(s.anchor.x / size.width).toBeGreaterThan(.25);expect(s.anchor.x / size.width).toBeLessThan(.75);expect(s.anchor.y / size.height).toBeGreaterThan(.45);expect(s.anchor.y / size.height).toBeLessThan(.8);if(progress < 1) expect(s.water).toBeLessThan(.1);
   if(index < chain.length && progress === .5) await capture(route.from + "-" + route.to + "-sailing");if(index === 0 && progress === .8) await capture("approaching");if(index === 0 && progress === .96) await capture("docking");
  }
  await page.clock.runFor(1500);await expect(page.locator("main")).toHaveAttribute("data-current-island",route.to);await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");await expect(page.locator(".island-info-panel h2")).toHaveText(getDestination(route.to)!.fullTitle);await featureLinks(page,route.to);
  const arrived = await frame(page),panel = (await page.getByRole("dialog").boundingBox())!;expect(arrived.targetVisible).toBe(true);if(size.width < 768)expect(arrived.boat.y + arrived.boat.height).toBeLessThan(panel.y - 5);else expect(arrived.boat.x + arrived.boat.width).toBeLessThan(panel.x - 5);expect(Math.abs(Math.atan2(Math.sin(arrived.heading - getIsland(route.to).dockHeading),Math.cos(arrived.heading - getIsland(route.to).dockHeading)))).toBeLessThan(.04);
  expect(await canvas!.evaluate(c => c === document.querySelector("canvas"))).toBe(true);if(index < chain.length) await capture(route.from + "-" + route.to + "-arrived");
  const audit = await page.evaluate(() => (window as QAWindow).comfortAudit!);expect(audit.frames).toBeGreaterThanOrEqual(Math.floor(samples[0].duration * 10) - 2);expect(audit.rootErrors).toBe(0);expect(audit.anchorErrors).toBe(0);expect(audit.maxStep).toBeLessThan(.87);expect(audit.maxBoatRate * degrees).toBeLessThan(65);expect(audit.maxCameraRate * degrees).toBeLessThan(15.1);expect(audit.maxYawVelocity * degrees).toBeLessThanOrEqual(12.001);expect(audit.maxYawAcceleration * degrees).toBeLessThanOrEqual(8.001);expect(audit.maxRoll).toBeLessThan(.001);expect(audit.maxPitch - audit.minPitch).toBeLessThan(.025);
  evidence.push({route,samples,arrived,audit});
  await writeFile(dir + "/normal-navigation.json",JSON.stringify(evidence,null,2));
 }
 await writeFile(dir + "/normal-navigation.json",JSON.stringify(evidence,null,2));expect(errors).toEqual([]);
});

for(const size of sizes) test("reduced motion: all 20 direct transitions at " + size.width,async ({page}) => {
 test.setTimeout(180000);await page.setViewportSize(size);await page.emulateMedia({reducedMotion:"reduce"});await page.clock.install();await page.addInitScript(() => {window.requestAnimationFrame = cb => window.setTimeout(() => cb(performance.now()),100);window.cancelAnimationFrame = id => clearTimeout(id);});
 await page.goto("/?inspect=1");await expect(page.locator("canvas")).toHaveAttribute("data-boat-loaded","true",{timeout:30000});await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 2000);const initial = await frame(page),evidence = [];
 for(const route of pairs){await restore(page,route.from);await map(page);await page.locator('[data-island-id="' + route.to + '"]').click();await page.clock.runFor(600);await expect(page.locator("main")).toHaveAttribute("data-current-island",route.to);await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");const s = await frame(page);expect(s.roots).toBe(initial.roots);expect(s.enabled).toBe(5);expect(s.velocity).toBe(0);expect(s.yaw).toBe(initial.yaw);await featureLinks(page,route.to);evidence.push({route,position:s.position,yaw:s.yaw,phase:s.phase});}
 const dir = "artifacts/route-optimization/" + size.width;await mkdir(dir,{recursive:true});await writeFile(dir + "/reduced-navigation.json",JSON.stringify(evidence,null,2));
});

test("reduced motion can retain animated sailing with a fixed camera heading",async ({page}) => {
 test.setTimeout(120000);await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:"reduce"});await page.clock.install();await page.addInitScript(() => {localStorage.setItem("youthverse.navigation-mode","sail");window.requestAnimationFrame = cb => window.setTimeout(() => cb(performance.now()),100);window.cancelAnimationFrame = id => clearTimeout(id);});
 await page.goto("/?inspect=1#office");await expect(page.locator("canvas")).toHaveAttribute("data-boat-loaded","true",{timeout:30000});await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 2000);const initial = await frame(page);await page.keyboard.press("Escape");await page.clock.runFor(800);await map(page);await page.locator('[data-island-id="campus"]').click();await page.clock.runFor(500);await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
 const samples:Frame[] = [];for(const progress of [.1,.5,.8,.96,1]){const before = await frame(page);expect(before.duration).toBeGreaterThanOrEqual(4);await page.clock.runFor(Math.max(0,(await milestoneTime(page,progress) + (progress === 1 ? .1 : 0) - before.elapsed) * 1000));const s = await frame(page);expect(s.yaw).toBe(initial.yaw);expect(s.velocity).toBe(0);expect(s.roots).toBe(initial.roots);expect(s.enabled).toBe(5);samples.push(s);}
 await page.clock.runFor(1500);await expect(page.locator("main")).toHaveAttribute("data-current-island","campus");await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");await featureLinks(page,"campus");await writeFile("artifacts/route-optimization/390/reduced-animated-navigation.json",JSON.stringify(samples,null,2));
});

test("sailing completes on time at five FPS instead of doubling the wait",async ({page}) => {
 await page.setViewportSize({width:390,height:844});await page.clock.install();await page.addInitScript(() => {localStorage.setItem("youthverse.navigation-mode","sail");window.requestAnimationFrame = cb => window.setTimeout(() => cb(performance.now()),200);window.cancelAnimationFrame = id => clearTimeout(id);});
 await page.goto("/?inspect=1#campus");await expect(page.locator("canvas")).toHaveAttribute("data-boat-loaded","true",{timeout:30000});await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 2000);await page.keyboard.press("Escape");await page.clock.runFor(1000);await map(page);await page.locator('[data-island-id="activities"]').click();await page.clock.runFor(1000);const before = await frame(page);await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");await page.clock.runFor((before.duration - before.elapsed + 1.5) * 1000);await expect(page.locator("main")).toHaveAttribute("data-current-island","activities");await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");const after = await frame(page);expect(after.elapsed).toBeLessThan(before.duration + .3);expect(after.enabled).toBe(5);
});
