import type { IslandId } from "../types";

export type JourneyPhase = "IDLE" | "SELECTING_DESTINATION" | "ROUTE_PLANNING" | "SAILING" | "APPROACHING" | "DOCKING" | "ARRIVED" | "EXPLORING_CONTENT";
export interface JourneyState {
  phase:JourneyPhase; currentIsland:IslandId; origin:IslandId; destination:IslandId|null; trip:number; routeError:string|null;atLaunch:boolean;
}
export type JourneyAction =
  | {type:"START"}
  | {type:"SAIL";destination:IslandId}
  | {type:"PLAN_READY";trip:number}
  | {type:"PLAN_FAILED";trip:number;message:string}
  | {type:"PROGRESS";phase:"APPROACHING"|"DOCKING";trip:number}
  | {type:"ARRIVE";trip:number}
  | {type:"OPEN_CONTENT";trip:number}
  | {type:"CLOSE_CONTENT"}
  | {type:"RESTORE";island:IslandId;openContent:boolean;atLaunch?:boolean};

export const initialJourney:JourneyState = {phase:"IDLE",currentIsland:"campus",origin:"campus",destination:null,trip:0,routeError:null,atLaunch:true};
export const isTransitioning = (state:JourneyState) => ["ROUTE_PLANNING","SAILING","APPROACHING","DOCKING","ARRIVED"].includes(state.phase);
export const canNavigate = (state:JourneyState) => ["IDLE","SELECTING_DESTINATION","EXPLORING_CONTENT"].includes(state.phase);

export function journeyReducer(state:JourneyState,action:JourneyAction):JourneyState {
  switch (action.type) {
    case "START": return state.phase === "IDLE" ? {...state,phase:"SELECTING_DESTINATION"} : state;
    case "SAIL":
      if (!canNavigate(state)) return state;
      if (action.destination === state.currentIsland && !state.atLaunch) return {...state,phase:state.currentIsland === "campus" ? "SELECTING_DESTINATION" : "EXPLORING_CONTENT",routeError:null};
      return {...state,phase:"ROUTE_PLANNING",origin:state.currentIsland,destination:action.destination,trip:state.trip + 1,routeError:null};
    case "PLAN_READY": return state.phase === "ROUTE_PLANNING" && action.trip === state.trip ? {...state,phase:"SAILING"} : state;
    case "PLAN_FAILED": return state.phase === "ROUTE_PLANNING" && action.trip === state.trip ? {...state,phase:"SELECTING_DESTINATION",destination:null,routeError:action.message} : state;
    case "PROGRESS":
      if (action.trip !== state.trip || !["SAILING","APPROACHING"].includes(state.phase)) return state;
      if (state.phase === "APPROACHING" && action.phase === "APPROACHING") return state;
      return {...state,phase:action.phase};
    case "ARRIVE": return action.trip === state.trip && ["SAILING","APPROACHING","DOCKING"].includes(state.phase) && state.destination ? {...state,currentIsland:state.destination,phase:"ARRIVED",atLaunch:false} : state;
    case "OPEN_CONTENT": return state.phase === "ARRIVED" && state.trip === action.trip ? {...state,phase:state.currentIsland === "campus" ? "SELECTING_DESTINATION" : "EXPLORING_CONTENT",destination:null} : state;
    case "CLOSE_CONTENT": return state.phase === "EXPLORING_CONTENT" ? {...state,phase:"SELECTING_DESTINATION",destination:null} : state;
    case "RESTORE": return {phase:action.openContent && action.island !== "campus" ? "EXPLORING_CONTENT" : "SELECTING_DESTINATION",currentIsland:action.island,origin:action.island,destination:null,trip:state.trip + 1,routeError:null,atLaunch:action.atLaunch ?? false};
  }
}
