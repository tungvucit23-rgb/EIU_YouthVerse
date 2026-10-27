import type { DestinationEntry, DestinationId } from "@/types";

type NewDestination = Exclude<DestinationId,"activities" | "news" | "clubs">;
export const destinationEntries: Record<NewDestination,DestinationEntry[]> = {
  events: [
    {id:"welcome-meeting",title:"Một buổi hẹn cùng thanh xuân",category:"Gặp gỡ",date:"2026-11-09",description:"Lịch minh họa cho một buổi gặp gỡ sinh viên, chia sẻ sở thích và tìm đồng đội.",body:"Đây là sự kiện demo dùng để thử lịch tương tác. Chưa có địa điểm, đơn vị tổ chức hoặc biểu mẫu đăng ký chính thức. Khi kết nối API, nội dung sẽ được thay bằng thông tin đã xác minh.",isDemo:true},
    {id:"ideas-workshop",title:"Xưởng ý tưởng sáng tạo",category:"Kỹ năng",date:"2026-11-16",description:"Một lịch hẹn minh họa để cùng phác thảo ý tưởng và học cách làm việc nhóm.",body:"Bản xem trước mô tả một buổi sinh hoạt nhóm với phần làm quen, chia sẻ và thực hành. Tất cả chi tiết là dữ liệu minh họa cho dự án tốt nghiệp.",isDemo:true},
    {id:"open-stage",title:"Sân khấu của những câu chuyện",category:"Sáng tạo",date:"2026-11-23",description:"Một điểm hẹn minh họa dành cho âm nhạc, kể chuyện và những điều bạn muốn chia sẻ.",body:"Sự kiện minh họa chưa mở đăng ký. Lịch, địa điểm, điều kiện tham gia và thông tin liên hệ sẽ được cập nhật từ hệ thống chính thức trong giai đoạn sau.",isDemo:true},
  ],
  volunteer: [
    {id:"seed-a-good-day",title:"Gieo một ngày xanh",category:"Môi trường",description:"Ý tưởng chiến dịch minh họa: tạo góc xanh nhỏ và cùng tìm hiểu cách chăm sóc cây.",body:"Từ một chậu cây nhỏ, nhóm bạn có thể thử lập kế hoạch, phân công chăm sóc và ghi lại những thay đổi. Đây là ý tưởng minh họa, không phải chiến dịch đã được EIU công bố.",isDemo:true},
    {id:"share-a-book",title:"Một cuốn sách, nhiều người bạn",category:"Cộng đồng",description:"Ý tưởng chia sẻ sách và trao đổi những điều hữu ích với cộng đồng sinh viên.",body:"Mẫu nội dung này minh họa cách trình bày mục tiêu, lịch thực hiện, điều kiện tham gia và đầu mối hỗ trợ. Chưa có đăng ký hoặc quyên góp trong phiên bản frontend.",isDemo:true},
    {id:"less-plastic",title:"Một tuần đổi thói quen",category:"Sống xanh",description:"Thử những thay đổi nhỏ: mang bình nước cá nhân, tiết kiệm vật dụng và chia sẻ trải nghiệm.",body:"Đây là một gợi ý thực hành tự nguyện dùng cho bản demo. Các mốc thời gian và cách tham gia chính thức sẽ được bổ sung khi có thông tin đã xác minh.",isDemo:true},
  ],
  office: [
    {id:"documents",title:"Tài liệu tổ chức",category:"Tài liệu",description:"Giới thiệu khu vực quản lý văn bản và tài liệu nội bộ.",body:"Chức năng nội bộ đang chờ ASP.NET Core API và danh tính được xác minh. Bản frontend không chứa tài liệu nội bộ hoặc thao tác nghiệp vụ.",access:"staff",isDemo:true},
    {id:"approvals",title:"Quy trình phê duyệt",category:"Nghiệp vụ",description:"Không gian dự kiến cho các luồng trình duyệt và theo dõi xử lý.",body:"Các yêu cầu phê duyệt cần quyền cán bộ hoặc quản trị viên. Không có yêu cầu thật nào được tạo, gửi hay phê duyệt trong bản xem trước.",access:"staff",isDemo:true},
    {id:"organization",title:"Không gian tổ chức",category:"Điều phối",description:"Giới thiệu khả năng điều phối công việc và cập nhật tình trạng tổ chức trong tương lai.",body:"Thông tin phân công, dữ liệu cá nhân và nghiệp vụ không được cung cấp cho khách. Phân quyền phải được thực thi lại ở mọi endpoint phía máy chủ khi tích hợp.",access:"staff",isDemo:true},
  ],
  achievements: [
    {id:"discover",title:"Dấu ấn Khám phá",category:"Trải nghiệm",description:"Huy hiệu minh họa cho tinh thần tò mò, thử sức và học hỏi.",body:"Biểu tượng này là nội dung demo, không phải danh hiệu hoặc thành tích do EIU xác nhận. Hệ thống sau này có thể hiển thị các dấu mốc đã được kiểm chứng.",isDemo:true},
    {id:"contribute",title:"Dấu ấn Cống hiến",category:"Đóng góp",description:"Một cách minh họa để kể lại những đóng góp có ý nghĩa cho cộng đồng.",body:"Không có điểm số hoặc hồ sơ cá nhân được tạo trong bản frontend. Mọi ghi nhận chính thức cần nguồn dữ liệu và quy trình xác minh phù hợp.",isDemo:true},
    {id:"personal-development",title:"Điểm rèn luyện cá nhân",category:"Cá nhân",description:"Dữ liệu cá nhân sẽ chỉ hiển thị sau khi đăng nhập và được cấp quyền phù hợp.",body:"Bản demo không chứa điểm rèn luyện. API sau này phải xác thực danh tính, kiểm tra chủ sở hữu hồ sơ và phân quyền máy chủ trước khi trả dữ liệu.",access:"student",isDemo:true},
  ],
  resources: [
    {id:"student-compass",title:"La bàn sinh viên — bản minh họa",category:"Cẩm nang",description:"Một checklist ngắn giúp bạn tự lên kế hoạch học tập, kết nối và trải nghiệm.",body:"Tài liệu demo gồm một vài gợi ý chung để bắt đầu hành trình sinh viên. Không thay thế hướng dẫn, quy định hoặc thông báo chính thức của trường.",downloadUrl:"/resources/student-compass-demo.md",isDemo:true},
    {id:"project-starter",title:"Bắt đầu một dự án cộng đồng",category:"Kỹ năng",description:"Những câu hỏi gợi mở về mục tiêu, đồng đội và cách đánh giá một ý tưởng nhỏ.",body:"Hãy bắt đầu bằng một vấn đề cụ thể, lắng nghe người liên quan, chọn phạm vi nhỏ và cùng thống nhất cách làm. Sau mỗi bước, ghi lại điều đã học và điều cần điều chỉnh. Đây là nội dung minh họa.",isDemo:true},
    {id:"find-community",title:"Tìm cộng đồng của bạn",category:"Kết nối",description:"Dành một chút thời gian tìm hiểu sở thích và những hoạt động khiến bạn tò mò.",body:"Một lời chào hoặc một cuộc trò chuyện có thể mở ra những người bạn mới. Bạn có thể quay lại quần đảo, ghé làng Câu lạc bộ và thử đọc các mô tả minh họa về cộng đồng sinh viên.",isDemo:true},
  ],
};
