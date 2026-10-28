import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type {IslandId} from "@/types";

export function ContentLayout({ eyebrow, title, description, children,worldIsland }: { eyebrow: string; title: string; description: string; children: ReactNode;worldIsland?:IslandId }) {
  return <div className="content-page"><SiteHeader /><main className="content-shell" id="main-content"><Link href={worldIsland ? "/#" + worldIsland : "/"} className="back-to-world"><ArrowLeft size={15} /> Trở về thế giới EIU</Link><div className="content-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><DemoNotice />{children}</main><footer className="content-footer"><span>EIU YouthVerse</span><span>Hoist the Sails · Bản trải nghiệm frontend</span></footer></div>;
}

export function DemoNotice() {
  return <div className="content-demo-banner"><Info size={14} /><span><strong>Nội dung demo.</strong> Các tên gọi, lịch, bài viết và câu lạc bộ bên dưới là minh họa cho giao diện, chưa phải thông tin chính thức của EIU.</span></div>;
}
