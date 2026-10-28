# Shorter sailing routes — 28 October 2026

The five-island world and stabilized camera from Phase 3 are preserved. This update shortens physical routes and replaces slow full-route easing with a curvature-aware speed profile. The comparison baseline was captured from commit `5a71416` before changing the planner.

| Measure, all 20 ordered island pairs | Before | After |
| --- | --- | --- |
| Average route length, world units | 85.66 | 45.73 |
| Average planned sailing time | 29.20 s | 8.91 s |
| Longest planned sailing time | 40.92 s | 13.55 s |
| Shortest planned sailing time | 10.17 s | 4.02 s |

Total physical distance is **46.6% lower** and average planned sailing time is **69.5% lower**. No ordered island-pair route is longer than its baseline, and every trip has a shorter duration. Timings describe active sailing, excluding the map and panel transitions.

Examples:

| Trip | Previous time | New time |
| --- | --- | --- |
| Campus → Clubs | 18.7 s | 4.0 s |
| Campus → Achievements | 39.4 s | 6.5 s |
| Activities → Office | 28.2 s | 8.3 s |
| Office → Campus | 37.9 s | 6.6 s |
| Office → Clubs | 40.9 s | 9.0 s |

## What caused the wait

Every route previously required a six-unit straight departure and approach, even between nearby berths. Candidate turns started at a six-unit radius. Those constraints often forced a large loop before the ship could approach its berth heading. The global quintic timing curve then spent much of the voyage accelerating/decelerating, averaging only about 2.93 units/s despite a 5.5-unit/s peak.

The sailing clock also discarded frame time above 100 ms. At five FPS, a 200 ms frame advanced the trip by only 100 ms, doubling the real wait.

## Changes

- The planner tests forward departure/approach leads of **0, 1.5, 3 and 6 units** and selects the shortest clear candidate. Zero lead permits a curved departure while moving; it does not rotate the stationary boat.
- Minimum turn radius is **4.5 units**. Larger radii remain available where they produce a safe route. All existing berth positions and endpoint headings remain unchanged.
- Angles within a small floating-point tolerance of zero or a full revolution normalize to zero, avoiding numerically spurious complete turns.
- A distance-indexed travel profile permits **8.5 units/s** on clear straights, slows according to curvature to limit route yaw rate to **55°/s**, bounds acceleration/deceleration at **5 units/s²** and limits the final three units to **2.8 units/s** before stopping.
- Forward/backward speed passes begin braking before a tighter turn or berth. Speed is continuous; final speed is zero. The previous whole-trip quintic timing is retained only for the existing lightweight fallback, which already uses a short transition.
- At normal and low frame rates, the 3D clock advances by the actual frame interval, up to 250 ms per frame. Hidden-tab sailing pauses; a long stall cannot fast-forward the whole voyage.
- Waterways and the map continue to derive from the planned cubic segments. All five roots, GLBs, branding, content, authorization boundaries and camera yaw limits remain unchanged.

The new timing sampler has an exact distance-to-time inverse for route milestones. QA reads the actual runtime timing profile instead of assuming the old quintic curve. Timing data is serialized once per plan in the existing opt-in inspector, not every rendered frame.

## Source and verification

Core changes: `src/lib/heading-routes.ts`, `src/lib/travel-timing.ts`, `src/lib/navigation-graph.ts`, `src/data/world-settings.ts`, `src/types/navigation.ts`, `WorldScene.tsx` and `SceneMetrics.tsx`.

Strict TypeScript, ESLint, production build and **83 unit tests** passed. Coverage retains all 20 ordered pairs, five launch routes, heading continuity, obstacle clearance and water geometry; new checks compare every route against the saved baseline and verify timing inversion, speed, acceleration and turn-rate bounds.

The browser suite exercises all pairs at **1920×1080, 1440×900 and 390×844**, direct transitions, the reduced-motion animated override and a new five-FPS regression that must arrive within the route's normal time. Existing portal, model, quality, history and accessibility scenarios are preserved.

Final results: **20 production browser scenarios passed** across the full run and focused navigation rerun; **5 development hydration cases passed**. The rerun replaces the previous five-second minimum-frame assertion with a check based on each route's actual duration, allowing the newly shortened four-second trips. See [verification summary](artifacts/route-optimization/verification-summary.json) and [hydration results](artifacts/route-optimization/hydration-results.json).

The main audit records **63 animated voyages and 60 direct transitions**, with **5,559 moving frames** and no island-root or boat-anchor violation. Observed boat yaw remains below **55.01°/s** and camera view yaw below **12.31°/s**. The longest island-free view on the phone falls from the historical 7.8 to **2.5 controlled seconds**. [Frame observations](artifacts/route-optimization/frame-summary.json). These are software-rendering checks, not physical-device performance measurements.

Evidence: [before](artifacts/route-optimization/before.json), [after](artifacts/route-optimization/after.json), and the per-viewport navigation captures under `artifacts/route-optimization/`. The five-island video is recorded with the actual scene and existing sky background.

| Viewport | Shortened Office → Clubs route | Arrival |
| --- | --- | --- |
| 1920×1080 | [Sailing](artifacts/route-optimization/1920/office-clubs-sailing.png) | [Docked](artifacts/route-optimization/1920/office-clubs-arrived.png) |
| 1440×900 | [Sailing](artifacts/route-optimization/1440/office-clubs-sailing.png) | [Docked](artifacts/route-optimization/1440/office-clubs-arrived.png) |
| 390×844 | [Sailing](artifacts/route-optimization/390/office-clubs-sailing.png) | [Docked](artifacts/route-optimization/390/office-clubs-arrived.png) |

Also retained: [Activities → Office](artifacts/route-optimization/1440/activities-office-sailing.png), [journey video](artifacts/route-optimization/1440/five-island-journey.webm), and the [numeric comparison](artifacts/route-optimization/comparison.json). Prior Phase 3 captures remain unchanged; this targeted update keeps seven representative images instead of duplicating the complete historical gallery.

## Limits

Some turns remain necessary to preserve forward travel and the berth's existing direction. The planner chooses among clear heading-constrained candidates, rather than claiming a globally shortest path through arbitrary obstacles. Camera stabilization is unchanged. Travel can still slow below four rendered frames per second because of the stall guard; the existing direct-transition and lightweight options remain available. Software browser checks do not establish physical-device GPU performance.
