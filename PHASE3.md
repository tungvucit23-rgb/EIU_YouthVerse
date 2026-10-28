# Phase 3 — calm navigation and five physical islands

The subsequent [route optimization](ROUTE-OPTIMIZATION.md) supersedes the fixed six-unit lead, minimum radius and global quintic travel timing described below. The five-island configuration, portal mappings and stabilized camera remain current.

Implemented in the existing repository on 28 October 2026. This supersedes the nine-island layout and boat-yaw chase rig in [BOAT-CENTRIC.md](BOAT-CENTRIC.md). The Phase 2 boat, Campus and Activities GLBs, their animation names and source, environment, lighting, quality modes and content are preserved.

## Audit: why the old boat and camera turned around

The reversal of cubic control points itself was mathematically correct. The endpoint conventions were incompatible with departing in the boat's current direction:

1. Every old berth faced **toward the island**. Its arrival edge ended with `c2 = berth - forwardHeading * 1.1`.
2. The undirected planner reused that arrival edge backwards for departure. Its first derivative therefore pointed **180° away from the boat's parked heading**. Dijkstra minimized distance without considering heading or turn radius.
3. During `ROUTE_PLANNING`, `SailingClock` immediately assigned that opposite tangent while translation was stopped for 700 ms. `SailingBoat` eased toward it, producing a visible turn in place. Averaging junction tangents could not fix that endpoint mismatch and could squeeze sharp channel reversals into small curves.
4. `CameraController` read `sailing-boat.rotation.y`, damped it again and rebuilt its boom behind that heading. The boat and camera both used shortest-angle wrapping already; wraparound was **not** the root cause. Neither damper imposed angular speed or acceleration limits, so the camera orbited with each departure reversal.

The fix addresses the berth convention, directed route geometry, timing and camera together. There is no replacement 700 ms spin, reversed arrival shortcut or phase-based island hiding.

## Five-island configuration

Physical island IDs and business-domain IDs are now separate types. The world registry, rendering roots, lightweight map and Archipelago Map contain exactly these five islands:

| Physical island | Position X, Y, Z | Scale | Preserved features / routes |
| --- | --- | --- | --- |
| **EIU Grand Campus** | 0, 0.8, -10 | 1.35 | Home, university introduction and general information; news / announcements at `/news` |
| **Youth Union & Activities** | -15, 0.1, 1 | 1.05 | `/activities`, `/events`, `/volunteer` |
| **Clubs & Community** | 15, 0.5, -1 | 1.00 | `/clubs`, `/resources`, existing personal-journey preview |
| **Achievements & Development** | 18, 2, -32 | 1.05 | `/achievements`, `/journey`; existing student access boundaries |
| **Digital Office** | -18, 1.4, -29 | 1.00 | `/office`; existing internal-document and staff access boundaries |

The launch is at **[0, -0.3, 25]**, facing negative Z. Campus is the prominent central landmark; Activities and Clubs form the medium-distance pair; Office and Achievements form the farther pair. All five lie in front of the initial boat. Desktop framing shows all five without scaling everything down to fit a distant overview.

`src/data/portal-sections.ts` retains the original eight domain descriptions and content routes. Those pages retain their filters, calendars, downloads, demo data and authorization notices. New arrival-panel links expose the sections belonging to each parent island. Search also recognizes legacy section names and IDs.

Content-page headings no longer present removed destinations as numbered islands. Their **Trở về thế giới EIU** links restore the correct parent berth. The map's accessible list numbers the five physical destinations consistently from 01 to 05.

| Old world hash | Canonical physical destination | Original page retained |
| --- | --- | --- |
| `#news` | `#campus` | `/news` |
| `#events` | `#activities` | `/events` |
| `#volunteer` | `#activities` | `/volunteer` |
| `#resources` | `#clubs` | `/resources` |

Legacy hashes normalize in history and open the correct parent panel. Unknown hashes and inherited object-property names cannot become destinations. Back/Forward, reload and the offshore/Campus distinction remain supported. Campus now opens its information interface on arrival, just like the other four islands.

## Heading-aware navigation graph

The five berths now park **along the shore**, facing east (+X), with a separate local berth-heading field. Pier geometry, water clearance and world transforms still derive from the registry. The launch retains its northward heading.

- Each departure continues **forward for six world units**. Each approach finishes with a straight segment aligned with the parked heading. The boat never has to turn in place to begin a trip.
- Directed lanes are generated independently for each ordered island pair, plus launch-to-island lanes. Reverse travel receives its own geometry rather than reversing an arrival spline.
- Heading-constrained CSC Dubins candidates use radii **6, 8, 10 and 12 units**. The shortest clear candidate is selected; an outer heading-compatible gate is available when a direct candidate is obstructed.
- Circular turns are converted to cubic pieces of at most 45°. Adjacent endpoints are identical; normalized tangents are continuous. Curvature is bounded by approximately `1 / 6` (with a small cubic-approximation tolerance).
- Every candidate is sampled against **all five** conservative island footprints, including the origin and destination, with additional clearance. A smooth elevation profile preserves flat departure/arrival tangents and the water mesh's upward orientation.
- Dijkstra still chooses a connected route over the resulting directed graph. Heading-compatible intermediate nodes replace blind post-search tangent averaging. Routes are deterministic and precomputed once; no path solver runs every animation frame.
- The existing quintic acceleration/deceleration and arc-length sampling remain. Duration is at least eight seconds and scales with distance so peak boat speed stays at or below **5.5 world units/s**. Longer maneuvers receive more time.

The map shows a readable set of real lanes around the five destinations and highlights the actual selected route. Its node positions and live boat marker use the same projection as the graph. Only active-route or berth water meshes are allocated, rather than constructing every directed lane whenever a trip changes. Those geometries and materials are disposed when replaced; island roots and the Canvas persist.

The CSC formulas are adapted from the primary [Dubins-Curves implementation](https://github.com/AndrewWalker/Dubins-Curves/blob/master/src/dubins.c); the license and local adaptations are recorded in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## Stabilized camera

The camera no longer reads the boat object's yaw. Its baseline heading stays aligned with the initial world view. A route's overall direction may bias that heading by at most **18°** to either side. Local hull turns and sharp route bends do not request a 180° camera orbit.

Shortest-angle interpolation drives a bounded angular controller: **12°/s maximum yaw speed and 8°/s² maximum yaw acceleration**. Translation, route anticipation and boom changes use time-based exponential damping. The rig samples three units ahead on the route and eases toward a displacement capped at **0.8 unit**; eye and target move together, preserving the camera's direction and level horizon.

| State | Camera behavior |
| --- | --- |
| IDLE | Behind and above the north-facing launch boat; lower-middle boat anchor |
| SELECTING / PLANNING | Stable heading and boat framing; no forced departure rotation |
| SAILING | Smooth translation follow and limited route anticipation; the hull can turn independently into a three-quarter or side view |
| APPROACHING | Destination grows through actual travel; anticipation settles and heading remains bounded |
| DOCKING / ARRIVED | Small eased boom adjustment, stable horizon, no orbit or abrupt zoom |
| CONTENT OPEN | Boat and berth stay readable beside the desktop panel or above the phone sheet |

Pitch remains nearly constant, roll is zero and FOV stays **50° desktop / 72° phone** throughout state changes. All animation updates run in `useFrame`, independently of React rerenders. Tuning lives in `worldSettings.cameraComfort` and `worldSettings.navigation`.

## Reduced motion and direct navigation

The settings dialog offers **Chuyển thẳng đến đảo**. It persists independently of graphics quality. It is enabled by default when `prefers-reduced-motion` is set, can also be enabled in normal mode and can be explicitly disabled to retain animated sailing.

Direct navigation restores the selected berth and opens its content without an automatic voyage or camera orbit. It keeps the existing scene and five root identities. Ambient sway, cloth/foliage/water animation and camera rotation are minimized or frozen. If animated sailing is explicitly retained under reduced motion, the camera stays world-aligned and the boat uses the same safe route at its normal duration; it does not rush across the world in 0.45 seconds. The lightweight fallback and keyboard-accessible map remain available.

## Verification

Commands use the repository's existing scripts: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e` and `npm.cmd run test:hydration`.

| Check | Final result |
| --- | --- |
| TypeScript / ESLint / production build | Passed |
| Unit suite | **81 passed** in six files |
| Production browser scenarios | **19 passed** across the full run and focused regression/media reruns |
| Development hydration | **5 passed** |
| Required viewports | **1920×1080, 1440×900, 390×844** |
| Visual evidence | **48 screenshots**, a decoded **960×600 WebM** and per-viewport route observations |

[Browser results](artifacts/phase3/browser-results.json) preserve run totals and the latest outcome of each scenario. The focused reruns update legacy marker assertions to compare both axes, allow the longer calm voyages in software rendering, check the final page-to-parent links/list numbers and validate a presented video frame after seeking. [Hydration results](artifacts/phase3/hydration-results.json) include the intentional nested-mismatch control. [Video metadata](artifacts/phase3/video-metadata.json) confirms decoded dimensions and a visible sky frame.

The unit suite covers all **20 ordered island pairs**, five launch routes, exact berth endpoints, forward departure/arrival headings, clearance, tangent continuity, bounded curvature, speed, camera speed/acceleration at 30/60/120 Hz, an opposite desired heading and ±180° wraparound. It also retains model, water, map, label, LOD, state/history and access-policy checks.

Browser scenarios exercise all 20 ordered pairs in normal mode and all 20 direct transitions in reduced-motion mode at **1440×900, 1920×1080 and 390×844**, plus actual launch-to-Campus voyages. They observe real boat positions/headings, camera view yaw, acceleration, pitch/roll/FOV, destination panels, feature links, exact root UUIDs and one persistent Canvas. The browser clock runs a repeatable 100 ms animation interval for software WebGL; route progress and application state are not mocked.

The main navigation audit completed **63 animated voyages, 60 direct transitions and 17,967 observed moving frames**. No island-root or boat-anchor violation was recorded. Actual camera view yaw peaked at **12.014°/s** (rounded upward), the controller's acceleration stayed within **8°/s²**, camera roll was effectively zero and measured pitch variation within a trip stayed below **0.003°**. Peak boat rotation was **52.55°/s** and the largest 100 ms movement step was below **0.55 world unit**, consistent with the 5.5-unit/s cap. See [frame-summary.json](artifacts/phase3/frame-summary.json).

The GLB animation and repeated quality-switch regression retained **186 geometries before and after** warming caches. Model files and dependency manifests are unchanged. Additional browser cases cover legacy hashes, section-aware search, page-to-parent links, direct-mode persistence and reduced-motion users who explicitly retain animated sailing.

### Captures

| Viewport | Homepage | Campus → Activities | Activities → Office | Office → Clubs | Clubs → Achievements | Return to Campus |
| --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | [Image](artifacts/phase3/1920/initial.png) | [Image](artifacts/phase3/1920/campus-activities-sailing.png) | [Image](artifacts/phase3/1920/activities-office-sailing.png) | [Image](artifacts/phase3/1920/office-clubs-sailing.png) | [Image](artifacts/phase3/1920/clubs-achievements-sailing.png) | [Image](artifacts/phase3/1920/achievements-campus-sailing.png) |
| 1440×900 | [Image](artifacts/phase3/1440/initial.png) | [Image](artifacts/phase3/1440/campus-activities-sailing.png) | [Image](artifacts/phase3/1440/activities-office-sailing.png) | [Image](artifacts/phase3/1440/office-clubs-sailing.png) | [Image](artifacts/phase3/1440/clubs-achievements-sailing.png) | [Image](artifacts/phase3/1440/achievements-campus-sailing.png) |
| 390×844 | [Image](artifacts/phase3/390/initial.png) | [Image](artifacts/phase3/390/campus-activities-sailing.png) | [Image](artifacts/phase3/390/activities-office-sailing.png) | [Image](artifacts/phase3/390/office-clubs-sailing.png) | [Image](artifacts/phase3/390/clubs-achievements-sailing.png) | [Image](artifacts/phase3/390/achievements-campus-sailing.png) |

The **48 screenshots** include selection, map, approach, docking, launch arrival and the five destination panels at each size. [The recorded journey](artifacts/phase3/1440/five-island-journey.webm) captures the actual WebGL scene during the five consecutive requested trips, with the existing sky photo composited behind its transparent canvas. It uses a QA-only retained framebuffer and a 960×600 native browser recording; production renderer settings are unchanged. HTML controls/panels are covered by the screenshots. The video is a controlled-clock software-rendering review, not a physical-device performance recording.

Raw measurements live in each viewport's `normal-navigation.json`, `launch-navigation.json` and `reduced-navigation.json`.

## Files changed and practical limits

- Registry / preserved domains: `src/types/`, `src/data/islands.ts`, `src/data/portal-sections.ts`, `src/data/navigation.ts`, `src/lib/repository.ts` and the existing dynamic content page.
- Geometry / navigation: `src/lib/heading-routes.ts`, `src/lib/route-geometry.ts`, `src/lib/navigation-graph.ts`, `WorldScene.tsx`, `SailingBoat.tsx` and `water/WaterwaySystem.tsx`.
- Camera: `src/lib/boat-camera.ts`, `CameraController.tsx`, `world-settings.ts` and opt-in `SceneMetrics.tsx` observations.
- Navigation UX: journey state/hook, navigation-comfort preference, destination picker, arrival panel, settings, lightweight world, icons, status copy and corresponding CSS. Business pages and access rules retain their existing behavior.
- Tests / evidence: updated existing unit/E2E assertions, added heading/curvature/comfort checks, three-size normal/reduced navigation evidence and captures in `artifacts/phase3/`.

Routes are forward-only candidates with bounded curvature, not a physics simulation or a proof of the globally shortest obstacle-avoiding path. Arc/straight junctions preserve tangent direction; curvature itself can step between zero and the arc value. Vessel steering damping smooths those changes. Obstacle checks use conservative footprints, not triangle-level collision detection.

The stable camera deliberately allows a side or front-quarter view during return legs. Islands can leave its physical field of view during an outer maneuver; none are disabled according to progress. Longest measured island-free intervals were **5.5 controlled seconds at 1440, 5.0 at 1920 and 7.8 on the narrow phone viewport**, while the boat remained readable and all five roots stayed enabled. This is a tradeoff of the stable world-aligned view, rather than a visibility stage or disappearing world. Software Edge/SwiftShader checks do not establish GPU FPS or replace comfort assessment on physical devices. The existing portal remains a frontend demonstration: no new authentication service, private records or backend workflows are claimed.
