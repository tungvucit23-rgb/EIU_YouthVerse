import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { portalSections } from "@/data/portal-sections";
import { repository } from "@/lib/repository";
import { ContentLayout } from "@/components/content/ContentLayout";
import { DestinationContent } from "@/components/content/DestinationContent";
import {getDestination,parentIslandForSection} from "@/data/islands";

const additional = portalSections.filter((section) => !["activities","news","clubs"].includes(section.id));
export const dynamicParams = false;
export function generateStaticParams() { return additional.map((island) => ({destination:island.slug})); }
export async function generateMetadata({params}: {params:Promise<{destination:string}>}):Promise<Metadata> { const {destination} = await params; return {title:additional.find((island) => island.slug === destination)?.fullTitle ?? "Điểm đến"}; }
export default async function DestinationPage({params}: {params:Promise<{destination:string}>}) {
  const {destination:slug} = await params;
  const destination = additional.find((island) => island.slug === slug);
  if (!destination) notFound();
  const entries = await repository.getDestinationEntries(destination.id);
  const parent = parentIslandForSection(destination.id);
  return <ContentLayout worldIsland={parent} eyebrow={getDestination(parent)!.title.toLocaleUpperCase("vi") + " · " + destination.title.toLocaleUpperCase("vi")} title={destination.fullTitle} description={destination.description}><DestinationContent destination={destination} entries={entries} /></ContentLayout>;
}
