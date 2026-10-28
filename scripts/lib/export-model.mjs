import {writeFile,mkdir} from "node:fs/promises";
import {dirname} from "node:path";
import {Box3,Vector3} from "three";
import {GLTFExporter} from "three/addons/exporters/GLTFExporter.js";
globalThis.FileReader = class {
  result = null; onloadend = null;
  readAsArrayBuffer(blob){blob.arrayBuffer().then(bytes => {this.result = bytes;this.onloadend?.({target:this});});}
  readAsDataURL(blob){blob.arrayBuffer().then(bytes => {this.result = "data:" + blob.type + ";base64," + Buffer.from(bytes).toString("base64");this.onloadend?.({target:this});});}
};
export async function exportModel(root,path,source) {
  root.updateMatrixWorld(true);
  const binary = await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true,trs:true});
  await mkdir(dirname(path),{recursive:true});await writeFile(path,Buffer.from(binary));
  const parts = [];let triangles = 0;const materials = new Set();
  root.traverse(o => {if(o.isMesh){parts.push(o.name);triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;for(const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m.name);}});
  const bounds = new Box3().setFromObject(root),size = bounds.getSize(new Vector3());
  return {name:root.name,authoring:"Original procedural Three.js geometry; not a Blender export",bytes:binary.byteLength,triangles,drawPrimitives:parts.length,materials:[...materials],parts,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()},source};
}
