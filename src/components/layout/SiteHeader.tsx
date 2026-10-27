import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

export function SiteHeader({ onSearch }: { onSearch?: () => void }) {
  return (
    <header className={`site-header ${onSearch ? "immersive-header" : ""}`}>
      <Link href="/" className="brand" aria-label="EIU YouthVerse — về thế giới EIU">
        <span className="brand-eiu">EIU</span>
        <span className="brand-divider" />
        {onSearch ? <span className="brand-union">ĐOÀN THANH NIÊN<br />HỘI SINH VIÊN<span>YOUTHVERSE</span></span> : <span className="brand-name">YouthVerse<span>ĐOÀN THANH NIÊN · HỘI SINH VIÊN</span></span>}
      </Link>
      <div className="header-actions">
        {onSearch && <button className="utility-button" onClick={onSearch} aria-label="Tìm điểm đến"><Search size={23} strokeWidth={1.7} /></button>}
        <Link href="/login" className="login-link">Đăng nhập <ArrowRight size={17} /></Link>
      </div>
    </header>
  );
}
