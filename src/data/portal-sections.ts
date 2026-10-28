import type {PortalSection} from "@/types";

/** Business domains survive independently of the five physical islands. */
export const portalSections:PortalSection[] = [
  {
    "id": "activities",
    "slug": "activities",
    "title": "Hoạt động",
    "subtitle": "Quảng trường của những khởi đầu",
    "description": "Từ một buổi gặp gỡ đến một trải nghiệm đáng nhớ. Khám phá không gian hoạt động, cùng bạn bè thử sức và tạo dấu ấn của riêng mình.",
    "contentRoute": "/activities",
    "access": "public",
    "number": "01",
    "action": "Xem tất cả hoạt động",
    "fullTitle": "Hoạt động Đoàn – Hội"
  },
  {
    "id": "news",
    "slug": "news",
    "title": "Tin tức",
    "subtitle": "Trạm tin giữa những tầng mây",
    "description": "Bắt nhịp Đoàn – Hội, đọc những câu chuyện sinh viên và tìm cảm hứng cho một hành trình mới.",
    "contentRoute": "/news",
    "access": "public",
    "number": "02",
    "action": "Xem tin tức",
    "fullTitle": "Tin tức – Thông báo"
  },
  {
    "id": "clubs",
    "slug": "clubs",
    "title": "Câu lạc bộ",
    "subtitle": "Tìm những người cùng đam mê",
    "description": "Một ngôi làng của âm nhạc, sáng tạo và công nghệ. Tìm cộng đồng nơi bạn được là chính mình.",
    "contentRoute": "/clubs",
    "access": "public",
    "number": "03",
    "action": "Khám phá câu lạc bộ",
    "fullTitle": "Làng câu lạc bộ"
  },
  {
    "id": "events",
    "slug": "events",
    "title": "Sự kiện",
    "subtitle": "Hẹn nhau ở những khoảnh khắc đẹp",
    "description": "Tìm điểm hẹn tiếp theo trong lịch sinh viên. Cùng tham gia, gặp gỡ và góp nên những khoảnh khắc đáng nhớ.",
    "contentRoute": "/events",
    "access": "public",
    "number": "04",
    "action": "Mở lịch sự kiện",
    "fullTitle": "Sự kiện – Lịch hoạt động"
  },
  {
    "id": "volunteer",
    "slug": "volunteer",
    "title": "Tình nguyện",
    "subtitle": "Gieo một điều tốt, mở một chân trời",
    "description": "Ghé khu vườn của những đóng góp nhỏ. Tìm hiểu các ý tưởng tình nguyện, lối sống xanh và hoạt động vì cộng đồng.",
    "contentRoute": "/volunteer",
    "access": "public",
    "number": "05",
    "action": "Khám phá chiến dịch",
    "fullTitle": "Tình nguyện – Chiến dịch"
  },
  {
    "id": "office",
    "slug": "office",
    "title": "Văn phòng",
    "subtitle": "Không gian làm việc của Đoàn – Hội",
    "description": "Giới thiệu không gian tài liệu và quy trình tổ chức. Nghiệp vụ nội bộ chỉ dành cho tài khoản được xác thực và phân quyền.",
    "contentRoute": "/office",
    "access": "staff",
    "number": "06",
    "action": "Xem văn phòng điện tử",
    "fullTitle": "Văn phòng điện tử"
  },
  {
    "id": "achievements",
    "slug": "achievements",
    "title": "Thành tích",
    "subtitle": "Mỗi bước tiến đều có ý nghĩa",
    "description": "Một không gian ghi nhận hành trình trưởng thành. Thông tin điểm rèn luyện cá nhân sẽ chỉ mở cho tài khoản có quyền.",
    "contentRoute": "/achievements",
    "access": "student",
    "number": "07",
    "action": "Khám phá hành trình ghi nhận",
    "fullTitle": "Thành tích – Điểm rèn luyện"
  },
  {
    "id": "resources",
    "slug": "resources",
    "title": "Tài nguyên",
    "subtitle": "Một góc yên để cùng nhau lớn lên",
    "description": "Ghé thư viện trên mây: tìm cẩm nang minh họa, đọc những chia sẻ và mang theo một ý tưởng hữu ích.",
    "contentRoute": "/resources",
    "access": "public",
    "number": "08",
    "action": "Mở thư viện tài nguyên",
    "fullTitle": "Cộng đồng – Tài nguyên"
  }
];
