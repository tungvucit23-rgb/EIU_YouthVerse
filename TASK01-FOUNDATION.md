# Task 01 — World architecture & navigation foundation

Hoàn tất trong dự án EIU YouthVerse hiện có, ngày **27/10/2026**. Phạm vi là bố cục, registry, đồ thị, mặt nước, camera và đồng bộ Hải đồ. Mô hình thuyền GLB, kiến trúc/đảo, sky WebP, font, màu sắc, ánh sáng, trang nội dung và giao diện đăng nhập hiện có được giữ lại. Không triển khai giai đoạn nâng cấp asset chi tiết.

## Nguyên nhân và thay đổi

| Nguyên nhân trước đây | Cách xử lý |
| --- | --- |
| Zoom và target đặt bằng hằng số, chưa tính toàn bộ đảo/boong/buồm | Tính góc nhìn orthographic theo vùng bao từng đảo, thuyền và khoảng trống của UI; giữ hướng camera ổn định, chuyển target/zoom bằng damping |
| Đảo xa vẫn xuất hiện lớn hoặc bị cắt mép | Stage ban đầu gồm campus + 4 đảo desktop, campus + 3 đảo mobile; đảo khác vẫn ở registry/scene/đồ thị và được đưa vào khung khi điều hướng |
| Bến vẽ tại tọa độ local nhưng thuyền đến một tọa độ world nhập riêng | Tính dockingPoint từ position/scale/rotation của đảo, hướng và chiều dài bến, khoảng hở cho thân thuyền; nút tiếp cận cũng sinh từ bến |
| Thuyền dùng spline đã làm trơn, nước/Hải đồ dùng đường gốc | Mặt nước đang đi và đường vàng trong Hải đồ dùng chính các segment của kế hoạch hành trình |
| Tam giác mặt nước quay xuống, vật liệu hai mặt che lỗi; render nhiều ribbon không liên quan | Đổi winding hướng lên, một mặt, có depth write/offset; giới hạn bề rộng, bỏ đoạn loe; lúc đứng bến chỉ hiện nhánh bến hiện tại |
| Làm trơn đường gấp khúc có thể dẫn tuyến qua đảo hoặc tạo dốc đứng | Thêm điểm vòng tránh; tiếp tuyến chung ưu tiên phương ngang và giới hạn độ dốc; kiểm tra cả 72 cặp đảo |
| Hải đồ dùng giới hạn tọa độ nhập tay | Giới hạn chiếu lấy từ registry và đồ thị; cùng phép chiếu cho đảo, bến, vị trí thuyền và tuyến được chọn |

## Registry và cấu trúc

`src/data/islands.ts` là nguồn định nghĩa thế giới. Mỗi đảo cung cấp:

`id, displayName, category, position, scale, rotation, dockingPoint, modelPath, contentRoute, requiresAuth, connections`.

Các trường bổ sung: `dock` (local position/rotation, chiều dài, khoảng hở, chênh mặt nước), `viewBounds`, `shape`, `asset`, `access`, `nearOnIntro`. Tên/title cũ phục vụ UI là dữ liệu được suy ra; không có bộ tọa độ đảo hoặc điểm đến thuyền nhập lặp trong component.

`islandRegistry` là ReadonlyMap dùng qua `getIsland(id)`. `campus`, `destinations`, `islands` là các view/index của cùng các định nghĩa. Registry phục vụ render, chọn đảo, graph, phép chiếu Hải đồ và contentRoute.

- `world-transform.ts`: biến đổi local → world theo đúng chiều xoay Y của Three.js.
- `world-framing.ts`: vùng bao, bố cục theo trạng thái, khoảng trống UI và phép fit camera; tách khỏi React để kiểm thử.
- `WorldComposition.tsx`: áp dụng danh sách đảo liên quan lên các root scene, không remount Canvas.
- `navigation.ts`: các tuyến hàng hải và điểm vòng tránh. Nút gần bến được sinh theo bến, không sao chép tọa độ thuyền.
- `navigation-graph.ts`: Dijkstra, Bézier bậc ba, bảng chiều dài cung, tiếp tuyến nối và nội suy theo quãng đường.
- `use-journey.ts`: sở hữu kế hoạch đã xác nhận; điều phối URL/history, lỗi lập tuyến và trip token.

Có sáu trạng thái điều hướng yêu cầu:
`IDLE → ROUTE_PLANNING → SAILING → APPROACHING → DOCKING → ARRIVED`.

Hai trạng thái UI sẵn có `SELECTING_DESTINATION` và `EXPLORING_CONTENT` được giữ để bảo toàn tương tác chọn đảo/đọc nội dung. Lập tuyến khóa lệnh cạnh tranh; chỉ PLAN_READY đúng trip mới khởi hành. PLAN_FAILED đưa về bến hiện tại và thông báo chọn lại. Back/Forward hủy kế hoạch chờ và bỏ qua kết quả cũ.

Đóng panel giữ thuyền tại đảo; đi tiếp từ đó. Trở về campus dùng cùng graph. Heading theo tiếp tuyến; heading cuối hướng vào bến. Scale thuyền cố định theo worldSettings thay vì thay đổi kích thước lúc khởi hành.

## Mặt nước và camera

Mặt nước có chiều rộng tối đa 1,1 world unit, không loe ở nút. Centerline lấy cùng arc-length spline với thuyền, UV theo quãng đường. Sóng biên độ nhỏ, mặt hướng lên, depth write và polygon offset giúp tránh artifact chồng lớp. Các segment xa dùng 8 đoạn; segment gần dùng mức chi tiết theo preset. Khi đi chỉ vẽ hành trình đã chọn; khi cập bến chỉ vẽ nhánh bến. Hải đồ vẫn biểu diễn toàn mạng.

Camera giữ hướng theo offset ánh sáng/bố cục cũ. Hero được fit cả các đảo đang stage và biên thuyền; campus là đảo lớn nhất. Trong hành trình, camera theo thuyền và bắt đầu fit điểm đến trước khi đưa đảo vào stage. Khi cập bến, camera chừa chỗ panel bên phải desktop hoặc phía dưới mobile. Reduced motion bỏ ambient motion và dùng camera trực tiếp với hành trình rút ngắn.

`viewBounds` và `getCameraFrame` là nơi chỉnh bố cục cho mô hình thay thế. Không dùng free orbit hoặc zoom không giới hạn.

## Tệp thay đổi

| Nhóm | Tệp |
| --- | --- |
| Registry/config/types | `src/types/index.ts`, `src/data/islands.ts`, `src/data/navigation.ts`, `src/data/world-settings.ts` |
| Logic | `src/lib/navigation-graph.ts`, `journey-machine.ts`, `map-projection.ts`, **mới:** `world-transform.ts`, `world-framing.ts`; `src/hooks/use-journey.ts` |
| Scene/camera/boat | `src/components/world/WorldScene.tsx`, `WorldCanvas.tsx`, `CameraController.tsx`, `CentralEIUIsland.tsx`, `DestinationIsland.tsx`, `SailingBoat.tsx`, `IslandInteraction.tsx`, `SceneMetrics.tsx`; **mới:** `WorldComposition.tsx` |
| Nước | `world/water/WaterwaySystem.tsx`, `water-geometry.ts`, `water-material.ts`; bỏ `HarborCascade.tsx` cũ không còn được render và không nối với graph |
| UI | `src/components/experience/YouthVerseExperience.tsx`, `DestinationPicker.tsx`, `JourneyStatus.tsx`; `src/app/archipelago.css` |
| Kiểm thử | `tests/unit/journey.test.ts`; **mới:** `tests/unit/world-foundation.test.ts`, `tests/e2e/world-foundation.spec.ts` |
| Tài liệu | `README.md`, `VERIFICATION.md`, tệp này |

Không thêm dependency, không tạo lại GLB và không thay nguồn dữ liệu nội dung/authentication.

## Xác minh

- TypeScript strict, ESLint và production build: đạt.
- **94 unit tests / 3 tệp**: đạt. Bao gồm 72 cặp đảo, mọi biến thể segment được lập cho các cặp đó, hướng mặt/bề rộng/centerline của nước, khoảng cách tránh các đảo không phải điểm đầu/cuối, biến đổi bến, camera-safe bounds, projection thực của Three.js, đồng bộ Hải đồ và khóa/hủy lập tuyến.
- **10 kiểm tra trình duyệt**: bộ đầy đủ cuối cùng đạt trong **2,6 phút**. Bảy kiểm tra hồi quy giữ nguyên nội dung, login preview, keyboard/fallback, lịch sử, đồ họa, mobile và axe; ba kiểm tra mới tại **1440×900**, **1920×1080**, **390×844**.
- Kiểm tra mới đo vùng bao bằng camera thực, kiểm tra campus lớn nhất, đúng tọa độ chín nút Hải đồ, vị trí thuyền, target đang chọn, đường hiện hành, hướng cập bến và liên kết nội dung.
- Trong các mẫu hành trình ba viewport, thuyền cách centerline mặt nước dưới 0,3 world unit. Không có pageerror/console error ngoài lỗi GPU được cố ý tạo để thử fallback.
- Đã xem ảnh đầu trang, đang đi, Hải đồ và cập bến ở các kích thước trên.

Một lỗi kiểm thử 1920 đầu tiên do đo hộp thoại khi CSS animation còn đang chạy; kiểm thử nay chờ animation kết thúc. Các lỗi water winding, tuyến xuyên gần đảo và độ dốc tiếp tuyến được tìm bằng test hình học, sửa rồi kiểm tra lại.

## Ảnh bàn giao

| Kích thước | Hero | Đang đi | Hải đồ | Cập bến |
| --- | --- | --- | --- | --- |
| 1440×900 | [Ảnh](artifacts/task01-1440-home.png) | [Ảnh](artifacts/task01-1440-sailing.png) | [Ảnh](artifacts/task01-1440-map-route.png) | [Ảnh](artifacts/task01-1440-arrival.png) |
| 1920×1080 | [Ảnh](artifacts/task01-1920-home.png) | [Ảnh](artifacts/task01-1920-sailing.png) | [Ảnh](artifacts/task01-1920-map-route.png) | [Ảnh](artifacts/task01-1920-arrival.png) |
| 390×844 | [Ảnh](artifacts/task01-390-home.png) | [Ảnh](artifacts/task01-390-sailing.png) | [Ảnh](artifacts/task01-390-map-route.png) | [Ảnh](artifacts/task01-390-arrival.png) |

## Giới hạn và điểm dừng

Kiểm tra WebGL dùng Microsoft Edge headless + SwiftShader. Chưa đo FPS/GPU trên thiết bị thật; chưa kiểm tra Safari/Firefox hay screen reader thủ công. Các bounding box cần được cập nhật khi thay asset lớn hơn. Test tránh đảo dùng footprint bảo thủ cho các đảo không phải đầu/cuối, không phải mô phỏng va chạm vật lý của thân tàu.

Kiến trúc EIU vẫn là mô hình stylized hiện có; logo chính thức và dữ liệu/API/authentication thật vẫn chưa có trong dự án. Các giới hạn này không được mô phỏng thành tích hợp đã hoàn thành.

Dừng ở **Task 01** để xem lại bố cục và điều hướng. Chưa bắt đầu giai đoạn nâng cấp asset chi tiết.
