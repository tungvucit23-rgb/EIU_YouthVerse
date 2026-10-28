"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Building2, List, LockKeyhole, Map, Search, X } from "lucide-react";
import { campus, destinations, getIsland, islands } from "@/data/islands";
import { navigationGraph } from "@/lib/navigation-graph";
import { MAP_HEIGHT, MAP_WIDTH, mapEdgePath, mapPoint } from "@/lib/map-projection";
import { isTransitioning, type JourneyState } from "@/lib/journey-machine";
import type { JourneyMotion } from "@/lib/journey-runtime";
import type { NavigationPlan } from "@/types/navigation";
import type { IslandId } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { DestinationIcon } from "./DestinationIcon";

const normalize = (text:string) => text.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
export function DestinationPicker({ state,plan,motion,onSelect,onClose }: { state:JourneyState; plan:NavigationPlan; motion:RefObject<JourneyMotion>; onSelect:(id:IslandId) => void; onClose:() => void }) {
  const [query,setQuery] = useState(""), [view,setView] = useState<"map"|"list">("map");
  const marker = useRef<SVGCircleElement>(null);
  const busy = isTransitioning(state);
  const currentName = state.atLaunch ? "Bến khởi hành" : getIsland(state.currentIsland).title;
  const filtered = destinations.filter((island) => normalize(island.fullTitle + " " + island.subtitle + " " + island.id).includes(normalize(query)));
  const select = (id:IslandId) => { if (busy) return; onClose(); onSelect(id); };
  useEffect(() => {
    let frame = 0;
    const update = () => { const p = mapPoint(motion.current.position); marker.current?.setAttribute("cx",String(p.x)); marker.current?.setAttribute("cy",String(p.y)); frame = requestAnimationFrame(update); };
    frame = requestAnimationFrame(update); return () => cancelAnimationFrame(frame);
  }, [motion]);
  const home = mapPoint(campus.position);
  return <Modal className="archipelago-map" labelId="archipelago-map-title" onClose={onClose}>
    <div className="dialog-heading"><p className="eyebrow">EIU YOUTHVERSE · 09 HÒN ĐẢO</p><button className="icon-button" onClick={onClose} aria-label="Đóng hải đồ"><X size={20} /></button></div>
    <h2 id="archipelago-map-title">Hải đồ của những chân trời.</h2>
    <p className="map-location">Bạn đang ở <strong>{currentName}</strong>{busy ? " · Đang di chuyển" : ""}</p>
    <div className="map-tools"><label className="map-search"><Search size={16} /><span className="sr-only">Tìm đảo trên hải đồ</span><input type="search" placeholder="Tìm một hòn đảo…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="map-view-buttons" role="group" aria-label="Cách xem điểm đến"><button aria-pressed={view === "map"} onClick={() => setView("map")} aria-label="Xem bản đồ"><Map size={17} /></button><button aria-pressed={view === "list"} onClick={() => setView("list")} aria-label="Xem danh sách điểm đến"><List size={17} /></button></div></div>
    {view === "map" ? <div className="archipelago-diagram" data-selected-destination={state.destination ?? undefined}>
      <svg viewBox={"0 0 " + MAP_WIDTH + " " + MAP_HEIGHT} preserveAspectRatio="none" className="archipelago-lines" aria-label="Các tuyến nước nối chín đảo" role="img">
        {navigationGraph.edges.filter((edge) => !busy || !plan.edgeIds.includes(edge.id)).map((edge) => <path key={edge.id} d={mapEdgePath(edge)} className="map-route" />)}
        {busy && plan.segments.map((edge) => <path key={"active-" + edge.id} d={mapEdgePath(edge)} className="map-route is-active" data-route-edge={edge.id} />)}
        {islands.map((island) => { const center = mapPoint(island.position),dock = mapPoint(island.dockingPoint); return <path key={"dock-" + island.id} d={"M " + center.x + " " + center.y + " L " + dock.x + " " + dock.y} className="map-dock-link" />; })}
        <ellipse cx={home.x} cy={home.y} rx="38" ry="27" className="map-campus-outline" />
        <circle ref={marker} r="4" fill="#073b71" stroke="#ffffff" strokeWidth="2" className="map-boat-marker" data-testid="map-boat-marker" />
      </svg>
      <button className={"map-island-node campus-node " + ((state.currentIsland === "campus" && !state.atLaunch) ? "is-current" : state.destination === "campus" ? "is-target" : "")} data-island-id="campus" data-selected={state.destination === "campus"} style={{left:home.x / MAP_WIDTH * 100 + "%",top:home.y / MAP_HEIGHT * 100 + "%"}} onClick={() => select("campus")} disabled={busy || (state.currentIsland === "campus" && !state.atLaunch)} aria-label={state.atLaunch ? "Căng buồm đến EIU Grand Campus" : "Căng buồm trở về EIU Grand Campus"}><span className="map-node-icon"><Building2 size={19} strokeWidth={1.5} /></span><span>EIU</span></button>
      {filtered.map((island) => { const point = mapPoint(island.position); return <button key={island.id} className={"map-island-node " + (state.currentIsland === island.id ? "is-current" : state.destination === island.id ? "is-target" : "")} style={{left:point.x / MAP_WIDTH * 100 + "%",top:point.y / MAP_HEIGHT * 100 + "%"}} data-island-id={island.id} data-selected={state.destination === island.id} disabled={busy} onClick={() => select(island.id)} aria-label={"Căng buồm đến " + island.fullTitle} aria-current={state.currentIsland === island.id ? "location" : undefined}><span className="map-node-icon" style={{borderColor:island.theme}}><DestinationIcon id={island.id} size={16} />{island.access !== "public" && <LockKeyhole className="map-node-lock" size={9} />}</span><span>{island.title}</span></button>; })}
    </div> : <ul className="destination-list archipelago-list">
      <li><button disabled={busy || (state.currentIsland === "campus" && !state.atLaunch)} onClick={() => select("campus")}><span className="destination-number">00</span><span><strong>EIU Grand Campus</strong><small>{state.atLaunch ? "Điểm đến chính phía trước" : state.currentIsland === "campus" ? "Vị trí hiện tại" : "Trở về campus EIU"}</small></span><Building2 size={18} /></button></li>
      {filtered.map((island) => <li key={island.id}><button disabled={busy} onClick={() => select(island.id)}><span className="destination-number">{island.number}</span><span><strong>{island.fullTitle}</strong><small>{state.currentIsland === island.id ? "Bạn đang ở đây" : island.subtitle}</small></span>{island.access === "public" ? <DestinationIcon id={island.id} size={18} /> : <LockKeyhole size={16} />}</button></li>)}
    </ul>}
    {!filtered.length && <p className="map-empty" role="status">Chưa tìm thấy hòn đảo phù hợp. <button onClick={() => setQuery("")}>Xóa tìm kiếm</button></p>}
    <div className="map-legend"><span><i className="map-current-dot" /> Vị trí thuyền</span><span><LockKeyhole size={11} /> Nghiệp vụ cần đăng nhập và phân quyền</span></div>
    <p className="dialog-note">Chọn một hòn đảo để căng buồm. Bạn có thể ghé thăm phần giới thiệu của mọi đảo; dữ liệu cá nhân và nghiệp vụ nội bộ được khóa.</p>
  </Modal>;
}

export function DestinationPickerTrigger({ onClick,buttonRef }: { onClick:() => void; buttonRef?:RefObject<HTMLButtonElement|null> }) {
  return <button ref={buttonRef} className="destination-picker-trigger" onClick={onClick} aria-label="Hải đồ · Danh sách điểm đến"><Map size={17} strokeWidth={1.5} /> Hải đồ <span>09</span></button>;
}
