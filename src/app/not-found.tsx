import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function NotFound() {
  return <div className="content-page"><SiteHeader /><main className="not-found" id="main-content"><Compass size={45} strokeWidth={1} /><h1>Gió đưa bạn đi hơi xa.</h1><p>Điểm đến này chưa có trên bản đồ. Cùng trở về EIU nhé.</p><Link href="/" className="primary-button">Trở về thế giới EIU</Link></main></div>;
}
