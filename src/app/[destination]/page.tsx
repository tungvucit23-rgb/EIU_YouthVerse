import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { destinations } from "@/data/islands";
import { repository } from "@/lib/repository";
import { ContentLayout } from "@/components/content/ContentLayout";
import { DestinationContent } from "@/components/content/DestinationContent";

const additional = destinations.filter((island) => !["activities","news","clubs"].includes(island.id));
export const dynamicParams = false;
export function generateStaticParams() { return additional.map((island) => ({destination:island.slug})); }
export async function generateMetadata({params}: {params:Promise<{destination:string}>}):Promise<Metadata> { const {destination} = await params; return {title:additional.find((island) => island.slug === destination)?.fullTitle ?? "Điểm đến"}; }
export default async function DestinationPage({params}: {params:Promise<{destination:string}>}) {
  const {destination:slug} = await params;
  const destination = additional.find((island) => island.slug === slug);
  if (!destination) notFound();
  const entries = await repository.getDestinationEntries(destination.id);
  return <ContentLayout eyebrow={"ĐIỂM DỪNG " + destination.number + " · " + destination.title.toLocaleUpperCase("vi")} title={destination.fullTitle} description={destination.description}><DestinationContent destination={destination} entries={entries} /></ContentLayout>;
}
