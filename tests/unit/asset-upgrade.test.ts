import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {Box3,Mesh,Raycaster,Vector3} from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {campus,getIsland} from "../../src/data/islands";
import {buildCampusEntrance} from "../../src/lib/art/campus-model";
import {disposeModel} from "../../src/lib/art/model-kit";
import {makeCliff} from "../../src/components/world/islands/terrain-geometry";

const load = async (path:string) => {
  const bytes = readFileSync(new URL("../../public/models/" + path,import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer,"");gltf.scene.updateMatrixWorld(true);return {bytes,scene:gltf.scene};
};
describe("exported Task 02A assets",() => {
  it("orients cliff faces outwards and closes the bottom without changing the navigation footprint",() => {
    const geometry = makeCliff(campus.shape,56,true),p = geometry.attributes.position,n = geometry.attributes.normal;
    let good = 0,count = 0;for(let i = 0;i < p.count;i++) if(p.getY(i) > -campus.shape.depth * .8){count++;if(p.getX(i) * n.getX(i) + p.getZ(i) * n.getZ(i) > 0) good++;}
    expect(good / count).toBeGreaterThan(.98);geometry.computeBoundingBox();expect(geometry.boundingBox!.min.y).toBeGreaterThanOrEqual(campus.viewBounds.min[1]);geometry.dispose();
  });
  it.each([{path:"eiu-campus.glb",island:campus,budget:750000,parts:9},{path:"islands/activities.glb",island:getIsland("activities"),budget:450000,parts:9}])("loads $path within the existing island and draw budgets",async ({path,island,budget,parts}) => {
    const {bytes,scene} = await load(path);expect(bytes.length).toBeLessThan(budget);expect(island.asset.kind).toBe("glb");
    const bounds = new Box3().setFromObject(scene);for(let i = 0;i < 3;i++){expect(bounds.min.getComponent(i)).toBeGreaterThanOrEqual(island.viewBounds.min[i]);expect(bounds.max.getComponent(i)).toBeLessThanOrEqual(island.viewBounds.max[i]);}
    let count = 0;scene.traverse(object => {if(object instanceof Mesh){count++;expect(object.geometry.index).not.toBeNull();expect(object.geometry.attributes.normal).toBeDefined();expect(object.geometry.attributes.uv).toBeDefined();}});expect(count).toBe(parts);
  });
  it("keeps the oval skylight genuinely open in the exported campus",async () => {
    const {scene} = await load("eiu-campus.glb");
    const hole = new Raycaster(new Vector3(1.48,10,1.48),new Vector3(0,-1,0));
    expect(hole.intersectObject(scene,true)).toHaveLength(0);
    const roof = new Raycaster(new Vector3(0,10,1.6),new Vector3(0,-1,0));
    expect(roof.intersectObject(scene,true).some(hit => hit.object.name.includes("EIU_White_Concrete"))).toBe(true);
  });
  it("retains reference proportions and the right sign in the procedural fallback",() => {
    const root = buildCampusEntrance();expect(root.userData.canopyWidth).toBe(7.2);expect(root.userData.signSide).toBe("right");
    root.updateMatrixWorld(true);const wall = root.getObjectByName("EIU_Entrance_EIU_Sign_Stone")!;
    expect(new Box3().setFromObject(wall).min.x).toBeGreaterThan(1.7);disposeModel(root);
  });
  it("loads the real boat, retains the animation contract and fixes outward hull normals",async () => {
    const {scene} = await load("youthverse-explorer.glb");
    for(const name of ["MainSail","JibSail","Mast_Pennant","SailRig","Wheel"]) expect(scene.getObjectByName(name)).toBeDefined();
    const mesh = scene.getObjectByName("Hull_Planks_0") as Mesh,p = mesh.geometry.attributes.position,n = mesh.geometry.attributes.normal;
    let outward = 0,tested = 0;for(let i = 0;i < p.count;i++) if(p.getX(i) > .2 && Math.abs(p.getZ(i)) < .6) {tested++;if(n.getX(i) > 0) outward++;}
    expect(tested).toBeGreaterThan(20);expect(outward / tested).toBeGreaterThan(.98);
    const bounds = new Box3().setFromObject(scene);expect(bounds.min.y).toBeGreaterThanOrEqual(-.6);expect(bounds.max.y).toBeLessThanOrEqual(4.1);
    for(const x of [bounds.min.x,bounds.max.x]) for(const z of [bounds.min.z,bounds.max.z]) expect(Math.hypot(x,z)).toBeLessThan(2.6);
    const sail = scene.getObjectByName("MainSail") as Mesh;sail.geometry.computeBoundingBox();expect(sail.geometry.boundingBox!.max.z).toBeGreaterThan(.35);
  });
});
