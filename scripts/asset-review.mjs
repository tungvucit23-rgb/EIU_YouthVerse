import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import {execFileSync} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
const root = fileURLToPath(new URL("../",import.meta.url));
try {
  const git = path => execFileSync("git",["-c","safe.directory=" + root.replaceAll("\\","/"),"show","6d651e5:" + path],{cwd:root,maxBuffer:2 * 1024 * 1024});
  const {dirname} = await import("node:path");
  await mkdir(root + ".asset-review-cache",{recursive:true});
  const files = execFileSync("git",["-c","safe.directory=" + root.replaceAll("\\","/"),"ls-tree","-r","--name-only","6d651e5","--","src"],{cwd:root}).toString().trim().split("\n");
  for(const path of files) {if(!path.startsWith("src/")) throw new Error("Unexpected baseline path");const target = root + ".asset-review-cache/" + path;await mkdir(dirname(target),{recursive:true});await writeFile(target,git(path).toString().replaceAll('"@/','"@baseline/').replaceAll("'@/","'@baseline/"));}
  await writeFile(root + ".asset-review-cache/HistoricalView.tsx",`import React from "react";
import {WorldQuality} from "@baseline/components/world/WorldQuality";
import {TerrainTextures} from "@baseline/components/world/TerrainTextures";
import {SceneryMaterials} from "@baseline/components/world/SceneryMaterials";
import {CentralEIUIsland} from "@baseline/components/world/CentralEIUIsland";
import {CampusEntrance} from "@baseline/components/world/CampusEntrance";
import {FloatingIsland} from "@baseline/components/world/FloatingIsland";
import ActivitiesIsland from "@baseline/components/world/islands/themes/ActivitiesIsland";
import {getIsland} from "@baseline/data/islands";
import {StaticSceneryBatch} from "@baseline/components/world/islands/StaticSceneryBatch";
export default function HistoricalView({view}) {return <WorldQuality quality="balanced" reducedMotion><TerrainTextures><SceneryMaterials>{view === "entrance" ? <CampusEntrance/> : view === "activities" ? <FloatingIsland shape={getIsland("activities").shape}><StaticSceneryBatch><ActivitiesIsland/></StaticSceneryBatch></FloatingIsland> : <CentralEIUIsland/>}</SceneryMaterials></TerrainTextures></WorldQuality>;}
`);
  await writeFile(root + ".asset-review-cache/boat.glb",git("public/models/youthverse-explorer.glb"));
  const source = git("src/components/world/boat/ExplorerBoatAsset.tsx").toString().replaceAll('"../TerrainTextures"','"@/components/world/TerrainTextures"').replaceAll('"../WorldQuality"','"@/components/world/WorldQuality"').replace('"/models/youthverse-explorer.glb"','"/.asset-review-cache/boat.glb"');
  await writeFile(root + ".asset-review-cache/ExplorerBoatAsset.tsx",source);
} catch {console.warn("Historical boat preview unavailable; current asset review still works.");}
const server = await createServer({configFile:false,root,resolve:{alias:{"@":root + "src","@baseline":root + ".asset-review-cache/src"}},server:{host:"127.0.0.1",port:4174,strictPort:true}});
await server.listen();
console.log("Asset review: http://127.0.0.1:4174/scripts/review/");
for (const signal of ["SIGINT","SIGTERM"]) process.on(signal,async () => {await server.close();process.exit(0);});
