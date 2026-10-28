import type { Destination, IslandId, WorldIsland, IslandDockConfig, Vector3Tuple } from "@/types";
import { worldSettings } from "./world-settings";
import { transformWorldPoint } from "@/lib/world-transform";

type Derived = "category" | "dockingPoint" | "dockHeading" | "modelPath" | "requiresAuth" | "viewBounds";
type IslandInput = Omit<WorldIsland,Derived> & { viewHeight?:number };
type DestinationInput = Omit<Destination,Derived | "fullTitle"> & { viewHeight?:number };
const dock = (position:Vector3Tuple,rotation = 0):IslandDockConfig => ({position,rotation,length:1.3,clearance:1.55,waterOffset:0.5});
const asset = (key:string) => ({kind:key === "activities" ? "glb" as const : "procedural" as const,key,url:"/models/islands/" + key + ".glb"});

function defineIsland<T extends IslandInput>(definition:T) {
  const {position,scale,rotation,shape,dock:landing} = definition;
  const reach = landing.length + landing.clearance / scale;
  const dockingPoint = transformWorldPoint(position,scale,rotation,[landing.position[0] + Math.sin(landing.rotation) * reach,landing.position[1],landing.position[2] + Math.cos(landing.rotation) * reach]);
  dockingPoint[1] -= landing.waterOffset;
  const rx = shape.radius * shape.stretch[0] * 1.16,rz = shape.radius * shape.stretch[1] * 1.16;
  const endX = landing.position[0] + Math.sin(landing.rotation) * landing.length;
  const endZ = landing.position[2] + Math.cos(landing.rotation) * landing.length;
  return {...definition,category:definition.id,fullTitle:definition.displayName,dockingPoint,
    dockHeading:rotation + landing.rotation + Math.PI,modelPath:definition.asset.url,requiresAuth:definition.access !== "public",
    viewBounds:{min:[Math.min(-rx,endX - .6),-shape.depth - .15,Math.min(-rz,endZ - .6)] as Vector3Tuple,max:[Math.max(rx,endX + .6),definition.viewHeight ?? 2.7,Math.max(rz,endZ + .6)] as Vector3Tuple},
  };
}

export const campus = defineIsland({
  id:"campus" as const,title:"EIU Grand Campus",displayName:"EIU Grand Campus",
  position:[0,1,-8] as Vector3Tuple,scale:1.4,rotation:0,
  shape:{radius:5.3,depth:3.9,seed:1.2,stretch:[1,.94] as [number,number]},
  asset:{kind:"glb" as const,key:"campus",url:"/models/eiu-campus.glb"},
  dock:dock([.3,.12,4.85]),connections:["harbor-channel"],contentRoute:"/",access:"public" as const,nearOnIntro:true,viewHeight:2.7,
});

const destinationDefinitions = [
  {
    id: "activities", slug: "activities", title: "Hoạt động", displayName: "Hoạt động Đoàn – Hội",
    subtitle: "Quảng trường của những khởi đầu",
    description: "Từ một buổi gặp gỡ đến một trải nghiệm đáng nhớ. Khám phá không gian hoạt động, cùng bạn bè thử sức và tạo dấu ấn của riêng mình.",
    position: [-12, -.5, 11], scale: .95, rotation: -.06, shape: { radius: 2.7, depth: 2.8, seed: 2.4, stretch: [1.13, 0.88] },
    dock: dock([0.17, 0.12, 2.3]),
    connections: ["west-channel"], theme: "#d6ad65", contentType: "activities", contentRoute: "/activities",
    asset: asset("activities"), access: "public", isAvailable: true, nearOnIntro: true, number: "01", action: "Xem tất cả hoạt động",
  },
  {
    id: "news", slug: "news", title: "Tin tức", displayName: "Tin tức – Thông báo",
    subtitle: "Trạm tin giữa những tầng mây",
    description: "Bắt nhịp Đoàn – Hội, đọc những câu chuyện sinh viên và tìm cảm hứng cho một hành trình mới.",
    position: [-24, 2, -13], scale: .9, rotation: 0, shape: { radius: 2.4, depth: 3.2, seed: 4.6, stretch: [0.87, 1.12] },
    dock: dock([.17, .12, 2.6]), viewHeight: 3.6,
    connections: ["northeast-channel"], theme: "#83b6c6", contentType: "news", contentRoute: "/news",
    asset: asset("news"), access: "public", isAvailable: true, nearOnIntro: false, number: "02", action: "Xem tin tức",
  },
  {
    id: "clubs", slug: "clubs", title: "Câu lạc bộ", displayName: "Làng câu lạc bộ",
    subtitle: "Tìm những người cùng đam mê",
    description: "Một ngôi làng của âm nhạc, sáng tạo và công nghệ. Tìm cộng đồng nơi bạn được là chính mình.",
    position: [12, .1, 8], scale: .88, rotation: .08, shape: { radius: 2.85, depth: 2.5, seed: 6.1, stretch: [1.12, 0.87] },
    dock: dock([-0.1, 0.12, 2.6]),
    connections: ["east-channel"], theme: "#a8b98b", contentType: "clubs", contentRoute: "/clubs",
    asset: asset("clubs"), access: "public", isAvailable: true, nearOnIntro: true, number: "03", action: "Khám phá câu lạc bộ",
  },
  {
    id: "events", slug: "events", title: "Sự kiện", displayName: "Sự kiện – Lịch hoạt động",
    subtitle: "Hẹn nhau ở những khoảnh khắc đẹp",
    description: "Tìm điểm hẹn tiếp theo trong lịch sinh viên. Cùng tham gia, gặp gỡ và góp nên những khoảnh khắc đáng nhớ.",
    position: [-32, 3, -41], scale: 1.03, rotation: -.1, shape: { radius: 3.1, depth: 3, seed: 8.8, stretch: [1.18, 0.83] },
    dock: dock([-0.1, 0.12, 2.8]),
    connections: ["southeast-channel"], theme: "#c1a1a0", contentType: "events", contentRoute: "/events",
    asset: asset("events"), access: "public", isAvailable: true, nearOnIntro: false, number: "04", action: "Mở lịch sự kiện",
  },
  {
    id: "volunteer", slug: "volunteer", title: "Tình nguyện", displayName: "Tình nguyện – Chiến dịch",
    subtitle: "Gieo một điều tốt, mở một chân trời",
    description: "Ghé khu vườn của những đóng góp nhỏ. Tìm hiểu các ý tưởng tình nguyện, lối sống xanh và hoạt động vì cộng đồng.",
    position: [24, 2.6, -18], scale: .84, rotation: -.1, shape: { radius: 2.95, depth: 3.4, seed: 10.3, stretch: [0.91, 1.09] },
    dock: dock([0.25, 0.12, 3]),
    connections: ["north-channel"], theme: "#91ac72", contentType: "volunteer", contentRoute: "/volunteer",
    asset: asset("volunteer"), access: "public", isAvailable: true, nearOnIntro: false, number: "05", action: "Khám phá chiến dịch",
  },
  {
    id: "office", slug: "office", title: "Văn phòng", displayName: "Văn phòng điện tử",
    subtitle: "Không gian làm việc của Đoàn – Hội",
    description: "Giới thiệu không gian tài liệu và quy trình tổ chức. Nghiệp vụ nội bộ chỉ dành cho tài khoản được xác thực và phân quyền.",
    position: [-11, 4.4, -53], scale: .95, rotation: .06, shape: { radius: 2.9, depth: 3.9, seed: 12.9, stretch: [1.14, 0.91] },
    dock: dock([0.1, 0.12, 3]),
    connections: ["far-north-channel"], theme: "#9bbed0", contentType: "office", contentRoute: "/office",
    asset: asset("office"), access: "staff", isAvailable: true, nearOnIntro: false, number: "06", action: "Xem văn phòng điện tử",
  },
  {
    id: "achievements", slug: "achievements", title: "Thành tích", displayName: "Thành tích – Điểm rèn luyện",
    subtitle: "Mỗi bước tiến đều có ý nghĩa",
    description: "Một không gian ghi nhận hành trình trưởng thành. Thông tin điểm rèn luyện cá nhân sẽ chỉ mở cho tài khoản có quyền.",
    position: [12, 5.5, -59], scale: 1.02, rotation: -.12, shape: { radius: 2.8, depth: 4.2, seed: 15.6, stretch: [0.91, 1.1] },
    dock: dock([0, 0.12, 2.7]),
    connections: ["northwest-channel"], theme: "#c8ad6b", contentType: "achievements", contentRoute: "/achievements",
    asset: asset("achievements"), access: "student", isAvailable: true, nearOnIntro: false, number: "07", action: "Khám phá hành trình ghi nhận",
  },
  {
    id: "resources", slug: "resources", title: "Tài nguyên", displayName: "Cộng đồng – Tài nguyên",
    subtitle: "Một góc yên để cùng nhau lớn lên",
    description: "Ghé thư viện trên mây: tìm cẩm nang minh họa, đọc những chia sẻ và mang theo một ý tưởng hữu ích.",
    position: [34, 3.4, -48], scale: .95, rotation: .08, shape: { radius: 3.05, depth: 2.7, seed: 17.8, stretch: [1.16, 0.88] },
    dock: dock([0.1, 0.12, 2.6]),
    connections: ["far-west-channel"], theme: "#b4b692", contentType: "resources", contentRoute: "/resources",
    asset: asset("resources"), access: "public", isAvailable: true, nearOnIntro: false, number: "08", action: "Mở thư viện tài nguyên",
  },
 ] satisfies DestinationInput[];

export const destinations:Destination[] = destinationDefinitions.map(defineIsland);
/** The only world-space island registry. Legacy UI collections are derived views. */
export const islandRegistry:ReadonlyMap<IslandId,WorldIsland> = new Map([campus,...destinations].map((island):[IslandId,WorldIsland] => [island.id,island]));
export const islands = [...islandRegistry.values()];
export const allIslandIds = islands.map((island) => island.id);
export const HOME_BOAT_POSITION = worldSettings.launchPosition;
export const islandLayers = {foreground:["activities","clubs"],midground:["campus","news","volunteer"],background:["events","office","achievements","resources"]} as const;

export function getDestination(id:IslandId|null) { return destinations.find((destination) => destination.id === id); }
export function getIsland(id:IslandId) { return islandRegistry.get(id)!; }
export function destinationFromHash(hash:string):IslandId|null { return hash === "#campus" ? "campus" : destinations.find((destination) => "#" + destination.slug === hash && destination.isAvailable)?.id ?? null; }
