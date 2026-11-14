import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// Minimal monochrome blockout: only the 3D skatepark and skateboard are shown.
const mount = document.getElementById('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91d9f2);
scene.fog = new THREE.Fog(0x91d9f2, 58, 150);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 180);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false });
} catch (error) {
  const panel = document.getElementById('load-error');
  panel.textContent = 'This browser could not create a WebGL graphics context. Try enabling hardware acceleration or updating iOS. Details: ' + (error.message || error);
  panel.style.display = 'grid';
  throw error;
}
let renderPixelRatio = Math.min(devicePixelRatio || 1, 2);
renderer.setPixelRatio(renderPixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x7b927e, 2.15));
const keyLight = new THREE.DirectionalLight(0xfff2d2, 3.0);
keyLight.position.set(-12, 22, -10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -42;
keyLight.shadow.camera.right = 42;
keyLight.shadow.camera.top = 42;
keyLight.shadow.camera.bottom = -42;
keyLight.shadow.bias = -0.00025;
scene.add(keyLight);

// Light, repeatable painted-concrete texture made locally on a tiny canvas.
function makePaintTexture(base, flecks, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  let seed = 918273;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Visible aggregate, sand grains and irregular mottling like poured skatepark concrete.
  for (let i = 0; i < 5200; i++) {
    const r = 0.45 + random() * 3.4;
    ctx.globalAlpha = 0.16 + random() * 0.34;
    ctx.fillStyle = flecks[Math.floor(random() * flecks.length)];
    ctx.beginPath(); ctx.arc(random() * size, random() * size, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 95; i++) {
    const x = random() * size, y = random() * size;
    ctx.globalAlpha = 0.035 + random() * 0.07;
    ctx.strokeStyle = random() > 0.5 ? '#713d28' : '#ffd09a';
    ctx.lineWidth = 1 + random() * 3;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (random() - 0.5) * 28, y + (random() - 0.5) * 22, x + (random() - 0.5) * 54, y + (random() - 0.5) * 40);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.anisotropy = 8;
  return texture;
}
const concreteTexture = makePaintTexture('#c87943', ['#e5a06a','#a95832','#d98b54','#f0b47a','#8f4e30','#f5c08a'], 512);
const asphaltTexture = makePaintTexture('#c87943', ['#e5a06a','#a95832','#d98b54','#f0b47a','#8f4e30','#f5c08a'], 512);
function makeDeckArtwork(top = false) {
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d');
  const purple='#514078', deepPurple='#302747', silver='#aeb3c1', paleSilver='#d8dbe1', green='#4f9b65', darkGreen='#244d38';
  ctx.fillStyle=purple;ctx.fillRect(0,0,2048,1024);
  // Subtle metallic grain gives the painted deck depth without looking chrome-plated.
  let seed=74291;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<5600;i++){const x=rnd()*2048,y=rnd()*1024;ctx.globalAlpha=.08+rnd()*.16;ctx.fillStyle=i%3===0?paleSilver:(i%2?silver:deepPurple);ctx.fillRect(x,y,1+rnd()*3,1+rnd()*2);}
  ctx.globalAlpha=1;
  // Worn clear-coat and chipped purple paint around both truck bolt patterns and ends.
  function scratchCluster(cx,cy,spreadX,spreadY,count){
    for(let i=0;i<count;i++){const x=cx+(rnd()-.5)*spreadX,y=cy+(rnd()-.5)*spreadY;const len=3+rnd()*22;
      ctx.strokeStyle=rnd()>.42?paleSilver:'#241f31';ctx.globalAlpha=.28+rnd()*.48;ctx.lineWidth=.8+rnd()*2.2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len,y+(rnd()-.5)*5);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  if(top){
    // Centred hand-illustrated skull with a living green serpent coiling around it.
    ctx.save();ctx.translate(1024,512);
    ctx.fillStyle='#d9d7d0';ctx.strokeStyle='#252633';ctx.lineWidth=20;
    ctx.beginPath();ctx.moveTo(-155,-170);ctx.quadraticCurveTo(-205,-310,-55,-330);ctx.quadraticCurveTo(110,-370,175,-220);ctx.quadraticCurveTo(225,-95,145,25);ctx.lineTo(95,145);ctx.lineTo(-95,145);ctx.lineTo(-160,20);ctx.quadraticCurveTo(-220,-70,-155,-170);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#302b3b';ctx.beginPath();ctx.ellipse(-78,-75,47,61,-.2,0,Math.PI*2);ctx.ellipse(78,-75,47,61,.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(-24,22);ctx.lineTo(0,-5);ctx.lineTo(24,22);ctx.lineTo(0,48);ctx.closePath();ctx.fill();
    ctx.fillStyle='#514078';for(let j=0;j<6;j++){ctx.fillRect(-75+j*30,105,18,54);}
    ctx.strokeStyle='#252633';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(-112,165);ctx.lineTo(112,165);ctx.stroke();
    // Serpent coils sweep around the skull in a bold S-shaped wrap.
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=darkGreen;ctx.lineWidth=92;ctx.beginPath();ctx.moveTo(-410,-255);ctx.bezierCurveTo(-280,-430,35,-410,210,-255);ctx.bezierCurveTo(390,-95,330,110,110,165);ctx.bezierCurveTo(-90,215,-300,85,-270,-65);ctx.bezierCurveTo(-245,-190,-70,-205,65,-125);ctx.stroke();
    ctx.strokeStyle=green;ctx.lineWidth=65;ctx.beginPath();ctx.moveTo(-410,-255);ctx.bezierCurveTo(-280,-430,35,-410,210,-255);ctx.bezierCurveTo(390,-95,330,110,110,165);ctx.bezierCurveTo(-90,215,-300,85,-270,-65);ctx.bezierCurveTo(-245,-190,-70,-205,65,-125);ctx.stroke();
    // Head and tapered tail, deliberately kept inside the deck silhouette.
    ctx.fillStyle=green;ctx.beginPath();ctx.moveTo(-410,-255);ctx.quadraticCurveTo(-475,-310,-455,-370);ctx.quadraticCurveTo(-390,-350,-350,-300);ctx.quadraticCurveTo(-380,-260,-410,-255);ctx.fill();
    ctx.fillStyle='#d8e7b9';ctx.beginPath();ctx.ellipse(-420,-307,8,13,-.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#d8e7b9';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-435,-340);ctx.lineTo(-450,-363);ctx.moveTo(-405,-344);ctx.lineTo(-410,-370);ctx.stroke();
    ctx.strokeStyle=darkGreen;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(65,-125);ctx.quadraticCurveTo(155,-70,250,-15);ctx.stroke();
    ctx.restore();
    ctx.fillStyle=paleSilver;ctx.font='900 48px Georgia';ctx.textAlign='center';ctx.fillText('SERPENT SOCIETY',1024,82);
    ctx.fillStyle='#d8d1e8';ctx.font='bold 27px Arial';ctx.fillText('PURPLE HAZE • DECK SERIES',1024,958);
    scratchCluster(160,210,230,250,110);scratchCluster(1888,210,230,250,110);
    scratchCluster(90,500,120,430,80);scratchCluster(1958,500,120,430,80);
  } else {
    // Underside: restrained metallic silver pinstripes and matching worn ends.
    ctx.strokeStyle='#aeb3c188';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(220,170);ctx.bezierCurveTo(620,60,1428,60,1828,170);ctx.stroke();
    ctx.beginPath();ctx.moveTo(220,854);ctx.bezierCurveTo(620,964,1428,964,1828,854);ctx.stroke();
    scratchCluster(210,240,250,260,130);scratchCluster(1838,240,250,260,130);
    scratchCluster(210,780,250,260,130);scratchCluster(1838,780,250,260,130);
  }
  // Bolt-area paint wear: four small clusters around each truck, visible from either side.
  for(const x of [640,1408])for(const y of [400,624])scratchCluster(x,y,74,72,22);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
const boardGraphicTexture=makeDeckArtwork(false);
const deckTopGraphicTexture=makeDeckArtwork(true);
const mats = {
  floor: new THREE.MeshStandardMaterial({ color: 0xffffff, map: asphaltTexture, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, roughness: 0.96 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x45413d, roughness: 0.92 }),
  board: new THREE.MeshStandardMaterial({ color: 0xffffff, map: boardGraphicTexture, metalness: 0.2, roughness: 0.42 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x263447, roughness: 1 }),
  metal: new THREE.MeshPhysicalMaterial({ color: 0xe0e5eb, metalness: 0.72, roughness: 0.19, clearcoat: 0.85, clearcoatRoughness: 0.12 }),
  outline: new THREE.LineBasicMaterial({ color: 0x40556a }),
  accentMint: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, roughness: 0.96 }),
  accentCoral: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, roughness: 0.96 }),
  accentLavender: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, roughness: 0.96 }),
  wheel: new THREE.MeshStandardMaterial({ color: 0xf7f4e9, roughness: 0.72 }),
  wheelBlack: new THREE.MeshStandardMaterial({ color: 0x17221f, roughness: 0.58 }),
  wheelGreen: new THREE.MeshStandardMaterial({ color: 0x36b77d, roughness: 0.58 })
};

const solidObstacles = [];
const grindRails = [];
const grindEdges = [];
function addGrindEdge(start, end, y, kind = 'ledge') {
  const a = new THREE.Vector3(start.x, y, start.z);
  const b = new THREE.Vector3(end.x, y, end.z);
  const delta = b.clone().sub(a);
  const length = delta.length();
  if (length < 0.35) return null;
  const target = { start: a, end: b, tangent: delta.normalize(), length, kind, center: a.clone().add(b).multiplyScalar(0.5), y };
  grindEdges.push(target);
  return target;
}

function outlinedBox(parent, w, h, d, mat, x, y, z) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  if (w < 90) solidObstacles.push(mesh);
  if (w >= 4.5 && d >= 1 && w < 90) {
    const surface = new THREE.Group();
    surface.position.set(x, y + h / 2, z);
    parent.add(surface);
    addSurfaceGrid(surface, w, d, 1, 0.012, 4);
  }
  return mesh;
}
function ramp(w, h, d, x, z, angle = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mats.accentMint);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, h / 2 - 0.02, z);
  mesh.rotation.z = angle;
  mesh.userData.isRamp = true;
  scene.add(mesh);
  // Ramps are supported by the terrain-height solver below, not by the
  // obstacle SAT solver. Treating the same ramp as both a terrain surface
  // and a solid box caused opposing corrections that launched/teleported
  // the board at the ramp surface.
  rampSurfaces.push({ w, h, d, x, z, angle });
  // A matching 1m grid on the ramp surface makes the obstacle's size and
  // orientation clear as the camera follows the skater.
  const surface = new THREE.Group();
  surface.position.copy(mesh.position);
  surface.rotation.copy(mesh.rotation);
  scene.add(surface);
  addSurfaceGrid(surface, w, d, 1, h / 2 + 0.012, 4);
}
function rail(x, z, length, height = 0.82) {
  const geometry = new THREE.CylinderGeometry(0.055, 0.055, length, 8);
  const rod = new THREE.Mesh(geometry, mats.metal);
  rod.rotation.x = Math.PI / 2;
  rod.position.set(x, height, z);
  rod.userData.isRail = true;
  rod.userData.railLength = length;
  scene.add(rod);
  solidObstacles.push(rod);
  grindRails.push(rod);
  addGrindEdge({ x, z: z - length / 2 }, { x, z: z + length / 2 }, height, 'rail');
  for (const offset of [-length / 2 + 0.18, length / 2 - 0.18]) {
    const support = outlinedBox(scene, 0.13, height, 0.13, mats.dark, x, height / 2, z + offset);
    support.userData.isRailSupport = true;
  }
}

// The bowl is a true cut-out in the concrete slab, not a bowl mesh buried
// beneath a flat floor. Its curved riding surface remains visible all the way down.
const bowl = { x: -18, z: 0, radiusX: 10.8, radiusZ: 9.2, depth: 2.8, flatRatio: 0.24 };
const quarterPipes = [];
const rampSurfaces = [];
const floorShape = new THREE.Shape();
floorShape.moveTo(-50, -50);
floorShape.lineTo(50, -50);
floorShape.lineTo(50, 50);
floorShape.lineTo(-50, 50);
floorShape.closePath();
const bowlOpening = new THREE.Path();
bowlOpening.absellipse(bowl.x, -bowl.z, bowl.radiusX, bowl.radiusZ, 0, Math.PI * 2, true, 0);
floorShape.holes.push(bowlOpening);
const parkFloor = new THREE.Mesh(
  new THREE.ExtrudeGeometry(floorShape, { depth: 0.45, bevelEnabled: false, curveSegments: 64 }),
  mats.floor
);
parkFloor.receiveShadow = true;
parkFloor.rotation.x = -Math.PI / 2;
parkFloor.position.y = -0.45;
scene.add(parkFloor);
function addSurfaceGrid(parent, width, depth, spacing, y = 0.012, majorEvery = 4) {
  const minor = [];
  const major = [];
  for (let x = -width / 2; x <= width / 2 + 0.001; x += spacing) {
    const target = Math.round((x + width / 2) / spacing) % majorEvery === 0 ? major : minor;
    target.push(x, y, -depth / 2, x, y, depth / 2);
  }
  for (let z = -depth / 2; z <= depth / 2 + 0.001; z += spacing) {
    const target = Math.round((z + depth / 2) / spacing) % majorEvery === 0 ? major : minor;
    target.push(-width / 2, y, z, width / 2, y, z);
  }
  for (const [points, color, opacity] of [
    [minor, 0x555555, 0.48],
    [major, 0x858585, 0.78]
  ]) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color, transparent: true, opacity, depthWrite: false
    }));
    parent.add(lines);
  }
}
// No debug grid on the riding surface: keep the park clean and skate-realistic.

// New park layout: a dedicated in-ground bowl on the west side and a
// separate street/flow zone to the east. All dimensions are in metres.
function bowlHeightAt(x, z) {
  const nx = (x - bowl.x) / bowl.radiusX;
  const nz = (z - bowl.z) / bowl.radiusZ;
  const radius = Math.sqrt(nx * nx + nz * nz);
  if (radius >= 1) return 0;
  const t = THREE.MathUtils.clamp((radius - bowl.flatRatio) / (1 - bowl.flatRatio), 0, 1);
  return -bowl.depth * Math.cos(t * Math.PI / 2);
}

function buildBowl() {
  const rings = 36;
  const segments = 112;
  const positions = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring++) {
    const radius = ring / rings;
    const y = -bowl.depth * Math.cos(
      THREE.MathUtils.clamp((radius - bowl.flatRatio) / (1 - bowl.flatRatio), 0, 1) * Math.PI / 2
    );
    for (let segment = 0; segment <= segments; segment++) {
      const angle = segment / segments * Math.PI * 2;
      positions.push(
        bowl.x + Math.cos(angle) * bowl.radiusX * radius,
        y,
        bowl.z + Math.sin(angle) * bowl.radiusZ * radius
      );
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = ring * (segments + 1) + segment;
      const b = a + segments + 1;
      // Wind triangles upward so the bowl receives correct lighting.
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const surface = new THREE.Mesh(geometry, mats.concrete);
  surface.material.side = THREE.DoubleSide;
  surface.receiveShadow = true;
  scene.add(surface);

  // Continuous round steel coping follows the full elliptical lip.
  const rimPoints = [];
  for (let i = 0; i <= 160; i++) {
    const angle = i / 160 * Math.PI * 2;
    rimPoints.push(new THREE.Vector3(
      bowl.x + Math.cos(angle) * bowl.radiusX,
      0.035,
      bowl.z + Math.sin(angle) * bowl.radiusZ
    ));
  }
  const rimCurve = new THREE.CatmullRomCurve3(rimPoints, true, 'centripetal');
  const coping = new THREE.Mesh(
    new THREE.TubeGeometry(rimCurve, 192, 0.075, 10, true),
    mats.metal
  );
  scene.add(coping);
  // Divide the continuous bowl coping into overlapping grindable arcs. Each
  // arc is long enough to ride naturally while allowing the grind to follow
  // the elliptical lip rather than pretending it is one straight rail.
  for (let i = 0; i < 24; i++) {
    const a0 = i / 24 * Math.PI * 2;
    const a1 = (i + 1) / 24 * Math.PI * 2;
    const edge = addGrindEdge(
      { x: bowl.x + Math.cos(a0) * bowl.radiusX, z: bowl.z + Math.sin(a0) * bowl.radiusZ },
      { x: bowl.x + Math.cos(a1) * bowl.radiusX, z: bowl.z + Math.sin(a1) * bowl.radiusZ },
      0.035, 'coping'
    );
    edge.previous = i === 0 ? null : grindEdges[grindEdges.length - 2];
    if (edge.previous) edge.previous.next = edge;
    edge.next = i === 23 ? grindEdges[grindEdges.length - 24] : null;
  }

  // A clean, slightly raised concrete deck around the bowl gives riders
  // room to set up, drop in and approach the coping without crowding it.
  const deck = new THREE.Mesh(new THREE.RingGeometry(11.05, 11.65, 128), mats.concrete);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(bowl.x, 0.005, bowl.z);
  deck.scale.set(1, bowl.radiusZ / bowl.radiusX, 1);
  scene.add(deck);
}
buildBowl();

function addQuarterPipe(axis, startX, startZ, width, height, direction = 1) {
  const depth = height;
  const segments = 32;
  const acrossSegments = 24;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = depth * i / segments;
    const y = height - Math.sqrt(Math.max(0.0001, height * height - t * t));
    for (let j = 0; j <= acrossSegments; j++) {
      const across = (j / acrossSegments - 0.5) * width;
      if (axis === 'x') positions.push(startX + direction * t, y, startZ + across);
      else positions.push(startX + across, y, startZ + direction * t);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < acrossSegments; j++) {
      const a = i * (acrossSegments + 1) + j;
      const b = a + acrossSegments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const face = new THREE.Mesh(geometry, mats.accentCoral);
  face.material.side = THREE.DoubleSide;
  face.castShadow = true;
  face.receiveShadow = true;
  scene.add(face);
  const copingGeometry = new THREE.CylinderGeometry(0.075, 0.075, width, 12);
  const coping = new THREE.Mesh(copingGeometry, mats.metal);
  if (axis === 'x') {
    coping.rotation.z = Math.PI / 2;
    coping.position.set(startX + direction * depth, height, startZ);
  } else {
    coping.rotation.x = Math.PI / 2;
    coping.position.set(startX, height, startZ + direction * depth);
  }
  scene.add(coping);
  if (axis === 'x') addGrindEdge({ x: startX + direction * depth, z: startZ - width / 2 }, { x: startX + direction * depth, z: startZ + width / 2 }, height + 0.035, 'coping');
  else addGrindEdge({ x: startX - width / 2, z: startZ + direction * depth }, { x: startX + width / 2, z: startZ + direction * depth }, height + 0.035, 'coping');
  quarterPipes.push({ axis, startX, startZ, width, height, depth, direction });
}
function quarterPipeHeightAt(x, z) {
  let height = -Infinity;
  for (const qp of quarterPipes) {
    const across = qp.axis === 'x' ? z - qp.startZ : x - qp.startX;
    if (Math.abs(across) > qp.width / 2) continue;
    const distance = qp.axis === 'x'
      ? (x - qp.startX) * qp.direction
      : (z - qp.startZ) * qp.direction;
    if (distance < 0 || distance > qp.depth) continue;
    const y = qp.height - Math.sqrt(Math.max(0, qp.height * qp.height - distance * distance));
    height = Math.max(height, y);
  }
  return height;
}
function rampHeightAt(x, z) {
  let height = -Infinity;
  for (const ramp of rampSurfaces) {
    const c = Math.cos(ramp.angle);
    const sn = Math.sin(ramp.angle);
    // Invert the rotated top-face transform to find the point in the
    // ramp's own local footprint, then evaluate its exact inclined plane.
    const localX = ((x - ramp.x) + sn * ramp.h / 2) / c;
    const localZ = z - ramp.z;
    if (Math.abs(localX) > ramp.w / 2 || Math.abs(localZ) > ramp.d / 2) continue;
    const centerY = ramp.h / 2 - 0.02;
    const surfaceY = centerY + sn * localX + c * ramp.h / 2;
    height = Math.max(height, surfaceY);
  }
  return height;
}
function rampAngleAt(x, z) {
  let angle = 0;
  let highest = -Infinity;
  for (const ramp of rampSurfaces) {
    const c = Math.cos(ramp.angle);
    const sn = Math.sin(ramp.angle);
    const localX = ((x - ramp.x) + sn * ramp.h / 2) / c;
    const localZ = z - ramp.z;
    if (Math.abs(localX) > ramp.w / 2 || Math.abs(localZ) > ramp.d / 2) continue;
    const surfaceY = ramp.h / 2 - 0.02 + sn * localX + c * ramp.h / 2;
    if (surfaceY > highest) { highest = surfaceY; angle = ramp.angle; }
  }
  return angle;
}
function groundHeightAt(x, z) {
  const nx = (x - bowl.x) / bowl.radiusX;
  const nz = (z - bowl.z) / bowl.radiusZ;
  const insideBowl = nx * nx + nz * nz < 1;
  const bowlY = insideBowl ? bowlHeightAt(x, z) : 0;
  return Math.max(bowlY, quarterPipeHeightAt(x, z), rampHeightAt(x, z), insideBowl ? -Infinity : 0);
}
const groundContactPoint = new THREE.Vector3();
function groundContactCorrection() {
  // Use the four actual wheel contact points. Comparing the board's lowest
  // world-space bounding-box corner with terrain height at its centre makes
  // a board on a curved wall look deeply embedded, causing large snap-outs.
  let correction = -Infinity;
  for (const wheel of wheelMeshes) {
    wheel.getWorldPosition(groundContactPoint);
    const surfaceY = groundHeightAt(groundContactPoint.x, groundContactPoint.z);
    correction = Math.max(correction, surfaceY - (groundContactPoint.y - 0.145));
  }
  return Number.isFinite(correction) ? correction : 0;
}

// Street plaza: low, usable obstacles with clear run-ups and room to roll away.
function bench(x, z, length = 5.2) {
  const top = outlinedBox(scene, length, 0.18, 0.78, mats.accentCoral, x, 0.53, z);
  top.userData.grindSurface = true;
  const topY = 0.53 + 0.09;
  addGrindEdge({ x: x - length / 2, z: z - 0.39 }, { x: x + length / 2, z: z - 0.39 }, topY);
  addGrindEdge({ x: x - length / 2, z: z + 0.39 }, { x: x + length / 2, z: z + 0.39 }, topY);
  addGrindEdge({ x: x - length / 2, z: z - 0.39 }, { x: x - length / 2, z: z + 0.39 }, topY);
  addGrindEdge({ x: x + length / 2, z: z - 0.39 }, { x: x + length / 2, z: z + 0.39 }, topY);
  for (const offset of [-length * 0.34, length * 0.34]) {
    outlinedBox(scene, 0.16, 0.48, 0.58, mats.dark, x + offset, 0.24, z);
  }
}
bench(10, -12, 5.4);
bench(22, 12, 4.8);

// Flat bars and a low round rail, spaced apart so their approaches do not overlap.
rail(14, -7, 7.5, 0.62);
rail(23, -7, 7.5, 0.82);
rail(10, 8, 6.5, 0.58);

// A mellow funbox: central manual/grind deck with shallow banks at both ends.
const funboxDeck = outlinedBox(scene, 5.4, 0.52, 3.2, mats.concrete, 17, 0.26, 3);
funboxDeck.userData.grindSurface = true;
const funboxTop = 0.26 + 0.52 / 2;
for (const zEdge of [3 - 1.6, 3 + 1.6]) addGrindEdge({ x: 17 - 2.7, z: zEdge }, { x: 17 + 2.7, z: zEdge }, funboxTop);
for (const xEdge of [17 - 2.7, 17 + 2.7]) addGrindEdge({ x: xEdge, z: 3 - 1.6 }, { x: xEdge, z: 3 + 1.6 }, funboxTop);
ramp(4.2, 0.72, 3.2, 12.2, 0, 0.17);
ramp(4.2, 0.72, 3.2, 21.8, 3, -0.17);
const funboxRail = outlinedBox(scene, 4.8, 0.18, 0.72, mats.metal, 17, 0.61, 3);
funboxRail.userData.grindSurface = true;
addGrindEdge({ x: 14.6, z: 3 }, { x: 19.4, z: 3 }, 0.61 + 0.09, 'rail');

// Two smooth concrete quarter pipes with coping, one on each side of the plaza.
addQuarterPipe('x', 27, -8, 8.5, 2.15, 1);
addQuarterPipe('z', 15, 17, 8.5, 2.0, 1);

// Detailed skateboard model: rounded deck, grip surface, trucks and wheels.
const board = new THREE.Group();
scene.add(board);

const deckShape = new THREE.Shape();
deckShape.moveTo(-1.13, 0);
deckShape.bezierCurveTo(-1.13, 0.17, -1.00, 0.30, -0.78, 0.30);
deckShape.lineTo(0.78, 0.30);
deckShape.bezierCurveTo(1.00, 0.30, 1.13, 0.17, 1.13, 0);
deckShape.bezierCurveTo(1.13, -0.17, 1.00, -0.30, 0.78, -0.30);
deckShape.lineTo(-0.78, -0.30);
deckShape.bezierCurveTo(-1.00, -0.30, -1.13, -0.17, -1.13, 0);

const deckGeometry = new THREE.ExtrudeGeometry(deckShape, {
  depth: 0.10,
  bevelEnabled: true,
  bevelSegments: 5,
  steps: 1,
  bevelSize: 0.022,
  bevelThickness: 0.014,
  curveSegments: 24
});
deckGeometry.rotateX(Math.PI / 2);

// Gentle, even kick at the nose and tail; the deck subtly thins toward each tip.
function deckKick(x) {
  const t = THREE.MathUtils.clamp((Math.abs(x) - 0.62) / 0.51, 0, 1);
  const eased = t * t * (3 - 2 * t);
  return eased * 0.095;
}
function deckThicknessAt(x) {
  const t = THREE.MathUtils.clamp((Math.abs(x) - 0.62) / 0.51, 0, 1);
  const eased = t * t * (3 - 2 * t);
  return 1 - eased * 0.32;
}
function curveDeckGeometry(geometry, taperThickness = false) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const baseY = position.getY(i);
    const thickness = taperThickness ? deckThicknessAt(x) : 1;
    position.setY(i, baseY * thickness + deckKick(x));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}
curveDeckGeometry(deckGeometry, true);
const deck = new THREE.Mesh(deckGeometry, mats.board);
deck.position.y = 0.43;
board.add(deck);

// Build the painted top from the same outline as the deck, preserving its kick and shape.
function makeDeckTop(scaleX, scaleZ, material, yOffset, renderOrder) {
  const geometry = new THREE.ShapeGeometry(deckShape, 48);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) * scaleX);
    positions.setY(i, positions.getY(i) * scaleZ);
  }
  positions.needsUpdate = true;
  geometry.rotateX(Math.PI / 2);
  curveDeckGeometry(geometry);
  const uv = geometry.attributes.uv;
  const p = geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (p.getX(i) + 1.13) / 2.26, (0.34 - p.getZ(i)) / 0.68);
  }
  uv.needsUpdate = true;
  const surface = new THREE.Mesh(geometry, material);
  surface.position.y = deck.position.y + yOffset;
  surface.renderOrder = renderOrder;
  board.add(surface);
  return surface;
}

// The deck has no grip-tape layer: its purple painted top is fully exposed.
const deckTopMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: deckTopGraphicTexture,
  metalness: 0.12,
  roughness: 0.48,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  depthWrite: false
});
makeDeckTop(0.992, 0.985, deckTopMaterial, 0.009, 3);

// Trucks: base plates, hangers, axles and kingpins.
const wheelMeshes = [];
for (const x of [-0.69, 0.69]) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.25),
    mats.metal
  );
  base.position.set(x, 0.265, 0);
  board.add(base);

  const hanger = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.66, 12),
    mats.metal
  );
  hanger.rotation.x = Math.PI / 2;
  hanger.position.set(x, 0.205, 0);
  board.add(hanger);

  const kingpin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8),
    mats.dark
  );
  kingpin.position.set(x, 0.22, 0);
  board.add(kingpin);

  // Rounded white urethane wheels with black/green/black side graphics.
  for (const z of [-0.30, 0.30]) {
    const profile=[
      new THREE.Vector2(0.105,-0.060),new THREE.Vector2(0.132,-0.052),
      new THREE.Vector2(0.143,-0.035),new THREE.Vector2(0.146,0),
      new THREE.Vector2(0.143,0.035),new THREE.Vector2(0.132,0.052),
      new THREE.Vector2(0.105,0.060)
    ];
    const wheel=new THREE.Mesh(new THREE.LatheGeometry(profile,32),mats.wheel);
    wheel.rotation.x=Math.PI/2;wheel.position.set(x,0.17,z);board.add(wheel);wheelMeshes.push(wheel);
    for(const side of [-1,1]){
      const sideDisc=(radius,depth,material,offset)=>{
        const disc=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,32),material);
        disc.rotation.x=Math.PI/2;disc.position.set(x,0.17,z+side*offset);board.add(disc);
      };
      sideDisc(0.078,0.008,mats.wheelBlack,0.061);
      sideDisc(0.061,0.009,mats.wheelGreen,0.067);
      sideDisc(0.026,0.010,mats.wheelBlack,0.073);
    }
  }
}
board.position.set(0, 0, 1.5);
board.rotation.order = 'YXZ';

// Skate physics: horizontal momentum, push impulses, carving, pop and
// independent board rotation in the air. The board model's long axis is X.
const keys = new Set();
const velocity = new THREE.Vector3(0, 0, 0);
let speed = 0;
let heading = 0;
let airborne = false;
let verticalVelocity = 0;
let shuvitVelocity = 0;
let boardTouchHold = false;
let trickCaught = false;
let trickStance = false;
let shuvitRotation = 0;
let shuvitTarget = 0;
let grinding = false;
let grindRail = null;
let grindType = '';
let airTime = 0;
let bailTimer = 0;
let steerInput = 0;
let lastLandTime = -10;
const gravity = 13.5;
const maxSpeed = 13.125; // 25% higher top speed

function forwardVector() {
  return new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
}
// The control frame follows the direction of travel. When rolling backwards,
// screen-left/right and forward/back controls are mirrored with the camera.
let travelSign = 1;
function travelForwardVector() {
  return forwardVector().multiplyScalar(travelSign);
}
function screenTurnDirection(dx) {
  return (dx > 0 ? 1 : -1) * travelSign;
}
function push(power = 2.7) {
  if (airborne || bailTimer > 0) return;
  const forward = travelForwardVector();
  velocity.addScaledVector(forward, power);
  const current = velocity.length();
  if (current > maxSpeed) velocity.multiplyScalar(maxSpeed / current);
}
function pop(kind = 'ollie', flickSpeed = 650) {
  if (airborne || bailTimer > 0 || velocity.length() < 0.25) return;
  airborne = true;
  airTime = 0;
  // A sharper tail/nose flick transfers more impulse into the pop.
  // Pixel speed is normalized so gentle flicks stay controllable while
  // fast, deliberate flicks have enough height to clear park obstacles.
  const flickPower = THREE.MathUtils.clamp((flickSpeed - 220) / 1180, 0, 1);
  const popImpulse = 4.35 + flickPower * 3.35;
  verticalVelocity = popImpulse + Math.min(velocity.length() * 0.055, 0.55);
  trickCaught = false;
  trickStance = false;
  // A tail pop (ollie) and nose pop (nollie) use opposite deck-pitch impulses.
  board.rotation.x = 0;
  board.rotation.z = 0;
  grinding = false;
  grindRail = null;
}
function flick(direction, distance = 45, flickSpeed = 500, verticalDistance = 0, touchX = 0) {
  if (!airborne || airTime > 0.48) return;
  // Treat the finger as applying an impulse at the point it contacts the deck.
  // Faster, longer flicks add more angular momentum; touching nearer the nose
  // or tail gives the same force more leverage for a horizontal-axis shuvit.
  const fingerSpeed = THREE.MathUtils.clamp(flickSpeed / 900, 0.15, 2.4);
  const alongDeck = THREE.MathUtils.clamp(Math.abs(touchX) / 1.13, 0, 1);
  const yawLeverage = 0.72 + alongDeck * 0.58;
  if (distance > 20 && Math.abs(shuvitVelocity) < 0.1 && Math.abs(shuvitRotation) < 0.1) {
    const impulse = fingerSpeed * (2.7 + distance * 0.055) * yawLeverage;
    const spinSpeed = THREE.MathUtils.clamp(impulse * 3, 8.4, 40.5) * 0.75;
    shuvitTarget = direction; // non-zero marker: a shuvit impulse is active
    shuvitVelocity += direction * spinSpeed;
  }
  // Vertical flicks are reserved for ollies and nollies. Airborne flicks
  // only add shuvit rotation; no kickflip-style axis spin.
}
// Resolve contact using the complete skateboard model bounds, not just its centre.
// This includes the deck, trucks and wheels, so nose/tail/side impacts are detected.
// Oriented-box collision: each obstacle keeps its real rotation and dimensions,
// and the skateboard is tested using its own transformed model bounds.
const boardLocalBounds = new THREE.Box3();
const boardLocalCenter = new THREE.Vector3();
const boardHalfSize = new THREE.Vector3();
const obstacleHalfSize = new THREE.Vector3();
const boardWorldCenter = new THREE.Vector3();
const obstacleLocalBounds = new THREE.Box3();
const obstacleWorldCenter = new THREE.Vector3();
const satTranslation = new THREE.Vector3();
const boardAxes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const obstacleAxes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const satAxes = [];
for (let i = 0; i < 15; i++) satAxes.push(new THREE.Vector3());
const collisionNormal = new THREE.Vector3();
const boardWorldBounds = new THREE.Box3();
let contactObstacle = null;
const grindContactPoint = new THREE.Vector3();
const grindLocalPoint = new THREE.Vector3();
const grindReadout = document.createElement('div');
grindReadout.style.cssText = 'position:absolute;left:50%;top:12%;transform:translateX(-50%);color:white;font:600 14px Arial,sans-serif;letter-spacing:2px;text-shadow:0 1px 5px #000;pointer-events:none;display:none;z-index:5;';
mount.appendChild(grindReadout);
let groundedRampAngle = 0;
let groundedRampNormal = new THREE.Vector3(0, 1, 0);

function buildBoardLocalBounds() {
  boardLocalBounds.makeEmpty();
  board.updateMatrix();
  for (const child of board.children) {
    if (!child.isMesh || !child.geometry) continue;
    child.updateMatrix();
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    boardLocalBounds.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrix));
  }
  boardLocalBounds.getCenter(boardLocalCenter);
  boardLocalBounds.getSize(boardHalfSize).multiplyScalar(0.5);
  // A tiny margin includes soft wheel/deck edges without making the board
  // feel as though it has an invisible oversized collision shell.
  boardHalfSize.add(new THREE.Vector3(0.012, 0.012, 0.012));
}
buildBoardLocalBounds();

function getWorldObb(mesh, localBounds, center, axes, halfSize) {
  mesh.updateWorldMatrix(true, false);
  const e = mesh.matrixWorld.elements;
  axes[0].set(e[0], e[1], e[2]).normalize();
  axes[1].set(e[4], e[5], e[6]).normalize();
  axes[2].set(e[8], e[9], e[10]).normalize();
  localBounds.getCenter(center);
  center.applyMatrix4(mesh.matrixWorld);
  localBounds.getSize(halfSize).multiplyScalar(0.5);
}

function getObbContact() {
  board.updateMatrixWorld(true);
  const boardMatrix = board.matrixWorld;
  const be = boardMatrix.elements;
  boardAxes[0].set(be[0], be[1], be[2]).normalize();
  boardAxes[1].set(be[4], be[5], be[6]).normalize();
  boardAxes[2].set(be[8], be[9], be[10]).normalize();
  boardWorldCenter.copy(boardLocalCenter).applyMatrix4(boardMatrix);

  let bestOverlap = Infinity;
  let bestAxis = null;
  let bestObstacle = null;

  for (const obstacle of solidObstacles) {
    if (!obstacle.geometry) continue;
    if (!obstacle.geometry.boundingBox) obstacle.geometry.computeBoundingBox();
    getWorldObb(obstacle, obstacle.geometry.boundingBox, obstacleWorldCenter, obstacleAxes, obstacleHalfSize);
    satTranslation.subVectors(boardWorldCenter, obstacleWorldCenter);

    satAxes[0].copy(boardAxes[0]);
    satAxes[1].copy(boardAxes[1]);
    satAxes[2].copy(boardAxes[2]);
    satAxes[3].copy(obstacleAxes[0]);
    satAxes[4].copy(obstacleAxes[1]);
    satAxes[5].copy(obstacleAxes[2]);
    let axisIndex = 6;
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        satAxes[axisIndex++].crossVectors(boardAxes[a], obstacleAxes[b]);
      }
    }

    let separated = false;
    let localBest = Infinity;
    let localNormal = null;
    for (const axis of satAxes) {
      const lengthSq = axis.lengthSq();
      if (lengthSq < 1e-8) continue;
      axis.multiplyScalar(1 / Math.sqrt(lengthSq));

      const boardRadius =
        boardHalfSize.x * Math.abs(axis.dot(boardAxes[0])) +
        boardHalfSize.y * Math.abs(axis.dot(boardAxes[1])) +
        boardHalfSize.z * Math.abs(axis.dot(boardAxes[2]));
      const obstacleRadius =
        obstacleHalfSize.x * Math.abs(axis.dot(obstacleAxes[0])) +
        obstacleHalfSize.y * Math.abs(axis.dot(obstacleAxes[1])) +
        obstacleHalfSize.z * Math.abs(axis.dot(obstacleAxes[2]));
      const signedDistance = satTranslation.dot(axis);
      const overlap = boardRadius + obstacleRadius - Math.abs(signedDistance);
      if (overlap <= 0) {
        separated = true;
        break;
      }
      if (overlap < localBest) {
        localBest = overlap;
        localNormal = axis.clone().multiplyScalar(signedDistance >= 0 ? 1 : -1);
      }
    }

    if (!separated && localNormal && localBest < bestOverlap) {
      bestOverlap = localBest;
      bestAxis = localNormal;
      bestObstacle = obstacle;
    }
  }

  if (!bestAxis) {
    contactObstacle = null;
    return null;
  }
  collisionNormal.copy(bestAxis);
  contactObstacle = bestObstacle;
  return bestOverlap;
}

function tryStartGrind() {
  if (!airborne || verticalVelocity >= 0) return false;
  const speedNow = velocity.length();
  if (speedNow < 1.0) return false;
  const boardForward = forwardVector();
  for (const edge of grindEdges) {
    const relative = new THREE.Vector3(board.position.x - edge.start.x, 0, board.position.z - edge.start.z);
    const rawAlong = relative.dot(edge.tangent);
    const along = THREE.MathUtils.clamp(rawAlong, 0, edge.length);
    const closest = edge.start.clone().addScaledVector(edge.tangent, along);
    const lateral = Math.hypot(board.position.x - closest.x, board.position.z - closest.z);
    // The deck can bridge a rail/ledge even when its centre is not directly
    // over it. Allow the board's footprint plus a small landing tolerance.
    if (lateral > 1.02) continue;
    const targetY = edge.y - 0.416;
    if (board.position.y > targetY + 0.24 || board.position.y < targetY - 0.52) continue;
    const boardAlignment = Math.abs(boardForward.dot(edge.tangent));
    const velocityAlong = velocity.x * edge.tangent.x + velocity.z * edge.tangent.z;
    const velocityAcross = Math.abs(velocity.x * edge.tangent.z - velocity.z * edge.tangent.x);
    // Accept both a lengthwise grind and a perpendicular boardslide. The
    // approach can be across the rail; the landing redirects onto its length.
    board.position.set(closest.x, targetY, closest.z);
    board.updateMatrixWorld(true);
    grindContactPoint.set(closest.x, edge.y, closest.z);
    grindLocalPoint.copy(grindContactPoint);
    board.worldToLocal(grindLocalPoint);
    const parallel = boardAlignment > 0.72;
    const nearEnd = along < 0.75 || along > edge.length - 0.75;
    if (!parallel && nearEnd && speedNow < 1.5 && grindLocalPoint.x < -0.58) grindType = 'TAIL STALL';
    else if (!parallel && grindLocalPoint.x < -0.58) grindType = 'TAILSLIDE';
    else if (!parallel && grindLocalPoint.x > 0.58) grindType = 'NOSESLIDE';
    else if (!parallel) grindType = 'BOARDSLIDE';
    else if (Math.abs(grindLocalPoint.x) > 0.48) grindType = '5-0';
    else if (grindLocalPoint.z > 0.18) grindType = 'CROOKED';
    else if (grindLocalPoint.z < -0.18) grindType = 'SALAD';
    else grindType = '50-50';
    grinding = true;
    grindRail = edge;
    airborne = false;
    verticalVelocity = 0;
    let direction = Math.sign(velocityAlong);
    if (!direction) direction = Math.sign(boardForward.dot(edge.tangent) || travelSign || 1);
    const grindSpeed = Math.max(1.2, Math.abs(velocityAlong), speedNow * 0.42);
    velocity.set(edge.tangent.x * direction * grindSpeed, 0, edge.tangent.z * direction * grindSpeed);
    shuvitVelocity = 0;
    shuvitRotation = 0;
    shuvitTarget = 0;
    board.rotation.x = 0;
    board.rotation.z = 0;
    grindReadout.textContent = grindType;
    grindReadout.style.display = 'block';
    return true;
  }
  return false;
}
function resolveObstacleContacts() {
  groundedRampAngle = 0;
  groundedRampNormal.set(0, 1, 0);
  // Two passes resolve corners where the deck meets two surfaces at once.
  for (let pass = 0; pass < 2; pass++) {
    const penetration = getObbContact();
    if (penetration === null) break;
    if (grinding && (contactObstacle?.userData.isRail || contactObstacle?.userData.isRailSupport || contactObstacle?.userData.grindSurface)) break;

    const separation = penetration + 0.004;
    board.position.addScaledVector(collisionNormal, separation);

    const normalSpeed = velocity.x * collisionNormal.x +
      velocity.z * collisionNormal.z +
      verticalVelocity * collisionNormal.y;
    const impactSpeed = Math.abs(normalSpeed);
    const isTopContact = collisionNormal.y > 0.62;

    // A ramp is a rideable surface, not a wall. Record its slope so the
    // grounded board can follow it and use gravity along its surface.
    if (isTopContact && !airborne && contactObstacle?.userData.isRamp) {
      const rampNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(contactObstacle.quaternion).normalize();
      if (rampNormal.y > 0.62) {
        groundedRampNormal.copy(rampNormal);
        const boardAlongRamp = Math.abs(forwardVector().x);
        if (boardAlongRamp > 0.55) groundedRampAngle = contactObstacle.rotation.z;
      }
      // Remove only velocity entering the ramp; never bounce the grounded
      // board upward from its support surface.
      if (normalSpeed < 0) {
        velocity.addScaledVector(collisionNormal, -normalSpeed * collisionNormal.y);
      }
      verticalVelocity = 0;
      continue;
    }

    if (isTopContact && verticalVelocity < 0 && impactSpeed < 9) {
      const rotationSpeed = Math.abs(shuvitVelocity);
      const uprightLanding = Math.abs(board.rotation.x) < 0.48 &&
        Math.abs(board.rotation.z) < 0.48 &&
        (!shuvitTarget || Math.abs(Math.sin(shuvitRotation / 2)) < 0.34);
      const heldTrickLanding = trickCaught || (boardTouchHold && rotationSpeed < 1.35);
      if (airborne && rotationSpeed < 1.35 && (uprightLanding || heldTrickLanding)) {
        airborne = false;
        verticalVelocity = 0;
        trickStance = heldTrickLanding && !uprightLanding;
        // Keep residual angular velocity; the board should not freeze on impact.
              heading += shuvitRotation;
        shuvitRotation = 0;
        shuvitTarget = 0;
        manualActive = false;
        manualAngle = 0;
        lastLandTime = clock.elapsedTime;
      } else if (airborne) {
        resetBoard();
        break;
      }
    } else if (impactSpeed > 0.02) {
      const restitution = impactSpeed > 5.5 ? 0.12 : 0.22;
      const impulse = (1 + restitution) * normalSpeed;
      velocity.x -= impulse * collisionNormal.x;
      velocity.z -= impulse * collisionNormal.z;
      verticalVelocity -= impulse * collisionNormal.y;

      // Friction acts along the surface, not through the contact normal.
      const tangentDamping = impactSpeed > 5.5 ? 0.62 : 0.86;
      if (Math.abs(collisionNormal.x) > 0.2) velocity.z *= tangentDamping;
      if (Math.abs(collisionNormal.z) > 0.2) velocity.x *= tangentDamping;

      if (impactSpeed > 5.5) {
        resetBoard();
        break;
      }
    }
  }
}

function resetBoard() {
  boardTouchHold = false;
  trickCaught = false;
  trickStance = false;
  grinding = false;
  grindRail = null;
  grindReadout.style.display = 'none';
  board.position.y = 0;
  board.rotation.x = 0;
  board.rotation.z = 0;
  verticalVelocity = 0;
  shuvitVelocity = 0;
  shuvitRotation = 0;
  shuvitTarget = 0;
  airborne = false;
  bailTimer = 0.8;
  velocity.multiplyScalar(0.25);
}

// Touch gestures:
// - swipe down beside the board = push
// - quick upward flick in the lower-middle screen = pop
// - horizontal drag while grounded = carve/turn
// - horizontal flick while airborne = shuvit
let gesture = null;
let touchSteer = 0;
let manualActive = false;
let manualAngle = 0;
let manualSide = 1; // +1 = tail manual, -1 = nose manual
const canvas = renderer.domElement;
canvas.style.touchAction = 'none';

// Classify the gesture by where the finger first touches: the deck itself
// triggers ollies/nollies; the surrounding ground area is for pushing.
const touchRaycaster = new THREE.Raycaster();
const touchNdc = new THREE.Vector2();
function deckTouchLocalPoint(clientX, clientY) {
  touchNdc.set(
    (clientX / innerWidth) * 2 - 1,
    -(clientY / innerHeight) * 2 + 1
  );
  board.updateMatrixWorld(true);
  touchRaycaster.setFromCamera(touchNdc, camera);
  const hit = touchRaycaster.intersectObject(deck, false)[0];
  if (!hit) return null;
  return board.worldToLocal(hit.point.clone());
}
function deckTouchLocalX(clientX, clientY) {
  const point = deckTouchLocalPoint(clientX, clientY);
  return point ? point.x : null;
}
canvas.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  canvas.setPointerCapture?.(event.pointerId);
  gesture = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    dx: 0,
    dy: 0,
    lastMoveDx: 0,
    lastMoveDy: 0,
    lastMoveSpeed: 0,
    startTime: performance.now(),
    lastMoveTime: performance.now(),
    deckLocalX: deckTouchLocalX(event.clientX, event.clientY),
    deckLocalZ: (() => { const p = deckTouchLocalPoint(event.clientX, event.clientY); return p ? p.z : 0; })(),
    manualGesture: false,
    manualPopTriggered: false
  };
  boardTouchHold = airborne && gesture.deckLocalX !== null;
  touchSteer = 0;
});
canvas.addEventListener('pointermove', event => {
  if (!gesture || gesture.id !== event.pointerId) return;
  const moveTime = performance.now();
  const moveDx = event.clientX - gesture.lastX;
  const moveDy = event.clientY - gesture.lastY;
  const moveDuration = Math.max(1, moveTime - gesture.lastMoveTime);
  gesture.lastMoveDx = moveDx;
  gesture.lastMoveDy = moveDy;
  gesture.lastMoveSpeed = Math.hypot(moveDx, moveDy) / moveDuration * 1000;
  gesture.dx = event.clientX - gesture.x;
  gesture.dy = event.clientY - gesture.y;
  gesture.lastX = event.clientX;
  gesture.lastY = event.clientY;
  gesture.lastMoveTime = moveTime;
  // Keep manual detection forgiving: the finger can land anywhere on the
  // relevant half of the deck, including close to its centre.
  const tailSide = gesture.deckLocalX !== null && gesture.deckLocalX * travelSign < -0.04;
  const noseSide = gesture.deckLocalX !== null && gesture.deckLocalX * travelSign > 0.04;
  const pullingTail = tailSide && gesture.dy > 8;
  const pullingNose = noseSide && gesture.dy < -8;
  // A quick pop flick must never be reclassified as a manual. Manuals require
  // a sustained, controlled drag rather than merely crossing the old 180ms mark.
  if (!airborne && (pullingTail || pullingNose) && moveDuration > 0 &&
      moveTime - gesture.startTime > 420 && gesture.lastMoveSpeed < 700) {
    // Pull slowly away from the centre: down on the tail for a manual,
    // up/forward on the nose for a nose manual. Both use the same travel scale.
    gesture.manualGesture = true;
    manualActive = true;
    manualSide = pullingTail ? 1 : -1;
    manualAngle = manualSide * THREE.MathUtils.clamp((Math.abs(gesture.dy) - 12) / 125, 0, 0.48);
  }
  // A quick flick pops directly out of a manual: tail manual = ollie,
  // nose manual = nollie. The pop flick is separate from the slower manual pull.
  // Either pop can also be triggered while kickturning.
  const manualPopDirection = manualSide === 1 ? moveDy > 28 : moveDy < -28;
  if (!airborne && manualActive && gesture.manualGesture && !gesture.manualPopTriggered &&
      manualPopDirection && moveDuration <= 180 && moveTime - gesture.startTime > 500) {
    gesture.manualPopTriggered = true;
    gesture.manualGesture = true;
    manualActive = false;
    manualAngle = 0;
    touchSteer = 0;
    pop(manualSide === 1 ? 'ollie' : 'nollie', gesture.lastMoveSpeed || 650);
  }
  if (!airborne && manualActive && gesture.manualGesture && Math.abs(gesture.dx) > 5) {
    // During a manual, horizontal movement controls a sharper rear-wheel pivot.
    touchSteer = THREE.MathUtils.clamp(-gesture.dx / 58 * travelSign, -1, 1);
  } else if (!airborne && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.7) {
    touchSteer = THREE.MathUtils.clamp(-gesture.dx / 78 * travelSign, -1, 1);
  }
});
function finishGesture(event) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const g = gesture;
  const elapsed = Math.max(1, performance.now() - g.startTime);
  const dx = event.clientX - g.x;
  const dy = event.clientY - g.y;
  const quick = elapsed < 420;
  if ((airborne || grinding) && quick && Math.abs(dx) > 30) {
    // Airborne and grind flicks now only create shuvit rotation.
    const flickDirection = Math.abs(dx) > 4 ? screenTurnDirection(dx) : (dy > 0 ? 1 : -1);
    flick(flickDirection, Math.abs(dx), g.lastMoveSpeed || (Math.hypot(dx, dy) / elapsed * 1000),
      0, g.deckLocalX || 0);
  } else if (grinding && g.deckLocalX !== null && quick && Math.abs(dy) > 38) {
    pop('ollie', g.lastMoveSpeed || (Math.abs(dy) / elapsed * 1000));
  } else if (!airborne && !grinding && !g.manualGesture && g.deckLocalX !== null && quick && Math.abs(dy) > 38) {
    // A diagonal deck flick combines the pop and shuvit into one motion:
    // vertical direction selects ollie/nollie, horizontal direction selects spin.
    const tailFlickSpeed = g.lastMoveSpeed || (Math.abs(dy) / elapsed * 1000);
    if (dy * travelSign > 0) pop('ollie', tailFlickSpeed);
    else pop('nollie', tailFlickSpeed);
    if (airborne && Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 0.35) {
      flick(screenTurnDirection(dx), Math.abs(dx), g.lastMoveSpeed || (Math.hypot(dx, dy) / elapsed * 1000),
        dy, g.deckLocalX || 0);
    }
  } else if (!airborne && !grinding && g.deckLocalX === null && Math.abs(dy) > 38) {
    // Vertical swipes beginning beside the board are pushes, not tricks.
    // Drag down = forward; drag up = backward, regardless of swipe speed.
    const direction = dy > 0 ? 1 : -1;
    velocity.addScaledVector(travelForwardVector(), direction * 2.8);
    const current = velocity.length();
    if (current > maxSpeed) velocity.multiplyScalar(maxSpeed / current);
  }
  // Steering is only applied while the finger is held down; release returns
  // the board to neutral instead of leaving it carving in a permanent circle.
  touchSteer = 0;
  manualActive = false;
  manualAngle = 0;
  boardTouchHold = false;
  gesture = null;
}
canvas.addEventListener('pointerup', finishGesture);
canvas.addEventListener('pointercancel', () => {
  boardTouchHold = false;
  gesture = null;
  touchSteer = 0;
  manualActive = false;
  manualAngle = 0;
});

// Keyboard fallback for desktop testing.
addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === ' ' && !event.repeat) pop('ollie');
  if (key === 'n' && !event.repeat) pop('nollie');
  if ((key === 'j' || key === 'k') && (airborne || grinding) && !event.repeat) flick(key === 'j' ? -1 : 1);
  if ((key === 'w' || key === 'arrowup') && !event.repeat) push(2.2);
});
addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));

const cameraOffset = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
let cameraHeading = heading;
function updateFollowCamera(dt) {
  // Rotate the camera through the full half-turn when momentum changes
  // direction, rather than abruptly flipping its position.
  const targetHeading = heading + (travelSign < 0 ? Math.PI : 0);
  const angleDelta = Math.atan2(
    Math.sin(targetHeading - cameraHeading),
    Math.cos(targetHeading - cameraHeading)
  );
  cameraHeading += angleDelta * (1 - Math.exp(-4.8 * dt));
  const forwardX = Math.sin(cameraHeading);
  const forwardZ = Math.cos(cameraHeading);
  cameraOffset.set(
    board.position.x - forwardX * 4.4,
    board.position.y + 4.4,
    board.position.z - forwardZ * 4.8
  );
  cameraTarget.set(
    board.position.x + forwardX * 4.5,
    board.position.y - 0.75,
    board.position.z + forwardZ * 4.5
  );
  const smooth = 1 - Math.exp(-6.5 * dt);
  camera.position.lerp(cameraOffset, smooth);
  camera.lookAt(cameraTarget);
}
camera.position.set(0, 4.4, -4.8);
camera.lookAt(0, -0.75, 6.0);

// Full skatepark map. Tap any point on the plan to teleport the skater there.
const mapButton = document.createElement('button');
mapButton.type = 'button';
mapButton.textContent = 'MAP';
mapButton.setAttribute('aria-label', 'Open skatepark map');
mapButton.style.cssText = 'position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);left:14px;z-index:20;padding:12px 18px;border:3px solid #fff;border-radius:15px;background:linear-gradient(145deg,#ff956e,#f36d83);color:#fff;font:900 12px Arial,sans-serif;letter-spacing:1.8px;text-shadow:0 2px 0 #bd5367;box-shadow:0 5px 0 #a94d62,0 8px 18px #27475a66;touch-action:manipulation;';
mount.appendChild(mapButton);

const mapPanel = document.createElement('div');
mapPanel.style.cssText = 'position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 18px) 14px 18px;background:rgba(35,63,77,.72);backdrop-filter:blur(7px);box-sizing:border-box;';
const mapCard = document.createElement('div');
mapCard.style.cssText = 'width:min(100%,760px);height:min(82vh,720px);display:flex;flex-direction:column;gap:12px;padding:16px;box-sizing:border-box;border:4px solid #fff;border-radius:24px;background:linear-gradient(155deg,#fff3d6,#d9f4e9);color:#31516a;font-family:Arial,sans-serif;box-shadow:0 12px 0 #426779,0 22px 48px #17394c88;';
const mapHeader = document.createElement('div');
mapHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;';
const mapTitle = document.createElement('div');
mapTitle.textContent = 'SKATEPARK MAP';
mapTitle.style.cssText = 'font-size:15px;font-weight:900;letter-spacing:2px;color:#31516a;text-shadow:0 2px 0 #fff;';
const mapClose = document.createElement('button');
mapClose.type = 'button';
mapClose.textContent = 'CLOSE';
mapClose.style.cssText = 'padding:10px 14px;border:3px solid #fff;border-radius:12px;background:#65cbb8;color:#174b55;font-size:11px;font-weight:900;box-shadow:0 3px 0 #328d84;touch-action:manipulation;';
mapHeader.append(mapTitle,mapClose);
const mapHint = document.createElement('div');
mapHint.textContent = 'TAP ANYWHERE ON THE MAP TO TELEPORT';
mapHint.style.cssText = 'flex:none;color:#66818a;font-size:10px;font-weight:900;letter-spacing:1.2px;';
const mapCanvas = document.createElement('canvas');
mapCanvas.style.cssText = 'display:block;width:100%;height:100%;min-height:0;flex:1;border:3px solid #fff;border-radius:16px;background:#a9dfce;box-shadow:inset 0 4px 12px #527f7166;touch-action:pan-x pan-y;';
mapCard.append(mapHeader,mapHint,mapCanvas);
mapPanel.appendChild(mapCard);
mount.appendChild(mapPanel);

const mapCtx = mapCanvas.getContext('2d');
const mapBounds = { minX: -32, maxX: 34, minZ: -24, maxZ: 24 };
function mapTransform() {
  const w = mapCanvas.clientWidth, h = mapCanvas.clientHeight;
  const scale = Math.min(w / (mapBounds.maxX - mapBounds.minX), h / (mapBounds.maxZ - mapBounds.minZ));
  return { w, h, scale, ox: (w - (mapBounds.maxX - mapBounds.minX) * scale) / 2 - mapBounds.minX * scale,
    oy: (h - (mapBounds.maxZ - mapBounds.minZ) * scale) / 2 - mapBounds.minZ * scale };
}
function drawSkateparkMap() {
  if (!mapCtx || mapPanel.style.display === 'none') return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = mapCanvas.clientWidth, h = mapCanvas.clientHeight;
  if (!w || !h) return;
  mapCanvas.width = Math.round(w * dpr); mapCanvas.height = Math.round(h * dpr);
  mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0); mapCtx.clearRect(0, 0, w, h);
  const t = mapTransform(), p = (x,z) => [t.ox+x*t.scale,t.oy+z*t.scale];
  const rounded=(x,y,bw,bh,r)=>{mapCtx.beginPath();mapCtx.roundRect(x,y,bw,bh,r);};
  const block=(x,z,width,depth,fill)=>{
    const [px,py]=p(x-width/2,z-depth/2), bw=width*t.scale,bh=depth*t.scale;
    rounded(px+2,py+Math.max(2,t.scale*.22),bw,bh,Math.min(9,bw/4,bh/3));
    mapCtx.fillStyle='#527f79';mapCtx.fill();
    rounded(px,py,bw,bh,Math.min(9,bw/4,bh/3));mapCtx.fillStyle=fill;mapCtx.fill();
    mapCtx.lineWidth=2;mapCtx.strokeStyle='#fff';mapCtx.stroke();
    rounded(px+2,py+2,bw-4,Math.max(2,bh*.18),4);mapCtx.fillStyle='#ffffff55';mapCtx.fill();
  };
  const label=(txt,x,z,color='#31516a',size=9)=>{
    const [px,py]=p(x,z);mapCtx.font='900 '+size+'px Arial,sans-serif';
    mapCtx.textAlign='center';mapCtx.textBaseline='middle';mapCtx.lineWidth=3;
    mapCtx.strokeStyle='#fff';mapCtx.strokeText(txt,px,py);mapCtx.fillStyle=color;mapCtx.fillText(txt,px,py);
  };
  const bg=mapCtx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#b9ead8');bg.addColorStop(1,'#8fcbbb');
  mapCtx.fillStyle=bg;mapCtx.fillRect(0,0,w,h);
  mapCtx.save();mapCtx.globalAlpha=.18;mapCtx.fillStyle='#fff';
  for(let x=8;x<w;x+=18)for(let y=8;y<h;y+=18){mapCtx.beginPath();mapCtx.arc(x,y,1.2,0,Math.PI*2);mapCtx.fill();}
  mapCtx.restore();
  block(0,0,64,46,'#e9d9b9');
  const [bx,by]=p(bowl.x,bowl.z);
  mapCtx.beginPath();mapCtx.ellipse(bx+2,by+4,bowl.radiusX*t.scale+4,bowl.radiusZ*t.scale+4,0,0,Math.PI*2);
  mapCtx.fillStyle='#557e78';mapCtx.fill();
  mapCtx.beginPath();mapCtx.ellipse(bx,by,bowl.radiusX*t.scale,bowl.radiusZ*t.scale,0,0,Math.PI*2);
  const bowlGrad=mapCtx.createRadialGradient(bx-5,by-5,2,bx,by,bowl.radiusX*t.scale);
  bowlGrad.addColorStop(0,'#8bd5d1');bowlGrad.addColorStop(.55,'#55b9b7');bowlGrad.addColorStop(1,'#347e91');
  mapCtx.fillStyle=bowlGrad;mapCtx.fill();
  for(let i=0;i<5;i++){mapCtx.beginPath();mapCtx.ellipse(bx,by,bowl.radiusX*t.scale*(.28+i*.14),bowl.radiusZ*t.scale*(.28+i*.14),0,0,Math.PI*2);mapCtx.strokeStyle='rgba(255,255,255,'+(.28-i*.035)+')';mapCtx.lineWidth=1.4;mapCtx.stroke();}
  mapCtx.lineWidth=5;mapCtx.strokeStyle='#fff1c9';mapCtx.stroke();mapCtx.lineWidth=2;mapCtx.strokeStyle='#ef9b70';mapCtx.stroke();
  mapCtx.beginPath();mapCtx.ellipse(bx,by,bowl.radiusX*bowl.flatRatio*t.scale,bowl.radiusZ*bowl.flatRatio*t.scale,0,0,Math.PI*2);
  mapCtx.fillStyle='#a7e1d4';mapCtx.fill();mapCtx.strokeStyle='#e7fff1';mapCtx.lineWidth=1.5;mapCtx.stroke();
  label('THE BOWL',bowl.x,bowl.z,'#286e78',10);
  block(10,-12,5.4,.78,'#f18b6b');block(22,12,4.8,.78,'#f18b6b');
  label('BENCH',10,-13.1);label('BENCH',22,10.8);
  for(const [x,z,len,col] of [[14,-7,7.5,'#f5c85c'],[23,-7,7.5,'#e989b0'],[10,8,6.5,'#8f87df']]){
    const a=p(x,z-len/2),b=p(x,z+len/2);mapCtx.lineCap='round';mapCtx.lineWidth=5;mapCtx.strokeStyle='#527f79';
    mapCtx.beginPath();mapCtx.moveTo(a[0]+1,a[1]+3);mapCtx.lineTo(b[0]+1,b[1]+3);mapCtx.stroke();
    mapCtx.lineWidth=3;mapCtx.strokeStyle=col;mapCtx.beginPath();mapCtx.moveTo(...a);mapCtx.lineTo(...b);mapCtx.stroke();
    mapCtx.fillStyle='#fff';for(const q of [a,b]){mapCtx.beginPath();mapCtx.arc(q[0],q[1],2,0,Math.PI*2);mapCtx.fill();}
  }
  block(17,3,5.4,3.2,'#8d87df');block(17,3,4.8,.72,'#f5c85d');label('FUNBOX',17,5.2);
  block(28.075,-8,2.15,8.5,'#f18b6b');block(15,21,8.5,2,'#f18b6b');
  for(const [x,z,dx,dz] of [[28.2,-8,1,0],[15,18.5,0,1]]){
    const a=p(x,z),b=p(x+dx*2.2,z+dz*2.2);mapCtx.lineCap='round';mapCtx.lineWidth=4;mapCtx.strokeStyle='#fff1c9';
    mapCtx.beginPath();mapCtx.moveTo(...a);mapCtx.lineTo(...b);mapCtx.stroke();
  }
  label('QUARTER',28,-13.2);label('QUARTER',20.5,21);
  for(const [x,z,c] of [[-27,-18,'#f28d70'],[29,16,'#f3c65f'],[-27,18,'#8e8ae0']]){
    const [px,py]=p(x,z);mapCtx.fillStyle=c;
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5;mapCtx.beginPath();mapCtx.arc(px+Math.cos(a)*4,py+Math.sin(a)*4,2.4,0,Math.PI*2);mapCtx.fill();}
    mapCtx.beginPath();mapCtx.arc(px,py,2.2,0,Math.PI*2);mapCtx.fillStyle='#fff4d5';mapCtx.fill();
  }
  const [sx,sy]=p(board.position.x,board.position.z);
  mapCtx.beginPath();mapCtx.arc(sx,sy,11,0,Math.PI*2);mapCtx.fillStyle='#fff8d9aa';mapCtx.fill();
  mapCtx.beginPath();mapCtx.arc(sx,sy,6.5,0,Math.PI*2);mapCtx.fillStyle='#ff6e73';mapCtx.fill();mapCtx.strokeStyle='#fff';mapCtx.lineWidth=2.5;mapCtx.stroke();
  const [hx,hy]=p(board.position.x+Math.sin(heading)*2.4,board.position.z+Math.cos(heading)*2.4);
  mapCtx.beginPath();mapCtx.moveTo(sx,sy);mapCtx.lineTo(hx,hy);mapCtx.strokeStyle='#31516a';mapCtx.lineWidth=3;mapCtx.lineCap='round';mapCtx.stroke();
  label('YOU',board.position.x,board.position.z-1.7,'#e95e6c',8);
}
function closeParkMap() { mapPanel.style.display='none'; }
window.addEventListener('resize', drawSkateparkMap);
mapButton.addEventListener('click', () => {
  mapPanel.style.display='flex';
  drawSkateparkMap();
});
mapClose.addEventListener('click', closeParkMap);
mapPanel.addEventListener('click', event => {
  if (event.target === mapPanel) closeParkMap();
});
mapCanvas.addEventListener('pointerdown', event => {
  const rect = mapCanvas.getBoundingClientRect();
  const t = mapTransform();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  const x = (px - t.ox) / t.scale;
  const z = (py - t.oy) / t.scale;
  if (x < mapBounds.minX || x > mapBounds.maxX || z < mapBounds.minZ || z > mapBounds.maxZ) return;
  // Clear all motion/trick states so teleporting never carries momentum or
  // leaves the board attached to a previous grind.
  grinding = false; grindRail = null; grindReadout.style.display='none';
  airborne = false; verticalVelocity = 0; velocity.set(0,0,0);
  shuvitVelocity = 0; shuvitRotation = 0; shuvitTarget = 0;
  manualActive = false; manualAngle = 0; boardTouchHold = false; trickCaught = false;
  bailTimer = 0;
  board.rotation.x = 0; board.rotation.z = 0;
  board.position.set(x, groundHeightAt(x,z) - 0.025, z);
  travelSign = 1;
  closeParkMap();
});

const clock = new THREE.Clock();
let qualityCheckTime = 0;
let qualityFrameCount = 0;
let adaptivePixelRatio = renderPixelRatio;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.025);
  qualityCheckTime += dt;
  qualityFrameCount++;
  if (qualityCheckTime >= 1.5) {
    const measuredFps = qualityFrameCount / qualityCheckTime;
    const maxRatio = Math.min(devicePixelRatio || 1, 2);
    if (measuredFps < 48 && adaptivePixelRatio > 1.15) adaptivePixelRatio = Math.max(1.15, adaptivePixelRatio - 0.15);
    else if (measuredFps > 57 && adaptivePixelRatio < maxRatio) adaptivePixelRatio = Math.min(maxRatio, adaptivePixelRatio + 0.1);
    if (Math.abs(renderer.getPixelRatio() - adaptivePixelRatio) > 0.02) {
      renderer.setPixelRatio(adaptivePixelRatio);
      renderer.setSize(innerWidth, innerHeight, false);
    }
    qualityCheckTime = 0; qualityFrameCount = 0;
  }
  const keyboardTurn = (keys.has('a') || keys.has('arrowleft') ? 1 : 0) -
    (keys.has('d') || keys.has('arrowright') ? 1 : 0);
  const steer = Math.abs(keyboardTurn) > 0 ? keyboardTurn : touchSteer;
  const braking = keys.has('s') || keys.has('arrowdown');

  if (bailTimer > 0) {
    bailTimer = Math.max(0, bailTimer - dt);
    board.rotation.x *= Math.exp(-5 * dt);
    board.rotation.z *= Math.exp(-5 * dt);
  } else {
    // Ground steering changes heading and gradually redirects momentum,
    // rather than moving the board sideways like a character controller.
    const currentSpeed = velocity.length();
    // Keep the POV/control frame facing the actual direction of motion.
    // A small dead zone prevents the camera oscillating when nearly stopped.
    if (currentSpeed > 0.45) {
      const alongBoard = velocity.dot(forwardVector());
      if (alongBoard < -0.12) travelSign = -1;
      else if (alongBoard > 0.12) travelSign = 1;
    }
    if (grinding && grindRail) {
      let edge = grindRail;
      let alongVelocity = velocity.x * edge.tangent.x + velocity.z * edge.tangent.z;
      let next = new THREE.Vector3(board.position.x, 0, board.position.z).addScaledVector(edge.tangent, alongVelocity * dt);
      let fromStart = next.clone().sub(new THREE.Vector3(edge.start.x, 0, edge.start.z)).dot(edge.tangent);
      if (fromStart < 0 || fromStart > edge.length) {
        const movingForward = fromStart > edge.length;
        const oldLength = edge.length;
        const overshoot = movingForward ? fromStart - oldLength : -fromStart;
        const nextEdge = movingForward ? edge.next : edge.previous;
        if (nextEdge && nextEdge.kind === edge.kind) {
          grindRail = edge = nextEdge;
          alongVelocity = velocity.x * edge.tangent.x + velocity.z * edge.tangent.z;
          if (Math.abs(alongVelocity) < 0.4) alongVelocity = (movingForward ? 1 : -1) * 1.2;
          next = movingForward
            ? edge.start.clone().addScaledVector(edge.tangent, overshoot)
            : edge.end.clone().addScaledVector(edge.tangent, -overshoot);
          fromStart = next.clone().sub(edge.start).dot(edge.tangent);
        } else {
          grinding = false;
          grindRail = null;
          grindReadout.style.display = 'none';
          airborne = true;
          verticalVelocity = -0.5;
        }
      }
      if (grinding && grindRail) {
        board.position.set(next.x, edge.y - 0.416, next.z);
        velocity.x = edge.tangent.x * alongVelocity * Math.exp(-0.075 * dt);
        velocity.z = edge.tangent.z * alongVelocity * Math.exp(-0.075 * dt);
      }
    }
    if (!airborne && !grinding) {
      // A manual kickturn pivots sharply around the rear wheels while the
      // tail stays lifted; normal carving keeps its usual, smoother response.
      const kickturnMultiplier = manualActive ? 2.0 : 1;
      heading += steer * travelSign * (manualActive ? -manualSide : 1) * (0.30 + currentSpeed * 0.105) * kickturnMultiplier * dt;
      // Redirect momentum toward the active travel direction. Using the
      // board's nose vector here while rolling backwards would fight the
      // existing velocity every frame and steadily bleed speed.
      const desired = travelForwardVector().multiplyScalar(currentSpeed);
      // Preserve momentum during a manual pivot so it feels like a kickturn,
      // rather than instantly redirecting the whole board like a normal carve.
      const redirectRate = manualActive ? 0.48 : (0.95 + currentSpeed * 0.10);
      velocity.lerp(desired, 1 - Math.exp(-redirectRate * dt));
      if (braking) velocity.multiplyScalar(Math.exp(-3.2 * dt));
      else velocity.multiplyScalar(Math.exp(-0.14 * dt));
      if (groundedRampNormal.y < 0.999) {
        const downhill = new THREE.Vector3(0, -gravity, 0).addScaledVector(
          groundedRampNormal,
          gravity * groundedRampNormal.y
        );
        velocity.x += downhill.x * dt;
        velocity.z += downhill.z * dt;
      }
      // Follow the local terrain gradient: gravity accelerates down bowl walls
      // and quarter-pipe transitions instead of treating them as flat ground.
      const sample = 0.22;
      const slopeX = (groundHeightAt(board.position.x + sample, board.position.z) -
        groundHeightAt(board.position.x - sample, board.position.z)) / (sample * 2);
      const slopeZ = (groundHeightAt(board.position.x, board.position.z + sample) -
        groundHeightAt(board.position.x, board.position.z - sample)) / (sample * 2);
      velocity.x += -gravity * slopeX * dt;
      velocity.z += -gravity * slopeZ * dt;
      if (!trickStance) {
        const targetDeckPitch = (manualActive ? manualAngle : rampAngleAt(board.position.x, board.position.z)) - steer * 0.075;
        board.rotation.z = THREE.MathUtils.damp(board.rotation.z, targetDeckPitch, manualActive ? 12 : 7, dt);
        const targetKickturnLean = manualActive ? steer * 0.17 : steer * 0.035;
        board.rotation.x = THREE.MathUtils.damp(board.rotation.x, targetKickturnLean, manualActive ? 10 : 7, dt);
      } else {
        // Preserve caught trick momentum after touchdown rather than freezing it.
        const groundAngularDamping = boardTouchHold ? 8.5 : 1.8;
        heading += shuvitVelocity * dt;
        const damping = Math.exp(-groundAngularDamping * dt);
        shuvitVelocity *= damping;
      }
    } else if (airborne) {
      // Limited air control; momentum remains mostly conserved.
      heading += steer * 0.32 * dt;
      velocity.multiplyScalar(Math.exp(-0.02 * dt));
      airTime += dt;
      // Free angular momentum: no preset rotation target or automatic snap.
      // Air drag slows the board gradually; touching the deck adds strong,
      // smooth damping so the player can catch and hold unusual orientations.
      const angularDamping = boardTouchHold ? 7.5 : 1.15;
      shuvitVelocity *= Math.exp(-angularDamping * dt);
      shuvitRotation += shuvitVelocity * dt;
      if (Math.abs(shuvitVelocity) < 0.025) shuvitVelocity = 0;
      if (boardTouchHold && Math.abs(shuvitVelocity) < 1.35) {
        trickCaught = true;
      }
    }

    if (!grinding) {
      board.position.x += velocity.x * dt;
      board.position.z += velocity.z * dt;
    }
    speed = velocity.length();

    if (airborne) {
      board.position.y += verticalVelocity * dt;
      verticalVelocity -= gravity * dt;
      tryStartGrind();
      if (grinding) {
        // A successful grind landing consumes this airborne update; do not
        // immediately run the ordinary ground-contact/bail test as well.
      } else {
      // Use the actual rotated board geometry for ground contact. The board
      // origin is not the bottom of the wheels/deck, especially during tricks.
      board.updateMatrixWorld(true);
      const groundCorrection = groundContactCorrection();
      if (groundCorrection >= 0 && verticalVelocity < 0) {
        board.position.y += groundCorrection;
        const rotationSpeed = Math.abs(shuvitVelocity);
        const uprightLanding = Math.abs(board.rotation.x) < 0.48 &&
          Math.abs(board.rotation.z) < 0.48 &&
          (!shuvitTarget || Math.abs(Math.sin(shuvitRotation / 2)) < 0.34);
        const heldTrickLanding = trickCaught || (boardTouchHold && rotationSpeed < 1.35);
        if (rotationSpeed < 1.35 && (uprightLanding || heldTrickLanding)) {
          // Keep the exact caught orientation: no auto-level, auto-rotate or snap.
          airborne = false;
          trickStance = heldTrickLanding && !uprightLanding;
          verticalVelocity = 0;
          // Keep residual angular velocity; the board should not freeze on impact.
                  heading += shuvitRotation;
          shuvitRotation = 0;
          shuvitTarget = 0;
          manualActive = false;
          manualAngle = 0;
          lastLandTime = clock.elapsedTime;
          velocity.multiplyScalar(0.97);
        } else {
          resetBoard();
        }
      }
      }
    }
  }

  resolveObstacleContacts();
  board.rotation.y = heading - Math.PI / 2 + (airborne ? shuvitRotation : 0);
  // Keep the complete board above the ground in every grounded stance,
  // including manuals and caught primo/Casper orientations.
  if (!airborne && !grinding) {
    board.updateMatrixWorld(true);
    board.position.y += groundContactCorrection();
  }
  // Keep wheel roll animation off for now; only give the wheels a subtle
  // steering angle when the board is carving, so they don't spin constantly.
  for (const wheel of wheelMeshes) {
    wheel.rotation.y = THREE.MathUtils.damp(wheel.rotation.y, steer * 0.12, 8, dt);
  }
  updateFollowCamera(dt);
  renderer.render(scene, camera);

  const errorPanel = document.getElementById('load-error');
  if (errorPanel) errorPanel.style.display = 'none';
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderPixelRatio = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(renderPixelRatio);
});
