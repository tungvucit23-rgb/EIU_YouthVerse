import {ExtrudeGeometry,Group,Path,Shape,type BufferGeometry,type MeshStandardMaterial} from "three";
import {bakeGroups,batch,box,material,pole,tube} from "./model-kit.ts";

/** Photo-informed silhouette, not surveyed architectural dimensions. Local ground is Y=.13. */
export function buildCampusEntrance() {
  const parts:{geometry:BufferGeometry;material:MeshStandardMaterial}[] = [];
  const white = material("EIU_White_Concrete","#f5f1e4",.82),edge = material("EIU_Soffit","#dfdccc",.88),ink = material("EIU_Lettering","#174b66",.55),stone = material("EIU_Sign_Stone","#ded9c9",.94);
  const add = (geometry:BufferGeometry,m = white) => parts.push({geometry,material:m});
  const plan = new Shape();plan.moveTo(-3.6,-.6);plan.bezierCurveTo(-1.8,-.34,.1,-.34,3.6,-.98);plan.lineTo(3.6,1.04);plan.bezierCurveTo(1.2,1.27,-1.8,.72,-3.6,.48);plan.closePath();
  const opening = new Path();opening.absellipse(1.48,.12,.98,.54,0,Math.PI * 2,true);plan.holes.push(opening);
  add(new ExtrudeGeometry(plan,{depth:.105,bevelEnabled:true,bevelSize:.016,bevelThickness:.012,bevelSegments:2,curveSegments:40}).rotateX(-Math.PI / 2).translate(0,1.43,0));
  // Thin perimeter fascia and the oval's inner reveal remain open to the sky.
  const rim = Array.from({length:65},(_,i) => {const a = i / 64 * Math.PI * 2;return [1.48 + Math.cos(a) * .98,1.435,-.12 - Math.sin(a) * .54];});
  add(tube(rim,.024,64),edge);
  for (const [x,z] of [[-3.28,.26],[-2.15,.28],[-1.02,.29],[.12,.29],[1.16,.68],[3.23,.66]]) {
    add(pole(.052,1.41,[x,.705,z]));add(pole(.071,.045,[x,.025,z]),edge);
  }
  // The sign wall is on the right, below the skylight, rather than an added monument.
  add(box([1.62,1.4,.19],[2.58,.7,.59]),stone);
  for (let i = 0; i < 23; i++) add(box([.012,1.35,.012],[1.81 + i * .067,.7,.692]),edge);
  // Actual extruded lettering remains legible in a standalone GLB without a runtime text texture.
  const ox = 2.12,oy = .9,z = .72,h = .4,w = .23,t = .047;
  add(box([t,h,.035],[ox,oy,z]),ink);
  for(const y of [-h / 2,0,h / 2]) add(box([w,t,.035],[ox + w / 2 - t / 2,oy + y,z]),ink);
  add(box([t,h,.035],[ox + .37,oy,z]),ink);
  for(const y of [-h / 2,h / 2]) add(box([.17,t,.035],[ox + .37,oy + y,z]),ink);
  for(const x of [.55,.79]) add(box([t,h - .1,.035],[ox + x,oy + .05,z]),ink);
  add(tube([[ox + .55,oy - .1,z],[ox + .57,oy - .2,z],[ox + .67,oy - .23,z],[ox + .77,oy - .2,z],[ox + .79,oy - .1,z]],.025,16),ink);
  const root = batch("EIU_Entrance",parts);root.position.set(0,.14,1.6);root.userData = {reference:"design-references/eiu-entrance-real.jpg",skylight:{center:[1.48,1.43,-.12],radii:[.98,.54]},signSide:"right",canopyWidth:7.2};return root;
}

export function buildCampusBuildings() {
  const root = new Group();root.name = "EIU_Academic_Quarter";
  const wall = material("Campus_Render","#b8a092"),white = material("Campus_Shading_Concrete","#e9e5d7"),glass = material("Campus_Recessed_Glass","#42616a",.3,.12),reveal = material("Campus_Window_Reveals","#7a7d70"),roof = material("Campus_Roof_Deck","#a9aba0",.97);
  for(const [index,x,z,w,d,angle] of [[0,-2.45,-2.35,2.8,1.16,-.06],[1,.65,-2.7,3.05,1.15,0],[2,3.05,-1.15,2.25,1.08,Math.PI / 2],[3,-2.8,-.55,2.1,.85,0]]) {
    const parts:{geometry:BufferGeometry;material:MeshStandardMaterial}[] = [];
    const add = (g:BufferGeometry,m = wall) => parts.push({geometry:g,material:m});
    const height = index === 3 ? 1.58 : 2.02;
    add(box([w,height,d],[0,height / 2,0]));add(box([w + .12,.09,d + .12],[0,.04,0]),reveal);
    // Three recessed window courses, deep mullions and horizontal sunshades from the campus photo.
    for(let floor = 0;floor < 3;floor++) {
      const y = .36 + floor * (height - .45) / 3,bays = Math.round(w / .42);
      for(const side of [-1,1]) for(let bay = 0;bay < bays;bay++) {
        const bx = -w / 2 + (bay + .5) * w / bays;
        add(box([w / bays - .075,.27,.025],[bx,y,side * (d / 2 + .016)]),glass);
        add(box([.025,.32,.075],[bx - w / bays / 2 + .03,y,side * (d / 2 + .04)]),white);
        add(box([w / bays - .04,.027,.11],[bx,y - .15,side * (d / 2 + .045)]),reveal);
      }
      add(box([w + .14,.055,d + .2],[0,y + .2,0]),white);
    }
    add(box([w + .2,.075,d + .22],[0,height + .035,0]),white);
    add(box([w,.035,d],[0,height + .085,0]),roof);
    for(const side of [-1,1]) add(box([w + .19,.1,.055],[0,height + .12,side * (d / 2 + .07)]),white);
    for(const side of [-1,1]) add(box([.055,.1,d + .2],[side * (w / 2 + .07),height + .12,0]),white);
    const group = batch("Academic_Block_" + index,parts);group.position.set(x,.13,z);group.rotation.y = angle;root.add(group);
  }
  return bakeGroups(root,"EIU_Academic_Quarter");
}
export function buildCampusModel() {const root = new Group();root.name = "EIU_Campus_Architecture";root.add(buildCampusBuildings(),buildCampusEntrance());root.userData = {authoring:"Original photo-informed procedural Three.js model",version:1,groundY:.13,bowAxis:"+Z"};return root;}
