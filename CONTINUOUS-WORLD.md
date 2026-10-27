# Continuous archipelago — 28/10/2026

Đã bỏ cơ chế tắt đảo theo tiến trình hành trình. Cả 9 root `island:<id>` được mount một lần, giữ nguyên danh tính và tọa độ trong các chuyến đi. `Canvas` không được remount khi đổi điểm đến. Đảo đi ra khỏi viewport do camera là hành vi bình thường.

## Nguyên nhân và kiến trúc sau sửa

`stageIslandIds()` từng bỏ đảo xuất phát sau 22%, chỉ đưa điểm đến vào sau 50%, và chỉ giữ đảo hiện tại khi cập bến. `WorldComposition.tsx` áp dụng danh sách đó vào `root.visible`; kiểm thử cũ yêu cầu chỉ một đảo sau khi đến. Hàm, component và yêu cầu kiểm thử này đã được xóa.

Bốn trách nhiệm hiện tách biệt:

- **Render:** 9 root luôn bật. Three.js cull mesh theo frustum camera; không có điều kiện phần trăm hành trình để tắt root.
- **Camera:** `cameraFocusPoints()` chọn mốc để fit khung, nhìn trước theo chính tuyến đường và cân nhắc đảo gần theo khoảng cách. Damping làm mượt target/zoom. Điểm đến xa không bị đưa toàn bộ vào khung từ đầu. Khi cập bến, camera chừa panel và giữ mốc lân cận; đóng panel tiếp tục giữ mốc gần trên desktop.
- **LOD:** khoảng cách không gian, kích thước biểu kiến và hysteresis chọn chi tiết hoặc silhouette. Điểm đang chọn được ưu tiên tải chi tiết. Chỉ các nhóm con LOD thay `visible`; root giữ bật. Art đã tải được giữ mounted, terrain chi tiết/đơn giản được cache để tránh tạo lại khi đổi LOD. Đổi preset đồ họa vẫn có thể tạo lại geometry theo mức chất lượng mới.
- **Nhãn HTML:** chiếu tọa độ world ra màn hình, ưu tiên điểm đến rồi các đảo gần, thử vị trí không va chạm với nhãn khác hoặc vùng UI. Giới hạn 5 desktop, 2 mobile. Hải đồ vẫn cung cấp đủ 9 điểm đến.

Desktop home fit campus và 5 đảo phụ: Hoạt động, Tin tức, Câu lạc bộ, Sự kiện, Tình nguyện. Bố cục điều chỉnh có chủ đích tọa độ/scale của năm đảo này; ba đảo xa Office/Achievements/Resources giữ vị trí cũ. Bến và phép chiếu Hải đồ tiếp tục sinh từ registry. Đồ thị bổ sung nhánh vòng đông bắc để các tuyến tránh footprint của đảo sau điều chỉnh. Các tọa độ mới ổn định trong toàn bộ hành trình.

GLB thuyền, animation, sky/cloud, ánh sáng, nhận diện, nội dung, login và authentication placeholders giữ nguyên. Không tạo lại asset hoặc thêm dependency.

## Metrics

Thêm `?inspect=1` để đọc các thuộc tính QA trên canvas; không có overlay sản phẩm:

| Thuộc tính | Ý nghĩa |
| --- | --- |
| `data-islands` | Số root thực sự tồn tại, kể cả root trùng nếu có |
| `data-enabled-island-count`, `data-enabled-islands` | Root và tất cả ancestor đang bật |
| `data-island-root-ids` | ID → UUID để phát hiện remount/duplicate qua hành trình |
| `data-viewport-islands` | Root bật, có bounds giao frustum và viewport thực |
| `data-island-states` | Chi tiết enabled/frustum/viewport, phần bounds trong màn hình, LOD, bounds chiếu và điểm mặt đảo |
| `data-detailed-islands`, `data-simplified-islands` | LOD đang hoạt động; không đồng nghĩa với nằm trong viewport |
| `data-loaded-detailed-islands` | Art chi tiết đã tải và đang được cache |
| `data-viewport-detailed-islands` | Chi tiết đang bật và giao viewport |
| `data-journey-progress`, `data-journey-elapsed`, `data-journey-duration` | Đồng hồ hành trình thực để lấy mẫu trình duyệt |

Các metrics thuyền, nước và renderer có sẵn vẫn được giữ. Việc quan sát không thay visibility của scene.

## Tệp nguồn thay đổi

| Nhóm | Tệp chính xác |
| --- | --- |
| Scene/camera | `src/components/world/WorldScene.tsx`, `src/components/world/CameraController.tsx`, `src/lib/world-framing.ts` |
| Xóa controller lỗi | `src/components/world/WorldComposition.tsx` |
| LOD/cache | `src/components/world/DestinationIsland.tsx`, `src/components/world/FloatingIsland.tsx`; mới: `src/lib/island-lod.ts` |
| Nhãn | `src/components/world/IslandInteraction.tsx`, `src/components/experience/YouthVerseExperience.tsx`, `src/app/archipelago.css`; mới: `src/lib/island-label-layout.ts` |
| Quan sát QA | `src/components/world/SceneMetrics.tsx`; mới: `src/lib/world-observation.ts` |
| Bố cục/đồ thị | `src/data/islands.ts`, `src/data/navigation.ts` |
| Kiểm thử | `tests/unit/journey.test.ts`, `tests/unit/world-foundation.test.ts`, `tests/e2e/experience.spec.ts`, `tests/e2e/world-foundation.spec.ts`; mới: `tests/unit/continuous-world.test.ts` |
| Tài liệu | `README.md`, `VERIFICATION.md`, `TASK01-FOUNDATION.md`, `CONTINUOUS-WORLD.md` |
| Bằng chứng mới | `artifacts/continuous/{1440,1920,390}/`: ảnh và `navigation-evidence.json` |

## Xác minh

TypeScript strict, ESLint và **102 unit tests / 4 tệp** đạt. Unit test kiểm tra cả 72 cặp đảo có hướng, bến/heading, độ liên tục tuyến, clearance, centerline/bề rộng/pháp tuyến nước, camera với Three.js thực tại ba viewport; thêm kiểm tra trạng thái đóng panel, nhãn và spatial LOD.

| Kiểm tra cuối cùng | Kết quả thực tế |
| --- | --- |
| TypeScript strict / ESLint / production build | Đạt |
| Unit tests | **102/102**, 4 tệp |
| Production browser suite | **10/10**, **5,6 phút** |
| Development hydration suite | **5/5**, **24,8 giây** |
| Viewport hành trình | **1440×900**, **1920×1080**, **390×844** |
| Sáu tuyến × ba viewport | **18 chuyến**, **126 mẫu** tại 10/30/45/60/70/85/100% |
| Quan sát từng frame đang đi | **1.338 frame**; **0** root bị tắt/remount, **0** frame không có đảo giao viewport |
| Đảo nền sau đóng panel trên desktop | **4–8** bounds đảo giao viewport tùy tuyến; không có yêu cầu chỉ một đảo |
| Lệch centerline nước lớn nhất trong các mẫu đang đi | **0,0311 world unit** |
| Bằng chứng bàn giao | **36 ảnh**, **3 JSON** chứa mẫu, UUID, LOD, camera và thống kê frame |

Sáu tuyến bắt buộc đều đạt ở cả ba viewport: Campus → News, Campus → Activities, Campus → Events, Campus → Office, News → Clubs, Achievements → Resources. Kiểm tra xác nhận cùng Canvas và UUID của đủ 9 root, điểm đến trong khung, thuyền/đảo không bị panel che, heading đúng bến, liên kết nội dung đúng, map-node/boat-marker đồng bộ registry, target/tuyến Hải đồ và nhãn không chồng nhau. Không có pageerror/console error ngoài lỗi WebGL được cố ý tạo trong bài fallback riêng.

Bảy bài hồi quy xác nhận raycasting, cả tám điểm đến với reduced motion, Back/Forward/deep links, mobile, chất lượng Low/Balanced/High, fallback SVG, nội dung/login và axe. Năm bài development xác nhận hydration, bao gồm reduced motion, root do cursor extension sửa và một mismatch con được cố ý tạo để bảo đảm cảnh báo không bị che toàn ứng dụng.

Kiểm tra chặt hơn đã phát hiện panel Office trên mobile che vùng camera khoảng 14px; vùng an toàn nay tính theo giới hạn sheet 72svh/650px. Lần chạy 1920 ban đầu còn gặp lỗi đồng hồ kiểm thử cố dừng tại thời điểm đã trôi qua; test đã chừa thời gian trước khi khóa clock. Các kết quả trên là lần chạy cuối sau các sửa đổi này.

Kiểm thử hành trình dùng Microsoft Edge + SwiftShader, browser clock và nhịp RAF 80ms để lấy mẫu có kiểm soát trên software WebGL. Đây là đồng hồ và khung hình R3F thật; test không đặt position/progress, không ép visibility và không mock route planner. Chuyển về bến xuất phát giữa các trường hợp dùng hành vi history có sẵn. Ảnh kết thúc animation hữu hạn của UI để panel hiện đầy đủ khi đồng hồ đang dừng. Các kiểm tra hồi quy khác chạy với thời gian trình duyệt bình thường.

## Ảnh kiểm tra

Các ảnh cho Campus → News ở cả ba kích thước:

| Kích thước | Home | 30% | 45% | 70% | Approach 85% | Panel mở | Panel đóng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | [Ảnh](artifacts/continuous/1440/home.png) | [Ảnh](artifacts/continuous/1440/campus-news-030.png) | [Ảnh](artifacts/continuous/1440/campus-news-045.png) | [Ảnh](artifacts/continuous/1440/campus-news-070.png) | [Ảnh](artifacts/continuous/1440/campus-news-085.png) | [Ảnh](artifacts/continuous/1440/campus-news-arrived-open.png) | [Ảnh](artifacts/continuous/1440/campus-news-arrived-closed.png) |
| 1920×1080 | [Ảnh](artifacts/continuous/1920/home.png) | [Ảnh](artifacts/continuous/1920/campus-news-030.png) | [Ảnh](artifacts/continuous/1920/campus-news-045.png) | [Ảnh](artifacts/continuous/1920/campus-news-070.png) | [Ảnh](artifacts/continuous/1920/campus-news-085.png) | [Ảnh](artifacts/continuous/1920/campus-news-arrived-open.png) | [Ảnh](artifacts/continuous/1920/campus-news-arrived-closed.png) |
| 390×844 | [Ảnh](artifacts/continuous/390/home.png) | [Ảnh](artifacts/continuous/390/campus-news-030.png) | [Ảnh](artifacts/continuous/390/campus-news-045.png) | [Ảnh](artifacts/continuous/390/campus-news-070.png) | [Ảnh](artifacts/continuous/390/campus-news-085.png) | [Ảnh](artifacts/continuous/390/campus-news-arrived-open.png) | [Ảnh](artifacts/continuous/390/campus-news-arrived-closed.png) |

Ảnh bổ sung ở 1440×900; cả năm tuyến này cũng được kiểm tra tại 1920×1080 và 390×844:

| Tuyến | 45% | Panel mở | Panel đóng |
| --- | --- | --- | --- |
| Campus → Activities | [Ảnh](artifacts/continuous/1440/campus-activities-045.png) | [Ảnh](artifacts/continuous/1440/campus-activities-arrived-open.png) | [Ảnh](artifacts/continuous/1440/campus-activities-arrived-closed.png) |
| Campus → Events | [Ảnh](artifacts/continuous/1440/campus-events-045.png) | [Ảnh](artifacts/continuous/1440/campus-events-arrived-open.png) | [Ảnh](artifacts/continuous/1440/campus-events-arrived-closed.png) |
| Campus → Office | [Ảnh](artifacts/continuous/1440/campus-office-045.png) | [Ảnh](artifacts/continuous/1440/campus-office-arrived-open.png) | [Ảnh](artifacts/continuous/1440/campus-office-arrived-closed.png) |
| News → Clubs | [Ảnh](artifacts/continuous/1440/news-clubs-045.png) | [Ảnh](artifacts/continuous/1440/news-clubs-arrived-open.png) | [Ảnh](artifacts/continuous/1440/news-clubs-arrived-closed.png) |
| Achievements → Resources | [Ảnh](artifacts/continuous/1440/achievements-resources-045.png) | [Ảnh](artifacts/continuous/1440/achievements-resources-arrived-open.png) | [Ảnh](artifacts/continuous/1440/achievements-resources-arrived-closed.png) |

## Tái hiện và giới hạn

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3001'
npm.cmd run test:e2e
# Hydration cần server development riêng, không dùng production 3001:
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd run test:hydration
```

Các kiểm tra này xác nhận hành vi/rendering với software WebGL, chưa đo FPS, nhiệt hoặc pin trên GPU/điện thoại thật. Chưa kiểm tra Safari/Firefox. Bounds QA là vùng bao bảo thủ từ registry; clearance là kiểm tra hình học, không phải mô phỏng vật lý hull. Đảo ngoài frustum vẫn tồn tại nhưng không nhất thiết thấy trong ảnh; số đảo nền trên mobile có thể ít hơn desktop khi ở xa. Auth/backend vẫn là phần demo hiện có.

Server production QA riêng trên cổng 3001 được dừng sau xác minh. Server development đang có của người dùng trên cổng 3000 được giữ lại.
