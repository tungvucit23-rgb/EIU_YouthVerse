import { expect,test } from "@playwright/test";
import { campus,getIsland,islands } from "../../src/data/islands";
import { mapPoint,MAP_WIDTH,MAP_HEIGHT } from "../../src/lib/map-projection";

interface Rect { id?:string;x:number;y:number;width:number;height:number }
const sizes = [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}];
for (const viewport of sizes) test("foundation: composition, water, map and sailing at " + viewport.width + "×" + viewport.height,async ({page},testInfo) => {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => localStorage.setItem("youthverse.graphics-quality","low"));
  const errors:string[] = [];
  page.on("pageerror",error => errors.push(error.message));
  page.on("console",message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/?inspect=1");
  const canvas = page.locator("canvas");
  await expect(page.locator(".scene-loading")).toHaveCount(0,{timeout:30000});
  await expect(canvas).toHaveAttribute("data-boat-loaded","true");
  await expect(canvas).toHaveAttribute("data-detailed-islands",/activities.*clubs.*news.*volunteer/);
  await expect.poll(async () => {
    const rects:Rect[] = JSON.parse(await canvas.getAttribute("data-visible-islands") ?? "[]");
    return rects.length === (viewport.width < 768 ? 4 : 5) && rects.every((rect) => rect.x >= 15 && rect.y >= 90 && rect.x + rect.width <= viewport.width - 15 && rect.y + rect.height <= viewport.height - 95);
  }).toBe(true);
  const hero:Rect[] = JSON.parse((await canvas.getAttribute("data-visible-islands"))!);
  expect(hero.find((rect) => rect.id === "campus")!.width).toBeGreaterThan(Math.max(...hero.filter((rect) => rect.id !== "campus").map((rect) => rect.width)) * 1.8);
  expect(Number(await canvas.getAttribute("data-water-meshes"))).toBeLessThan(10);
  await page.screenshot({path:"artifacts/task01-" + viewport.width + "-home.png"});
  await page.getByRole("button",{name:"Bắt đầu hành trình"}).click();
  const openMap = async () => {
    await page.getByRole("button",{name:/^(Hải đồ · Danh sách điểm đến|Hải đồ)$/}).click();
    await page.getByRole("dialog").evaluate((element) => Promise.all(element.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished)));
  };
  await openMap();
  const diagram = await page.locator(".archipelago-diagram").boundingBox();
  for (const island of islands) {
    const node = page.locator('[data-island-id="' + island.id + '"]'),bounds = await node.boundingBox(),point = mapPoint(island.position);
    expect(bounds).not.toBeNull();
    expect(bounds!.x + bounds!.width / 2).toBeCloseTo(diagram!.x + point.x / MAP_WIDTH * diagram!.width,0);
    expect(bounds!.y + bounds!.height / 2).toBeCloseTo(diagram!.y + point.y / MAP_HEIGHT * diagram!.height,0);
  }
  const home = mapPoint(campus.dockingPoint),marker = page.getByTestId("map-boat-marker");
  await expect.poll(async () => Math.abs(Number(await marker.getAttribute("cx")) - home.x)).toBeLessThan(.1);
  await expect.poll(async () => Math.abs(Number(await marker.getAttribute("cy")) - home.y)).toBeLessThan(.1);
  await page.getByRole("dialog").getByRole("button",{name:"Căng buồm đến Tin tức – Thông báo",exact:true}).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
  await openMap();
  await expect(page.locator('[data-island-id="news"]')).toHaveAttribute("data-selected","true");
  expect(await page.locator(".map-route.is-active").count()).toBeGreaterThan(2);
  await page.screenshot({path:"artifacts/task01-" + viewport.width + "-map-route.png"});
  await page.getByRole("button",{name:"Đóng hải đồ"}).click();
  const samples:Record<string,string>[] = [];
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(500);
    const sample = await canvas.evaluate((element) => ({position:element.dataset.boatPosition!,heading:element.dataset.boatHeading!,zoom:element.dataset.cameraZoom!,waterDistance:element.dataset.boatWaterDistance!,phase:document.querySelector("main")!.getAttribute("data-phase")!}));
    samples.push(sample);
    expect(Number(sample.zoom)).toBeGreaterThan(8); expect(Number(sample.zoom)).toBeLessThan(110);
    if (["SAILING","APPROACHING","DOCKING"].includes(sample.phase)) expect(Number(sample.waterDistance)).toBeLessThan(.3);
  }
  expect(new Set(samples.map((sample) => sample.position)).size).toBeGreaterThan(1);
  await page.screenshot({path:"artifacts/task01-" + viewport.width + "-sailing.png"});
  await expect(page.getByRole("dialog").getByRole("heading",{name:"Tin tức – Thông báo",exact:true})).toBeVisible({timeout:40000});
  const panel = await page.getByRole("dialog").boundingBox();
  await expect.poll(async () => {
    const rects:Rect[] = JSON.parse(await canvas.getAttribute("data-visible-islands") ?? "[]");
    const boat:Rect = JSON.parse(await canvas.getAttribute("data-boat-screen") ?? "{}");
    return rects.length === 1 && rects[0].id === "news" && [...rects,boat].every((rect) => rect.x >= 10 && rect.y >= 85 && rect.x + rect.width <= (viewport.width < 768 ? viewport.width - 10 : panel!.x - 10) && rect.y + rect.height <= (viewport.width < 768 ? panel!.y - 8 : viewport.height - 85));
  },{timeout:10000}).toBe(true);
  const heading = Number(await canvas.getAttribute("data-boat-heading")) - getIsland("news").dockHeading;
  expect(Math.abs(Math.atan2(Math.sin(heading),Math.cos(heading)))).toBeLessThan(.18);
  await page.screenshot({path:"artifacts/task01-" + viewport.width + "-arrival.png"});
  await testInfo.attach("navigation-samples",{body:JSON.stringify(samples),contentType:"application/json"});
  await page.getByRole("dialog").locator("a.primary-button").click();
  await expect(page).toHaveURL(/\/news$/); await expect(page.locator("canvas")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
