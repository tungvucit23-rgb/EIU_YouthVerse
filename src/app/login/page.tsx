import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoginPreview } from "@/components/content/LoginPreview";

export const metadata: Metadata = { title: "Đăng nhập — giao diện xem trước" };

export default function LoginPage() {
  return <div className="content-page"><SiteHeader /><main className="login-main" id="main-content"><section className="login-story"><Link href="/" className="back-to-world"><ArrowLeft size={15} /> Trở về thế giới EIU</Link><h1>Mỗi hành trình<br />bắt đầu từ <em>bạn.</em></h1><p>Những điều bạn khám phá hôm nay sẽ trở thành một phần câu chuyện ngày mai.</p><Link href="/journey" className="journey-text-link" style={{ justifyContent: "flex-start", marginTop: 25 }}>Xem trước hành trình cá nhân<ArrowRight size={15} /></Link></section><LoginPreview /></main></div>;
}
