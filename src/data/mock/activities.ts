import type { Activity } from "@/types";

export const activities: Activity[] = [
  { id: "first-voyage", title: "Chuyến hải trình đầu tiên", description: "Một buổi gặp gỡ để làm quen, chia sẻ mong đợi và cùng vẽ bản đồ những năm tháng sinh viên.", category: "Trải nghiệm", dateLabel: "Lịch minh họa · 09.11", location: "Không gian sinh viên · Demo", illustration: "sail", isDemo: true },
  { id: "green-weekend", title: "Cuối tuần gieo xanh", description: "Từ một chậu cây nhỏ đến những thói quen tốt hơn. Cùng thử một ngày sống xanh với bạn bè.", category: "Cộng đồng", dateLabel: "Lịch minh họa · 16.11", location: "Khuôn viên · Demo", illustration: "leaf", isDemo: true },
  { id: "creative-workshop", title: "Ý tưởng nhỏ, dấu ấn lớn", description: "Khám phá tư duy sáng tạo qua những thử thách ngắn và học cách kể câu chuyện của nhóm mình.", category: "Kỹ năng", dateLabel: "Lịch minh họa · 23.11", location: "Phòng sinh hoạt · Demo", illustration: "spark", isDemo: true },
  { id: "community-day", title: "Một ngày cùng nhau", description: "Lắng nghe cộng đồng, kết nối những người bạn và phác thảo một dự án đóng góp ý nghĩa.", category: "Cộng đồng", dateLabel: "Lịch minh họa · 30.11", location: "Không gian mở · Demo", illustration: "leaf", isDemo: true },
];
