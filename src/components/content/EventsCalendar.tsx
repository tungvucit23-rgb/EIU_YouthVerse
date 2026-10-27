"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import type { DestinationEntry } from "@/types";

const dateKey = (year:number,month:number,day:number) => year + "-" + String(month + 1).padStart(2,"0") + "-" + String(day).padStart(2,"0");

export function EventsCalendar({entries,onSelect}: {entries:DestinationEntry[]; onSelect:(entry:DestinationEntry) => void}) {
  const [month,setMonth] = useState({year:2026,index:10}), [day,setDay] = useState<number|null>(null);
  const first = new Date(Date.UTC(month.year,month.index,1));
  const days = new Date(Date.UTC(month.year,month.index + 1,0)).getUTCDate();
  const padding = (first.getUTCDay() + 6) % 7;
  const prefix = dateKey(month.year,month.index,1).slice(0,7);
  const shown = entries.filter((entry) => entry.date?.startsWith(prefix) && (day === null || entry.date === dateKey(month.year,month.index,day)));
  const changeMonth = (direction:number) => { const next = new Date(Date.UTC(month.year,month.index + direction,1)); setMonth({year:next.getUTCFullYear(),index:next.getUTCMonth()}); setDay(null); };
  return <div className="calendar-layout"><section className="events-calendar" aria-label="Lịch sự kiện minh họa"><div className="calendar-controls"><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Tháng trước"><ArrowLeft size={17} /></button><h2>Tháng {month.index + 1}, {month.year}</h2><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Tháng sau"><ArrowRight size={17} /></button></div><div className="calendar-weekdays" aria-hidden="true">{["T2","T3","T4","T5","T6","T7","CN"].map((label) => <span key={label}>{label}</span>)}</div><div className="calendar-days">{Array.from({length:padding},(_,i) => <span key={"blank-" + i} />)}{Array.from({length:days},(_,index) => { const value = index + 1, key = dateKey(month.year,month.index,value), count = entries.filter((entry) => entry.date === key).length; return <button key={key} data-calendar-date={key} className={count ? "has-event" : ""} aria-pressed={day === value} aria-label={value + " tháng " + (month.index + 1) + ", " + month.year + (count ? " · " + count + " sự kiện demo" : " · Chưa có sự kiện demo")} onClick={() => setDay(value)}>{value}</button>; })}</div><button className="text-button" onClick={() => setDay(null)}>Xem cả tháng</button><p className="calendar-note">Dấu vàng chỉ ngày có nội dung minh họa. Đây không phải lịch chính thức của nhà trường.</p></section><section className="calendar-selection" aria-label="Sự kiện theo ngày"><h2>{day ? "Điểm hẹn ngày " + day : "Điểm hẹn trong tháng"}</h2>{shown.map((entry) => <article key={entry.id} className="destination-entry-card"><CalendarDays size={23} /><span className="entry-date">DEMO · {entry.date?.split("-").reverse().join(".")}</span><h2>{entry.title}</h2><p>{entry.description}</p><button className="card-action" onClick={() => onSelect(entry)}>Xem sự kiện<ArrowRight size={15} /></button></article>)}{!shown.length && <div className="empty-state"><p>Chưa có mục demo cho thời gian này.</p><button className="text-button" onClick={() => { setMonth({year:2026,index:10}); setDay(null); }}>Về tháng minh họa</button></div>}</section></div>;
}
