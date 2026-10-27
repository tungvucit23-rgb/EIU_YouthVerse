import { expect,test,type Page } from "@playwright/test";
import { mkdir,writeFile } from "node:fs/promises";
import { allIslandIds,campus,getIsland,islands } from "../../src/data/islands";
import { MAP_HEIGHT,MAP_WIDTH,mapPoint } from "../../src/lib/map-projection";

interface IslandState {id:string;uuid:string;enabled:boolean;inFrustum:boolean;inViewport:boolean;visibleFraction:number;lod:string;detailLoaded:boolean;x:number;y:number;width:number;height:number}
interface Snapshot {progress:number;elapsed:number;duration:number;phase:string;enabled:number;islands:IslandState[];roots:string;viewport:string;zoom:number;boat:{x:number;y:number;width:number;height:number};position:string;heading:number;water:number;loaded:string}
interface FrameAudit {frames:number;rootViolations:number;emptyViewportFrames:number;minViewport:number;maxZoomStep:number;lastZoom:number|null}
type AuditWindow = Window & typeof globalThis & {worldAudit?:FrameAudit};
const routes = [
  {from:"campus",to:"news"},{from:"campus",to:"activities"},{from:"campus",to:"events"},
  {from:"campus",to:"office"},{from:"news",to:"clubs"},{from:"achievements",to:"resources"},
] as const;
const milestones = [.1,.3,.45,.6,.7,.85,1];
test.use({trace:"off"});
const inverseEase = (progress:number) => {
  let low = 0,high = 1;
  for (let i = 0; i < 48; i++) { const t = (low + high) / 2,value = t * t * t * (t * (t * 6 - 15) + 10); if (value < progress) low = t; else high = t; }
  return (low + high) / 2;
};
async function snapshot(page:Page):Promise<Snapshot> {
  return page.locator("canvas").evaluate((canvas) => ({
    progress:Number(canvas.dataset.journeyProgress),elapsed:Number(canvas.dataset.journeyElapsed),duration:Number(canvas.dataset.journeyDuration),
    phase:canvas.dataset.phase!,enabled:Number(canvas.dataset.enabledIslandCount),islands:JSON.parse(canvas.dataset.islandStates!),
    roots:canvas.dataset.islandRootIds!,viewport:canvas.dataset.viewportIslands!,zoom:Number(canvas.dataset.cameraZoom),
    boat:JSON.parse(canvas.dataset.boatScreen!),position:canvas.dataset.boatPosition!,heading:Number(canvas.dataset.boatHeading),
    water:Number(canvas.dataset.boatWaterDistance),loaded:canvas.dataset.loadedDetailedIslands!,
  }));
}
async function checkLabels(page:Page,limit:number) {
  const labels = await page.locator(".island-label:visible").evaluateAll((elements) => elements.map((element) => {
    const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};
  }));
  expect(labels.length).toBeLessThanOrEqual(limit);
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i],b = labels[j];
    expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y).toBe(false);
  }
}
async function finishDialogAnimation(page:Page) {
  await page.getByRole("dialog").evaluate((element) => {
    for (const animation of element.getAnimations({subtree:true})) if (animation.effect?.getComputedTiming().iterations !== Infinity) animation.finish();
  });
}

for (const viewport of [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}]) test("continuous world: six routes at " + viewport.width + "×" + viewport.height,async ({page},testInfo) => {
  test.setTimeout(420000);
  await page.setViewportSize(viewport);
  // Browser time control freezes genuine R3F frames at exact progress; it never changes journey or island data.
  await page.clock.install();
  // Exercise a consistent 12.5 FPS browser cadence on software WebGL, within SailingClock's 100ms delta cap.
  await page.addInitScript(() => {
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(performance.now()),80);
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
  });
  const errors:string[] = [];
  page.on("pageerror",error => errors.push(error.message));
  page.on("console",message => {if (message.type() === "error") errors.push(message.text());});
  await page.goto("/?inspect=1");
  await expect(page.locator(".scene-loading")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("canvas")).toHaveAttribute("data-enabled-island-count","9");
  await expect(page.locator("canvas")).toHaveAttribute("data-boat-loaded","true");
  await page.waitForTimeout(1400);
  const initial = await snapshot(page),canvas = await page.locator("canvas").elementHandle();
  expect(initial.enabled).toBe(9); expect(initial.islands).toHaveLength(9);
  if (viewport.width > 768) {
    const identifiable = initial.islands.filter((island) => island.id !== "campus" && island.inViewport && island.visibleFraction > .65 && island.width > 60);
    expect(identifiable.length).toBeGreaterThanOrEqual(5);
    expect(initial.islands.find((island) => island.id === "campus")!.width).toBeGreaterThan(Math.max(...identifiable.map((island) => island.width)) * 1.25);
  }
  await checkLabels(page,viewport.width < 768 ? 2 : 5);
  const directory = "artifacts/continuous/" + viewport.width;
  await mkdir(directory,{recursive:true});
  await page.screenshot({animations:"disabled",path:directory + "/home.png"});
  // Leave enough wall-clock headroom for the 1920px software renderer before freezing browser time.
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 10000);
  await page.evaluate((roots) => {
    const capture = () => {
      const canvas = document.querySelector("canvas"),audit = (window as AuditWindow).worldAudit;
      if (canvas && audit && ["SAILING","APPROACHING","DOCKING"].includes(canvas.dataset.phase!)) {
        const count = canvas.dataset.viewportIslands?.split(",").filter(Boolean).length ?? 0,zoom = Number(canvas.dataset.cameraZoom);
        audit.frames++; audit.minViewport = Math.min(audit.minViewport,count);
        if (canvas.dataset.enabledIslandCount !== "9" || canvas.dataset.islandRootIds !== roots) audit.rootViolations++;
        if (!count) audit.emptyViewportFrames++;
        if (audit.lastZoom !== null) audit.maxZoomStep = Math.max(audit.maxZoomStep,Math.abs(zoom - audit.lastZoom));
        audit.lastZoom = zoom;
      }
      requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  },initial.roots);
  const evidence:unknown[] = [];
  for (const route of routes) {
    await page.evaluate((origin) => {
      history.pushState({youthverse:true,view:"world"},"","/?inspect=1" + (origin === "campus" ? "" : "#" + origin));
      dispatchEvent(new PopStateEvent("popstate"));
    },route.from);
    await page.clock.runFor(1000);
    await expect(page.locator("main")).toHaveAttribute("data-current-island",route.from);
    await page.getByRole("button",{name:/^(Hải đồ · Danh sách điểm đến|Hải đồ)$/}).click();
    await page.clock.runFor(400);
    await finishDialogAnimation(page);
    if (route.to === "news") {
      const diagram = (await page.locator(".archipelago-diagram").boundingBox())!;
      for (const island of islands) {
        const bounds = (await page.locator('[data-island-id="' + island.id + '"]').boundingBox())!,point = mapPoint(island.position);
        expect(bounds.x + bounds.width / 2).toBeCloseTo(diagram.x + point.x / MAP_WIDTH * diagram.width,0);
        expect(bounds.y + bounds.height / 2).toBeCloseTo(diagram.y + point.y / MAP_HEIGHT * diagram.height,0);
      }
      const berth = mapPoint(campus.dockingPoint),marker = page.getByTestId("map-boat-marker");
      expect(Number(await marker.getAttribute("cx"))).toBeCloseTo(berth.x,1);
      expect(Number(await marker.getAttribute("cy"))).toBeCloseTo(berth.y,1);
    }
    await page.evaluate(() => { (window as AuditWindow).worldAudit = {frames:0,rootViolations:0,emptyViewportFrames:0,minViewport:9,maxZoomStep:0,lastZoom:null}; });
    await page.getByRole("dialog").locator('[data-island-id="' + route.to + '"]').click();
    await page.clock.runFor(240);
    await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
    if (route.to === "news") {
      await page.getByRole("button",{name:/^(Hải đồ · Danh sách điểm đến|Hải đồ)$/}).click();
      await page.clock.runFor(160); await finishDialogAnimation(page);
      await expect(page.locator('[data-island-id="news"]')).toHaveAttribute("data-selected","true");
      expect(await page.locator(".map-route.is-active").count()).toBeGreaterThan(2);
      const marker = page.getByTestId("map-boat-marker"),x = await marker.getAttribute("cx"),y = await marker.getAttribute("cy");
      await page.clock.runFor(160);
      expect([await marker.getAttribute("cx"),await marker.getAttribute("cy")]).not.toEqual([x,y]);
      await page.getByRole("dialog").locator(".dialog-heading button").click();
      await page.clock.runFor(80);
    }
    const tripSamples:Snapshot[] = [];
    for (const progress of milestones) {
      const before = await snapshot(page);
      const target = inverseEase(progress) * before.duration + (progress === 1 ? .04 : 0);
      await page.clock.runFor(Math.max(0,(target - before.elapsed) * 1000));
      const current = await snapshot(page); tripSamples.push(current);
      expect(current.progress).toBeCloseTo(progress,1);
      expect(current.enabled).toBe(9); expect(current.islands).toHaveLength(9);
      expect(current.islands.every((island) => island.enabled)).toBe(true);
      expect(current.roots).toBe(initial.roots);
      expect(current.islands.some((island) => island.inViewport)).toBe(true);
      expect(current.zoom).toBeGreaterThan(8); expect(current.zoom).toBeLessThan(110);
      const boat = current.boat;
      expect(boat.x + boat.width / 2).toBeGreaterThan(0); expect(boat.x + boat.width / 2).toBeLessThan(viewport.width);
      expect(boat.y + boat.height / 2).toBeGreaterThan(70); expect(boat.y + boat.height / 2).toBeLessThan(viewport.height - 40);
      expect(boat.height).toBeGreaterThan(viewport.width < 768 ? 40 : 80);
      if (current.phase !== "ARRIVED" && current.phase !== "EXPLORING_CONTENT") expect(current.water).toBeLessThan(.35);
      expect(await canvas!.evaluate((element) => element === document.querySelector("canvas"))).toBe(true);
      await checkLabels(page,viewport.width < 768 ? 2 : 5);
      if ((route.to === "news" && [.3,.45,.7,.85].includes(progress)) || (viewport.width === 1440 && progress === .45)) {
        await page.screenshot({animations:"disabled",path:directory + "/" + route.from + "-" + route.to + "-" + Math.round(progress * 100).toString().padStart(3,"0") + ".png"});
      }
    }
    await page.clock.runFor(1000);
    await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");
    await expect(page.getByRole("dialog").locator("a.primary-button")).toHaveAttribute("href",getIsland(route.to).contentRoute);
    const open = await snapshot(page);
    await finishDialogAnimation(page);
    const panel = (await page.getByRole("dialog").boundingBox())!;
    expect(open.enabled).toBe(9); expect(open.roots).toBe(initial.roots);
    expect(open.islands.find((island) => island.id === route.to)!.inViewport).toBe(true);
    expect(open.islands.filter((island) => island.inFrustum).every((island) => island.enabled)).toBe(true);
    for (const rect of [open.boat,open.islands.find((island) => island.id === route.to)!]) {
      expect(rect.x).toBeGreaterThanOrEqual(8); expect(rect.y).toBeGreaterThanOrEqual(82);
      expect(rect.x + rect.width).toBeLessThan(viewport.width < 768 ? viewport.width - 8 : panel.x - 8);
      expect(rect.y + rect.height).toBeLessThan(viewport.width < 768 ? panel.y - 8 : viewport.height - 80);
    }
    const angle = open.heading - getIsland(route.to).dockHeading;
    expect(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))).toBeLessThan(.18);
    if (viewport.width === 1440 || route.to === "news") await page.screenshot({animations:"disabled",path:directory + "/" + route.from + "-" + route.to + "-arrived-open.png"});
    await page.keyboard.press("Escape");
    await page.clock.runFor(1000);
    const closed = await snapshot(page);
    expect(closed.enabled).toBe(9); expect(closed.roots).toBe(initial.roots);
    if (viewport.width >= 768) expect(closed.islands.filter((island) => island.inViewport).length).toBeGreaterThan(1);
    await checkLabels(page,viewport.width < 768 ? 2 : 5);
    if (viewport.width === 1440 || route.to === "news") await page.screenshot({animations:"disabled",path:directory + "/" + route.from + "-" + route.to + "-arrived-closed.png"});
    const frames = await page.evaluate(() => (window as AuditWindow).worldAudit!);
    expect(frames.frames).toBeGreaterThan(8); expect(frames.rootViolations).toBe(0); expect(frames.emptyViewportFrames).toBe(0);
    expect(frames.maxZoomStep).toBeLessThan(16);
    evidence.push({route,samples:tripSamples,open,closed,frames});
  }
  await writeFile(directory + "/navigation-evidence.json",JSON.stringify(evidence,null,2));
  await testInfo.attach("continuous-world-milestones",{body:JSON.stringify(evidence),contentType:"application/json"});
  expect(new Set(allIslandIds).size).toBe(9);
  expect(errors).toEqual([]);
});
