"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import type { Activity, DestinationId, NewsArticle, StudentClub } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { CoverIllustration } from "./CoverIllustration";

type Item = Activity | NewsArticle | StudentClub;

export function ContentCollection({ kind, items }: { kind: DestinationId; items: Item[] }) {
  const [filter, setFilter] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const categories = ["Tất cả", ...new Set(items.map((item) => item.category))];
  const filtered = useMemo(() => items.filter((item) => (filter === "Tất cả" || item.category === filter) && `${item.title} ${item.description}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi").trim())), [items, filter, query]);
  const action = kind === "activities" ? "Xem hoạt động" : kind === "news" ? "Đọc bài viết" : "Tìm hiểu câu lạc bộ";

  return <>
    <div className="collection-tools"><div className="filter-buttons" role="group" aria-label="Lọc theo chủ đề">{categories.map((category) => <button key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}</div><label className="search-field"><Search size={17} /><span className="sr-only">Tìm kiếm nội dung</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm một điều thú vị…" /></label></div>
    <div className="content-grid">{filtered.map((item, index) => <article className="content-card" key={item.id}>
      {"monogram" in item ? <div className="club-monogram" style={{ backgroundColor: item.color }} aria-hidden="true">{item.monogram}</div> : <CoverIllustration variant={"illustration" in item ? item.illustration : "news"} index={index} />}
      <div className="card-body"><div className="card-meta"><span className="card-category">{item.category}</span><span>{"readMinutes" in item ? `${item.readMinutes} phút đọc · Demo` : "DEMO"}</span></div><h2>{item.title}</h2><p>{item.description}</p><button className="card-action" onClick={() => setSelected(item)} aria-label={`${action}: ${item.title}`}>{action}<ArrowRight size={16} /></button></div>
    </article>)}</div>
    {!filtered.length && <div className="empty-state"><h2>Một chân trời khác đang chờ.</h2><p>Chưa có nội dung phù hợp với tìm kiếm của bạn.</p><button className="text-button" onClick={() => { setFilter("Tất cả"); setQuery(""); }}>Xem lại tất cả</button></div>}
    <p className="collection-count" role="status">{filtered.length} {kind === "clubs" ? "câu lạc bộ" : kind === "news" ? "bài viết" : "hoạt động"} minh họa</p>
    {selected && <Modal className="detail-dialog" labelId="detail-title" onClose={() => setSelected(null)}><div className="dialog-heading"><span className="demo-label">NỘI DUNG DEMO · {selected.category}</span><button className="icon-button" aria-label="Đóng chi tiết" onClick={() => setSelected(null)}><X size={20} /></button></div><h2 id="detail-title">{selected.title}</h2><p>{selected.description}</p>{"dateLabel" in selected && <p className="card-category">{selected.dateLabel}</p>}{"location" in selected && <p className="card-category">{selected.location}</p>}<p>{kind === "activities" ? "Hãy hình dung một buổi sinh hoạt nơi bạn có thể thử một điều mới, chia sẻ góc nhìn và cùng bạn bè tạo nên một trải nghiệm đáng nhớ. Đây là bản xem trước cách thông tin hoạt động sẽ được hiển thị." : kind === "clubs" ? "Một cộng đồng bắt đầu từ sự tò mò và lớn lên nhờ những người cùng đam mê. Phần giới thiệu, lịch sinh hoạt và thông tin liên hệ sẽ được cập nhật khi có dữ liệu đã xác minh." : "Những năm tháng sinh viên có thể bắt đầu bằng một lời chào, một câu hỏi hoặc một lần thử sức. Hãy dành chỗ cho sự tò mò, lắng nghe những câu chuyện khác mình và tìm niềm vui trong những bước tiến nhỏ mỗi ngày."}</p><p className="detail-note">{kind === "news" ? "Bài viết minh họa cho bản thử nghiệm, không phải thông báo chính thức." : "Chưa mở đăng ký hoặc liên hệ trong bản demo. Thông tin chính thức sẽ được kết nối qua API trong giai đoạn sau."}</p><button className="text-button" onClick={() => setSelected(null)}>Trở lại danh sách</button></Modal>}
  </>;
}
