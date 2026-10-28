import type {ConnectionSpec,NavigationNode} from "@/types/navigation";
import type {IslandId} from "@/types";
import {getIsland,HOME_BOAT_POSITION} from "./islands";
const channelFor = (id:string,islandId:IslandId):NavigationNode => {
 const island = getIsland(islandId),p = island.dockingPoint;
 return {id,kind:"channel",position:[p[0] - Math.sin(island.dockHeading) * 4.2,p[1],p[2] - Math.cos(island.dockHeading) * 4.2]};
};
/** Frontal fan: navigable water between the 2/3/4 island layers, outside their footprints. */
export const channelNodes:NavigationNode[] = [
 {id:"launch-channel",position:HOME_BOAT_POSITION,kind:"channel"},
 {id:"launch-wake-channel",position:[0,-.3,42],kind:"channel"},
 {id:"horizon-channel",position:[0,-.1,22],kind:"channel"},
 channelFor("harbor-channel","campus"),channelFor("west-channel","activities"),channelFor("east-channel","clubs"),
 {id:"west-bypass-channel",position:[-25,.7,6],kind:"channel"},
 {id:"east-bypass-channel",position:[26,1.3,-2],kind:"channel"},
 channelFor("north-channel","volunteer"),channelFor("northeast-channel","news"),
 {id:"west-horizon-channel",position:[-38,2.5,-26],kind:"channel"},
 {id:"far-horizon-channel",position:[0,3.1,-30],kind:"channel"},
 {id:"east-horizon-channel",position:[38,3.3,-30],kind:"channel"},
 channelFor("southeast-channel","events"),channelFor("far-north-channel","office"),
 channelFor("northwest-channel","achievements"),channelFor("far-west-channel","resources"),
];
const connect = (from:string,to:string,bend = .4):ConnectionSpec => ({from,to,bend,width:.46});
export const channelConnections:ConnectionSpec[] = [
 connect("launch-channel","horizon-channel",0),connect("horizon-channel","harbor-channel",0),
 connect("launch-wake-channel","launch-channel",0),
 connect("harbor-channel","west-channel",-.6),connect("harbor-channel","east-channel",.6),
 connect("harbor-channel","west-bypass-channel",-.4),connect("harbor-channel","east-bypass-channel",.4),
 connect("horizon-channel","west-channel",-.7),connect("horizon-channel","east-channel",.7),
 connect("west-channel","west-bypass-channel",-.6),connect("east-channel","east-bypass-channel",.6),
 connect("west-bypass-channel","northeast-channel",-.4),connect("east-bypass-channel","north-channel",.4),
 connect("west-bypass-channel","west-horizon-channel",-.7),connect("east-bypass-channel","east-horizon-channel",.7),
 connect("west-horizon-channel","far-horizon-channel",.4),connect("far-horizon-channel","east-horizon-channel",-.4),
 connect("west-horizon-channel","southeast-channel",.3),connect("far-horizon-channel","far-north-channel",-.4),
 connect("far-horizon-channel","northwest-channel",.4),connect("east-horizon-channel","far-west-channel",-.3),
];
