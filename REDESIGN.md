# Bàn giao bản nâng cấp quần đảo EIU YouthVerse

Bản nâng cấp được triển khai trực tiếp trong dự án Next.js / React Three Fiber hiện có. Thế giới gồm **1 đảo EIU và 8 đảo nội dung**. Ảnh tham chiếu định hướng bố cục, màu sắc và không khí; các đảo, kiến trúc, thuyền và tuyến nước đều là hình học WebGL thật.

## Các đảo và nội dung

| Đảo | Dấu hiệu thị giác | Nội dung |
| --- | --- | --- |
| EIU Grand Campus | Cổng mái trắng uốn cong, lỗ mái oval, khối học thuật, đường vòng, hồ và bến | Điểm xuất phát và quay về |
| Hoạt động | Sân khấu, mái vải căng, cờ dây, ghế và quảng trường | Tìm kiếm/lọc/xem hoạt động demo |
| Tin tức | Tháp quan sát, ăng-ten, trạm thông tin và bảng tin | Tin tức và thông báo demo |
| Câu lạc bộ | Cụm studio, biểu tượng guitar/công nghệ, sân vườn | Danh sách, bộ lọc và giới thiệu CLB |
| Sự kiện | Khán đài vòng cung, sân khấu vòm, lối đi và đèn | Lịch tháng/ngày và chi tiết sự kiện |
| Tình nguyện | Nhà kính có khung, luống trồng, cầu gỗ, vườn cây | Ý tưởng chiến dịch và nội dung đọc |
| Văn phòng | Kiến trúc hiện đại, lam đứng, sảnh và biển chỉ dẫn | Giới thiệu dịch vụ; nghiệp vụ nội bộ khóa |
| Thành tích | Cúp có tay cầm, bệ ghi nhận và khu trưng bày | Ghi nhận minh họa; điểm cá nhân khóa |
| Tài nguyên | Thư viện, mái đọc sách, ghế và sân cây xanh | Cẩm nang, tìm kiếm và tải tài liệu demo |

Đảo bố trí theo các khoảng cách/cao độ khác nhau. Khung đầu có đảo chính cùng bốn đảo lân cận; các đảo khác được khám phá khi đi. Nhãn HTML chỉ hiện tối đa ba điểm đến theo vị trí. Hải đồ thu gọn mặc định có đủ chín nút, đường nối, vị trí thuyền, tìm kiếm không dấu, chế độ danh sách và ký hiệu quyền truy cập.

## Thuyền và điều hướng

Tệp thật `public/models/youthverse-explorer.glb` có thân gỗ cong nhiều lớp, vỏ trong, boong ván, sống thuyền, cột buồm, hai buồm cong, dây chằng, vô lăng, cuộn dây và thùng nhỏ. Các bộ phận được đặt tên và xuất cùng vật liệu PBR. Nguồn tạo mô hình và script xuất được bàn giao; không có Blender trong môi trường này.

Đồ thị dùng các tuyến hàng hải chung. Dijkstra chọn chuỗi tuyến; spline Bézier bậc ba và bảng chiều dài cung tạo chuyển động theo quãng đường. Các tiếp tuyến ở nút nối được làm trơn, hướng cuối khớp bến. Mọi cặp trong 9 đảo đều có tuyến, không cần viết riêng 72 animation.

Chuỗi trạng thái:
`IDLE → SELECTING_DESTINATION → SAILING → APPROACHING → DOCKING → ARRIVED → EXPLORING_CONTENT`.

Đóng nội dung giữ thuyền ở đảo hiện tại. Chọn đảo tiếp theo đi từ bến đó. Quay về EIU dùng cùng bộ lập tuyến. Trip token loại bỏ kết quả cũ khi Back/Forward ngắt hành trình. Hash URL phục hồi đảo và nội dung tương ứng.

Thuyền có tăng/giảm tốc, hướng theo tiếp tuyến, nghiêng khi rẽ, nhấp nhô nhẹ, buồm chuyển động, vô lăng phản hồi và vệt sóng theo vận tốc. Camera orthographic theo thuyền rồi chuyển trọng tâm về đảo/bảng nội dung. Giảm chuyển động tắt animation môi trường và rút ngắn chuyến đi.

## Tệp và nhóm thay đổi

| Nhóm | Tệp chính |
| --- | --- |
| Kiểu dữ liệu / cấu hình | `src/types/index.ts`, `src/types/navigation.ts`, `src/data/islands.ts`, `src/data/navigation.ts`, `src/data/world-settings.ts` |
| Điều hướng / quyền | `src/lib/navigation-graph.ts`, `journey-machine.ts`, `journey-runtime.ts`, `map-projection.ts`, `access-policy.ts`; `src/hooks/use-journey.ts`, `use-graphics-quality.ts` |
| Scene / camera / ánh sáng | `WorldScene.tsx`, `WorldCanvas.tsx`, `WorldQuality.tsx`, `CameraController.tsx`, `WorldLighting.tsx`, `SkyEnvironment.tsx`, `AtmosphericMotes.tsx`, `SceneMetrics.tsx` trong `src/components/world/` |
| Đảo / cảnh quan | `FloatingIsland.tsx`, `IslandRockStrata.tsx`, `Trees.tsx`, `TerrainTextures.tsx`, `SceneryMaterials.tsx`, `DestinationIsland.tsx`, `CentralEIUIsland.tsx`, `IslandInteraction.tsx` |
| Kiến trúc tái sử dụng | `world/islands/terrain-geometry.ts`, `Scenery.tsx`, `FestivalStructures.tsx`, `IslandArt.tsx`, `IslandSilhouette.tsx`, `StaticSceneryBatch.tsx` |
| Tám chủ đề | Tám module trong `src/components/world/islands/themes/` |
| Thuyền / nước | `SailingBoat.tsx`, `boat/ExplorerBoatAsset.tsx`, `boat/BoatWake.tsx`, `water/WaterwaySystem.tsx`, `water/water-geometry.ts`, `water/water-material.ts`, `water/HarborCascade.tsx` |
| Giao diện trải nghiệm | `YouthVerseExperience.tsx`, `DestinationPicker.tsx`, `DestinationIcon.tsx`, `IslandInfoPanel.tsx`, `JourneyStatus.tsx`, `AccessNotice.tsx`, `HelpDialog.tsx`, `MobileDestinationSheet.tsx`, `LightweightWorld.tsx`, `SceneStatus.tsx` trong `components/experience/` |
| Nội dung mới | `src/app/[destination]/page.tsx`, `src/components/content/DestinationContent.tsx`, `EventsCalendar.tsx`, `src/data/mock/destinations.ts`, `src/lib/repository.ts` |
| Style / tích hợp | `src/app/archipelago.css`, `src/app/layout.tsx`, `src/app/page.tsx` |
| Asset / công cụ | `public/models/youthverse-explorer.glb`, `explorer-manifest.json`, `scripts/lib/explorer-boat.mjs`, `scripts/build-boat-model.mjs`, `scripts/capture-preview.mjs`, `public/resources/student-compass-demo.md`, `package.json` |
| Kiểm tra / tài liệu | `tests/unit/journey.test.ts`, `tests/unit/boat-asset.test.ts`, `tests/e2e/experience.spec.ts`, `playwright.config.ts`, `README.md`, `VERIFICATION.md`, tài liệu mô hình và tệp này |

Các module thuyền/tuyến đơn cũ không còn dùng đã được loại bỏ: `BoatModel`, `SailingRoute`, `SailingWake`, `DistantIslet`, `sailing-route.ts`. Cổng trường và các trang nội dung cũ được giữ lại.

## Tối ưu

- Low / Balanced / High điều chỉnh DPR, bóng, phân đoạn địa hình, số đá/cụm lá và phân đoạn nước; thiết bị nhỏ tự dùng Low.
- PerformanceMonitor giảm DPR; thiết bị liên tục chậm được giới hạn Low.
- Cây/đá instanced; kiến trúc tĩnh gộp theo vật liệu tương thích; vật liệu và texture dùng chung.
- Chủ đề lazy load, LOD cho đảo xa, frustum culling và mô hình chi tiết ưu tiên đảo đang đến.
- GLB thuyền giảm từ 1,458,956 xuống 535,684 byte bằng dùng lại đỉnh có chỉ mục; chưa dùng Draco/Meshopt.
- Nước shader có gợn, phản sáng, bọt, hướng chảy và tuyến đang đi; thác nhỏ tại bến và lớp hạt rất thưa tắt ở Low.
- Không postprocessing toàn màn hình, bloom hay render target phản chiếu.
- Animation dùng ref/uniform/BufferAttribute, không setState mỗi frame; hình học/vật liệu/texture được dọn theo vòng đời.
- Fallback SVG vẫn dùng cùng trạng thái/đồ thị và nội dung; hoạt động khi WebGL lỗi hoặc người dùng chọn chế độ nhẹ.

## Giới hạn thật và đầu vào cần bổ sung

Cổng/khối trường là bản dựng procedural dựa trên ảnh, chưa phải mô hình kiến trúc đo đạc. Có sẵn vị trí thay GLB cho campus và từng đảo. Cần mô hình EIU đã duyệt và logo SVG chính thức để đạt chi tiết/nhận diện như ảnh render tham chiếu. Bản này có phong cách 3D stylized, chưa đạt độ chân thực nhiếp ảnh của ảnh mẫu.

Toàn bộ sự kiện, nội dung, thành tích là demo có nhãn. Đăng nhập chỉ là giao diện xem trước; không tạo phiên. Không có dữ liệu cá nhân, xử lý văn bản hay phê duyệt thật. API ASP.NET Core cần thực thi xác thực, vai trò và quyền sở hữu ở máy chủ; `access-policy.ts` chỉ định hướng UI.

Chưa đo FPS trên laptop/điện thoại thật; chưa kiểm tra Safari/Firefox hoặc screen reader thủ công. Kết quả build, test và ảnh kiểm tra nằm trong [VERIFICATION.md](VERIFICATION.md).
