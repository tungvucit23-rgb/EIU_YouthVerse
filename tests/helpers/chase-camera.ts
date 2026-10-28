import {PerspectiveCamera,Vector3} from "three";
import {getBoatCameraPose} from "../../src/lib/boat-camera";
import type {JourneyState} from "../../src/lib/journey-machine";
import type {Vector3Tuple} from "../../src/types";
export function cameraFor(state:JourneyState,p:Vector3Tuple,heading:number,size:{width:number;height:number},speed = 0) {
  const pose = getBoatCameraPose(state,p,heading,speed,size.width < 768),camera = new PerspectiveCamera(pose.fov,size.width / size.height,.1,260);
  camera.position.set(...pose.position);camera.lookAt(...pose.target);
  camera.setViewOffset(size.width,size.height,pose.shift[0] * size.width,pose.shift[1] * size.height,size.width,size.height);camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera;
}
export function screen(point:Vector3Tuple,camera:PerspectiveCamera,size:{width:number;height:number}) {const p = new Vector3(...point).project(camera);return {x:(p.x * .5 + .5) * size.width,y:(-p.y * .5 + .5) * size.height,z:p.z};}
