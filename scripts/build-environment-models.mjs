import {writeFile} from "node:fs/promises";
import {buildCampusModel} from "../src/lib/art/campus-model.ts";
import {buildActivitiesModel} from "../src/lib/art/activities-model.ts";
import {exportModel} from "./lib/export-model.mjs";
const models = [await exportModel(buildCampusModel(),"public/models/eiu-campus.glb","src/lib/art/campus-model.ts"),await exportModel(buildActivitiesModel(),"public/models/islands/activities.glb","src/lib/art/activities-model.ts")];
await writeFile("public/models/environment-manifest.json",JSON.stringify(models,null,2) + "\n");console.log(JSON.stringify(models,null,2));
