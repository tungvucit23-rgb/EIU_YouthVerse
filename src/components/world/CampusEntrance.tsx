"use client";
import {buildCampusEntrance} from "@/lib/art/campus-model";
import {ProceduralModel} from "./islands/ProceduralModel";
export interface CampusEntranceProps {width?:number;height?:number;position?:[number,number,number]}
const build = () => {const model = buildCampusEntrance();model.position.set(0,0,0);return model;};
export function CampusEntrance({width = 7.2,height = 1.55,position = [0,.14,1.6]}:CampusEntranceProps) {
  return <group position={position} scale={[width / 7.2,height / 1.55,1]}><ProceduralModel build={build}/></group>;
}
