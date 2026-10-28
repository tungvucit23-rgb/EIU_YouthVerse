import React,{lazy,Suspense} from "react";
import {createRoot} from "react-dom/client";
import {Canvas,useFrame} from "@react-three/fiber";
import {OrthographicCamera} from "three";
import {TerrainTextures} from "@/components/world/TerrainTextures";
import {SceneryMaterials} from "@/components/world/SceneryMaterials";
import {WorldQuality} from "@/components/world/WorldQuality";
import {CentralEIUIsland} from "@/components/world/CentralEIUIsland";
import {CampusEntrance} from "@/components/world/CampusEntrance";
import {FloatingIsland} from "@/components/world/FloatingIsland";
import {IslandArt} from "@/components/world/islands/IslandArt";
import {ExplorerBoatAsset} from "@/components/world/boat/ExplorerBoatAsset";
import {getIsland} from "@/data/islands";
Object.assign(window,{React});
const view = new URLSearchParams(location.search).get("view") ?? "boat";
const baseline = new URLSearchParams(location.search).has("baseline");
const historicalModule = "/.asset-review-cache/ExplorerBoatAsset.tsx";
const HistoricalBoat = lazy(() => import(/* @vite-ignore */ historicalModule).then(module => ({default:module.ExplorerBoatAsset as typeof ExplorerBoatAsset})));
const historicalView = "/.asset-review-cache/HistoricalView.tsx";
const HistoricalView = lazy(() => import(/* @vite-ignore */ historicalView).then(module => ({default:module.default as React.ComponentType<{view:string}>})));
const settings:{[key:string]:{target:[number,number,number];position:[number,number,number];span:number}} = {
  boat:{target:[0,1.7,0],position:[6,4.1,8],span:6.8},campus:{target:[0,-.1,0],position:[11,8,16],span:14},
  entrance:{target:[0,.9,1.6],position:[5,3.3,12],span:8.8},activities:{target:[0,-.4,0],position:[7,5,10],span:9.3},
};
function ReviewCamera() {
  useFrame(({camera,size,gl,scene}) => {
    const s = settings[view] ?? settings.boat;
    camera.position.set(...s.position); camera.lookAt(...s.target);
    if (camera instanceof OrthographicCamera) {camera.zoom = Math.min(size.width / s.span,size.height / (s.span * .73));camera.updateProjectionMatrix();camera.updateMatrixWorld();}
    gl.domElement.dataset.ready = "true";
    gl.domElement.dataset.metrics = JSON.stringify({calls:gl.info.render.calls,triangles:gl.info.render.triangles,geometries:gl.info.memory.geometries,textures:gl.info.memory.textures,boat:!!scene.getObjectByName("YouthVerse_Explorer")});
  }); return null;
}
createRoot(document.getElementById("root")!).render(<Canvas orthographic shadows dpr={1} camera={{position:[8,5,10],near:.1,far:100}} gl={{antialias:true}}><color attach="background" args={["#d7e8ed"]}/><WorldQuality quality="balanced" reducedMotion><TerrainTextures><SceneryMaterials>
  <ambientLight intensity={.55}/><hemisphereLight args={["#dceeff","#667653",.9]}/><directionalLight position={[-4,9,6]} intensity={2.7} color="#ffe9ca" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-normalBias={.015}/><directionalLight position={[8,4,-4]} intensity={.7} color="#cfeaff"/>
  <Suspense fallback={null}>{view === "boat" ? baseline ? <HistoricalBoat onReady={() => undefined}/> : <ExplorerBoatAsset onReady={() => undefined}/> : baseline ? <HistoricalView view={view}/> : view === "entrance" ? <CampusEntrance/> : view === "activities" ? <FloatingIsland polished shape={getIsland("activities").shape}><IslandArt destination={getIsland("activities") as Parameters<typeof IslandArt>[0]["destination"]}/></FloatingIsland> : <CentralEIUIsland/>}</Suspense>
  <ReviewCamera/>
</SceneryMaterials></TerrainTextures></WorldQuality></Canvas>);
