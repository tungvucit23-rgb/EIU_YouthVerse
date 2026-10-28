"use client";
import {useRef,type RefObject} from "react";
import {useFrame} from "@react-three/fiber";
import {PerspectiveCamera,Vector3} from "three";
import {getBoatCameraPose,preferredCameraYaw,stepCameraYaw} from "@/lib/boat-camera";
import type {JourneyState} from "@/lib/journey-machine";
import type {JourneyMotion} from "@/lib/journey-runtime";
import type {NavigationPlan} from "@/types/navigation";
import {worldSettings} from "@/data/world-settings";
import {samplePlanInto} from "@/lib/navigation-graph";
import type {RouteSample} from "@/types/navigation";

export function CameraController({state,plan,motion,mobile,reducedMotion}:{state:JourneyState;plan:NavigationPlan;motion:RefObject<JourneyMotion>;mobile:boolean;reducedMotion:boolean}) {
 const ready = useRef(false),yaw = useRef(worldSettings.launchHeading),velocity = useRef(0),anchor = useRef(new Vector3()),scratch = useRef(new Vector3()),target = useRef(new Vector3());
 const rig = useRef({...worldSettings.chase,x:0,y:0});
 const lead = useRef(new Vector3()),leadTarget = useRef(new Vector3()),routeSample = useRef<RouteSample>({position:[0,0,0],tangent:[0,0,-1],edgeIndex:0});
 useFrame(({camera,size},delta) => {
  if(!(camera instanceof PerspectiveCamera)) return;
  const p = motion.current.position,dt = Math.min(delta,.1),snap = !ready.current || reducedMotion,comfort = worldSettings.cameraComfort;
  const moving = ["ROUTE_PLANNING","SAILING","APPROACHING","DOCKING"].includes(state.phase);
  leadTarget.current.set(0,0,0);
  if(!reducedMotion && state.phase === "SAILING" && plan.distance > 0){samplePlanInto(plan,Math.min(1,motion.current.progress + comfort.routeLookAhead / plan.distance),routeSample.current);const q = routeSample.current.position;leadTarget.current.set(q[0] - p[0],0,q[2] - p[2]).clampLength(0,comfort.routeLead);}
  if(snap) lead.current.copy(leadTarget.current);else lead.current.lerp(leadTarget.current,1 - Math.exp(-dt * 2));
  const next = reducedMotion ? {yaw:yaw.current,velocity:0,acceleration:0} : stepCameraYaw(yaw.current,velocity.current,moving ? preferredCameraYaw(plan) : yaw.current,dt);
  yaw.current = next.yaw;velocity.current = next.velocity;
  const alpha = snap ? 1 : 1 - Math.exp(-dt * comfort.rigDamping),pose = getBoatCameraPose(state,p,yaw.current,motion.current.speed,mobile),r = rig.current;
  if(snap) anchor.current.set(...p);else anchor.current.lerp(scratch.current.set(...p),1 - Math.exp(-dt * comfort.positionDamping));
  for(const key of ["distance","height","lookAhead","fov"] as const) r[key] += (pose[key] - r[key]) * alpha;
  r.shoulder += ((mobile ? .45 : worldSettings.chase.shoulder) - r.shoulder) * alpha;r.x += (pose.shift[0] - r.x) * alpha;r.y += (pose.shift[1] - r.y) * alpha;
  const sx = Math.sin(yaw.current),cz = Math.cos(yaw.current),a = anchor.current;
  camera.position.set(a.x - sx * r.distance + cz * r.shoulder + lead.current.x,a.y + r.height,a.z - cz * r.distance - sx * r.shoulder + lead.current.z);
  target.current.set(a.x + sx * r.lookAhead + lead.current.x,a.y + .3,a.z + cz * r.lookAhead + lead.current.z);camera.up.set(0,1,0);camera.lookAt(target.current);camera.fov = r.fov;
  camera.setViewOffset(size.width,size.height,r.x * size.width,r.y * size.height,size.width,size.height);camera.updateProjectionMatrix();camera.updateMatrixWorld();ready.current = true;
  Object.assign(camera.userData,{followTarget:target.current.toArray(),followHeading:yaw.current,lensShift:[r.x,r.y],yawVelocity:velocity.current,yawAcceleration:next.acceleration});
 });return null;
}
