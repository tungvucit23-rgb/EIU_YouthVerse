import { activities } from "@/data/mock/activities";
import { news } from "@/data/mock/news";
import { clubs } from "@/data/mock/clubs";
import type { Activity, NewsArticle, StudentClub, StudentJourneySummary, DestinationEntry, DestinationId, WorldPreviews } from "@/types";
import { islands,islandSections } from "@/data/islands";
import { destinationEntries } from "@/data/mock/destinations";

/** Replace this adapter with fetch calls to ASP.NET Core; pages keep the same contract. */
export interface YouthVerseRepository {
  getActivities(): Promise<Activity[]>;
  getNews(): Promise<NewsArticle[]>;
  getClubs(): Promise<StudentClub[]>;
  getJourney(): Promise<StudentJourneySummary>;
  getDestinationEntries(destination: DestinationId): Promise<DestinationEntry[]>;
  getWorldPreviews(): Promise<WorldPreviews>;
}

export const repository: YouthVerseRepository = {
  getActivities: async () => activities,
  getNews: async () => news,
  getClubs: async () => clubs,
  getDestinationEntries: async (id) => {
    if (id === "activities") return activities.map((item) => ({...item,body:item.description}));
    if (id === "news") return news.map((item) => ({...item,body:item.description}));
    if (id === "clubs") return clubs.map((item) => ({...item,body:item.description}));
    return destinationEntries[id];
  },
  getWorldPreviews: async () => Object.fromEntries(await Promise.all(islands.map(async (destination) => {
    const entries = (await Promise.all(islandSections[destination.id].map(id => repository.getDestinationEntries(id)))).flat();
    return [destination.id,entries.slice(0,2).map(({id,title,category}) => ({id,title,category}))];
  }))) as WorldPreviews,
  getJourney: async () => ({
    title: "Hành trình mang dấu ấn của bạn",
    description: "Một nơi để lưu lại trải nghiệm, nhìn thấy sự trưởng thành và chọn chân trời tiếp theo.",
    requiresAuthentication: true,
    isDemo: true,
    milestones: [
      { title: "Khám phá", description: "Tìm hoạt động và cộng đồng khiến bạn tò mò." },
      { title: "Kết nối", description: "Gặp đồng đội và bắt đầu trải nghiệm đầu tiên." },
      { title: "Đóng góp", description: "Biến ý tưởng của bạn thành điều có ích." },
    ],
  }),
};
