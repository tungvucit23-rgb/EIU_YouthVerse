# EIU YouthVerse

**Hoist the Sails — Khơi buồm hành trình sinh viên.**

The **continuous archipelago correction (28 October 2026)** removes journey-based island hiding. All nine island roots persist; camera lookahead, spatial LOD and collision-aware labels operate independently. Desktop home frames the campus and five recognizable secondary islands. See [CONTINUOUS-WORLD.md](CONTINUOUS-WORLD.md) for the exact changes, verification and screenshots. The existing 3D assets are preserved.

An explorable nine-island university world built in the existing Next.js / React Three Fiber project. The campus remains the visual center; eight distinct islands represent student activities, news, clubs, events, volunteering, digital office, achievements, and community resources.

This is a working frontend demonstration. All content is marked demo. Authentication, private student records, document workflows and ASP.NET Core APIs are not connected.

## Run locally

Node.js 24 LTS and npm are used in this workspace.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. In Windows PowerShell with script execution disabled, use `npm.cmd`.

```sh
npm run build
npm run start
```

## Explore

1. Select **Bắt đầu hành trình**, click a nearby island or open **Hải đồ**.
2. The collapsed-by-default map contains all nine islands, shipping lanes, a live boat marker, search and an accessible list.
3. Choose a destination. The wooden GLB boat follows a graph-planned curved route with acceleration, turns, wake, camera follow and slower docking.
4. Arrival opens relevant previews and a link to the destination's HTML content.
5. Close the panel to remain at that dock, then choose another island. **Trở về EIU** sails home using the same route graph.

Desktop supports up to five contextual labels with screen-space collision avoidance; mobile supports two. Mobile uses a compact navigation bar and reduced rendering quality. Settings offer **Low / Balanced / High**, persistent preferences and a manual lightweight mode. WebGL failure, context loss or the 22-second asset timeout switches to a functional SVG archipelago. Reduced motion freezes ambient animation and shortens travel to 0.45 seconds.

Deep links such as `/#events`, `/#office` and `/#resources` restore the appropriate destination. Back/Forward safely interrupts active trips. Closing a panel keeps the island hash and records that the user is viewing the world.

## Routes

| Route | Function |
| --- | --- |
| `/` | Nine-island 3D world |
| `/activities` | Activity filtering, search and details |
| `/news` | News categories and reading previews |
| `/clubs` | Club discovery and introductions |
| `/events` | Month/day calendar with event details |
| `/volunteer` | Campaign ideas, filters and reading |
| `/office` | Public service introduction; internal functions locked |
| `/achievements` | Illustrative recognition; personal records locked |
| `/resources` | Searchable resources and a real demo Markdown download |
| `/journey` | Public preview of a future personal journey |
| `/login` | Login UI preview; no credentials submitted or session created |

Content routes contain no WebGL Canvas. Data flows through `src/lib/repository.ts`, the replacement boundary for future APIs. UI access rules are not server authorization; future protected endpoints must enforce authentication, role and record ownership.

## Source and assets

- `src/data/islands.ts`: typed island registry, docks, themes, model slots, routes and access policies.
- `src/data/navigation.ts`, `src/lib/navigation-graph.ts`: shared lanes, Dijkstra routing, cubic splines and arc-length sampling.
- `src/lib/world-framing.ts`, `src/lib/world-transform.ts`: shared world transforms and camera-safe composition.
- `src/lib/journey-machine.ts`, `src/hooks/use-journey.ts`: explicit route planning, sailing stages, preserved UI states, command guards, history and stale-trip handling.
- `src/components/world/`: irregular island geometry, detailed scenery, themed modules, boat, water, lighting and camera.
- `src/components/experience/`: minimal HUD, map, settings, reusable arrival panel and lightweight alternative.
- `src/components/content/`: existing listings and the five additional destinations.
- `public/models/youthverse-explorer.glb`: original 535,684-byte, 18,859-triangle boat with named hull, sail, rigging and deck parts.
- `scripts/lib/explorer-boat.mjs`: editable procedural model source; regenerate with `npm run assets:boat`.
- `public/images/sky-clouds-v2.webp`: sky-only background, reused from the earlier visual pass. It contains no islands, campus, boat or UI.
- `design-references/`: six supplied reference images and their README.

The boat GLB is an actual indexed geometry export produced with Three.js. Blender is unavailable and was not used. No Draco/Meshopt compression is claimed. See [model integration](public/models/README.md) and [sky provenance](public/images/sky-clouds-v2.prompt.md).

## Performance

Balanced is the default. Quality presets cap DPR and adjust shadows, terrain segments, rock instances, foliage clusters and water tessellation. Distant scenery uses lightweight silhouettes; visible large islands and the current destination retain detailed art. Theme modules load lazily.

Island roots remain enabled regardless of journey phase or progress. Normal mesh frustum culling and spatial LOD control drawing cost. Loaded detail stays cached, and terrain geometries are reused when switching LOD. Camera focus landmarks do not control island visibility.

Trees and rocks use instancing, static architecture is merged by compatible material, and materials/textures are shared. Water, cloth, vegetation, boat and camera animation run imperatively without React updates every frame. Generated resources have cleanup boundaries. No bloom, full-screen postprocessing or reflection render targets are used.

Physical-device frame rates have not been measured. Headless SwiftShader checks rendering and interaction, not laptop or phone GPU performance.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:hydration
```

Browser tests use installed Microsoft Edge with software WebGL. Build before running them. Set `PLAYWRIGHT_BASE_URL` to choose a different local server/port; tests can start or reuse a production server.

`test:hydration` uses a development server because React's attribute-mismatch diagnostics are development-only. It covers reduced motion, stored graphics preferences, mobile and root attributes injected by cursor extensions. An intentional nested mismatch confirms that application components still report hydration errors. The normal production browser suite excludes these development-only checks.

`node scripts/capture-preview.mjs http://127.0.0.1:3001/?inspect=1` captures an already-running preview. The optional `?inspect=1` query exposes separate counts for existing/enabled island roots, actual viewport intersections, active detailed/simplified LOD, cached detail, renderer counters and boat coordinates as canvas data attributes for QA, with no product overlay.

See [VERIFICATION.md](VERIFICATION.md) for actual results and [REDESIGN.md](REDESIGN.md) for the implementation handoff.

## Remaining production work

The campus entrance preserves the reference's long low curved canopy, oval roof opening, columns and right-hand EIU sign wall. It is a stylized procedural approximation, not a surveyed reconstruction. Replace its dedicated model slot with an approved campus GLB when supplied.

Approved EIU / Youth Union / Student Association SVG wordmarks, verified production campus geometry, official content, backend authentication and APIs remain to be supplied. Text branding and original decorative compass marks are used in this preview. No hosting or external publication is configured.
