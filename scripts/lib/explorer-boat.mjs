import { BoxGeometry, BufferGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial,  Shape, ExtrudeGeometry, TorusGeometry, TubeGeometry, Vector3 } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const sections = [[-1.5,.34,.6,-.04],[-1.12,.55,.47,-.25],[-.4,.67,.41,-.43],[.43,.62,.45,-.4],[1.18,.35,.59,-.1],[1.7,.018,.76,.62]];
function profileSlope(i,axis) {
  const slope = j => (sections[j + 1][axis] - sections[j][axis]) / (sections[j + 1][0] - sections[j][0]);
  if(i === 0) return slope(0);if(i === sections.length - 1) return slope(i - 1);
  const a = slope(i - 1),b = slope(i);return a * b <= 0 ? 0 : 2 * a * b / (a + b);
}
function hullSection(z) {
  let index = 0; while (index < sections.length - 2 && sections[index + 1][0] < z) index++;
  const a = sections[index], b = sections[index + 1],span = b[0] - a[0],t = Math.max(0,Math.min(1,(z - a[0]) / span));
  // Monotone Hermite sections preserve a fair sheer line instead of stopping its tangent at every station.
  return [z,...[1,2,3].map(axis => (2 * t ** 3 - 3 * t * t + 1) * a[axis] + (t ** 3 - 2 * t * t + t) * span * profileSlope(index,axis) + (-2 * t ** 3 + 3 * t * t) * b[axis] + (t ** 3 - t * t) * span * profileSlope(index + 1,axis))];
}
function hullSurface(startAngle, endAngle, inner = false) {
  const positions = [], uv = [], indices = [];
  const rows = 48,cols = 6;
  for (let row = 0; row <= rows; row++) {
    const [z,width,top,keel] = hullSection(-1.5 + row / rows * 3.2);
    for (let col = 0; col <= cols; col++) {
      const angle = startAngle + col / cols * (endAngle - startAngle);
      positions.push(Math.cos(angle) * Math.max(0.008,width - (inner ? 0.065 : 0)),top - (inner ? 0.04 : 0) - Math.pow(Math.sin(angle),0.76) * (top - keel - (inner ? 0.09 : 0)),z);
      uv.push(row / rows,angle / Math.PI * 3);
      // The old outward shell had inward-facing normals, showing only the dark backing from outside.
      if (row < rows && col < cols) { const a = row * (cols + 1) + col; const triangles = [a,a + cols + 1,a + 1,a + 1,a + cols + 1,a + cols + 2]; if(inner) for(let t = 0;t < 6;t += 3) indices.push(triangles[t],triangles[t + 2],triangles[t + 1]); else indices.push(...triangles); }
    }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute("position",new Float32BufferAttribute(positions,3)); geometry.setAttribute("uv",new Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
function sailPoint(blue,u,v) {
  return [(blue ? 1 : -1) * u * (blue ? 1.24 : 1.56) * (1 - v * .99),v * (blue ? 2.9 : 3.16),Math.sin(u * Math.PI) * Math.pow(Math.sin(v * Math.PI),.85) * (blue ? -.23 : .38)];
}
function sailGeometry(blue = false) {
  const positions = [], uv = [], indices = [];
  const rows = 24, cols = 14;
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= cols; col++) {
    const u = col / cols, v = row / rows;
    positions.push(...sailPoint(blue,u,v));
    uv.push(u,v); if (row < rows && col < cols) { const a = row * (cols + 1) + col; indices.push(a,a + cols + 1,a + 1,a + 1,a + cols + 1,a + cols + 2); }
  }
  const geometry = new BufferGeometry(); geometry.setAttribute("position",new Float32BufferAttribute(positions,3)); geometry.setAttribute("uv",new Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
function sailMarkGeometry(side) {
  const p = [],uv = [],indices = [],cols = 12,rows = 8;
  for(let y = 0;y <= rows;y++) for(let x = 0;x <= cols;x++) {
    const px = -.81 + x / cols * .65,py = .48 + y / rows * .53,v = py / 3.16,u = -px / (1.56 * (1 - v * .99));
    const point = sailPoint(false,u,v);point[2] += side * .006;p.push(...point);uv.push(side > 0 ? x / cols : 1 - x / cols,y / rows);
    if(y < rows && x < cols){const a = y * (cols + 1) + x;indices.push(a,a + 1,a + cols + 1,a + 1,a + cols + 2,a + cols + 1);}
  }
  if(side < 0) for(let i = 0;i < indices.length;i += 3) [indices[i + 1],indices[i + 2]] = [indices[i + 2],indices[i + 1]];
  const g = new BufferGeometry();g.setAttribute("position",new Float32BufferAttribute(p,3));g.setAttribute("uv",new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
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
  root.userData = { authoring: "Original procedural Three.js geometry", version: 4, bowAxis: "+Z", replacement: "/models/youthverse-explorer.glb" };
  const wood = ["#b38b58","#b99564","#c29b69","#997345"].map((color,i) => { const m = new MeshStandardMaterial({color,roughness:.71 + i * .025}); m.name = "Wood_" + i; return m; });
  const dark = new MeshStandardMaterial({color:"#604631",roughness:0.85,side:DoubleSide}); dark.name = "Wood_Dark";
  const brass = new MeshStandardMaterial({color:"#c5ad72",metalness:0.7,roughness:0.33}); brass.name = "Brass_Hardware";
  const navy = new MeshStandardMaterial({color:"#254c61",roughness:0.6}); navy.name = "Ocean_Trim";
  const ropeMat = new MeshStandardMaterial({color:"#d6c5a2",roughness:1}); ropeMat.name = "Rope_Hemp";
  const white = new MeshStandardMaterial({color:"#fff7df",roughness:0.93,side:DoubleSide}); white.name = "Ivory_Fabric";
  const blue = new MeshStandardMaterial({color:"#285f7c",roughness:0.92,side:DoubleSide}); blue.name = "Blue_Fabric";
  const ink = new MeshStandardMaterial({transparent:true,roughness:0.95}); ink.name = "Sail_Mark";
  const binding = new MeshStandardMaterial({color:"#c8bb9c",roughness:1});binding.name = "Sail_Stitched_Binding";
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
  const transom = new Shape(); transom.moveTo(-.34,.6).lineTo(.34,.6).lineTo(.26,.12).quadraticCurveTo(0,-.09,-.26,.12).closePath();
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
  for (const side of [-1,1]) add(side === 1 ? "SailMarkFront" : "SailMarkBack",sailMarkGeometry(side),ink,rig);
  const seams = [];
  for(const blueSail of [false,true]) {
    for(const v of [.16,.34,.52,.7,.86]) seams.push(new TubeGeometry(new CatmullRomCurve3(Array.from({length:17},(_,i) => new Vector3(...sailPoint(blueSail,i / 16,v)))),16,.006,4,false));
    for(const u of [0,1]) seams.push(new TubeGeometry(new CatmullRomCurve3(Array.from({length:25},(_,i) => new Vector3(...sailPoint(blueSail,u,i / 24)))),24,.012,5,false));
  }
  add("Sewn_Sail_Panels_And_Edge_Binding",merge(seams),binding,rig);
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
  const fittings = [],joinery = [];
  for(const y of [.48,.88,1.58,2.44,3.48]) fittings.push(new TorusGeometry(y < .6 ? .066 : .036,.01,5,12).rotateX(Math.PI / 2).translate(0,y,.1));
  for(const side of [-1,1]) {
    joinery.push(box([.16,.055,.82],[side * .39,.36,-.81]));
    for(let j = 0;j < 4;j++) fittings.push(new CylinderGeometry(.013,.018,.095,6).translate(side * .45,.46,-.35 + j * .09));
  }
  add("Stern_Bench_Joinery",merge(joinery),wood[2]);add("Mast_Collars_And_Belaying_Pins",merge(fittings),brass);
  const seamsHull = [];
  for(const side of [-1,1]) for(let band = 0;band < 6;band++) {
    const z = -.95 + band % 3 * .67,[,w,top,keel] = hullSection(z),angle = (side === 1 ? band / 14 + .03 : 1 - band / 14 - .03) * Math.PI;
    const points = [angle,angle + (side === 1 ? .1 : -.1)].map(a => new Vector3(Math.cos(a) * (w + .003),top - Math.pow(Math.sin(a),.76) * (top - keel),z));
    seamsHull.push(new TubeGeometry(new CatmullRomCurve3(points),2,.006,4,false));
  }
  add("Staggered_Carvel_Plank_Joints",merge(seamsHull),dark);
  add("Stern_Lantern_Frame",merge([box([.11,.14,.1],[-.28,.89,-1.29]),new TorusGeometry(.04,.009,5,12).translate(-.28,1,-1.29)]),brass);
  add("Stern_Lantern_Glass",box([.076,.08,.105],[-.28,.89,-1.29]),white);
  const pennant = new BufferGeometry(); pennant.setAttribute("position",new Float32BufferAttribute([0,0,0,0.36,-0.07,0,0,-0.15,0],3)); pennant.setAttribute("uv",new Float32BufferAttribute([0,1,1,0.5,0,0],2)); pennant.computeVertexNormals();
  add("Mast_Pennant",pennant,white).position.set(0,3.98,0.1);
  root.updateMatrixWorld(true); return root;
}
