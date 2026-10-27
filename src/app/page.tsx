import { YouthVerseExperience } from "@/components/experience/YouthVerseExperience";
import { repository } from "@/lib/repository";

export default async function HomePage() {
  return <YouthVerseExperience previews={await repository.getWorldPreviews()} />;
}
