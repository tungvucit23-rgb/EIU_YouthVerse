import type {NavigationNode} from "@/types/navigation";
import {HOME_BOAT_POSITION,islands} from "./islands";
import {worldSettings} from "./world-settings";
/** Five along-shore berths and one offshore launch; all poses include forward heading. */
export const navigationPoses:NavigationNode[] = [
 ...islands.map(i => ({id:i.id,position:i.dockingPoint,kind:"island" as const,islandId:i.id,heading:i.dockHeading})),
 {id:"launch-channel",position:HOME_BOAT_POSITION,kind:"channel",heading:worldSettings.launchHeading},
];
/** The map shows these real lanes; the planner supports every directed pair. */
export const mapLanePairs = new Set(["launch-channel>campus","campus>activities","activities>office","office>achievements","achievements>clubs","clubs>campus"]);
