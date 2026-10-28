import type {Vector3Tuple} from "@/types";
import type {JourneyState} from "./journey-machine";
import type {NavigationPlan} from "@/types/navigation";
import {worldSettings} from "@/data/world-settings";
export const wrappedAngle = (a:number) => Math.atan2(Math.sin(a),Math.cos(a));
const clamp = (n:number,min:number,max:number) => Math.max(min,Math.min(max,n));
export function dampAngle(current:number,target:number,delta:number,rate = 5) {return current + wrappedAngle(target - current) * (1 - Math.exp(-delta * rate));}
/** A world-aligned corridor: vessel yaw is deliberately absent from this calculation. */
export function preferredCameraYaw(plan:NavigationPlan) {
 const start = plan.segments[0]?.start,end = plan.segments.at(-1)?.end,base = worldSettings.launchHeading;
 if(!start || !end) return base;
 const bearing = Math.atan2(end[0] - start[0],end[2] - start[2]);
 return base + clamp(wrappedAngle(bearing - base),-worldSettings.cameraComfort.yawCorridor,worldSettings.cameraComfort.yawCorridor);
}
export function stepCameraYaw(yaw:number,velocity:number,target:number,delta:number) {
 const {maxYawSpeed,maxYawAcceleration} = worldSettings.cameraComfort,dt = Math.max(0,delta);
 const acceleration = clamp(wrappedAngle(target - yaw) * 2.5 - velocity * 2.2,-maxYawAcceleration,maxYawAcceleration);
 const nextVelocity = clamp(velocity + acceleration * dt,-maxYawSpeed,maxYawSpeed);
 return {yaw:yaw + nextVelocity * dt,velocity:nextVelocity,acceleration:dt ? (nextVelocity - velocity) / dt : 0};
}
export interface BoatCameraPose {position:Vector3Tuple;target:Vector3Tuple;fov:number;shift:[number,number];distance:number;height:number;lookAhead:number}
/** Heading means the independent camera heading, not the boat's rotation. */
export function getBoatCameraPose(state:JourneyState,p:Vector3Tuple,heading:number,speed:number,mobile:boolean):BoatCameraPose {
 const base = worldSettings.chase,panel = state.phase === "EXPLORING_CONTENT",docking = state.phase === "DOCKING" || state.phase === "ARRIVED";
 const distance = panel && mobile ? 15.5 : docking ? 12 : base.distance;
 const baseAhead = mobile ? base.mobileLookAhead : base.lookAhead,lookAhead = baseAhead + (state.phase === "SAILING" ? clamp(speed / 5.5,0,1) * 1.2 : 0);
 const height = .3 + (base.height - .3) / (base.distance + baseAhead) * (distance + lookAhead),forward = [Math.sin(heading),Math.cos(heading)],shoulder = mobile ? .45 : base.shoulder;
 return {position:[p[0] - forward[0] * distance + forward[1] * shoulder,p[1] + height,p[2] - forward[1] * distance - forward[0] * shoulder],target:[p[0] + forward[0] * lookAhead,p[1] + .3,p[2] + forward[1] * lookAhead],fov:mobile ? base.mobileFov : base.fov,shift:panel ? mobile ? [0,.3] : [.14,0] : [0,0],distance,height,lookAhead};
}
