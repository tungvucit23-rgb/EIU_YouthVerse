import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const mobile = process.argv.includes("--mobile");
try {
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  page.on("console", (message) => { if (message.type() === "error") console.error(message.text().slice(0,1800)); });
  page.on("pageerror", (error) => console.error(error.message));
  await page.goto(process.argv[2] ?? "http://127.0.0.1:3001");
  await page.locator(".scene-loading").waitFor({ state: "hidden", timeout: 25000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: mobile ? "artifacts/mobile-redesign.png" : "artifacts/desktop-redesign.png" });
  console.log(JSON.stringify({ canvas: await page.locator("canvas").count(), fallback: await page.locator(".scene-fallback").count(), phase: await page.locator("main").getAttribute("data-phase"), metrics:await page.locator("canvas").evaluateAll((canvases) => canvases.map((canvas) => ({...canvas.dataset}))) }));
} finally {
  await browser.close();
}
