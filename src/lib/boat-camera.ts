import type {Vector3Tuple} from "@/types";
import type {JourneyState} from "./journey-machine";
import {worldSettings} from "@/data/world-settings";
export interface BoatCameraPose {position:Vector3Tuple;target:Vector3Tuple;fov:number;shift:[number,number];distance:number;height:number;lookAhead:number}
export function dampAngle(current:number,target:number,delta:number,rate = 5) {
  return current + Math.atan2(Math.sin(target - current),Math.cos(target - current)) * (1 - Math.exp(-delta * rate));
}
/** A chase rig in the vessel's local frame. Islands never move the camera away from its boat anchor. */
export function getBoatCameraPose(state:JourneyState,p:Vector3Tuple,heading:number,speed:number,mobile:boolean):BoatCameraPose {
  const base = worldSettings.chase;
  const moving = state.phase === "SAILING",approach = state.phase === "APPROACHING",docking = state.phase === "DOCKING" || state.phase === "ARRIVED";
  const panel = state.phase === "EXPLORING_CONTENT",selecting = state.phase === "SELECTING_DESTINATION" || state.phase === "ROUTE_PLANNING";
  const pace = moving ? Math.min(1,Math.max(0,speed) / 25) : 0;
  const distance = panel && mobile ? 15.5 : docking ? 11.8 : approach ? 12.2 : base.distance + pace * 1.8 + (selecting ? .4 : 0);
  const height = panel && mobile ? 7 : docking ? 5.9 : base.height + pace * .35;
  const lookAhead = panel && mobile ? base.mobileLookAhead : (mobile ? base.mobileLookAhead : base.lookAhead) + pace * 3 + (selecting ? .6 : 0) - (docking ? 1 : 0);
  const forward = [Math.sin(heading),Math.cos(heading)],shoulder = mobile ? .45 : base.shoulder;
  return {position:[p[0] - forward[0] * distance + forward[1] * shoulder,p[1] + height,p[2] - forward[1] * distance - forward[0] * shoulder],
    target:[p[0] + forward[0] * lookAhead,p[1] + .3,p[2] + forward[1] * lookAhead],
    fov:mobile ? base.mobileFov : base.fov,shift:panel ? mobile ? [0,.3] : [.14,0] : [0,0],distance,height,lookAhead};
}
