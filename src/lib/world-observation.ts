import { Box3,Frustum,Matrix4,Vector3,type Camera,type Object3D } from "three";
import { getIsland } from "@/data/islands";
import type { IslandId,Vector3Tuple } from "@/types";
import { islandBoundsPoints } from "./world-framing";
import type { ScreenRect } from "./island-label-layout";

export interface IslandObservation extends ScreenRect {
  id:IslandId; uuid:string; enabled:boolean; inFrustum:boolean; inViewport:boolean; visibleFraction:number;
  lod:"detailed"|"simplified"|"loading"; detailLoaded:boolean;
  groundScreen:{x:number;y:number};
}
export function projectScreenBounds(points:Vector3Tuple[],camera:Camera,size:{width:number;height:number}):ScreenRect {
  const p = new Vector3(),xs:number[] = [],ys:number[] = [];
  for (const point of points) { p.set(...point).project(camera); xs.push((p.x * .5 + .5) * size.width); ys.push((-p.y * .5 + .5) * size.height); }
  const x = Math.min(...xs),y = Math.min(...ys);
  return {x,y,width:Math.max(...xs) - x,height:Math.max(...ys) - y};
}
export function observeIslandRoots(scene:Object3D,camera:Camera,size:{width:number;height:number}):IslandObservation[] {
  const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const observations:IslandObservation[] = [];
  scene.traverse((root) => {
    if (!root.name.startsWith("island:")) return;
    const id = root.name.slice(7) as IslandId,island = getIsland(id); if (!island) return;
    let enabled = true;
    for (let parent:Object3D|null = root; parent; parent = parent.parent) if (!parent.visible) enabled = false;
    const points = islandBoundsPoints(island),rect = projectScreenBounds(points,camera,size);
    const box = new Box3().setFromPoints(points.map((point) => new Vector3(...point)));
    const inFrustum = frustum.intersectsBox(box);
    const clippedWidth = Math.max(0,Math.min(size.width,rect.x + rect.width) - Math.max(0,rect.x));
    const clippedHeight = Math.max(0,Math.min(size.height,rect.y + rect.height) - Math.max(0,rect.y));
    const detail = id === "campus" || Boolean(root.getObjectByName("island-lod-detailed:" + id)?.visible);
    const detailLoaded = id === "campus" || Boolean(root.getObjectByName("island-art:" + id));
    const ground = new Vector3(island.position[0],island.position[1] + .15 * island.scale,island.position[2]).project(camera);
    observations.push({id,uuid:root.uuid,enabled,inFrustum,inViewport:enabled && inFrustum && clippedWidth * clippedHeight > 0,
      visibleFraction:clippedWidth * clippedHeight / Math.max(1,rect.width * rect.height),lod:detail ? detailLoaded ? "detailed" : "loading" : "simplified",detailLoaded,groundScreen:{x:(ground.x * .5 + .5) * size.width,y:(-ground.y * .5 + .5) * size.height},...rect});
  });
  return observations;
}
