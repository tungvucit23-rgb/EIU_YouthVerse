import { BookOpen, Building2, CalendarDays, Flag, Music2, RadioTower, Sprout, Trophy } from "lucide-react";
import type { DestinationId } from "@/types";

const icons = { activities:Flag,news:RadioTower,clubs:Music2,events:CalendarDays,volunteer:Sprout,office:Building2,achievements:Trophy,resources:BookOpen };
export function DestinationIcon({ id,size = 15 }: { id:DestinationId; size?:number }) { const Icon = icons[id]; return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />; }
