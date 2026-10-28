# Task 02A — 3D asset upgrade

The models and animations documented here are preserved. [BOAT-CENTRIC.md](BOAT-CENTRIC.md) records the subsequent perspective camera and forward island layout; world-view captures below show the earlier overview composition.

[Phase 3](PHASE3.md) now defines the current five-island layout, preserved content mappings and stable camera. The asset files documented here remain unchanged.

Thực hiện trong dự án hiện có, ngày **28/10/2026**. Phạm vi: thuyền, campus EIU và một đảo mẫu Hoạt động. Các model là GLB thật, được sinh từ source procedural có thể sửa và xuất lại. Đây là art stylized dựa trên ảnh; chưa phải mô hình kiến trúc đo đạc hoặc asset chính thức được EIU duyệt. Không tìm thấy Blender trong PATH/thư mục cài chuẩn đã kiểm tra; không tạo hoặc tuyên bố có tệp `.blend`.

## Thay đổi nhìn thấy

- **Thuyền:** sửa hướng mặt ván ngoài vốn quay vào trong và chỉ lộ lớp backing tối; profile Hermite liên tục cho đường thân/mũi/đuôi, ván gỗ sáng rõ và có bề dày. Buồm phồng hơn, có đường may/viền thật, dấu EIU bám theo mặt cong và đúng chiều UV. Bổ sung ghế đuôi, đai cột, chốt buộc dây, đường nối ván và đèn nhỏ; giữ boong, dây, vô lăng, hatch, coil, crate. Các tên animation được giữ nguyên.
- **Cổng:** đọc trực tiếp hai ảnh `design-references/eiu-entrance-real.jpg` và `eiu-campus-real.jpg`. Giữ mái trắng ngang cong, lỗ oval thông thật, cột tròn thanh, tường chữ ở bên phải. Mái mỏng có fascia/reveal và cạnh bo nhẹ, chữ EIU là hình học 3D. Không thêm cổng fantasy hoặc công trình được gán là kiến trúc thật ngoài ảnh.
- **Campus:** khối lớp học lùi về sau và có chiều cao phân biệt với mái cổng; ba dải cửa sổ chìm, mullion, gờ che nắng, parapet và mặt mái. Lối đi nối bến, hồ chữ nhật nhỏ lấy cảm hứng từ ảnh, cây có tán rộng/hẹp và độ cao khác nhau. Bố cục là bản thu nhỏ stylized, không phải mặt bằng khảo sát.
- **Địa hình:** sửa hướng tam giác vách đá quay vào trong, đóng đáy mesh; hai đảo mẫu dùng tầng xói mòn thấp, gờ đá, ít đá rời nhỏ hơn, và váy mép cỏ nối kín vách. Trung tâm mặt đất vẫn phẳng để giữ chân kiến trúc/bến; gợn nhẹ chỉ ở vùng ngoài. Không tăng phân đoạn đồng loạt. Sửa winding dùng chung giúp mesh của các đảo còn lại có mặt ngoài đúng; không tạo thêm bảy môi trường chi tiết.
- **Hoạt động:** GLB sân gỗ có ván/slat, ghế có chân/tựa, mái vải căng cong có đường may, cờ dây, cột/dây chằng, loa và đường vào bến. Đây là mẫu chất lượng để xem lại trước khi làm các đảo khác.

## Asset và tích hợp

| Asset | Trước | Sau |
| --- | --- | --- |
| Thuyền | 535.684 byte, 18.859 tam giác, 31 mesh | **544.600 byte, 18.151 tam giác, 37 mesh** |
| Campus architecture | JSX procedural | **624.404 byte, 9.588 tam giác, 9 mesh** |
| Activities art | JSX procedural | **325.220 byte, 10.203 tam giác, 9 mesh** |

Thuyền giảm khoảng 3,75% số tam giác, tăng khoảng 1,66% dung lượng. Hai GLB môi trường thêm tổng cộng 949.624 byte; không che giấu chi phí tải mới. PBR màu/roughness/metalness có trong GLB; runtime dùng texture nhỏ có sẵn, chia sẻ giữa các instance. Chưa dùng Draco/Meshopt/KTX2 hoặc baked lightmap.

Đã chạy lại cả hai script sinh model và so SHA-256: cả ba GLB được tái tạo **giống từng byte** với asset bàn giao.

Registry thật chọn `kind: "glb"` cho campus và Activities. Loader clone scene/material, dùng lại geometry đã cache; cleanup chỉ giải phóng tài nguyên instance sở hữu. Fallback procedural dùng cùng source xuất model. Loader lỗi không làm mất kiến trúc hoặc điều hướng. `island-art:<id>` bao cả GLB/fallback để metrics/LOD vẫn quan sát đúng. Thuyền có URL version để tránh giữ GLB cũ trong cache HMR.

Tọa độ/scale/rotation của cả chín đảo, bến, graph, spline, state machine, camera framing, Hải đồ, trang nội dung và login không đổi. Asset đã kiểm tra nằm trong `viewBounds`/boat envelope cũ nên không cần nới bounds hoặc thay graph. All-nine-root fix vẫn được giữ.

## Đo và kiểm tra

TypeScript strict, lint, **108 unit tests / 5 tệp** và production build đã đạt. Unit mới thực sự parse GLB bằng GLTFLoader, kiểm tra bounds/ngân sách/normal/UV/index, các tên chuyển động, normal thân tàu hướng ra ngoài, độ phồng buồm, normal vách đá, vị trí sign wall và raycast qua lỗ oval trên campus GLB.

| Kiểm tra cuối cùng | Kết quả |
| --- | --- |
| TypeScript / ESLint / production build | Đạt |
| Unit tests | **108/108**, 5 tệp |
| Browser production | **12/12**, **6,0 phút** |
| Development hydration | **5/5**, **25,5 giây** |
| Viewport | **1440×900**, **1920×1080**, **390×844** |
| Điều hướng liên tục | 6 tuyến × 3 viewport, 126 mẫu và **1.338 frame**; **0** root bị tắt/remount, **0** frame không có đảo giao viewport |
| Quality/resource check | Sau warm-up LOD và vòng lặp High/Low/Balanced: **259 → 259 geometry** |

Hai bài browser mới xác nhận đúng URL của cả ba GLB được tích hợp thật, main/jib sail vẫn đổi đỉnh khi chạy, reduced motion dừng biến dạng và đổi chất lượng không làm tăng số geometry sau warm-up. Bài chặn cả hai GLB môi trường vẫn thấy kiến trúc procedural, đủ 9 root và đi/cập bến Activities được. Lỗi tải trong bài này được tạo có chủ đích. Các bài còn lại xác nhận raycasting, cả tám điểm đến, lịch sử, map, culling/LOD, bến/panel, nội dung, fallback không WebGL, accessibility và bố cục hẹp. Hydration vẫn đạt cả kiểm tra cursor extension và mismatch con cố ý tạo.

Đo trong inspector với camera, ánh sáng, Balanced và reduced motion giống nhau; số tam giác bao gồm shadow pass và không phải số tam giác trong file GLB:

| Góc cận | Draw calls trước → sau | Tam giác render trước → sau | Texture trước → sau |
| --- | --- | --- | --- |
| Boat | 62 → 74 | 37.718 → 36.302 | 6 → 6 |
| Campus | 62 → 67 | 52.248 → 69.724 | 7 → 6 |
| Entrance | 17 → 8 | 1.194 → 7.752 | 4 → 3 |
| Activities | 22 → 22 | 12.712 → 24.014 | 8 → 6 |

Chi tiết campus/Activities tăng số tam giác; chúng được gộp theo vật liệu và vẫn dùng LOD/culling/preset sẵn có. Không tuyên bố FPS tốt hơn chỉ từ các con số này. Bằng chứng inspector nằm trong `artifacts/task02/{before,after}/review-metrics.json`; kiểm tra runtime ở `after/runtime-metrics.json`.

## Ảnh trước/sau

Inspector là công cụ local ngoài route ứng dụng, import đúng component runtime. Bản trước được dựng lại từ source/GLB của commit `6d651e5` trong cache bị ignore; cùng góc camera và ánh sáng cho từng cặp. Home/approach/docking dùng ảnh kiểm tra hành trình của phiên bản trước và lần chạy mới ở đúng viewport/tuyến/mốc. Không dùng ảnh làm vật thể 3D.

Mỗi kích thước có đủ 7 cặp: home, boat, campus, entrance, Activities, approach và docking:

| Viewport | Trước | Sau |
| --- | --- | --- |
| 1440×900 | [Home](artifacts/task02/before/1440/home.png), [Boat](artifacts/task02/before/1440/boat.jpg), [Campus](artifacts/task02/before/1440/campus.jpg), [Entrance](artifacts/task02/before/1440/entrance.jpg), [Activities](artifacts/task02/before/1440/activities.jpg), [Approach](artifacts/task02/before/1440/approach.png), [Docking](artifacts/task02/before/1440/docking.png) | [Home](artifacts/task02/after/1440/home.png), [Boat](artifacts/task02/after/1440/boat.jpg), [Campus](artifacts/task02/after/1440/campus.jpg), [Entrance](artifacts/task02/after/1440/entrance.jpg), [Activities](artifacts/task02/after/1440/activities.jpg), [Approach](artifacts/task02/after/1440/approach.png), [Docking](artifacts/task02/after/1440/docking.png) |
| 1920×1080 | [Home](artifacts/task02/before/1920/home.png), [Boat](artifacts/task02/before/1920/boat.jpg), [Campus](artifacts/task02/before/1920/campus.jpg), [Entrance](artifacts/task02/before/1920/entrance.jpg), [Activities](artifacts/task02/before/1920/activities.jpg), [Approach](artifacts/task02/before/1920/approach.png), [Docking](artifacts/task02/before/1920/docking.png) | [Home](artifacts/task02/after/1920/home.png), [Boat](artifacts/task02/after/1920/boat.jpg), [Campus](artifacts/task02/after/1920/campus.jpg), [Entrance](artifacts/task02/after/1920/entrance.jpg), [Activities](artifacts/task02/after/1920/activities.jpg), [Approach](artifacts/task02/after/1920/approach.png), [Docking](artifacts/task02/after/1920/docking.png) |
| 390×844 | [Home](artifacts/task02/before/390/home.png), [Boat](artifacts/task02/before/390/boat.jpg), [Campus](artifacts/task02/before/390/campus.jpg), [Entrance](artifacts/task02/before/390/entrance.jpg), [Activities](artifacts/task02/before/390/activities.jpg), [Approach](artifacts/task02/before/390/approach.png), [Docking](artifacts/task02/before/390/docking.png) | [Home](artifacts/task02/after/390/home.png), [Boat](artifacts/task02/after/390/boat.jpg), [Campus](artifacts/task02/after/390/campus.jpg), [Entrance](artifacts/task02/after/390/entrance.jpg), [Activities](artifacts/task02/after/390/activities.jpg), [Approach](artifacts/task02/after/390/approach.png), [Docking](artifacts/task02/after/390/docking.png) |

Ảnh cho thấy khối học thuật và mái cổng tách rõ hơn, window depth/soffit đọc được ở góc cận; thân thuyền có màu gỗ đúng phía ngoài, ký tự EIU không lật và buồm có camber/đường may. Vách đá thành khối kín có tầng thay vì các mặt trông như tấm tam giác rời. Các thay đổi này được xem bằng ảnh/render thực, không suy ra chỉ từ build thành công.

## Tệp bàn giao

- **Model/source:** `public/models/{youthverse-explorer.glb,eiu-campus.glb,explorer-manifest.json,environment-manifest.json,README.md}`, `public/models/islands/activities.glb`; `scripts/lib/{explorer-boat.mjs,export-model.mjs}`, `scripts/{build-boat-model.mjs,build-environment-models.mjs}`; `src/lib/art/{model-kit.ts,campus-model.ts,activities-model.ts}`.
- **Tích hợp:** `src/components/world/{CampusBuildings.tsx,CampusEntrance.tsx,CampusLandscape.tsx,CentralEIUIsland.tsx,DestinationIsland.tsx,FloatingIsland.tsx,IslandRockStrata.tsx,Trees.tsx,SceneMetrics.tsx}`, `boat/ExplorerBoatAsset.tsx`, `islands/{IslandArt.tsx,ProceduralModel.tsx,terrain-geometry.ts,themes/ActivitiesIsland.tsx}`; `src/data/islands.ts`.
- **Công cụ QA:** `scripts/{asset-review.mjs,capture-assets.mjs,review/index.html,review/main.tsx}`, `tests/unit/asset-upgrade.test.ts`, `tests/e2e/asset-upgrade.spec.ts`; `package.json`, `tsconfig.json`, `.gitignore`, `eslint.config.mjs`.
- **Tài liệu/bằng chứng:** `TASK02-ASSET-UPGRADE.md`, `README.md`, `VERIFICATION.md`, `REDESIGN.md`, `artifacts/task02/`. `AGENTS.md` đã có sẵn dưới dạng untracked khi bắt đầu Task 02A và không bị sửa.

## Chạy lại và giới hạn

```powershell
npm.cmd run assets:boat
npm.cmd run assets:environment
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3001'
npm.cmd run test:e2e
# Inspector riêng, không phải route sản phẩm:
npm.cmd run assets:review
# Terminal khác:
npm.cmd run assets:capture
```

Vite đã có trong lockfile qua Vitest; không thêm dependency/decoder. Script sinh môi trường dùng native TypeScript của Node 24. Cache baseline cần Git và commit lịch sử nói trên; review bản hiện tại vẫn chạy nếu không có lịch sử đó.

Chưa đo FPS, VRAM, nhiệt/pin trên laptop hoặc điện thoại thật; headless Edge/SwiftShader xác nhận hành vi và hình ảnh. Chưa có Safari/Firefox hoặc đo đạc kiến trúc, model chính thức/logo được duyệt. Vải là deform stylized, không phải mô phỏng vật lý; dây/đường may không có cloth simulation riêng. Chưa có texture compression/baked AO, và GLB gần dùng cùng mesh trong các preset; preset/LOD giảm bóng/DPR/địa hình/chi tiết xa. Auth/API vẫn là demo hiện có. **Dừng ở Task 02A** để xem lại art direction trước khi nâng cấp các đảo còn lại.

Các server inspector/production QA riêng được dừng sau xác minh; server development của người dùng trên cổng 3000 được giữ lại. Ảnh và JSON lịch sử Task 01/continuous-world được giữ nguyên trong Git; bằng chứng art mới nằm riêng ở `artifacts/task02/`.
