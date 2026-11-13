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

function outlinedBox(parent, w, h, d, mat, x, y, z) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
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
  scene.add(mesh);
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
  scene.add(rod);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mats.outline);
  edge.rotation.copy(rod.rotation);
  edge.position.copy(rod.position);
  scene.add(edge);
  for (const offset of [-length / 2 + 0.18, length / 2 - 0.18]) {
    outlinedBox(scene, 0.13, height, 0.13, mats.dark, x, height / 2, z + offset);
  }
}

// Park floor and subtle construction grid.
outlinedBox(scene, 100, 0.45, 100, mats.floor, 0, -0.25, 0);
const gridPoints = [];
for (let i = -10; i <= 10; i++) {
  gridPoints.push(-48, 0, i * 4, 48, 0, i * 4, i * 4, 0, -48, i * 4, 0, 48);
}
const gridGeometry = new THREE.BufferGeometry();
gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
scene.add(new THREE.LineSegments(gridGeometry, new THREE.LineBasicMaterial({ color: 0x3b3b3b })));

// Skatepark obstacles.
ramp(13, 1.45, 8, -15, -5, 0.17);
ramp(13, 1.45, 8, 15, -5, -0.17);
ramp(10, 1.1, 6, -15, 13, -0.14);
ramp(10, 1.1, 6, 15, 13, 0.14);
outlinedBox(scene, 6.5, 1, 1.35, mats.concrete, -7, 0.5, -11);
outlinedBox(scene, 6.5, 1, 1.35, mats.concrete, 7, 0.5, 11);
outlinedBox(scene, 4.5, 0.55, 1.1, mats.concrete, -22, 0.275, 5);
outlinedBox(scene, 4.5, 0.55, 1.1, mats.concrete, 22, 0.275, -2);
rail(0, -8, 8, 0.78);
rail(-8, 8, 8, 0.78);
rail(-10, 3, 5, 0.62);
rail(10, -2, 5, 0.62);

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

// Build the grip directly from the deck's original Shape. This keeps
// triangulation identical and avoids broken triangles at the nose and tail.
const gripGeometry = new THREE.ShapeGeometry(deckShape, 32);
const gripPositions = gripGeometry.attributes.position;
for (let i = 0; i < gripPositions.count; i++) {
  // A narrow, even inset: preserve the deck's complete outline and kick shape.
  gripPositions.setX(i, gripPositions.getX(i) * 0.985);
  gripPositions.setY(i, gripPositions.getY(i) * 0.94);
}
gripPositions.needsUpdate = true;
gripGeometry.rotateX(Math.PI / 2);
curveDeckGeometry(gripGeometry);

const grip = new THREE.Mesh(
  gripGeometry,
  new THREE.MeshBasicMaterial({
    color: 0x050505,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    depthWrite: false
  })
);
grip.position.y = deck.position.y + 0.006;
grip.renderOrder = 2;
board.add(grip);

// Trucks: base plates, hangers, axles and kingpins.
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

// Low follow-camera POV: the board fills the lower foreground while the
// park opens up ahead. The board's long axis is aligned with its travel.
const keys = new Set();
let speed = 0;
let heading = 0;
board.rotation.y = heading - Math.PI / 2;

const cameraOffset = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
function updateFollowCamera(dt) {
  const forwardX = Math.sin(heading);
  const forwardZ = Math.cos(heading);
  cameraOffset.set(
    board.position.x - forwardX * 4.4,
    board.position.y + 4.4,
    board.position.z - forwardZ * 4.8
  );
  cameraTarget.set(
    board.position.x + forwardX * 4.5,
    -0.75,
    board.position.z + forwardZ * 4.5
  );
  const smooth = 1 - Math.exp(-7 * dt);
  camera.position.lerp(cameraOffset, smooth);
  camera.lookAt(cameraTarget);
}
camera.position.set(0, 4.4, -4.8);
camera.lookAt(0, -0.75, 6.0);

// Basic keyboard movement remains available; no on-screen controls.
let verticalVelocity = 0;
let airborne = false;
addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === ' ' && !airborne) { verticalVelocity = 4.2; airborne = true; }
});
addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  const throttle = keys.has('w') || keys.has('arrowup');
  const brake = keys.has('s') || keys.has('arrowdown');
  const turn = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  speed += (throttle ? 5.5 : 0) * dt;
  speed -= (brake ? 8 : 0) * dt;
  speed = THREE.MathUtils.clamp(speed * Math.pow(0.985, dt * 60), 0, 12);
  heading += turn * Math.min(speed * 0.11, 1.2) * dt;
  board.rotation.y = heading - Math.PI / 2;
  board.position.x += Math.sin(heading) * speed * dt;
  board.position.z += Math.cos(heading) * speed * dt;
  if (airborne) {
    board.position.y += verticalVelocity * dt;
    verticalVelocity -= 12 * dt;
    if (board.position.y <= 0) {
      board.position.y = 0;
      verticalVelocity = 0;
      airborne = false;
    }
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