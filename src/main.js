import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// Minimal monochrome blockout: only the 3D skatepark and skateboard are shown.
const mount = document.getElementById('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);
scene.fog = new THREE.Fog(0x202020, 38, 115);
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
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x454545, 2.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
keyLight.position.set(-10, 18, -8);
scene.add(keyLight);

const mats = {
  floor: new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x484848, roughness: 0.95 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 1 }),
  board: new THREE.MeshStandardMaterial({ color: 0x858585, roughness: 0.82 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 1 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9b9b9b, metalness: 0.35, roughness: 0.55 }),
  outline: new THREE.LineBasicMaterial({ color: 0xd8d8d8 })
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
  mesh.position.set(x, y, z);
  parent.add(mesh);
  if (w < 90) solidObstacles.push(mesh);
  if (w >= 4.5 && d >= 1 && w < 90) {
    const surface = new THREE.Group();
    surface.position.set(x, y + h / 2, z);
    parent.add(surface);
    addSurfaceGrid(surface, w, d, 1, 0.012, 4);
  }
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mats.outline);
  edge.position.copy(mesh.position);
  parent.add(edge);
  return mesh;
}
function ramp(w, h, d, x, z, angle = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mats.concrete);
  mesh.position.set(x, h / 2 - 0.02, z);
  mesh.rotation.z = angle;
  mesh.userData.isRamp = true;
  scene.add(mesh);
  solidObstacles.push(mesh);
  // A matching 1m grid on the ramp surface makes the obstacle's size and
  // orientation clear as the camera follows the skater.
  const surface = new THREE.Group();
  surface.position.copy(mesh.position);
  surface.rotation.copy(mesh.rotation);
  scene.add(surface);
  addSurfaceGrid(surface, w, d, 1, h / 2 + 0.012, 4);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mats.outline);
  edge.position.copy(mesh.position);
  edge.rotation.copy(mesh.rotation);
  scene.add(edge);
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
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mats.outline);
  edge.rotation.copy(rod.rotation);
  edge.position.copy(rod.position);
  scene.add(edge);
  for (const offset of [-length / 2 + 0.18, length / 2 - 0.18]) {
    const support = outlinedBox(scene, 0.13, height, 0.13, mats.dark, x, height / 2, z + offset);
    support.userData.isRailSupport = true;
  }
}

// The bowl is a true cut-out in the concrete slab, not a bowl mesh buried
// beneath a flat floor. Its curved riding surface remains visible all the way down.
const bowl = { x: -18, z: 0, radiusX: 9.5, radiusZ: 8.5, depth: 2.25, flatRatio: 0.28 };
const quarterPipes = [];
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
  return -bowl.depth * (1 - Math.cos(t * Math.PI / 2));
}

function buildBowl() {
  const rings = 36;
  const segments = 112;
  const positions = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring++) {
    const radius = ring / rings;
    const y = -bowl.depth * (1 - Math.cos(
      THREE.MathUtils.clamp((radius - bowl.flatRatio) / (1 - bowl.flatRatio), 0, 1) * Math.PI / 2
    ));
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
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const surface = new THREE.Mesh(geometry, mats.concrete);
  surface.material.side = THREE.DoubleSide;
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
  for (let i = 0; i < 64; i++) {
    const a0 = i / 64 * Math.PI * 2;
    const a1 = (i + 1) / 64 * Math.PI * 2;
    addGrindEdge(
      { x: bowl.x + Math.cos(a0) * bowl.radiusX, z: bowl.z + Math.sin(a0) * bowl.radiusZ },
      { x: bowl.x + Math.cos(a1) * bowl.radiusX, z: bowl.z + Math.sin(a1) * bowl.radiusZ },
      0.035, 'coping'
    );
  }

  // A clean, slightly raised concrete deck around the bowl gives riders
  // room to set up, drop in and approach the coping without crowding it.
  const deck = new THREE.Mesh(new THREE.RingGeometry(9.8, 10.5, 112), mats.concrete);
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
  const face = new THREE.Mesh(geometry, mats.concrete);
  face.material.side = THREE.DoubleSide;
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
function groundHeightAt(x, z) {
  const nx = (x - bowl.x) / bowl.radiusX;
  const nz = (z - bowl.z) / bowl.radiusZ;
  const insideBowl = nx * nx + nz * nz < 1;
  const bowlY = insideBowl ? bowlHeightAt(x, z) : 0;
  return Math.max(bowlY, quarterPipeHeightAt(x, z), insideBowl ? -Infinity : 0);
}

// Street plaza: low, usable obstacles with clear run-ups and room to roll away.
function bench(x, z, length = 5.2) {
  const top = outlinedBox(scene, length, 0.18, 0.78, mats.metal, x, 0.53, z);
  top.userData.grindSurface = true;
  const topY = 0.53 + 0.09 + 0.416;
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
const funboxTop = 0.26 + 0.52 / 2 + 0.416;
for (const zEdge of [3 - 1.6, 3 + 1.6]) addGrindEdge({ x: 17 - 2.7, z: zEdge }, { x: 17 + 2.7, z: zEdge }, funboxTop);
for (const xEdge of [17 - 2.7, 17 + 2.7]) addGrindEdge({ x: xEdge, z: 3 - 1.6 }, { x: xEdge, z: 3 + 1.6 }, funboxTop);
ramp(4.2, 0.72, 3.2, 12.2, 0, 0.17);
ramp(4.2, 0.72, 3.2, 21.8, 3, -0.17);
const funboxRail = outlinedBox(scene, 4.8, 0.18, 0.72, mats.metal, 17, 0.61, 3);
funboxRail.userData.grindSurface = true;
addGrindEdge({ x: 14.6, z: 3 }, { x: 19.4, z: 3 }, 0.61 + 0.09 + 0.416, 'rail');

// Two smooth concrete quarter pipes with coping, one on each side of the plaza.
addQuarterPipe('x', 27, -8, 8.5, 2.15, 1);
addQuarterPipe('z', 15, 17, 8.5, 2.0, 1);

// Detailed skateboard model: rounded deck, grip surface, trucks and wheels.
const board = new THREE.Group();
scene.add(board);

const deckShape = new THREE.Shape();
deckShape.moveTo(-1.13, 0);
deckShape.bezierCurveTo(-1.13, 0.20, -1.00, 0.34, -0.78, 0.34);
deckShape.lineTo(0.78, 0.34);
deckShape.bezierCurveTo(1.00, 0.34, 1.13, 0.20, 1.13, 0);
deckShape.bezierCurveTo(1.13, -0.20, 1.00, -0.34, 0.78, -0.34);
deckShape.lineTo(-0.78, -0.34);
deckShape.bezierCurveTo(-1.00, -0.34, -1.13, -0.20, -1.13, 0);

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

const deckOutline = new THREE.LineSegments(
  new THREE.EdgesGeometry(deckGeometry, 30),
  mats.outline
);
deckOutline.position.copy(deck.position);
board.add(deckOutline);

// The deck itself has a black top with a very slim exposed white rim.
// Both top layers are generated from the exact deck outline, so the edges
// follow the nose, tail and side curves without separate grip-tape geometry.
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
  const surface = new THREE.Mesh(geometry, material);
  surface.position.y = deck.position.y + yOffset;
  surface.renderOrder = renderOrder;
  board.add(surface);
  return surface;
}

const deckTopWhite = new THREE.MeshBasicMaterial({
  color: 0xd8d8d8,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  depthWrite: false
});
const deckTopBlack = new THREE.MeshBasicMaterial({
  color: 0x030303,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
  depthWrite: false
});

// White underlayer leaves only a fine border visible around the black top.
makeDeckTop(0.992, 0.985, deckTopWhite, 0.006, 2);
makeDeckTop(0.972, 0.955, deckTopBlack, 0.009, 3);

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

  // Four soft-edged wheels with visible inner hubs.
  for (const z of [-0.34, 0.34]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, 0.12, 24, 1),
      new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.88 })
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.17, z);
    board.add(wheel);
    wheelMeshes.push(wheel);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.125, 16),
      new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.45, roughness: 0.48 })
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.copy(wheel.position);
    board.add(hub);
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
    const spinSpeed = THREE.MathUtils.clamp(impulse * 3, 8.4, 40.5);
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
  const boardForward = forwardVector();
  for (const edge of grindEdges) {
    const relative = new THREE.Vector3(board.position.x - edge.start.x, 0, board.position.z - edge.start.z);
    const along = THREE.MathUtils.clamp(relative.dot(edge.tangent), 0.22, edge.length - 0.22);
    const closest = edge.start.clone().addScaledVector(edge.tangent, along);
    const lateral = Math.hypot(board.position.x - closest.x, board.position.z - closest.z);
    if (lateral > 0.78) continue;
    const targetY = edge.y - 0.416;
    if (board.position.y > targetY + 0.16 || board.position.y < targetY - 0.42) continue;
    const alignment = Math.abs(boardForward.dot(edge.tangent));
    if (alignment < 0.18) continue;
    board.position.set(closest.x, targetY, closest.z);
    board.updateMatrixWorld(true);
    grindContactPoint.set(closest.x, edge.y, closest.z);
    grindLocalPoint.copy(grindContactPoint);
    board.worldToLocal(grindLocalPoint);
    const parallel = alignment > 0.72;
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
    const direction = velocity.dot(edge.tangent) >= 0 ? 1 : -1;
    const grindSpeed = Math.max(1.2, Math.abs(velocity.dot(edge.tangent)), speedNow * 0.45);
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

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.025);
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
      const edge = grindRail;
      const alongVelocity = velocity.x * edge.tangent.x + velocity.z * edge.tangent.z;
      const next = new THREE.Vector3(board.position.x, 0, board.position.z).addScaledVector(edge.tangent, alongVelocity * dt);
      const fromStart = next.clone().sub(new THREE.Vector3(edge.start.x, 0, edge.start.z)).dot(edge.tangent);
      if (fromStart < 0.08 || fromStart > edge.length - 0.08) {
        grinding = false;
        grindRail = null;
        grindReadout.style.display = 'none';
        airborne = true;
        verticalVelocity = -0.5;
      } else {
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
        const targetDeckPitch = (manualActive ? manualAngle : groundedRampAngle) - steer * 0.075;
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
      // Use the actual rotated board geometry for ground contact. The board
      // origin is not the bottom of the wheels/deck, especially during tricks.
      board.updateMatrixWorld(true);
      boardWorldBounds.setFromObject(board);
      const groundY = groundHeightAt(board.position.x, board.position.z);
      if (boardWorldBounds.min.y <= groundY && verticalVelocity < 0) {
        board.position.y += groundY - boardWorldBounds.min.y;
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

  resolveObstacleContacts();
  board.rotation.y = heading - Math.PI / 2 + (airborne ? shuvitRotation : 0);
  // Keep the complete board above the ground in every grounded stance,
  // including manuals and caught primo/Casper orientations.
  if (!airborne && !grinding) {
    board.updateMatrixWorld(true);
    boardWorldBounds.setFromObject(board);
    const groundY = groundHeightAt(board.position.x, board.position.z);
    board.position.y += groundY - boardWorldBounds.min.y;
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
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
});
