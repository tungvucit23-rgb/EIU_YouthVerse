import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";
const stage = process.argv[2] ?? "after";
if (!["before","after"].includes(stage)) throw new Error("Choose before or after");
const browser = await chromium.launch({channel:"msedge",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const observations = [];
try {
  for (const viewport of [{width:1440,height:900},{width:1920,height:1080},{width:390,height:844}]) {
    const page = await browser.newPage({viewport});
    const errors = []; page.on("pageerror",error => errors.push(error.message));
    const directory = "artifacts/task02/" + stage + "/" + viewport.width; await mkdir(directory,{recursive:true});
    for (const view of process.argv.includes("--boat-only") ? ["boat"] : ["boat","campus","entrance","activities"]) {
      await page.goto("http://127.0.0.1:4174/scripts/review/?view=" + view + (stage === "before" ? "&baseline=1" : ""));
      await page.waitForFunction(() => Number(JSON.parse(document.querySelector("canvas")?.dataset.metrics ?? "{}").geometries) > 0);
      if (view === "boat") await page.waitForFunction(() => JSON.parse(document.querySelector("canvas").dataset.metrics).boat);
      await page.waitForTimeout(1500);
      if(errors.length) throw new Error(errors.join("\n"));
      await page.screenshot({path:directory + "/" + view + ".jpg",type:"jpeg",quality:90});
      const metrics = await page.locator("canvas").evaluate(canvas => JSON.parse(canvas.dataset.metrics));
      observations.push({viewport,view,...metrics}); console.log(stage,viewport.width,view,JSON.stringify(metrics));
    }
    await page.close();
  }
  if (!process.argv.includes("--boat-only")) await writeFile("artifacts/task02/" + stage + "/review-metrics.json",JSON.stringify(observations,null,2));
} finally {await browser.close();}
