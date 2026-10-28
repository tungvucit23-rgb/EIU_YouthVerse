"use client";
import {useRef,type RefObject} from "react";
import {useFrame} from "@react-three/fiber";
import {PerspectiveCamera,Vector3} from "three";
import {getBoatCameraPose,dampAngle} from "@/lib/boat-camera";
import type {JourneyState} from "@/lib/journey-machine";
import type {JourneyMotion} from "@/lib/journey-runtime";
import type {NavigationPlan} from "@/types/navigation";
import {worldSettings} from "@/data/world-settings";
export function CameraController({state,motion,mobile,reducedMotion}:{state:JourneyState;plan:NavigationPlan;motion:RefObject<JourneyMotion>;mobile:boolean;reducedMotion:boolean}) {
 const ready = useRef(false),heading = useRef(Math.PI),anchor = useRef(new Vector3()),desired = useRef(new Vector3()),target = useRef(new Vector3());
 const rig = useRef({...worldSettings.chase,x:0,y:0});
 useFrame(({camera,size,scene},delta) => {
  if(!(camera instanceof PerspectiveCamera)) return;
  const vessel = scene.getObjectByName("sailing-boat"),p = motion.current.position;
  const yaw = vessel?.rotation.y ?? Math.atan2(motion.current.tangent[0],motion.current.tangent[2]);
  const snap = !ready.current || reducedMotion,dt = Math.min(delta,.1),alpha = snap ? 1 : 1 - Math.exp(-dt * 4.8);
  heading.current = snap ? yaw : dampAngle(heading.current,yaw,dt,12);
  if(snap) anchor.current.set(...p);else anchor.current.lerp(desired.current.set(...p),1 - Math.exp(-dt * 12));
  const pose = getBoatCameraPose(state,p,heading.current,motion.current.speed,mobile),r = rig.current;
  for(const key of ["distance","height","lookAhead","fov"] as const) r[key] += (pose[key] - r[key]) * alpha;
  r.shoulder += ((mobile ? .45 : worldSettings.chase.shoulder) - r.shoulder) * alpha;r.x += (pose.shift[0] - r.x) * alpha;r.y += (pose.shift[1] - r.y) * alpha;
  const sx = Math.sin(heading.current),cz = Math.cos(heading.current),a = anchor.current;
  camera.position.set(a.x - sx * r.distance + cz * r.shoulder,a.y + r.height,a.z - cz * r.distance - sx * r.shoulder);
  target.current.set(a.x + sx * r.lookAhead,a.y + .3,a.z + cz * r.lookAhead);
  camera.lookAt(target.current);camera.fov = r.fov;
  camera.setViewOffset(size.width,size.height,r.x * size.width,r.y * size.height,size.width,size.height);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();ready.current = true;
  camera.userData.followTarget = target.current.toArray();camera.userData.followHeading = heading.current;camera.userData.lensShift = [r.x,r.y];
 });return null;
}
