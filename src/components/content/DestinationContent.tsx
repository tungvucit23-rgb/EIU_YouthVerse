"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, LockKeyhole, Search, X } from "lucide-react";
import type { Destination, DestinationEntry } from "@/types";
import { anonymousPrincipal, canAccess } from "@/lib/access-policy";
import { Modal } from "@/components/ui/Modal";
import { AccessNotice } from "@/components/experience/AccessNotice";
import { DestinationIcon } from "@/components/experience/DestinationIcon";
import { EventsCalendar } from "./EventsCalendar";

export function DestinationContent({ destination,entries }: { destination:Destination; entries:DestinationEntry[] }) {
  const [query,setQuery] = useState(""), [category,setCategory] = useState("Tất cả"), [selected,setSelected] = useState<DestinationEntry|null>(null);
  const filtered = useMemo(() => entries.filter((entry) => (category === "Tất cả" || entry.category === category) && (entry.title + " " + entry.description).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi").trim())), [entries,query,category]);
  const categories = ["Tất cả",...new Set(entries.map((entry) => entry.category))];
  return <>
    <AccessNotice policy={destination.access} returnTo={destination.contentRoute} />
    <div className="destination-content-tools"><div className="filter-buttons" role="group" aria-label="Lọc tài nguyên theo chủ đề">{categories.map((item) => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-field"><Search size={17} /><span className="sr-only">Tìm kiếm nội dung</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm một điều hữu ích…" /></label></div>
    {destination.id === "events" ? <EventsCalendar entries={filtered} onSelect={setSelected} /> : <div className="destination-entry-grid">{filtered.map((entry) => <EntryCard key={entry.id} entry={entry} destination={destination} onSelect={() => setSelected(entry)} />)}</div>}
    {!filtered.length && <div className="empty-state"><h2>Thử một chân trời khác.</h2><p>Chưa có nội dung demo phù hợp.</p><button className="text-button" onClick={() => { setQuery(""); setCategory("Tất cả"); }}>Xem lại tất cả</button></div>}
    <p className="collection-count" role="status">{filtered.length} mục minh họa · Không phải dữ liệu chính thức</p>
    {selected && <Modal className="detail-dialog" labelId="destination-entry-title" onClose={() => setSelected(null)}><div className="dialog-heading"><span className="demo-label">DEMO · {selected.category}</span><button className="icon-button" onClick={() => setSelected(null)} aria-label="Đóng nội dung"><X size={20} /></button></div><h2 id="destination-entry-title">{selected.title}</h2><p>{selected.description}</p>{selected.access && !canAccess(anonymousPrincipal,selected.access) ? <AccessNotice policy={selected.access} returnTo={destination.contentRoute} /> : <><p>{selected.body}</p>{selected.downloadUrl && <a className="resource-download" href={selected.downloadUrl} download><Download size={16} /> Tải tài liệu Markdown minh họa</a>}</>}<p className="detail-note">Nội dung minh họa cho EIU YouthVerse. Các thông tin chính thức sẽ được kết nối qua API đã xác minh.</p><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={13} style={{display:"inline",marginRight:6}} /> Trở lại danh sách</button></Modal>}
  </>;
}

export function EntryCard({entry,destination,onSelect}: {entry:DestinationEntry; destination:Destination; onSelect:() => void}) {
  const locked = entry.access && !canAccess(anonymousPrincipal,entry.access);
  return <article className="destination-entry-card"><DestinationIcon id={destination.id} size={28} /><span className="card-category">{entry.category} · DEMO</span><h2>{entry.title}</h2><p>{entry.description}</p>{entry.date && <span className="entry-date">Lịch minh họa · {entry.date.split("-").reverse().join(".")}</span>}<button className="card-action" onClick={onSelect} aria-label={(locked ? "Thông tin truy cập: " : "Đọc nội dung: ") + entry.title}>{locked ? "Thông tin truy cập" : "Đọc nội dung"}{locked ? <LockKeyhole size={15} /> : <ArrowRight size={16} />}</button></article>;
}
