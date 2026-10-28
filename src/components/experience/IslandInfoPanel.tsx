"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Map, X } from "lucide-react";
import type { ContentPreview, Destination } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { AccessNotice } from "./AccessNotice";
import { DestinationIcon } from "./DestinationIcon";
import {islandSections} from "@/data/islands";
import {portalSections} from "@/data/portal-sections";

export function IslandInfoPanel({ destination,previews,onClose,onReturn,onMap }: { destination:Destination; previews:ContentPreview[]; onClose:() => void; onReturn:() => void; onMap:() => void }) {
  return <Modal className="island-info-panel" labelId="island-panel-title" onClose={onClose}>
    <div className="panel-inner">
      <div className="dialog-heading"><span className="arrival-label"><span /> ĐÃ CẬP BẾN · ĐẢO {destination.number}</span><button className="icon-button" onClick={onClose} aria-label="Đóng và tiếp tục khám phá"><X size={20} /></button></div>
      <p className="panel-kicker"><DestinationIcon id={destination.id} size={15} /> {destination.subtitle}</p>
      <h2 id="island-panel-title">{destination.fullTitle}</h2>
      <p className="panel-description">{destination.description}</p>
      <AccessNotice policy={destination.access} returnTo={destination.contentRoute} compact />
      <div className="demo-label">NỘI DUNG DEMO</div>
      <nav className="island-feature-links" aria-label="Khám phá nội dung trên đảo">{islandSections[destination.id].map(id => {const section = portalSections.find(s => s.id === id)!;return <Link key={id} href={section.contentRoute}><DestinationIcon id={id} size={14}/>{section.title}<ArrowRight size={12}/></Link>;})}</nav>
      <ul className="panel-previews">{previews.map((item,i) => <li key={item.id}><span className="preview-index">0{i + 1}</span><div><small>{item.category}</small><h3>{item.title}</h3></div></li>)}</ul>
      <Link className="primary-button panel-link" href={destination.contentRoute}>{destination.action}<ArrowRight size={18} /></Link>
      {(destination.id === "clubs" || destination.id === "achievements") && <Link href="/journey" className="journey-text-link">Xem trước hành trình cá nhân <ArrowRight size={14} /></Link>}
      <div className="panel-navigation"><button className="return-button" onClick={onMap}><Map size={15} /> Chọn đảo tiếp theo</button>{destination.id !== "campus" && <ReturnToCampusButton onClick={onReturn} />}</div>
    </div>
  </Modal>;
}
export function ReturnToCampusButton({ onClick }: { onClick:() => void }) { return <button className="return-button" onClick={onClick}><ArrowLeft size={15} /> Trở về EIU</button>; }
