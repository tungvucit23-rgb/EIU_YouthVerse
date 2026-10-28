import type { Metadata } from "next";
import { ContentLayout } from "@/components/content/ContentLayout";
import { ContentCollection } from "@/components/content/ContentCollection";
import { repository } from "@/lib/repository";

export const metadata: Metadata = { title: "Tin tức Đoàn – Hội" };

export default async function NewsPage() {
  return <ContentLayout worldIsland="campus" eyebrow="EIU CAMPUS · TIN TỨC ĐOÀN – HỘI" title="Những câu chuyện đang tiếp diễn." description="Bắt nhịp đời sống sinh viên. Tìm một góc nhìn mới, một chút cảm hứng và những câu chuyện đáng sẻ chia."><ContentCollection kind="news" items={await repository.getNews()} /></ContentLayout>;
}
