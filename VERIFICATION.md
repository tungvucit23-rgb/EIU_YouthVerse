# Verification record

## Task 02A asset upgrade — 28 October 2026

Current source, functional GLBs, matching visual comparisons and test evidence are documented in [TASK02-ASSET-UPGRADE.md](TASK02-ASSET-UPGRADE.md). This adds 6 meaningful unit cases (108 total) and 2 real-browser asset cases for GLB selection, cloth animation, repeat quality-switch resource counts and failed-model procedural fallback. Historical checks below retain their original asset sizes and screenshots; current art captures live in `artifacts/task02/`.

Final Task 02A results: TypeScript, lint, build, **108 unit tests**, **12 production browser tests (6.0 minutes)** and **5 development hydration tests (25.5 seconds)** passed. All 18 required route/viewport combinations retained nine enabled roots and recorded no empty-land viewport frame. The repeated graphics cycle retained **259 geometries before and after** warming LOD caches. **42 before/after screenshots** cover all three viewports. New files contain functional indexed GLBs: boat 544,600 bytes, campus 624,404 bytes, Activities 325,220 bytes. Physical GPU FPS has not been measured.

## Continuous archipelago correction — 28 October 2026

The current architecture and verification are recorded in [CONTINUOUS-WORLD.md](CONTINUOUS-WORLD.md). The former phase-based island staging described in the historical Task 01 record below has been removed. All nine roots remain enabled; camera intersections and active LOD are measured separately. Current screenshots are in `artifacts/continuous/`.

Final results: strict TypeScript, ESLint, production build, **102 unit tests**, **10 production browser tests (5.6 minutes)** and **5 development hydration tests (24.8 seconds)** passed. The six requested routes were exercised at all three required sizes, with **126 milestone observations** and **1,338 controlled sailing frames**. No disabled/remounted island root or empty-island viewport frame was recorded. The handoff includes **36 screenshots and 3 JSON evidence files**. Software WebGL does not establish physical-device FPS.

## Hydration correction

The development log identified cursor-extension mutations (`data-cc-prev-cursor` and `style.cursor`) on `html`/`body`. A separate clean-browser reproduction with reduced motion identified a real hero mismatch: the server rendered `translateY(14px)` while the client initially rendered `none`.

Hero and destination-hint motion preferences now use the existing `useSyncExternalStore` media-query hook with a stable server snapshot. Only root `html`/`body` attribute warnings are suppressed to tolerate cursor extensions; application children remain checked.

Validation: strict TypeScript, ESLint, production build and all **94 unit tests** passed. The dedicated development browser suite passed **5 tests in 29.6 seconds**, covering desktop, reduced motion, mobile/stored graphics settings, extension-modified roots on home/login, and an intentional nested mismatch that must still report a hydration error. Before the fix, the same suite reproduced three failures; after the fix, all five passed. Production mode alone cannot validate these attribute diagnostics.

Reproduce with `npm.cmd run test:hydration`. It uses `playwright.hydration.config.ts` to start or reuse a development server; ordinary production E2E excludes this suite.

## Task 01 foundation — historical, before the continuous-world correction

Verified locally on **27 October 2026**, in the existing Windows workspace.

| Check | Actual result |
| --- | --- |
| Strict TypeScript | Passed — `npm.cmd run typecheck` |
| ESLint | Passed — `npm.cmd run lint`, no errors or warnings |
| Unit tests | Passed — **94 tests**, 3 files |
| Production build | Passed — all 11 application routes prerendered |
| Final browser suite | Passed — **10 tests**, **2.6 minutes**, after the final tangent-grade fix |
| Required viewports | **1440×900**, **1920×1080**, **390×844** |
| Regression layouts | Also checked at 820×1180 and 320×740 |
| Accessibility automation | No axe violations for the selected WCAG A/AA checks in the regression suite |

The browser run used installed Microsoft Edge, headless, with SwiftShader WebGL. It exercises an actual Canvas and GLB, not screenshot-based navigation.

## Foundation checks

- The common registry contains all nine island identities, routes, transforms, docks and access metadata.
- Dock endpoints and headings derive from the local pier and island transform. Pier-to-boat clearance is checked independently.
- All **72 directed island pairs** have finite routes with exact dock endpoints and normalized, continuous tangents.
- Every distinct planned segment across those pairs is checked against the water mesh centerline, bounded width and upward normals.
- Sampled routes avoid conservative footprints of unrelated islands. Intermediate bypass nodes prevent shortcuts through nearby destinations.
- Hero and arrival bounds fit safe rectangles at all three required viewport sizes. The pure fit calculation is compared against an actual Three.js OrthographicCamera projection.
- That version staged campus + four destinations on desktop and campus + three on mobile. This staging behavior was a bug and has been superseded by the persistent nine-root architecture; desktop camera framing now includes five secondary islands.
- Real-browser projected bounds confirm unclipped hero islands and docked boat/destination beside or above the content panel.
- HTML map-node centers match registry projections; the boat marker matches the current berth. Selected-target styling and the active route are exercised.
- Moving samples verify changing boat coordinates, bounded camera zoom and a boat-to-water-centerline distance below **0.3 world unit**.
- The final heading aligns with the destination dock; content opens the correct HTML route without a Canvas.
- ROUTE_PLANNING locks competing commands; invalid/stale plans recover safely. History interrupts active trips without accepting old completion events.

The nine-island concept, existing GLB and content/login behavior are preserved. The boat GLB remains **535,684 bytes**, last modified 26 October; the sky WebP remains **169,464 bytes**, also last modified 26 October. Neither asset was regenerated in Task 01.

## Existing behavior rechecked

Seven existing browser scenarios passed: desktop raycasting/sailing/home; all eight destinations and one persistent Canvas; Back/Forward/deep links; mobile settings and lightweight travel; deliberate WebGL failure and keyboard search; all content routes/calendar/downloads/access notices/login preview; accessibility and responsive/quality persistence checks.

Three new scenarios cover composition, map synchronization, real sailing and docked framing separately at 1440×900, 1920×1080 and 390×844. No unexpected pageerror or console error was recorded in those scenarios. GPU errors are deliberately produced in the separate fallback test.

Initial failures found and resolved:

- Water triangle winding pointed down and had been hidden by a double-sided material.
- Some smoothed routes cut through a nearby island; explicit bypass nodes now constrain them.
- Certain junction directions introduced steep vertical tangents; horizontal tangent blending now caps the grade.
- A 1920-pixel map assertion measured during the dialog animation; the test now waits for that animation to finish.
- Hidden islands had left contextual labels at the page origin; every label is now reset and hidden by default.

## Screenshots reviewed

| Viewport | Hero | Sailing | Active map | Arrival |
| --- | --- | --- | --- | --- |
| 1440×900 | [View](artifacts/task01-1440-home.png) | [View](artifacts/task01-1440-sailing.png) | [View](artifacts/task01-1440-map-route.png) | [View](artifacts/task01-1440-arrival.png) |
| 1920×1080 | [View](artifacts/task01-1920-home.png) | [View](artifacts/task01-1920-sailing.png) | [View](artifacts/task01-1920-map-route.png) | [View](artifacts/task01-1920-arrival.png) |
| 390×844 | [View](artifacts/task01-390-home.png) | [View](artifacts/task01-390-sailing.png) | [View](artifacts/task01-390-map-route.png) | [View](artifacts/task01-390-arrival.png) |

## Reproduce

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3001'
node node_modules/@playwright/test/cli.js test
```

The QA preview used an independently controlled production server on port 3001 and was stopped after verification. For interactive review, run `npm.cmd run dev` and open http://localhost:3000.

## Limits

- Software WebGL verifies behavior and composition, not physical GPU FPS, battery or thermal performance.
- No Safari/Firefox, physical touch-device or manual screen-reader verification; axe does not establish full WCAG conformance.
- Camera tests use conservative configured bounds; replace those bounds when introducing larger assets.
- Route clearance tests are not a rigid-body physics simulation of hull collision.
- Existing campus art remains stylized and approximate. Production EIU models and official logos have not been supplied.
- Authentication and ASP.NET Core APIs remain unconnected in the existing frontend demo. No real private records or document workflows are exposed.

See [TASK01-FOUNDATION.md](TASK01-FOUNDATION.md) for architecture, changed files and the phase boundary. The high-detail asset upgrade has not started.
