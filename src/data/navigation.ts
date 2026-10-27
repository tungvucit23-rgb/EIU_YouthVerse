import type { ConnectionSpec, NavigationNode } from "@/types/navigation";
import type { IslandId } from "@/types";
import { getIsland } from "./islands";

const channelFor = (id:string,islandId:IslandId):NavigationNode => {
  const island = getIsland(islandId),p = island.dockingPoint;
  return {id,kind:"channel",position:[p[0] - Math.sin(island.dockHeading) * 4.2,p[1],p[2] - Math.cos(island.dockHeading) * 4.2]};
};

/** Intermediate shipping lanes only; island docks are derived from the island registry. */
export const channelNodes:NavigationNode[] = [
  channelFor("harbor-channel","campus"),
  channelFor("west-channel","activities"),
  channelFor("east-channel","clubs"),
  {id:"west-bypass-channel",position:[-11.5,-1.5,2.2],kind:"channel"},
  {id:"east-bypass-channel",position:[11.7,-1,1],kind:"channel"},
  channelFor("north-channel","volunteer"),
  {id:"north-bypass-channel",position:[-9.5,-1.2,-12.5],kind:"channel"},
  channelFor("northeast-channel","news"),
  channelFor("southeast-channel","events"),
  channelFor("far-north-channel","office"),
  channelFor("northwest-channel","achievements"),
  channelFor("far-west-channel","resources"),
];
export const channelConnections:ConnectionSpec[] = [
  {from:"harbor-channel",to:"west-channel",bend:-.8,width:.5},
  {from:"harbor-channel",to:"east-channel",bend:.7,width:.5},
  {from:"west-channel",to:"west-bypass-channel",bend:-.7,width:.44},
  {from:"west-bypass-channel",to:"north-channel",bend:-.6,width:.44},
  {from:"north-channel",to:"north-bypass-channel",bend:-.6,width:.44},
  {from:"north-bypass-channel",to:"northeast-channel",bend:-1.4,width:.44},
  {from:"east-channel",to:"east-bypass-channel",bend:-.7,width:.44},
  {from:"east-bypass-channel",to:"northeast-channel",bend:-.6,width:.44},
  {from:"east-channel",to:"southeast-channel",bend:-1.8,width:.44},
  {from:"west-channel",to:"far-west-channel",bend:1.8,width:.42},
  {from:"north-channel",to:"northwest-channel",bend:-1.1,width:.42},
  {from:"northeast-channel",to:"far-north-channel",bend:1,width:.42},
];
