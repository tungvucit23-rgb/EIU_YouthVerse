import type { Metadata } from "next";
import { ContentLayout } from "@/components/content/ContentLayout";
import { ContentCollection } from "@/components/content/ContentCollection";
import { repository } from "@/lib/repository";

export const metadata: Metadata = { title: "Câu lạc bộ" };

export default async function ClubsPage() {
  return <ContentLayout eyebrow="ĐIỂM DỪNG 03 · CÂU LẠC BỘ" title="Cùng đam mê. Cùng một cánh buồm." description="Có một cộng đồng dành cho điều bạn yêu. Tìm đồng đội, khám phá khả năng và viết tiếp câu chuyện của chính mình."><ContentCollection kind="clubs" items={await repository.getClubs()} /></ContentLayout>;
}
