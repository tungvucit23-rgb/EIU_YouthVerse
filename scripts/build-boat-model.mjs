import {writeFile} from "node:fs/promises";
import {buildExplorerBoat} from "./lib/explorer-boat.mjs";
import {exportModel} from "./lib/export-model.mjs";
const manifest = await exportModel(buildExplorerBoat(),"public/models/youthverse-explorer.glb","scripts/lib/explorer-boat.mjs");
manifest.regenerate = "npm run assets:boat";
await writeFile("public/models/explorer-manifest.json",JSON.stringify(manifest,null,2) + String.fromCharCode(10));
console.log(JSON.stringify(manifest,null,2));
