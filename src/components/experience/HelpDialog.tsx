"use client";

import { Compass, MousePointer2, Sailboat, X } from "lucide-react";
import type { GraphicsQuality } from "@/types";
import { Modal } from "@/components/ui/Modal";

export function HelpDialog({ onClose,simplified,onToggleSimplified,quality,onQuality }: { onClose:() => void; simplified:boolean; onToggleSimplified:() => void; quality:GraphicsQuality; onQuality:(quality:GraphicsQuality) => void }) {
  return <Modal className="help-dialog" labelId="help-title" onClose={onClose}>
    <div className="dialog-heading"><p className="eyebrow">CÁNH BUỒM CỦA BẠN</p><button className="icon-button" onClick={onClose} aria-label="Đóng hướng dẫn"><X size={20} /></button></div>
    <h2 id="help-title">Chọn nhịp khám phá.</h2>
    <ol className="help-steps"><li><Compass size={20} /><span>Mở Hải đồ để tìm đủ chín đảo và xem vị trí của thuyền.</span></li><li><MousePointer2 size={20} /><span>Chạm vào một đảo gần hoặc chọn điểm đến trong danh sách.</span></li><li><Sailboat size={20} /><span>Thuyền đi theo dòng nước, giảm tốc và cập bến. Đóng nội dung để khám phá tiếp từ đảo hiện tại.</span></li></ol>
    <fieldset className="quality-selector"><legend>Chất lượng đồ họa</legend>{([{id:"low",label:"Thấp",caption:"Low · Tiết kiệm"},{id:"balanced",label:"Cân bằng",caption:"Balanced · Mặc định"},{id:"high",label:"Chi tiết",caption:"High"}] as const).map((item) => <label key={item.id}><input type="radio" name="graphics-quality" value={item.id} checked={quality === item.id} onChange={() => onQuality(item.id)} /><span><strong>{item.label}</strong><small>{item.caption}</small></span></label>)}</fieldset>
    <p className="dialog-note">Màn hình nhỏ và thiết bị chậm tự giảm độ phân giải, bóng đổ và chi tiết ở xa. Tôn trọng cài đặt giảm chuyển động của thiết bị.</p>
    <button className="text-button" onClick={onToggleSimplified}>{simplified ? "Bật trải nghiệm 3D" : "Dùng hải đồ nhẹ, không cần 3D"}</button>
  </Modal>;
}
