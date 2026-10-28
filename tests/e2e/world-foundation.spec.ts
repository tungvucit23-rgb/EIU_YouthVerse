import {expect,test,type Page} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";
import {getIsland,islands,HOME_BOAT_POSITION} from "../../src/data/islands";
import {mapPoint,MAP_WIDTH,MAP_HEIGHT} from "../../src/lib/map-projection";
interface Island {id:string;uuid:string;enabled:boolean;inViewport:boolean;width:number;height:number;groundScreen:{x:number;y:number}}
interface Shot {phase:string;progress:number;elapsed:number;duration:number;roots:string;enabled:number;islands:Island[];anchor:{x:number;y:number};boat:{x:number;y:number;width:number;height:number};position:string;heading:number;behind:number;height:number;alignment:number;fov:number;water:number}
interface Audit {frames:number;roots:number;behind:number;anchor:number;empty:number;emptyRun:number;maxEmptyRun:number}
type QAWindow = Window & typeof globalThis & {chaseAudit?:Audit};
const sizes = [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}];
const routes = [{from:"campus",to:"news"},{from:"campus",to:"activities"},{from:"campus",to:"events"},{from:"campus",to:"office"},{from:"news",to:"clubs"},{from:"achievements",to:"resources"}] as const;
test.use({trace:"off"});
function rawProgress(p:number) {let a = 0,b = 1;for(let i = 0;i < 45;i++){const t = (a + b) / 2,v = t * t * t * (t * (t * 6 - 15) + 10);if(v < p) a = t;else b = t;}return (a + b) / 2;}
async function shot(page:Page):Promise<Shot> {return page.locator("canvas").evaluate(c => ({phase:document.querySelector("main")!.getAttribute("data-phase")!,progress:Number(c.dataset.journeyProgress),elapsed:Number(c.dataset.journeyElapsed),duration:Number(c.dataset.journeyDuration),roots:c.dataset.islandRootIds!,enabled:Number(c.dataset.enabledIslandCount),islands:JSON.parse(c.dataset.islandStates!),anchor:JSON.parse(c.dataset.boatAnchor!),boat:JSON.parse(c.dataset.boatScreen!),position:c.dataset.boatPosition!,heading:Number(c.dataset.boatHeading),behind:Number(c.dataset.cameraBehind),height:Number(c.dataset.cameraHeight),alignment:Number(c.dataset.cameraForwardAlignment),fov:Number(c.dataset.cameraFov),water:Number(c.dataset.boatWaterDistance)}));}
async function labels(page:Page,limit:number) {
 const rects = await page.locator(".island-label:visible").evaluateAll(elements => elements.map(e => {const r = e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));expect(rects.length).toBeLessThanOrEqual(limit);
 for(let i = 0;i < rects.length;i++) for(let j = i + 1;j < rects.length;j++){const a = rects[i],b = rects[j];expect(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y).toBe(false);}
 const boat = await page.locator("canvas").evaluate(c => JSON.parse(c.dataset.boatScreen!));
 for(const a of rects) expect(a.x < boat.x + boat.width && a.x + a.w > boat.x && a.y < boat.y + boat.height && a.y + a.h > boat.y).toBe(false);
}
async function map(page:Page) {
 await page.locator(".mobile-map-button:visible,.destination-picker-trigger:visible").first().click();await page.clock.runFor(400);
 await page.getByRole("dialog").evaluate(e => {for(const a of e.getAnimations({subtree:true})) if(a.effect?.getComputedTiming().iterations !== Infinity) a.finish();});
}
for(const size of sizes) test("third-person boat journey at " + size.width + "x" + size.height,async ({page},testInfo) => {
 test.setTimeout(480000);await page.setViewportSize(size);await page.clock.install();
 await page.addInitScript(() => {window.requestAnimationFrame = cb => window.setTimeout(() => cb(performance.now()),80);window.cancelAnimationFrame = id => clearTimeout(id);});
 const errors:string[] = [];page.on("pageerror",e => errors.push(e.message));page.on("console",m => {if(m.type() === "error") errors.push(m.text());});
 await page.goto("/?inspect=1");const canvas = page.locator("canvas");await expect(canvas).toHaveAttribute("data-boat-loaded","true",{timeout:30000});await page.waitForTimeout(1400);
 await expect(canvas).toHaveAttribute("data-camera-type","PerspectiveCamera");await expect(page.locator("main")).toHaveAttribute("data-at-launch","true");
 const first = await shot(page),handle = await canvas.elementHandle();expect(first.enabled).toBe(9);expect(first.islands).toHaveLength(9);expect(first.islands.find(i => i.id === "campus")!.inViewport).toBe(true);
 const directory = "artifacts/boat-centric/" + size.width;await mkdir(directory,{recursive:true});
 const capture = async (name:string) => page.screenshot({animations:"disabled",path:directory + "/" + name + ".png"});
 const check = async (s:Shot,panel = false) => {
  expect(s.enabled).toBe(9);expect(s.roots).toBe(first.roots);expect(s.islands.every(i => i.enabled)).toBe(true);
  expect(s.behind).toBeGreaterThan(2);expect(s.height).toBeGreaterThan(3);expect(s.height).toBeLessThan(10);expect(s.alignment).toBeGreaterThan(.7);
  expect(s.fov).toBeGreaterThanOrEqual(48);expect(s.fov).toBeLessThanOrEqual(74);
  expect(s.anchor.x / size.width).toBeGreaterThan(panel && size.width > 768 ? .15 : .22);expect(s.anchor.x / size.width).toBeLessThan(.78);
  expect(s.anchor.y).toBeGreaterThan(85);expect(s.anchor.y / size.height).toBeLessThan(.83);
  if(!panel) expect(s.anchor.y / size.height).toBeGreaterThan(.4);
  expect(s.boat.height).toBeGreaterThan(size.width < 768 ? 60 : 140);
  expect(await handle!.evaluate(e => e === document.querySelector("canvas"))).toBe(true);
 };
 await check(first);await labels(page,size.width < 768 ? 2 : 5);await capture("initial");
 await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 10000);
 await page.locator(".hero-introduction .primary-button").click();await page.clock.runFor(1200);await expect(page.locator("main")).toHaveAttribute("data-phase","SELECTING_DESTINATION");await capture("selection");
 await map(page);const diagram = (await page.locator(".archipelago-diagram").boundingBox())!;
 for(const island of islands){const r = (await page.locator('[data-island-id="' + island.id + '"]').boundingBox())!,p = mapPoint(island.position);expect(r.x + r.width / 2).toBeCloseTo(diagram.x + p.x / MAP_WIDTH * diagram.width,0);expect(r.y + r.height / 2).toBeCloseTo(diagram.y + p.y / MAP_HEIGHT * diagram.height,0);}
 const marker = page.getByTestId("map-boat-marker"),launch = mapPoint(HOME_BOAT_POSITION);expect(Number(await marker.getAttribute("cx"))).toBeCloseTo(launch.x,1);expect(Number(await marker.getAttribute("cy"))).toBeCloseTo(launch.y,1);
 await expect(page.locator('[data-island-id="campus"]')).toBeEnabled();await capture("map");
 await page.evaluate(roots => {const record = () => {const c = document.querySelector("canvas"),a = (window as QAWindow).chaseAudit;if(c && a && ["SAILING","APPROACHING","DOCKING"].includes(c.dataset.phase!)){a.frames++;if(c.dataset.enabledIslandCount !== "9" || c.dataset.islandRootIds !== roots) a.roots++;if(Number(c.dataset.cameraBehind) <= 0) a.behind++;const p = JSON.parse(c.dataset.boatAnchor!);if(p.x < 0 || p.x > innerWidth || p.y < 60 || p.y > innerHeight - 35) a.anchor++;if(!c.dataset.viewportIslands){a.empty++;a.emptyRun++;a.maxEmptyRun = Math.max(a.maxEmptyRun,a.emptyRun);}else a.emptyRun = 0;}requestAnimationFrame(record);};requestAnimationFrame(record);},first.roots);
 const reset = () => page.evaluate(() => {(window as QAWindow).chaseAudit = {frames:0,roots:0,behind:0,anchor:0,empty:0,emptyRun:0,maxEmptyRun:0};});
 const advance = async (p:number) => {const before = await shot(page),target = rawProgress(p) * before.duration + (p === 1 ? .1 : 0);await page.clock.runFor(Math.max(0,(target - before.elapsed) * 1000));const s = await shot(page);expect(s.progress).toBeCloseTo(p,1);await check(s);if(p < 1) expect(s.water).toBeLessThan(.35);return s;};
 const evidence:unknown[] = [];
 await reset();await page.locator('[data-island-id="campus"]').click();await page.clock.runFor(1000);await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
 const launchSamples:Shot[] = [];
 for(const p of [.1,.3,.5,.8,.96,1]) {const s = await advance(p);launchSamples.push(s);if(p === .5) await capture("mid-sailing");if(p === .8) await capture("approaching");if(p === .96) await capture("docking");if(p === 1) await capture("arrived");}
 await page.clock.runFor(1200);await expect(page.locator("main")).toHaveAttribute("data-at-launch","false");await expect(page.locator("main")).toHaveAttribute("data-current-island","campus");
 evidence.push({route:"launch-campus",samples:launchSamples,frames:await page.evaluate(() => (window as QAWindow).chaseAudit)});
 for(const route of routes){
  await page.evaluate(origin => {history.pushState({youthverse:true,view:"world",atLaunch:false},"","/?inspect=1" + (origin === "campus" ? "" : "#" + origin));dispatchEvent(new PopStateEvent("popstate"));},route.from);await page.clock.runFor(1600);
  await expect(page.locator("main")).toHaveAttribute("data-current-island",route.from);await map(page);await reset();await page.locator('[data-island-id="' + route.to + '"]').click();await page.clock.runFor(1000);await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
  const samples:Shot[] = [];for(const p of [.1,.3,.45,.6,.85,.96,1]){samples.push(await advance(p));if((size.width === 1440 && p === .45) || (route.to === "news" && p === .85)) await capture(route.from + "-" + route.to + "-" + Math.round(p * 100));}
  await page.clock.runFor(1400);await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");await expect(page.getByRole("dialog").locator("a.primary-button")).toHaveAttribute("href",getIsland(route.to).contentRoute);
  const open = await shot(page);await check(open,true);expect(open.islands.find(i => i.id === route.to)!.inViewport).toBe(true);
  const panel = (await page.getByRole("dialog").boundingBox())!;if(size.width < 768) expect(open.boat.y + open.boat.height).toBeLessThan(panel.y - 5);else expect(open.boat.x + open.boat.width).toBeLessThan(panel.x - 5);
  const angle = open.heading - getIsland(route.to).dockHeading;expect(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))).toBeLessThan(.18);
  if(route.to === "news" || size.width === 1440) await capture(route.from + "-" + route.to + "-panel");
  await page.keyboard.press("Escape");await page.clock.runFor(1000);await labels(page,size.width < 768 ? 2 : 5);await check(await shot(page));
  if(route.to === "news") await capture("arrived-closed");
  const frames = await page.evaluate(() => (window as QAWindow).chaseAudit!);expect(frames.frames).toBeGreaterThan(10);expect(frames.roots).toBe(0);expect(frames.behind).toBe(0);expect(frames.anchor).toBe(0);
  evidence.push({route,samples,open,closed:await shot(page),frames});
 }
 await writeFile(directory + "/navigation-evidence.json",JSON.stringify(evidence,null,2));await testInfo.attach("third-person-frames",{body:JSON.stringify(evidence),contentType:"application/json"});expect(errors).toEqual([]);
});
