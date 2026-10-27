import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { ContentLayout } from "@/components/content/ContentLayout";
import { repository } from "@/lib/repository";

export const metadata: Metadata = { title: "Hành trình của bạn" };

export default async function JourneyPage() {
  const journey = await repository.getJourney();
  return <ContentLayout eyebrow="NHẬT KÝ HẢI TRÌNH · XEM TRƯỚC" title={journey.title} description={journey.description}><div className="journey-steps">{journey.milestones.map((milestone, i) => <article className="journey-step" key={milestone.title}><span>0{i + 1}</span><h2>{milestone.title}</h2><p>{milestone.description}</p></article>)}</div><div className="journey-lock"><LockKeyhole size={26} strokeWidth={1.3} /><div><h2>Câu chuyện của riêng bạn, sắp ra khơi.</h2><p>Hành trình cá nhân sẽ yêu cầu đăng nhập. Bản frontend hiện tại chưa lưu dữ liệu hoặc kết nối tài khoản.</p></div><Link href="/login" className="primary-button">Xem giao diện đăng nhập<ArrowRight size={16} /></Link></div></ContentLayout>;
}
