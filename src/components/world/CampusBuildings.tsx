"use client";
import {buildCampusBuildings} from "@/lib/art/campus-model";
import {ProceduralModel} from "./islands/ProceduralModel";
export function CampusBuildings() {return <ProceduralModel build={buildCampusBuildings}/>;}
