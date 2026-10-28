# Boat-centric exploration — 28 October 2026

The homepage now starts behind the sailing boat, looking forward toward EIU Campus and a layered horizon. A perspective chase camera replaces the orthographic world-fitting camera. The boat owns the framing throughout a trip; island bounds no longer determine camera position or zoom.

## Camera

`src/lib/boat-camera.ts` defines the state profiles. `CameraController.tsx` applies them in the vessel's local frame, using the boat's animated heading. The base boom sits **12.5 units behind and 6.2 above** the boat, with **10 units of forward lookahead**, a small shoulder offset and **50° vertical FOV**. Mobile uses **72° FOV**, less shoulder offset and **14 units of lookahead**. The boat's anchor sits around the lower middle of the viewport.

Anchor and heading damping use an exponential rate of 12; boom, lens shift and lookahead ease at 4.8. Heading interpolation takes the shortest angle across ±π. The camera eye is reconstructed behind the vessel each frame, avoiding a Cartesian interpolation that would cut across the boat during a turn. It does not orbit to an island or fit the entire world.

| State | Framing |
| --- | --- |
| IDLE | Calm base chase pose behind the offshore boat |
| SELECTING_DESTINATION / ROUTE_PLANNING | Slightly longer boom and lookahead preserve the boat while revealing more of the horizon |
| SAILING | Speed adds up to 1.8 units of boom distance, 0.35 of height and 3 of lookahead |
| APPROACHING | Boom eases to 12.2; the destination grows naturally as distance closes |
| DOCKING / ARRIVED | Boom eases to 11.8 and height to 5.9, with shorter lookahead |
| EXPLORING_CONTENT | Same chase direction; desktop lens shift leaves room for the right panel, mobile moves the boat above a scrollable sheet |

Reduced motion applies the chase pose directly without camera easing or an animated orbit, omits the departure pause, freezes the existing ambient animation and retains the existing 0.45-second journey. Normal departures allow **700 ms** to turn toward the first route tangent before translating. Existing boat turning, sail, rig, wheel and wake animations remain intact.

## Forward island fan

The boat starts at **[0, -0.3, 34]**, facing negative Z. Every island lies ahead of that point. Distances, elevations and scales vary deliberately; the campus is the strongest midground destination. This is a 2 / 3 / 4 composition, rather than a ring.

| Layer | Island | World position X, Y, Z | Scale |
| --- | --- | --- | --- |
| Foreground | Activities | -12, -0.5, 11 | 0.95 |
| Foreground | Clubs | 12, 0.1, 8 | 0.88 |
| Midground | **EIU Campus** | **0, 1, -8** | **1.40** |
| Midground | News | -24, 2, -13 | 0.90 |
| Midground | Volunteer | 24, 2.6, -18 | 0.84 |
| Background | Events | -32, 3, -41 | 1.03 |
| Background | Office | -11, 4.4, -53 | 0.95 |
| Background | Achievements | 12, 5.5, -59 | 1.02 |
| Background | Resources | 34, 3.4, -48 | 0.95 |

Fog now extends from 52 to 150 world units. Existing spatial LOD uses perspective apparent size as well as distance and hysteresis. More distant islands remain softer silhouettes until approached. All **nine island roots stay mounted and enabled**, independent of journey phase. Physical frustum culling and child LOD groups still control drawing cost.

Labels avoid both UI and the projected boat bounds, prioritize the selected destination and nearby islands, and remain limited to five on desktop and two on mobile. A Campus label is available from the launch. The map retains all nine destinations even when they are outside the chase camera's field of view.

## Navigation and history

The offshore launch is a waterway node, **not a tenth island**. `JourneyState.atLaunch` distinguishes the original homepage from a boat physically docked at Campus. The initial Campus destination is now selectable and has a real launch-to-Campus route. Arriving or restoring an island berth clears `atLaunch`.

- Island transforms, local piers, docking positions and the minimap derive from the same registry. The News pier now faces the forward approach.
- Added launch/wake/horizon channels and western/eastern bypasses connect the new fan. Direct Campus departure channels avoid unnecessarily sailing back toward the launch before entering the world.
- The existing Dijkstra planner, cubic splines, C1 tangent blending, arc-length sampling, acceleration and approach/docking thresholds are preserved. `planLaunchRoute()` selects the launch graph node without changing island identities.
- `/#campus` restores the actual Campus berth. An initial URL without an island hash starts offshore. History state preserves the distinction when going Back/Forward or reloading, including an actual Campus berth without a hash.
- Closing a destination panel leaves the boat at its berth. **Trở về EIU** sails to Campus, rather than teleporting to the launch.
- The desktop arrival panel keeps the boat to its left. The phone sheet has a 55svh maximum height and scrolls its existing content, leaving the boat readable above it.

All three upgraded GLBs, their generation source, content routes, access rules, login preview, lightweight fallback, quality settings, branding and sky artwork are preserved. The standalone asset inspector compensates for the new Campus transform so its model views remain usable. No new dependency or regenerated model is required.

## Verification and captures

| Check | Result |
| --- | --- |
| TypeScript / ESLint / production build | Passed |
| Unit suite | **110 passed**, five files |
| Production browser scenarios | **12 passed** across the full run and targeted history rerun |
| Development hydration suite | **5 passed** |
| Required viewports | **1920×1080, 1440×900, 390×844** |
| Captures | **41 PNGs**, including all six requested states at each size |

The added reload regression compares the berth's X/Z coordinates while preserving the hull's existing vertical bobbing. [Production results](artifacts/boat-centric/production-results.json) record the full-run totals and successful targeted rerun; [hydration results](artifacts/boat-centric/hydration-results.json) retain the five development checks. A final map smoke check at all three sizes verifies the correct offshore location label, Campus availability and screen-reader announcement after copy cleanup.

The browser scenarios use actual Three.js perspective projection, actual route travel, real GLBs and persistent Canvas/root identities. A controlled browser clock and 80 ms requestAnimationFrame interval make the journey milestones repeatable in software WebGL; application route progress is not mocked.

Each viewport exercises launch → Campus and Campus → News / Activities / Events / Office, News → Clubs, Achievements → Resources. The evidence records seven trips and 48 milestone samples per size. It checks the camera remains behind the boat, forward alignment, lower-middle anchor, waterway alignment, all nine enabled roots with unchanged UUIDs, final dock heading, synchronized map coordinates, destination links, boat clearance from content panels and label collisions.

The three journey scenarios passed with **21 trips, 144 milestone samples and 1,947 controlled sailing frames**. There were **zero root-identity, behind-camera or boat-anchor violations**. Sampled camera distance behind the vessel remained approximately **11.8–15.6 units**; maximum sampled planar boat-to-waterway distance was **0.0214 unit**. GLB animation and repeated graphics-preset checks retained **243 geometries before and after** warming caches. The boat, Campus and Activities GLB bytes are unchanged.

| Viewport | Initial | Selection | Mid-sailing | Approaching | Docking | Arrived |
| --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | [Image](artifacts/boat-centric/1920/initial.png) | [Image](artifacts/boat-centric/1920/selection.png) | [Image](artifacts/boat-centric/1920/mid-sailing.png) | [Image](artifacts/boat-centric/1920/approaching.png) | [Image](artifacts/boat-centric/1920/docking.png) | [Image](artifacts/boat-centric/1920/arrived.png) |
| 1440×900 | [Image](artifacts/boat-centric/1440/initial.png) | [Image](artifacts/boat-centric/1440/selection.png) | [Image](artifacts/boat-centric/1440/mid-sailing.png) | [Image](artifacts/boat-centric/1440/approaching.png) | [Image](artifacts/boat-centric/1440/docking.png) | [Image](artifacts/boat-centric/1440/arrived.png) |
| 390×844 | [Image](artifacts/boat-centric/390/initial.png) | [Image](artifacts/boat-centric/390/selection.png) | [Image](artifacts/boat-centric/390/mid-sailing.png) | [Image](artifacts/boat-centric/390/approaching.png) | [Image](artifacts/boat-centric/390/docking.png) | [Image](artifacts/boat-centric/390/arrived.png) |

Arrival panels: [desktop](artifacts/boat-centric/1440/campus-news-panel.png), [phone](artifacts/boat-centric/390/campus-news-panel.png). Each size also includes its map and closed-panel arrival. The 1440 directory additionally captures the other required route midpoints and panels.

Raw frame and milestone evidence: [1920](artifacts/boat-centric/1920/navigation-evidence.json), [1440](artifacts/boat-centric/1440/navigation-evidence.json), [390](artifacts/boat-centric/390/navigation-evidence.json).

Unit coverage retains all 72 directed island-pair routes, exact transformed dock endpoints, C1 continuity, water mesh orientation and conservative unrelated-island clearance. It adds all nine launch routes, frontal-layer ordering, perspective boat framing at all three sizes, shortest-angle turns and launch/Campus state restoration.

The chase camera deliberately follows the boat during reverse trips and departure turns. A destination can initially be off-screen while the vessel turns or follows a necessary bypass. Measured island-free field-of-view intervals were at most **2 controlled frames (0.16 s) at 1440**, **none at 1920**, and **17 controlled frames (1.36 s) on the narrow phone viewport**; the boat remained visible and all nine roots stayed enabled throughout. The evidence measures actual island-bound intersections separately from root enablement. These are conservative screen bounds, not an occlusion test. Software Edge/SwiftShader verification does not establish physical laptop or phone GPU frame rates.
