import { mkdir, writeFile } from "node:fs/promises";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { buildExplorerBoat } from "./lib/explorer-boat.mjs";

// GLTFExporter uses the browser FileReader API; Node's Blob provides the same bytes.
globalThis.FileReader = class {
  result = null;
  onloadend = null;
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((bytes) => { this.result = bytes; this.onloadend?.({ target: this }); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((bytes) => { this.result = "data:" + blob.type + ";base64," + Buffer.from(bytes).toString("base64"); this.onloadend?.({ target: this }); }); }
};

const boat = buildExplorerBoat();
const binary = await new GLTFExporter().parseAsync(boat, { binary: true, onlyVisible: true, trs: true });
await mkdir("public/models", { recursive: true });
await writeFile("public/models/youthverse-explorer.glb", Buffer.from(binary));
const parts = []; let triangles = 0;
boat.traverse((object) => { if (object.isMesh) { parts.push(object.name); triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; } });
const manifest = { name: boat.name, authoring: "Original Three.js procedural model; not a Blender export", bytes: binary.byteLength, triangles, parts, source: "scripts/lib/explorer-boat.mjs", regenerate: "npm run assets:boat" };
await writeFile("public/models/explorer-manifest.json", JSON.stringify(manifest,null,2) + "\n");
console.log(JSON.stringify(manifest,null,2));
