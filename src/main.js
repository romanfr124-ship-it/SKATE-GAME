import * as THREE from 'three';
import './style.css';

// Minimal monochrome blockout: only the 3D skatepark and skateboard are shown.
const mount = document.getElementById('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);
scene.fog = new THREE.Fog(0x202020, 38, 115);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 180);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false });
} catch (error) {
  const panel = document.getElementById('load-error');
  panel.textContent = 'This browser could not create a WebGL graphics context. Try enabling hardware acceleration or updating iOS. Details: ' + (error.message || error);
  panel.style.display = 'grid';
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25));
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
rail(0, 8, 8, 0.78);
rail(-10, 3, 5, 0.62);
rail(10, -2, 5, 0.62);

// Skateboard model in the foreground.
const board = new THREE.Group();
scene.add(board);
outlinedBox(board, 2.15, 0.14, 0.62, mats.board, 0, 0.36, 0);
const capGeometry = new THREE.SphereGeometry(0.31, 12, 8);
for (const x of [-1, 1]) {
  const cap = new THREE.Mesh(capGeometry, mats.board);
  cap.scale.set(0.55, 0.22, 1);
  cap.position.set(x, 0.36, 0);
  board.add(cap);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(capGeometry), mats.outline);
  edge.scale.copy(cap.scale);
  edge.position.copy(cap.position);
  board.add(edge);
}
for (const x of [-0.68, 0.68]) {
  outlinedBox(board, 0.16, 0.12, 0.76, mats.metal, x, 0.22, 0);
  for (const z of [-0.39, 0.39]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 12), mats.rubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.17, z);
    board.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.135, 10), mats.metal);
    hub.rotation.x = Math.PI / 2;
    hub.position.copy(wheel.position);
    board.add(hub);
  }
}
board.position.set(0, 0, 1.5);

// Establishing camera: board prominent, park visible behind it.
camera.position.set(13.5, 11.5, -19);
camera.lookAt(0, 0.1, 0);
board.rotation.y = -0.22;

// Basic keyboard movement remains available; no on-screen controls.
const keys = new Set();
let speed = 0;
let heading = -0.22;
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
  board.rotation.y = heading;
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