export type DestinationId = "activities" | "news" | "clubs" | "events" | "volunteer" | "office" | "achievements" | "resources";
export type IslandId = "campus" | DestinationId;
export type Vector3Tuple = [number, number, number];
export type GraphicsQuality = "low" | "balanced" | "high";
export type AccessPolicy = "public" | "student" | "staff";
export interface IslandAsset { kind: "procedural" | "glb"; key: string; url: string }
export interface IslandShape { radius: number; depth: number; seed: number; stretch: [number, number] }

export interface ContentPreview { id: string; title: string; category: string }
export type WorldPreviews = Record<DestinationId, ContentPreview[]>;

export interface IslandDockConfig {
  position: Vector3Tuple;
  rotation: number;
  length: number;
  clearance: number;
  waterOffset: number;
}
export interface WorldBounds { min: Vector3Tuple; max: Vector3Tuple }
export interface WorldIsland {
  id: IslandId;
  displayName: string;
  category: IslandId;
  title: string;
  position: Vector3Tuple;
  scale: number;
  rotation: number;
  shape: IslandShape;
  asset: IslandAsset;
  modelPath: string;
  connections: string[];
  contentRoute: string;
  access: AccessPolicy;
  requiresAuth: boolean;
  dock: IslandDockConfig;
  dockingPoint: Vector3Tuple;
  dockHeading: number;
  viewBounds: WorldBounds;
  nearOnIntro: boolean;
}
export interface Destination extends WorldIsland {
  id: DestinationId;
  slug: string;
  fullTitle: string;
  subtitle: string;
  description: string;
  theme: string;
  contentType: DestinationId;
  isAvailable: boolean;
  number: string;
  action: string;
}

export interface DestinationEntry {
  id: string;
  title: string;
  category: string;
  description: string;
  body: string;
  date?: string;
  downloadUrl?: string;
  access?: AccessPolicy;
  isDemo: true;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: "Trải nghiệm" | "Cộng đồng" | "Kỹ năng";
  dateLabel: string;
  location: string;
  illustration: "sail" | "leaf" | "spark";
  isDemo: true;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: "Góc sinh viên" | "Cẩm nang" | "Kết nối";
  readMinutes: number;
  dateLabel: string;
  isDemo: true;
}

export interface StudentClub {
  id: string;
  title: string;
  description: string;
  category: "Sáng tạo" | "Công nghệ" | "Ngôn ngữ" | "Thể thao";
  monogram: string;
  color: string;
  isDemo: true;
}

export interface StudentJourneySummary {
  title: string;
  description: string;
  milestones: { title: string; description: string }[];
  requiresAuthentication: true;
  isDemo: true;
}
