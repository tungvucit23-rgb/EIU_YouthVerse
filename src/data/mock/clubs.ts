import type { StudentClub } from "@/types";

export const clubs: StudentClub[] = [
  { id: "creative", title: "Creative Collective", description: "Một không gian minh họa dành cho những người yêu thiết kế, nhiếp ảnh và kể chuyện bằng hình ảnh.", category: "Sáng tạo", monogram: "Cc", color: "#e4b898", isDemo: true },
  { id: "code", title: "Code & Coffee", description: "Cùng học lập trình, thử nghiệm ý tưởng và xây những dự án nhỏ có ích cho cuộc sống sinh viên.", category: "Công nghệ", monogram: "</>", color: "#a6cad7", isDemo: true },
  { id: "language", title: "The Conversation Club", description: "Luyện giao tiếp, chia sẻ văn hóa và tự tin thể hiện suy nghĩ trong một cộng đồng cởi mở.", category: "Ngôn ngữ", monogram: "Hi!", color: "#c5cb9a", isDemo: true },
  { id: "outdoor", title: "Move Together", description: "Tìm niềm vui vận động, khám phá hoạt động ngoài trời và giữ một nhịp sống cân bằng.", category: "Thể thao", monogram: "Mt", color: "#d5bed9", isDemo: true },
];
