import { BoxGeometry, BufferGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Shape, ExtrudeGeometry, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const sections = [[-1.5,0.32,0.6,-0.03],[-1.15,0.53,0.45,-0.22],[-0.45,0.68,0.4,-0.43],[0.4,0.64,0.44,-0.39],[1.2,0.37,0.57,-0.11],[1.7,0.025,0.73,0.58]];
function hullSection(z) {
  let index = 0; while (index < sections.length - 2 && sections[index + 1][0] < z) index++;
  const a = sections[index], b = sections[index + 1]; const raw = Math.max(0,Math.min(1,(z - a[0]) / (b[0] - a[0]))); const t = raw * raw * (3 - 2 * raw);
  return [z,a[1] + (b[1] - a[1]) * t,a[2] + (b[2] - a[2]) * t,a[3] + (b[3] - a[3]) * t];
}
function hullSurface(startAngle, endAngle, inner = false) {
  const positions = [], uv = [], indices = [];
  for (let row = 0; row <= 64; row++) {
    const [z,width,top,keel] = hullSection(-1.5 + row / 64 * 3.2);
    for (let col = 0; col <= 8; col++) {
      const angle = startAngle + col / 8 * (endAngle - startAngle);
      positions.push(Math.cos(angle) * Math.max(0.008,width - (inner ? 0.065 : 0)),top - (inner ? 0.04 : 0) - Math.pow(Math.sin(angle),0.76) * (top - keel - (inner ? 0.09 : 0)),z);
      uv.push(row / 64,angle / Math.PI * 3);
      if (row < 64 && col < 8) { const a = row * 9 + col; indices.push(a,a + 1,a + 9,a + 1,a + 10,a + 9); }
    }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute("position",new Float32BufferAttribute(positions,3)); geometry.setAttribute("uv",new Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
function sailGeometry(blue = false) {
  const positions = [], uv = [], indices = [];
  const rows = 24, cols = 14;
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= cols; col++) {
    const u = col / cols, v = row / rows;
    positions.push((blue ? 1 : -1) * u * (blue ? 1.24 : 1.56) * (1 - v * 0.99),v * (blue ? 2.9 : 3.16),Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * (blue ? -0.13 : 0.23));
    uv.push(u,v); if (row < rows && col < cols) { const a = row * (cols + 1) + col; indices.push(a,a + cols + 1,a + 1,a + 1,a + cols + 1,a + cols + 2); }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute("position",new Float32BufferAttribute(positions,3)); geometry.setAttribute("uv",new Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
const box = (size,at) => new BoxGeometry(...size).translate(...at);
const rod = (a,b,radius = 0.015) => new TubeGeometry(new CatmullRomCurve3([new Vector3(...a),new Vector3(...b)]),1,radius,5,false);
function rope(a,b,radius = 0.01) {
  const middle = new Vector3(...a).lerp(new Vector3(...b),0.5); middle.y -= 0.05;
  return new TubeGeometry(new CatmullRomCurve3([new Vector3(...a),middle,new Vector3(...b)]),12,radius,5,false);
}
const merge = (parts) => mergeGeometries(parts.map((geometry) => geometry.index ? geometry.toNonIndexed() : geometry));

export function buildExplorerBoat() {
  const root = new Group(); root.name = "YouthVerse_Explorer";
  root.userData = { authoring: "Original procedural Three.js geometry", version: 3, bowAxis: "+Z", replacement: "/models/youthverse-explorer.glb" };
  const wood = ["#a67849","#a17a50","#b38b5b","#976e43"].map((color,i) => { const m = new MeshStandardMaterial({color,roughness:0.78}); m.name = "Wood_" + i; return m; });
  const dark = new MeshStandardMaterial({color:"#604631",roughness:0.85,side:DoubleSide}); dark.name = "Wood_Dark";
  const brass = new MeshStandardMaterial({color:"#c5ad72",metalness:0.7,roughness:0.33}); brass.name = "Brass_Hardware";
  const navy = new MeshStandardMaterial({color:"#254c61",roughness:0.6}); navy.name = "Ocean_Trim";
  const ropeMat = new MeshStandardMaterial({color:"#d6c5a2",roughness:1}); ropeMat.name = "Rope_Hemp";
  const white = new MeshStandardMaterial({color:"#fff7df",roughness:0.93,side:DoubleSide}); white.name = "Ivory_Fabric";
  const blue = new MeshStandardMaterial({color:"#285f7c",roughness:0.92,side:DoubleSide}); blue.name = "Blue_Fabric";
  const ink = new MeshStandardMaterial({transparent:true,roughness:0.95}); ink.name = "Sail_Mark";
  const add = (name,geometry,material,parent = root) => { const mesh = new Mesh(mergeVertices(geometry,0.00001),material); mesh.name = name; mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  add("Hull_Inner_Shell",hullSurface(0,Math.PI,true),dark);
  add("Hull_Seam_Backing",hullSurface(0,Math.PI),dark);
  for (let color = 0; color < 4; color++) {
    const parts = []; for (let strake = color; strake < 8; strake += 4) parts.push(hullSurface(strake / 8 * Math.PI + 0.004,(strake + 1) / 8 * Math.PI - 0.004));
    add("Hull_Planks_" + color,merge(parts),wood[color]);
  }
  const deckParts = [[],[],[]];
  for (let plank = -10; plank <= 10; plank++) {
    const x = plank * 0.057; let min = 2, max = -2;
    for (let i = 0; i <= 100; i++) { const z = -1.48 + i / 100 * 3.1; if (hullSection(z)[1] > Math.abs(x) + 0.065) { min = Math.min(min,z); max = Math.max(max,z); } }
    if (max > min) deckParts[(plank + 12) % 3].push(box([0.052,0.035,max - min],[x,0.285,(min + max) / 2]));
  }
  deckParts.forEach((parts,i) => add("Deck_Planks_" + i,merge(parts),wood[(i + 1) % 4]));
  const transom = new Shape(); transom.moveTo(-0.32,0.6).lineTo(0.32,0.6).lineTo(0.26,0.12).quadraticCurveTo(0,-0.09,-0.26,0.12).closePath();
  add("Stern_Transom",new ExtrudeGeometry(transom,{depth:0.07,bevelEnabled:true,bevelSize:0.015,bevelThickness:0.01,bevelSegments:1,curveSegments:12}).translate(0,0,-1.53),wood[1]);
  const rimPoints = [];
  for (let i = 0; i <= 40; i++) { const [z,w,top] = hullSection(-1.5 + i / 40 * 3.2); rimPoints.push(new Vector3(-w,top + 0.015,z)); }
  for (let i = 40; i >= 0; i--) { const [z,w,top] = hullSection(-1.5 + i / 40 * 3.2); rimPoints.push(new Vector3(w,top + 0.015,z)); }
  add("Gunwale_Thick_Timber_Rim",new TubeGeometry(new CatmullRomCurve3(rimPoints,true),128,0.038,6,true),wood[2]);
  const trims = [];
  for (const side of [-1,1]) {
    const points = [];
    for (let i = 0; i <= 40; i++) { const [z,w,top,keel] = hullSection(-1.48 + i / 40 * 3.15); points.push(new Vector3(side * w * 0.96,top - (top - keel) * 0.21,z)); }
    trims.push(new TubeGeometry(new CatmullRomCurve3(points),64,0.027,5,false));
  }
  add("Navy_Hull_Trim",merge(trims),navy);
  const keel = new Shape(); keel.moveTo(1.3,-0.03).lineTo(0.5,-0.5).quadraticCurveTo(-0.4,-0.78,-1.2,-0.2).lineTo(-1.5,0.2).lineTo(-1.2,0.25).lineTo(0.8,-0.15).closePath();
  add("Keel",new ExtrudeGeometry(keel,{depth:0.08,bevelEnabled:false,curveSegments:16}).rotateY(Math.PI / 2).translate(-0.04,0,0),dark);
  add("Mast",new CylinderGeometry(0.025,0.052,3.65,12).translate(0,2.13,0.1),wood[2]);
  add("Bowsprit",rod([0,0.65,1.3],[0,0.74,1.98],0.035),wood[2]);
  const rig = new Group(); rig.name = "SailRig"; rig.position.set(0,0.71,0.1); root.add(rig);
  add("MainSail",sailGeometry(false),white,rig); add("JibSail",sailGeometry(true),blue,rig);
  add("Boom",rod([0,0,0],[-1.65,0.03,0],0.027),wood[2],rig);
  add("Gaff_Support",rod([0,2.93,0],[-0.32,2.91,0],0.018),wood[1],rig);
  for (const side of [-1,1]) { const mark = add(side === 1 ? "SailMarkFront" : "SailMarkBack",new PlaneGeometry(0.64,0.48),ink,rig); mark.position.set(-0.48,0.73,side === 1 ? 0.24 : -0.02); if (side === -1) mark.rotation.y = Math.PI; }
  const rigging = [rope([0,3.9,0.1],[0,0.74,1.98]),rope([0,3.9,0.1],[0,0.6,-1.45])];
  for (const side of [-1,1]) { rigging.push(rope([0,3.6,0.1],[side * 0.61,0.46,-0.15])); rigging.push(rope([-1.5,0.74,0.1],[side * 0.48,0.39,-0.78])); }
  add("Standing_And_Running_Rigging",merge(rigging),ropeMat);
  const rails = [], hardware = [];
  for (const side of [-1,1]) {
    const guard = [];
    for (const z of [-1.1,-0.6,0,0.55,1.1]) { const [,w,top] = hullSection(z); const x = side * w; rails.push(rod([x,top,z],[x,top + 0.19,z],0.012)); hardware.push(new TorusGeometry(0.026,0.007,4,10).translate(x,top + 0.19,z)); guard.push(new Vector3(x,top + 0.19,z)); }
    rails.push(new TubeGeometry(new CatmullRomCurve3(guard),32,0.009,4,false));
  }
  add("Guard_Rails_And_Lifelines",merge(rails),ropeMat);
  for (const x of [-0.42,0.42]) for (const z of [-0.85,0.85]) { hardware.push(box([0.11,0.025,0.025],[x,0.43,z])); hardware.push(box([0.022,0.07,0.022],[x,0.4,z])); }
  add("Cleats_And_Attachment_Hardware",merge(hardware),brass);
  const hatch = [box([0.48,0.055,0.6],[0,0.33,-0.25])];
  for (let i = 0; i < 6; i++) hatch.push(box([0.4,0.025,0.045],[0,0.37,-0.49 + i * 0.09]));
  add("Deck_Hatch",merge(hatch),wood[0]);
  const wheel = new Group(); wheel.name = "Wheel"; wheel.position.set(0,0.75,-1.05); wheel.rotation.x = -0.25; root.add(wheel);
  add("Wheel_Rim",new TorusGeometry(0.15,0.018,6,28),wood[1],wheel);
  const spokes = []; for (let i = 0; i < 8; i++) spokes.push(rod([0,0,0],[Math.cos(i / 8 * Math.PI * 2) * 0.19,Math.sin(i / 8 * Math.PI * 2) * 0.19,0],0.009));
  add("Wheel_Spokes",merge(spokes),brass,wheel);
  add("Wheel_Pedestal",new CylinderGeometry(0.025,0.045,0.36,8).translate(0,0.49,-1.02),wood[1]);
  const coil = []; for (let i = 0; i < 4; i++) coil.push(new TorusGeometry(0.085 + i * 0.018,0.009,5,28).rotateX(Math.PI / 2).translate(0.36,0.32 + i * 0.004,-0.57));
  add("Rope_Coil",merge(coil),ropeMat);
  const crate = [box([0.26,0.25,0.24],[-0.31,0.43,-0.85])]; for (let i = 0; i < 3; i++) crate.push(box([0.28,0.018,0.26],[-0.31,0.33 + i * 0.1,-0.85]));
  add("Storage_Crate",merge(crate),wood[1]);
  const pennant = new BufferGeometry(); pennant.setAttribute("position",new Float32BufferAttribute([0,0,0,0.36,-0.07,0,0,-0.15,0],3)); pennant.setAttribute("uv",new Float32BufferAttribute([0,1,1,0.5,0,0],2)); pennant.computeVertexNormals();
  add("Mast_Pennant",pennant,white).position.set(0,3.98,0.1);
  root.updateMatrixWorld(true); return root;
}
