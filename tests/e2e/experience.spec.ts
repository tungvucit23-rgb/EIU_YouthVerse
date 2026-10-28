import {destinations as worldDestinations,getDestination,parentIslandForSection} from "../../src/data/islands";
import {portalSections} from "../../src/data/portal-sections";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const islands = worldDestinations.map(i=>({id:i.id,title:i.fullTitle,route:i.contentRoute}));
async function ready(page:Page) {
  await expect(page.locator(".scene-loading")).toHaveCount(0,{timeout:30000});
  await expect(page.locator("canvas")).toHaveAttribute("data-boat-loaded","true",{timeout:30000});
}
async function map(page:Page) {
  await page.getByRole("button",{name:/^(Hải đồ · Danh sách điểm đến|Hải đồ)$/}).click();
  await expect(page.getByRole("dialog",{name:"Hải đồ của những chân trời."})).toBeVisible();
}
async function choose(page:Page,title:string) {
  await page.getByRole("dialog").getByRole("button",{name:"Căng buồm đến " + title,exact:true}).click();
}
async function arrived(page:Page,id:string,title:string) {
  await expect(page.locator("main")).toHaveAttribute("data-current-island",id,{timeout:120000});
  await expect(page.getByRole("dialog").getByRole("heading",{name:title,exact:true})).toBeVisible({timeout:40000});
  await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");
}

test("desktop: real boat, raycasting, graph sailing, map during travel and return",async ({page},testInfo) => {
  test.setTimeout(240000); // Full-length calm routes run slower on software WebGL.
  const errors:string[] = [];
  page.on("pageerror",error => errors.push(error.message));
  page.on("console",message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/?inspect=1");
  await ready(page);
  await expect(page.locator("canvas")).toHaveAttribute("data-islands","5");
  await expect(page.locator("canvas")).toHaveAttribute("data-loaded-detailed-islands",/activities.*campus.*clubs/);
  await expect(page.getByRole("heading",{name:"Hoist the Sails"})).toBeVisible();
  await expect(page.locator("header").getByRole("link")).toHaveCount(2);
  await page.screenshot({path:"artifacts/desktop-home.png"});
  await testInfo.attach("initial-renderer-metrics",{body:JSON.stringify(await page.locator("canvas").evaluate(canvas => ({...canvas.dataset}))),contentType:"application/json"});
  await page.getByRole("button",{name:"Bắt đầu hành trình"}).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase","SELECTING_DESTINATION");
  await page.waitForTimeout(1300);
  expect(await page.locator(".island-label:visible").count()).toBeLessThanOrEqual(5);
  await page.screenshot({path:"artifacts/desktop-overview.png"});
  const island = await page.locator("canvas").evaluate((canvas) => (JSON.parse(canvas.dataset.islandStates!) as {id:string;groundScreen:{x:number;y:number}}[]).find((entry) => entry.id === "activities")!);
  const before = await page.locator("canvas").getAttribute("data-boat-position");
  await page.mouse.click(island.groundScreen.x,island.groundScreen.y);
  await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
  await expect.poll(() => page.locator("canvas").getAttribute("data-boat-position")).not.toBe(before);
  await page.screenshot({path:"artifacts/desktop-sailing.png"});
  await map(page);
  await expect(page.locator(".map-island-node")).toHaveCount(5);
  await expect(page.getByRole("dialog").getByRole("button",{name:"Căng buồm đến Văn phòng điện tử",exact:true})).toBeDisabled();
  const marker = page.getByTestId("map-boat-marker");
  const markerPosition = () => Promise.all([marker.getAttribute("cx"),marker.getAttribute("cy")]);
  const beforeMarker = await markerPosition();
  await expect.poll(markerPosition).not.toEqual(beforeMarker);
  await arrived(page,"activities","Đoàn – Hội & Hoạt động");
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.waitForTimeout(700);
  await page.screenshot({path:"artifacts/desktop-arrival.png"});
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveAttribute("data-phase","SELECTING_DESTINATION");
  await expect(page.locator("main")).toHaveAttribute("data-current-island","activities");
  await expect(page.getByRole("button",{name:"Hải đồ · Danh sách điểm đến",exact:true})).toBeFocused();
  await page.getByRole("button",{name:"Trở về EIU",exact:true}).click();
  await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
  await expect(page.locator("main")).toHaveAttribute("data-current-island","campus",{timeout:120000});
  await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");
  expect(errors).toEqual([]);
});

test("all four destinations: continuous island travel, correct panels and one persistent canvas",async ({page}) => {
  test.setTimeout(240000);
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(() => localStorage.setItem("youthverse.graphics-quality","low"));
  await page.goto("/?inspect=1");
  await ready(page);
  const canvas = await page.locator("canvas").elementHandle();
  for (const island of islands) {
    await map(page);
    await choose(page,island.title);
    await arrived(page,island.id,island.title);
    await expect(page.locator("canvas")).toHaveAttribute("data-detailed-islands",new RegExp(island.id));
    await expect(page.getByRole("dialog").locator("a.primary-button")).toHaveAttribute("href",island.route);
    expect(await canvas!.evaluate(element => element === document.querySelector("canvas"))).toBe(true);
    if (island.id === "achievements") await page.screenshot({path:"artifacts/island-achievements.png"});
    await page.keyboard.press("Escape");
    await expect(page.locator("main")).toHaveAttribute("data-current-island",island.id);
    await expect(page.locator("main")).toHaveAttribute("data-phase","SELECTING_DESTINATION");
  }
  await map(page);
  await page.screenshot({path:"artifacts/archipelago-map.png"});
  await page.getByRole("dialog").getByRole("button",{name:"Căng buồm trở về EIU Grand Campus"}).click();
  await expect(page.locator("main")).toHaveAttribute("data-current-island","campus",{timeout:20000});
});

test("history: interrupt a trip, back, forward and direct links",async ({page}) => {
  await page.goto("/?inspect=1");
  await ready(page);
  await map(page); await choose(page,"Đoàn – Hội & Hoạt động");
  await expect(page.locator("main")).toHaveAttribute("data-phase","SAILING");
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-current-island","campus");
  await expect(page.locator("main")).toHaveAttribute("data-at-launch","true");
  await page.waitForTimeout(600);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goForward(); await arrived(page,"activities","Đoàn – Hội & Hoạt động");
  await page.keyboard.press("Escape");
  await map(page); await choose(page,"Văn phòng điện tử");
  await page.goBack();
  await expect(page.locator("main")).toHaveAttribute("data-current-island","activities");
  await expect(page.locator("main")).toHaveAttribute("data-phase","SELECTING_DESTINATION");
  await page.goForward(); await arrived(page,"office","Văn phòng điện tử");
  await page.goto("/?inspect=1#clubs");
  await arrived(page,"clubs","Câu lạc bộ & Cộng đồng");
  await page.getByRole("link",{name:"Khám phá câu lạc bộ",exact:true}).click();
  await expect(page).toHaveURL(/\/clubs$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.goto("/?inspect=1#campus");
  await ready(page);
  await expect(page.locator("main")).toHaveAttribute("data-at-launch","false");
  const berth = (await page.locator("canvas").getAttribute("data-boat-position"))!.split(",");
  await page.evaluate(() => history.replaceState({youthverse:true,view:"world",atLaunch:false},"","/?inspect=1"));
  await page.reload(); await ready(page);
  await expect(page.locator("main")).toHaveAttribute("data-at-launch","false");
  // The hull bobs vertically; its horizontal berth must survive reload exactly.
  await expect.poll(async () => {
    const position = (await page.locator("canvas").getAttribute("data-boat-position"))!.split(",");
    return [position[0],position[2]];
  }).toEqual([berth[0],berth[2]]);
});

test("mobile: map, docking sheet, graphics and lightweight navigation",async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/?inspect=1"); await ready(page);
  await expect(page.locator("canvas")).toHaveAttribute("data-quality","low");
  await expect(page.locator("canvas")).toHaveAttribute("data-loaded-detailed-islands",/activities.*campus.*clubs/);
  await page.screenshot({path:"artifacts/mobile-home.png"});
  await page.getByRole("button",{name:"Bắt đầu hành trình"}).click();
  await map(page); await choose(page,"Văn phòng điện tử");
  await arrived(page,"office","Văn phòng điện tử");
  await page.screenshot({path:"artifacts/mobile-arrival.png"});
  const bounds = await page.getByRole("dialog").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Cài đặt đồ họa"}).click();
  await page.getByRole("radio",{name:/Chi tiết/}).check();
  await page.getByRole("button",{name:"Dùng hải đồ nhẹ, không cần 3D"}).click();
  await expect(page.locator(".lightweight-world")).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-current-island","office");
  await map(page); await choose(page,"Câu lạc bộ & Cộng đồng");
  await arrived(page,"clubs","Câu lạc bộ & Cộng đồng");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("no WebGL: keyboard search, locked service and all five map nodes",async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this:HTMLCanvasElement,type:string,...args:unknown[]) {
      if (type.startsWith("webgl") || type === "experimental-webgl") return null;
      return Reflect.apply(original,this,[type,...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".lightweight-world")).toBeVisible({timeout:30000});
  await page.getByRole("button",{name:"Hải đồ · Danh sách điểm đến",exact:true}).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".map-island-node")).toHaveCount(5);
  await page.getByRole("button",{name:"Xem danh sách điểm đến",exact:true}).click();
  await expect(page.locator(".archipelago-list li")).toHaveCount(5);
  await page.getByRole("searchbox",{name:"Tìm đảo trên hải đồ"}).fill("van phong");
  await expect(page.locator(".archipelago-list li")).toHaveCount(2);
  await page.getByRole("dialog").getByRole("button",{name:/05 Văn phòng điện tử/}).focus();
  await page.keyboard.press("Enter");
  await arrived(page,"office","Văn phòng điện tử");
  await expect(page.getByRole("dialog")).toContainText("Cần quyền cán bộ");
});

test("content: existing filters, calendar, resources, locked data and all ten routes",async ({page}) => {
  await page.goto("/activities");
  await expect(page.locator(".back-to-world")).toHaveAttribute("href","/#activities");
  await page.getByRole("button",{name:"Cộng đồng",exact:true}).click();
  await expect(page.locator("article.content-card")).toHaveCount(2);
  await page.getByRole("searchbox").fill("không có kết quả");
  await expect(page.getByRole("heading",{name:"Một chân trời khác đang chờ."})).toBeVisible();
  await page.getByRole("button",{name:"Xem lại tất cả"}).click();
  await expect(page.locator("article.content-card")).toHaveCount(4);
  for (const route of ["news","clubs","journey","events","volunteer","office","achievements","resources","login"]) {
    const response = await page.goto("/" + route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("canvas")).toHaveCount(0);
    const section = portalSections.find(s => s.id === route);
    if(section) await expect(page.locator(".back-to-world")).toHaveAttribute("href","/#" + parentIslandForSection(section.id));
  }
  await page.getByLabel("Email sinh viên").fill("demo@example.com");
  await page.getByLabel("Mật khẩu",{exact:true}).fill("example-only");
  await page.getByRole("button",{name:"Xem trước đăng nhập"}).click();
  await expect(page.getByRole("status")).toContainText("Chưa có phiên đăng nhập được tạo");
  await page.goto("/events");
  await expect(page.locator(".calendar-selection article")).toHaveCount(3);
  await page.locator('[data-calendar-date="2026-11-09"]').click();
  await expect(page.locator(".calendar-selection article")).toHaveCount(1);
  await page.getByRole("button",{name:"Xem sự kiện"}).click();
  await expect(page.getByRole("dialog")).toContainText("Chưa có địa điểm");
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Tháng sau"}).click();
  await expect(page.locator(".calendar-selection article")).toHaveCount(0);
  await page.getByRole("button",{name:"Về tháng minh họa"}).click();
  await expect(page.locator(".calendar-selection article")).toHaveCount(3);
  await page.goto("/resources");
  await page.getByRole("button",{name:/Đọc nội dung: La bàn sinh viên/}).click();
  const download = page.waitForEvent("download");
  await page.getByRole("link",{name:"Tải tài liệu Markdown minh họa"}).click();
  expect((await download).suggestedFilename()).toBe("student-compass-demo.md");
  await page.goto("/office");
  await expect(page.locator(".access-notice")).toContainText("chưa kết nối xác thực");
  await page.getByRole("button",{name:"Thông tin truy cập: Tài liệu tổ chức"}).click();
  await expect(page.getByRole("dialog").locator(".access-notice")).toBeVisible();
  await page.goto("/achievements");
  await page.getByRole("button",{name:"Thông tin truy cập: Điểm rèn luyện cá nhân"}).click();
  await expect(page.getByRole("dialog")).toContainText("Thông tin cá nhân cần đăng nhập");
});

test("accessibility, quality persistence and narrow layouts",async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/?inspect=1"); await ready(page);
  const check = async () => {
    const result = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    expect(result.violations.map(item => ({id:item.id,nodes:item.nodes.map(node => ({target:node.target,summary:node.failureSummary}))}))).toEqual([]);
  };
  await check(); await map(page); await check();
  await choose(page,"Câu lạc bộ & Cộng đồng"); await arrived(page,"clubs","Câu lạc bộ & Cộng đồng"); await check();
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:"Cài đặt đồ họa và hướng dẫn"}).click();
  for (const [label,value] of [["Thấp","low"],["Chi tiết","high"],["Cân bằng","balanced"]]) {
    await page.getByRole("radio",{name:new RegExp(label)}).check();
    await expect(page.locator("canvas")).toHaveAttribute("data-quality",value,{timeout:20000});
  }
  await page.getByRole("radio",{name:/Thấp/}).check();
  await page.reload(); await ready(page);
  await expect(page.locator("canvas")).toHaveAttribute("data-quality","low");
  for (const [width,height,name] of [[820,1180,"tablet"],[320,740,"small-phone"]] as const) {
    await page.setViewportSize({width,height});
    await page.goto("/?inspect=1"); await ready(page);
    await page.screenshot({path:"artifacts/" + name + "-home.png"});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await map(page);
    const bounds = await page.getByRole("dialog").boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
  }
  await page.goto("/office"); await check();
  await page.goto("/login"); await check();
});

test("legacy world links map to five parents while original content stays accessible",async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/?inspect=1");await ready(page);
  const roots = await page.locator("canvas").getAttribute("data-island-root-ids");
  for(const [legacy,parent] of [["news","campus"],["events","activities"],["volunteer","activities"],["resources","clubs"]] as const) {
    await page.evaluate(hash => {location.hash = hash;},legacy);
    await expect(page).toHaveURL(new RegExp("#" + parent + "$"));
    await expect(page.locator("main")).toHaveAttribute("data-current-island",parent);
    await expect(page.locator(".island-info-panel h2")).toHaveText(getDestination(parent)!.fullTitle);
    await expect(page.locator('.island-feature-links a[href="/' + legacy + '"]')).toBeVisible();
    await expect(page.locator("canvas")).toHaveAttribute("data-enabled-island-count","5");
    await expect(page.locator("canvas")).toHaveAttribute("data-island-root-ids",roots!);
  }
  await page.keyboard.press("Escape");await map(page);
  for(const [section,parent] of [["volunteer","activities"],["resources","clubs"]]) {
    await page.locator(".map-search input").fill(section);await expect(page.locator(".map-island-node")).toHaveCount(2);await expect(page.locator('[data-island-id="' + parent + '"]')).toBeVisible();
  }
});

test("optional direct navigation persists and keeps the existing scene",async ({page}) => {
  await page.goto("/?inspect=1");await ready(page);const canvas = await page.locator("canvas").elementHandle();
  await page.locator(".footer-signature").click();await page.locator(".navigation-comfort input").check();
  expect(await page.evaluate(() => localStorage.getItem("youthverse.navigation-mode"))).toBe("direct");await page.keyboard.press("Escape");
  await map(page);await page.locator(".map-view-buttons button").last().click();await expect(page.locator(".destination-number")).toHaveText(["01","02","03","04","05"]);await page.locator(".map-view-buttons button").first().click();await page.locator('[data-island-id="office"]').click();await expect(page.locator("main")).toHaveAttribute("data-phase","EXPLORING_CONTENT");await expect(page.locator("main")).toHaveAttribute("data-current-island","office");expect(await canvas!.evaluate(c => c === document.querySelector("canvas"))).toBe(true);
  await page.reload();await ready(page);await page.keyboard.press("Escape");await page.locator(".footer-signature").click();await expect(page.locator(".navigation-comfort input")).toBeChecked();
});
