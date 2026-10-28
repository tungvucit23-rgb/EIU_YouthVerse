import {BufferGeometry,CylinderGeometry,DoubleSide,Float32BufferAttribute,IcosahedronGeometry,type MeshStandardMaterial} from "three";
import {batch,box,material,pole,tube} from "./model-kit.ts";

/** A reusable festival courtyard: raised timber stage, sewn tensile roofs, seating and planted edge. */
export function buildActivitiesModel() {
  const parts:{geometry:BufferGeometry;material:MeshStandardMaterial}[] = [];
  const wood = material("Wood_Teak","#b38a57",.76),end = material("Wood_Endgrain","#75563a",.9),ivory = material("Festival_Canvas","#f1e5cc",.95),navy = material("Festival_Navy","#285c70",.82),gold = material("Festival_Ochre","#d0ae65",.88),metal = material("Festival_Hardware","#505f5e",.5,.35),stone = material("Festival_Pavers","#cec6b1",.98),leaf = material("Activities_Foliage","#71904d",1),darkLeaf = material("Activities_Leaf_Shade","#446c43",1);
  ivory.side = navy.side = gold.side = DoubleSide;
  const add = (g:BufferGeometry,m = wood) => parts.push({geometry:g,material:m});
  // Gaps and different plank lengths read at a normal camera distance without modelling nail heads.
  for(let i = 0;i < 24;i++) {
    const z = -.48 + i * .09;add(box([2.65,.075,.082],[0,.19,z]),i % 5 === 0 ? end : wood);
  }
  for(const x of [-1.18,1.18]) add(box([.09,.18,2.3],[x,.105,.5]),end);
  for(let i = 0;i < 3;i++) add(box([.8,.08,.18],[0,.065 + i * .045,1.86 - i * .16]),stone);
  function canopy(cx:number,cz:number,w:number,d:number,h:number) {
    const p:number[] = [],uv:number[] = [],indices:number[] = [],cols = 16,rows = 10;
    for(let z = 0;z <= rows;z++) for(let x = 0;x <= cols;x++) {
      const u = x / cols,v = z / rows;
      p.push(cx + (u - .5) * w,h + .24 * Math.pow(2 * u - 1,2) - .12 * Math.sin(v * Math.PI) + .012 * Math.cos(u * Math.PI * 12),cz + (v - .5) * d);uv.push(u,v);
      if(z < rows && x < cols){const a = z * (cols + 1) + x;indices.push(a,a + cols + 1,a + 1,a + 1,a + cols + 1,a + cols + 2);}
    }
    const g = new BufferGeometry();g.setAttribute("position",new Float32BufferAttribute(p,3));g.setAttribute("uv",new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();add(g,ivory);
    for(const side of [-1,1]) {
      const x = cx + side * w / 2;
      add(tube([[x,h + .25,cz - d / 2],[x,h + .12,cz],[x,h + .25,cz + d / 2]],.023),gold);
      for(const z of [cz - d / 2,cz + d / 2]) {add(pole(.027,h + .22,[x,(h + .22) / 2,z]),metal);add(tube([[x,h + .2,z],[x + side * .1,.16,z + .08]],.008),end);}
    }
    for(let i = 1;i < 6;i++) {const x = cx + (i / 6 - .5) * w;add(tube([[x,h + .24 * Math.pow(2 * i / 6 - 1,2),cz - d / 2],[x,h - .12 + .24 * Math.pow(2 * i / 6 - 1,2),cz],[x,h + .24 * Math.pow(2 * i / 6 - 1,2),cz + d / 2]],.006,10),gold);}
  }
  canopy(0,-.86,2.65,1.32,1.7);canopy(-1.95,.35,.72,.85,.9);canopy(1.94,.35,.72,.85,.9);
  for(const side of [-1,1]) {
    add(box([.21,.52,.23],[side * 1.1,.5,-.22]),navy);
    add(new CylinderGeometry(.065,.065,.018,16).rotateX(Math.PI / 2).translate(side * 1.1,.52,-.092),metal);
    // Side benches have individual slats, legs and curved support rails.
    for(let j = 0;j < 4;j++) add(box([.73,.035,.055],[side * 1.68,.36,1.12 + j * .06]));
    for(const dx of [-.27,.27]) add(box([.045,.23,.34],[side * 1.68 + dx,.23,1.22]),metal);
    for(let j = 0;j < 3;j++) add(box([.73,.05,.025],[side * 1.68,.47 + j * .065,1.37]),wood);
  }
  // A sagging pennant line, with actual curved flags rather than a flat printed card.
  add(tube([[-2.05,1.58,.65],[0,1.36,.65],[2.05,1.58,.65]],.012,24),end);
  for(const x of [-2.05,2.05]) add(pole(.025,1.62,[x,.81,.65]),wood);
  for(let i = 0;i < 11;i++) {
    const x = -1.85 + i * .37,y = 1.36 + Math.pow(x / 2.05,2) * .22,g = new BufferGeometry();
    g.setAttribute("position",new Float32BufferAttribute([x - .12,y,.65,x + .12,y,.65,x,y - .24,.71],3));g.setAttribute("uv",new Float32BufferAttribute([0,1,1,1,.5,0],2));g.computeVertexNormals();add(g,[ivory,navy,gold][i % 3]);
  }
  // Keep the entry path open all the way to the existing dock at (.17,.12,2.3).
  for(let i = 0;i < 5;i++) add(box([.48,.025,.18],[.17,.137,1.98 + i * .09]),stone);
  for(const [i,x,z] of [[0,-2,-.6],[1,-1.6,-1.7],[2,1.75,-1.2],[3,2.1,.3],[4,-2.2,.65]]) {
    const h = .66 + i % 3 * .12;add(pole(.028,h,[x,.12 + h / 2,z]),end);
    for(let j = 0;j < 5;j++) {const a = j * 2.4 + i,r = j === 4 ? 0 : .23,g = new IcosahedronGeometry(.3,1);g.scale(1.1,.8 + (i % 2) * .3,1).translate(x + Math.cos(a) * r,.12 + h + (j === 4 ? .2 : 0),z + Math.sin(a) * r);add(g,j % 2 ? leaf : darkLeaf);}
  }
  const root = batch("Activities_Festival_Courtyard",parts);root.userData = {authoring:"Original procedural stylized festival courtyard",version:1,groundY:.12};return root;
}
