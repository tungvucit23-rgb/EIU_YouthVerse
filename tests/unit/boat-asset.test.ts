import { readFileSync } from "node:fs";
import { expect,it } from "vitest";

it("ships a real GLB 2.0 with indexed geometry, named moving parts and a modest asset budget",() => {
  const bytes = readFileSync(new URL("../../public/models/youthverse-explorer.glb",import.meta.url));
  expect(bytes.subarray(0,4).toString()).toBe("glTF");
  expect(bytes.readUInt32LE(4)).toBe(2); expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  expect(bytes.length).toBeLessThan(1_000_000);
  expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a);
  const json = JSON.parse(bytes.subarray(20,20 + bytes.readUInt32LE(12)).toString());
  const names = json.nodes.map((node:{name:string}) => node.name);
  for (const name of ["YouthVerse_Explorer","Mast","MainSail","JibSail","SailRig","Wheel","Keel","Hull_Inner_Shell","Rope_Coil","Storage_Crate","Cleats_And_Attachment_Hardware"]) expect(names).toContain(name);
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) { expect(primitive.indices).toBeTypeOf("number"); expect(primitive.attributes.NORMAL).toBeTypeOf("number"); expect(primitive.attributes.TEXCOORD_0).toBeTypeOf("number"); }
});
