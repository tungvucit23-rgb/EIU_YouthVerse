# Model assets and replacement boundaries

## YouthVerse Explorer

`youthverse-explorer.glb` is a real original glTF 2.0 binary model:

- 535,684 bytes; 18,859 triangles.
- 31 named mesh parts plus organizing groups.
- Curved plank hull, inner shell, thick gunwale, transom, keel, deck boards and navy trim.
- Mast, bowed main sail and jib, boom, support beam, standing/running rigging, lifelines and cleats.
- Wheel, hatch, rope coil, crate and pennant.
- PBR wood/fabric/metal materials. Runtime adds shared wood grain, fabric seams and original EIU text/compass decoration.
- `MainSail`, `JibSail`, `Mast_Pennant`, `SailRig` and `Wheel` are animation interfaces.

Authoring source: `scripts/lib/explorer-boat.mjs`.
Exporter: `scripts/build-boat-model.mjs`.
Regenerate: `npm run assets:boat`.
Statistics and part names: `explorer-manifest.json`.

The source is procedural Three.js, exported using GLTFExporter with indexed vertices. Blender was not installed or used. The file is not Draco/Meshopt compressed. No external model license or remote decoder is required.

Runtime loading is isolated in `ExplorerBoatAsset.tsx`. The cached GLB is cloned; only cloned animated geometry and cloned materials are modified/disposed. A small boat proxy is shown during loading; navigation falls back to the lightweight world if startup fails.

## Approved campus model

The referenced campus and entrance currently use original procedural geometry. Place a verified, licensed, optimized `eiu-campus.glb` here, then change `campus.asset.kind` in `src/data/islands.ts` from `procedural` to `glb`. Its URL is already configured.

`ReplaceableIslandModel` in `islands/IslandArt.tsx` supplies lazy GLB loading, local Suspense and a procedural fallback on failure. The campus replacement slot wraps the buildings and entrance; terrain, docks and navigation remain separate. Align the model around the origin with ground near Y=0.13 and a footprint of approximately 10 × 8 world units.

For entrance-only replacement, swap `CampusEntrance.tsx`, keeping its width/height/position props. Preserve the low white curved roof, oval opening, slender columns and right sign wall. Validate proportions against the supplied photographs rather than treating the preview as authoritative.

## Destination models

Every destination declares:

```ts
asset: { kind: "procedural", key: "events", url: "/models/islands/events.glb" }
```

Its current theme is procedural and lazy-loaded. To replace it, provide the file and set `kind: "glb"`. Do not enable missing URLs. Model coordinates are local to the island; retain the island scale, terrain, dock and graph connection configuration.

Prefer shared materials, indexed geometry, baked ambient shading and optimized texture dimensions. Meshopt/Draco and KTX2 can be added with locally configured decoders; the current build intentionally requests no missing decoders or placeholder GLBs.
