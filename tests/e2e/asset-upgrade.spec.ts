import {expect,test} from "@playwright/test";
import {mkdir,writeFile} from "node:fs/promises";

test("assets: exported models load, sails animate, and quality switches release cloned resources",async ({page},testInfo) => {
  const errors:string[] = [];page.on("pageerror",error => errors.push(error.message));
  await page.goto("/?inspect=1");const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-boat-loaded","true",{timeout:30000});
  await expect(canvas).toHaveAttribute("data-model-assets",/eiu-campus\.glb/);
  await expect(canvas).toHaveAttribute("data-model-assets",/islands\/activities\.glb/);
  await expect(canvas).toHaveAttribute("data-model-assets",/youthverse-explorer\.glb\?v=4/);
  await expect(canvas).toHaveAttribute("data-campus-architecture","true");
  const animation = async () => JSON.parse((await canvas.getAttribute("data-boat-animation"))!);
  const before = await animation();expect(before.main).toEqual(expect.any(Number));expect(before.jib).toEqual(expect.any(Number));
  await expect.poll(async () => (await animation()).main,{timeout:5000}).not.toBe(before.main);
  await expect.poll(async () => (await animation()).jib,{timeout:5000}).not.toBe(before.jib);
  await page.emulateMedia({reducedMotion:"reduce"});await page.waitForTimeout(300);
  const frozen = await animation();await page.waitForTimeout(400);expect((await animation()).main).toBe(frozen.main);
  await page.getByRole("button",{name:"Cài đặt đồ họa và hướng dẫn"}).click();
  // Warm legitimate distance-LOD caches before measuring a repeat cycle for resource growth.
  for(const name of [/Chi tiết/,/Tiết kiệm/,/Cân bằng/]) {await page.getByRole("radio",{name}).check();await page.waitForTimeout(650);}
  const baseline = Number(await canvas.getAttribute("data-geometries"));
  for(const name of [/Chi tiết/,/Tiết kiệm/,/Cân bằng/]) {await page.getByRole("radio",{name}).check();await page.waitForTimeout(650);}
  await page.keyboard.press("Escape");await page.waitForTimeout(500);
  const final = Number(await canvas.getAttribute("data-geometries"));expect(final).toBeLessThanOrEqual(baseline + 4);
  await expect(canvas).toHaveAttribute("data-enabled-island-count","9");
  const evidence = {before,animated:await animation(),frozen,baselineGeometries:baseline,finalGeometries:final,canvas:await canvas.evaluate(element => ({...element.dataset}))};
  await mkdir("artifacts/task02/after",{recursive:true});await writeFile("artifacts/task02/after/runtime-metrics.json",JSON.stringify(evidence,null,2));
  await testInfo.attach("asset-and-renderer-metrics",{body:JSON.stringify(evidence),contentType:"application/json"});
  expect(errors).toEqual([]);
});

test("assets: failed environment GLBs retain procedural architecture and navigation",async ({page}) => {
  await page.route("**/models/eiu-campus.glb",route => route.abort());
  await page.route("**/models/islands/activities.glb",route => route.abort());
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/?inspect=1");
  const canvas = page.locator("canvas");await expect(canvas).toHaveAttribute("data-boat-loaded","true",{timeout:30000});
  await expect(canvas).toHaveAttribute("data-campus-architecture","true");
  await expect(canvas).not.toHaveAttribute("data-model-assets",/eiu-campus|islands\/activities/);
  await expect(canvas).toHaveAttribute("data-enabled-island-count","9");
  await page.getByRole("button",{name:"Hải đồ · Danh sách điểm đến"}).click();
  await page.getByRole("dialog").locator('[data-island-id="activities"]').click();
  await expect(page.locator("main")).toHaveAttribute("data-current-island","activities",{timeout:15000});
  await expect(page.getByRole("dialog").getByRole("heading",{name:"Hoạt động Đoàn – Hội",exact:true})).toBeVisible();
  await expect(canvas).toHaveAttribute("data-enabled-island-count","9");
});
