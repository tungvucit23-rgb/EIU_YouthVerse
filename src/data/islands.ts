import type {Destination,DestinationId,IslandId,IslandDockConfig,Vector3Tuple,WorldIsland} from "@/types";
import {worldSettings} from "./world-settings";
import {portalSections} from "./portal-sections";
import {transformWorldPoint} from "@/lib/world-transform";

type Derived = "category"|"dockingPoint"|"dockHeading"|"modelPath"|"requiresAuth"|"viewBounds";
type IslandInput = Omit<Destination,Derived> & {viewHeight?:number};
const dock = (position:Vector3Tuple):IslandDockConfig => ({position,rotation:0,heading:Math.PI / 2,length:1.3,clearance:1.8,waterOffset:.5});
const section = (id:DestinationId) => portalSections.find(s => s.id === id)!;
const asset = (key:string) => ({kind:key === "activities" ? "glb" as const : "procedural" as const,key,url:"/models/islands/" + key + ".glb"});

function defineIsland(definition:IslandInput):Destination {
 const {position,scale,rotation,shape,dock:landing} = definition;
 const reach = landing.length + landing.clearance / scale;
 const dockingPoint = transformWorldPoint(position,scale,rotation,[landing.position[0] + Math.sin(landing.rotation) * reach,landing.position[1],landing.position[2] + Math.cos(landing.rotation) * reach]);
 dockingPoint[1] -= landing.waterOffset;
 const rx = shape.radius * shape.stretch[0] * 1.16,rz = shape.radius * shape.stretch[1] * 1.16;
 const endX = landing.position[0] + Math.sin(landing.rotation) * landing.length,endZ = landing.position[2] + Math.cos(landing.rotation) * landing.length;
 return {...definition,category:definition.id,dockingPoint,dockHeading:rotation + (landing.heading ?? landing.rotation + Math.PI),modelPath:definition.asset.url,requiresAuth:definition.access !== "public",
  viewBounds:{min:[Math.min(-rx,endX - .6),-shape.depth - .15,Math.min(-rz,endZ - .6)],max:[Math.max(rx,endX + .6),definition.viewHeight ?? 2.7,Math.max(rz,endZ + .6)]}};
}

export const campus = defineIsland({
 id:"campus",slug:"campus",title:"EIU Grand Campus",displayName:"EIU Grand Campus",fullTitle:"EIU Grand Campus",
 subtitle:"Ngôi nhà của những hành trình",description:"Khám phá đại học EIU, cập nhật tin tức, thông báo và những thông tin chung dành cho cộng đồng sinh viên.",
 position:[0,.8,-10],scale:1.35,rotation:0,shape:{radius:5.3,depth:3.9,seed:1.2,stretch:[1,.94]},
 asset:{kind:"glb",key:"campus",url:"/models/eiu-campus.glb"},dock:dock([.3,.12,4.85]),
 connections:["activities","clubs","achievements","office"],contentRoute:"/news",contentType:"news",access:"public",nearOnIntro:true,isAvailable:true,number:"01",theme:"#83b6c6",action:"Tin tức & Thông báo",
});
export const destinations:Destination[] = [
 defineIsland({...section("activities"),id:"activities",displayName:"Đoàn – Hội & Hoạt động",fullTitle:"Đoàn – Hội & Hoạt động",title:"Đoàn – Hội",
  description:"Hoạt động Đoàn – Hội, lịch sự kiện và các chiến dịch tình nguyện. Cùng tham gia, kết nối và góp nên những trải nghiệm đáng nhớ.",
  position:[-15,.1,1],scale:1.05,rotation:0,shape:{radius:2.7,depth:2.8,seed:2.4,stretch:[1.13,.88]},dock:dock([.17,.12,2.3]),
  connections:["campus","clubs","achievements","office"],theme:"#d6ad65",contentType:"activities",asset:asset("activities"),isAvailable:true,nearOnIntro:true,number:"02"}),
 defineIsland({...section("clubs"),id:"clubs",displayName:"Câu lạc bộ & Cộng đồng",fullTitle:"Câu lạc bộ & Cộng đồng",title:"CLB & Cộng đồng",
  description:"Tìm câu lạc bộ, gặp người cùng đam mê và chia sẻ tài nguyên. Một không gian để sinh viên cộng tác và cùng trưởng thành.",
  position:[15,.5,-1],scale:1,rotation:0,shape:{radius:2.85,depth:2.5,seed:6.1,stretch:[1.12,.87]},dock:dock([-.1,.12,2.6]),
  connections:["campus","activities","achievements","office"],theme:"#a8b98b",contentType:"clubs",asset:asset("clubs"),isAvailable:true,nearOnIntro:true,number:"03"}),
 defineIsland({...section("achievements"),id:"achievements",displayName:"Thành tích & Phát triển",fullTitle:"Thành tích & Phát triển",title:"Thành tích",
  position:[18,2,-32],scale:1.05,rotation:0,shape:{radius:2.8,depth:4.2,seed:15.6,stretch:[.91,1.1]},dock:dock([0,.12,2.7]),
  connections:["campus","activities","clubs","office"],theme:"#c8ad6b",contentType:"achievements",asset:asset("achievements"),isAvailable:true,nearOnIntro:false,number:"04"}),
 defineIsland({...section("office"),id:"office",displayName:"Văn phòng điện tử",
  position:[-18,1.4,-29],scale:1,rotation:0,shape:{radius:2.9,depth:3.9,seed:12.9,stretch:[1.14,.91]},dock:dock([.1,.12,3]),
  connections:["campus","activities","clubs","achievements"],theme:"#9bbed0",contentType:"office",asset:asset("office"),isAvailable:true,nearOnIntro:false,number:"05"}),
];
export const islands:Destination[] = [campus,...destinations];
export const islandRegistry:ReadonlyMap<IslandId,WorldIsland> = new Map(islands.map(i => [i.id,i]));
export const allIslandIds = islands.map(i => i.id);
export const HOME_BOAT_POSITION = worldSettings.launchPosition;
export const islandLayers = {landmark:["campus"],midground:["activities","clubs"],background:["office","achievements"]} as const;
export const islandSections:Record<IslandId,DestinationId[]> = {campus:["news"],activities:["activities","events","volunteer"],clubs:["clubs","resources"],achievements:["achievements"],office:["office"]};
export const parentIslandForSection = (id:DestinationId):IslandId => allIslandIds.find(island => islandSections[island].includes(id))!;
export const legacyIslandParents:Record<string,IslandId> = {news:"campus",events:"activities",volunteer:"activities",resources:"clubs"};
export const getDestination = (id:IslandId|null) => islands.find(i => i.id === id);
export const getIsland = (id:IslandId) => islandRegistry.get(id)!;
export function destinationFromHash(hash:string):IslandId|null {const id = hash.slice(1);return islands.find(i => i.id === id)?.id ?? (Object.hasOwn(legacyIslandParents,id) ? legacyIslandParents[id] : null);}
