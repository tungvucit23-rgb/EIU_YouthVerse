import {BoxGeometry,BufferGeometry,CatmullRomCurve3,CylinderGeometry,Group,Mesh,MeshStandardMaterial,TubeGeometry,Vector3} from "three";
import {mergeGeometries,mergeVertices} from "three/addons/utils/BufferGeometryUtils.js";

export const material = (name:string,color:string,roughness = .8,metalness = 0) => {
  const m = new MeshStandardMaterial({color,roughness,metalness}); m.name = name; return m;
};
export const box = (size:number[],at:number[]) => new BoxGeometry(size[0],size[1],size[2]).translate(at[0],at[1],at[2]);
export const pole = (radius:number,height:number,at:number[]) => new CylinderGeometry(radius,radius * 1.06,height,12).translate(at[0],at[1],at[2]);
export const tube = (points:number[][],radius:number,segments = 16) => new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(p[0],p[1],p[2]))),segments,radius,6,false);
export function mesh(name:string,geometry:BufferGeometry,m:MeshStandardMaterial,parent:Group) {
  const object = new Mesh(geometry,m);object.name = name;object.castShadow = object.receiveShadow = true;parent.add(object);return object;
}
/** Bake static detail by material. Indexed vertices retain hard normals and UV seams. */
export function batch(name:string,parts:{geometry:BufferGeometry;material:MeshStandardMaterial}[]) {
  const root = new Group();root.name = name;
  const buckets = new Map<MeshStandardMaterial,BufferGeometry[]>();
  for (const part of parts) {
    if (!buckets.has(part.material)) buckets.set(part.material,[]);
    const expanded = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
    if (expanded !== part.geometry) part.geometry.dispose();
    buckets.get(part.material)!.push(expanded);
  }
  for(const [m,pieces] of buckets) {
    const merged = mergeGeometries(pieces)!;pieces.forEach(g => g.dispose());
    const indexed = mergeVertices(merged,1e-5);merged.dispose();indexed.computeBoundingBox();indexed.computeBoundingSphere();
    mesh(name + "_" + m.name,indexed,m,root);
  }
  return root;
}
export function disposeModel(root:Group) {
  const geometries = new Set<BufferGeometry>(),materials = new Set<MeshStandardMaterial>();
  root.traverse(object => {if(object instanceof Mesh){geometries.add(object.geometry);for(const m of Array.isArray(object.material) ? object.material : [object.material]) if(m instanceof MeshStandardMaterial) materials.add(m);}});
  geometries.forEach(g => g.dispose());materials.forEach(m => m.dispose());
}
export function bakeGroups(root:Group,name:string) {
  root.updateMatrixWorld(true);
  const parts:{geometry:BufferGeometry;material:MeshStandardMaterial}[] = [];
  root.traverse(object => {if(object instanceof Mesh && object.material instanceof MeshStandardMaterial){parts.push({geometry:object.geometry.clone().applyMatrix4(object.matrixWorld),material:object.material});object.geometry.dispose();}});
  return batch(name,parts);
}
