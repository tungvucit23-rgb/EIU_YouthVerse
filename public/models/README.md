# Task 02A model assets

These are functioning original glTF 2.0 binary models, exported from editable Three.js source. They are stylized procedural art, not approved surveyed EIU architecture or Blender-authored production deliverables. No `.blend` file was created. Blender was not found on PATH or in the standard Blender Foundation installation directory checked on this machine.

| File | Bytes | Triangles | Mesh primitives |
| --- | ---: | ---: | ---: |
| `youthverse-explorer.glb` | 544,600 | 18,151 | 37 |
| `eiu-campus.glb` | 624,404 | 9,588 | 9 |
| `islands/activities.glb` | 325,220 | 10,203 | 9 |

All geometry is indexed with normals and UVs. Materials are glTF metallic/roughness PBR; no external decoder, remotely downloaded material or missing texture URL is required. No Draco/Meshopt/KTX2 compression is claimed. Small shared runtime wood, grass, stone and fabric CanvasTextures remain in use; the models also render with their base PBR colors in a standalone glTF viewer.

## Regenerate and inspect

Use Node.js 24, as tested in this workspace. Environment generation uses Node's native TypeScript stripping.

```powershell
npm.cmd run assets:boat
npm.cmd run assets:environment
npm.cmd run assets:review
# Separate terminal, while the review server is running:
npm.cmd run assets:capture
```

The local review URL printed by the script is `http://127.0.0.1:4174/scripts/review/`. Add `?view=boat`, `campus`, `entrance`, or `activities`. This harness is outside the application's routes and imports the actual runtime components. It uses the Vite installation already locked through Vitest. Stop it with Ctrl+C.

`scripts/asset-review.mjs` can reconstruct the historical source and boat from commit `6d651e5` into ignored `.asset-review-cache/`. `&baseline=1` displays that historical version with the same camera and lighting. It does not change the working tree's application source or Git state. Before/after screenshots and renderer observations are in `artifacts/task02/`.

## Boat

Source: `scripts/lib/explorer-boat.mjs`; exporter: `scripts/build-boat-model.mjs` and `scripts/lib/export-model.mjs`. Statistics: `explorer-manifest.json`.

The hull uses monotone Hermite profiles, fuller stern shoulders, a finer raised bow, outward-facing carvel planks and a thick inner rim. The model includes curved main/jib sails with sewn bindings, conformal EIU markings, rigging, deck planks, hatch, cleats, rope coil, crate, stern benches, mast collars, belaying pins and a lantern. Geometry was redistributed rather than uniformly subdivided: 18,859 → 18,151 triangles; file size increased 8,916 bytes.

Coordinates: Y up, bow +Z. Actual bounds are recorded in the manifest and stay within the existing rotated boat camera envelope. `MainSail`, `JibSail`, `Mast_Pennant`, `SailRig` and `Wheel` remain animation interfaces. Runtime cloth and mark geometry is cloned before deformation; shared loader geometry is not disposed by an instance. Cloned materials/animated buffers and private CanvasTextures have explicit cleanup. Low and reduced motion avoid cloth vertex updates.

## Campus and entrance

Source: `src/lib/art/campus-model.ts` and `model-kit.ts`. The campus GLB includes architecture only: buildings, entrance and right sign wall. Terrain, trees, pool, paths and dock remain runtime components. Ground is near Y=.13; local architecture bounds are approximately 7.69 × 2.20 × 5.98. The reference canopy is 7.2 units wide, with an actual oval hole, slender columns, slim fascia and extruded EIU text on the right wall. The canopy is tested by raycasting through the exported skylight.

`campus.asset.kind` is now `glb`, with `/models/eiu-campus.glb`. `CentralEIUIsland` actually loads it through `ReplaceableIslandModel`. `CampusBuildings.tsx` and `CampusEntrance.tsx` retain procedural fallbacks from the same generation source. The entrance adapter preserves its width/height/position interface.

Architecture dimensions and layout are photo-informed approximations. The EIU text is original geometric lettering, not an approved official wordmark.

## Activities reference island

Source: `src/lib/art/activities-model.ts`. The GLB contains a timber courtyard, detailed benches and stage, curved sewn canopies, poles, guy lines, speakers, pennants, steps and varied trees. The existing terrain and dock stay separate. The Activities registry selects `/models/islands/activities.glb`; the matching theme component supplies the procedural fallback.

Static geometry is merged by material. Generic island instances clone materials before adding shared maps, retain cached loader geometry and use `dispose={null}` with scoped material cleanup. Distance LOD still switches child detail/silhouette groups; all nine island roots remain enabled. Seven other destination themes keep their existing procedural identities and asset configuration.

See [TASK02-ASSET-UPGRADE.md](../../TASK02-ASSET-UPGRADE.md) for visual comparisons, exact source changes, actual checks and limitations.
