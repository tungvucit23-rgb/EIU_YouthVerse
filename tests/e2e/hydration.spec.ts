import { expect, test, type Page } from "@playwright/test";

const hydrationWarning = /hydration|hydrated|server rendered HTML|didn't match/i;
function collectErrors(page:Page) {
  const errors:string[] = [];
  page.on("console",message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror",error => errors.push(error.message));
  return errors;
}
async function hydrateHome(page:Page) {
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Hoist the Sails"})).toBeVisible();
  // An interactive update proves hydration finished; waiting for SSR markup alone would miss the warning.
  await page.getByRole("button",{name:"Bắt đầu hành trình"}).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase","SELECTING_DESTINATION");
}

for (const scenario of [
  {name:"desktop",width:1440,height:900,reducedMotion:"no-preference",quality:"balanced"},
  {name:"reduced motion",width:1440,height:900,reducedMotion:"reduce",quality:"high"},
  {name:"mobile reduced motion",width:390,height:844,reducedMotion:"reduce",quality:"low"},
] as const) test("hydration: " + scenario.name,async ({page}) => {
  await page.setViewportSize({width:scenario.width,height:scenario.height});
  await page.emulateMedia({reducedMotion:scenario.reducedMotion});
  await page.addInitScript((quality) => localStorage.setItem("youthverse.graphics-quality",quality),scenario.quality);
  const errors = collectErrors(page);
  await hydrateHome(page);
  expect(errors.filter((message) => hydrationWarning.test(message))).toEqual([]);
  expect(errors).toEqual([]);
});

test("hydration: custom cursor root attributes survive without hiding component mismatches",async ({page}) => {
  await page.addInitScript(() => {
    const decorate = () => {
      for (const element of [document.documentElement,document.body]) {
        if (!element) continue;
        element.setAttribute("data-cc-prev-cursor",'{"prev":["",""],"ours":["crosshair","important"]}');
        element.style.setProperty("cursor","crosshair","important");
      }
      if (document.documentElement && document.body) observer.disconnect();
    };
    const observer = new MutationObserver(decorate);
    observer.observe(document,{childList:true,subtree:true}); decorate();
  });
  const errors = collectErrors(page);
  await hydrateHome(page);
  await expect(page.locator("html")).toHaveAttribute("data-cc-prev-cursor",/crosshair/);
  await expect(page.locator("body")).toHaveCSS("cursor","crosshair");
  await page.goto("/login");
  await page.getByRole("button",{name:"Hiện mật khẩu"}).click();
  await expect(page.getByLabel("Mật khẩu",{exact:true})).toHaveAttribute("type","text");
  expect(errors).toEqual([]);
});

test("hydration: a mismatch inside the application is still reported",async ({page}) => {
  await page.addInitScript(() => {
    const inject = () => {
      const heading = document.getElementById("hero-title");
      if (!heading) return;
      heading.setAttribute("data-hydration-probe","unexpected-external-change"); observer.disconnect();
    };
    const observer = new MutationObserver(inject);
    observer.observe(document,{childList:true,subtree:true}); inject();
  });
  const errors = collectErrors(page);
  await hydrateHome(page);
  expect(errors.some((message) => hydrationWarning.test(message) && message.includes("data-hydration-probe"))).toBe(true);
});
