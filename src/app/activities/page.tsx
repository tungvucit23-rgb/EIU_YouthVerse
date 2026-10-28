import type { Metadata } from "next";
import { ContentLayout } from "@/components/content/ContentLayout";
import { ContentCollection } from "@/components/content/ContentCollection";
import { repository } from "@/lib/repository";

export const metadata: Metadata = { title: "Hoạt động sinh viên" };

export default async function ActivitiesPage() {
  return <ContentLayout worldIsland="activities" eyebrow="ĐOÀN – HỘI · HOẠT ĐỘNG" title="Trải nghiệm nhiều hơn. Lớn lên cùng nhau." description="Bước ra khỏi giảng đường, thử những điều mới và góp một phần thanh xuân vào những điều có ý nghĩa."><ContentCollection kind="activities" items={await repository.getActivities()} /></ContentLayout>;
}
