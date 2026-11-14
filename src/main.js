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
  scene.add(rod);
  solidObstacles.push(rod);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mats.outline);
  edge.rotation.copy(rod.rotation);
  edge.position.copy(rod.position);
  scene.add(edge);
  for (const offset of [-length / 2 + 0.18, length / 2 - 0.18]) {
    outlinedBox(scene, 0.13, height, 0.13, mats.dark, x, height / 2, z + offset);
  }
}

// Park floor with a readable world-coordinate grid. Minor lines mark 1m,
// brighter major lines mark every 4m, making position and travel direction easier to judge.
outlinedBox(scene, 100, 0.45, 100, mats.floor, 0, -0.25, 0);
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
addSurfaceGrid(scene, 96, 96, 1, -0.022, 4);

// Coordinate labels around the perimeter give the grid a consistent X/Z reference.
function coordinateLabel(text, x, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(8,8,8,0.72)';
  ctx.fillRect(4, 4, 248, 88);
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d0d0d0';
  ctx.fillText(text, 128, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const label = new THREE.Sprite(material);
  label.position.set(x, 0.025, z);
  label.scale.set(2.8, 1.05, 1);
  scene.add(label);
}
for (let coordinate = -40; coordinate <= 40; coordinate += 8) {
  coordinateLabel(`X ${coordinate > 0 ? '+' : ''}${coordinate}`, coordinate, -46.1);
  coordinateLabel(`Z ${coordinate > 0 ? '+' : ''}${coordinate}`, -46.1, coordinate);
}

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
let flipVelocity = 0;
let flipTarget = 0;
let shuvitVelocity = 0;
let boardTouchHold = false;
let trickCaught = false;
let trickStance = false;
let shuvitRotation = 0;
let shuvitTarget = 0;
let pitchVelocity = 0;
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
  flipVelocity = 0;
  flipTarget = 0;
  trickCaught = false;
  trickStance = false;
  // A tail pop (ollie) and nose pop (nollie) use opposite deck-pitch impulses.
  const popDirection = (kind === 'nollie' ? -1 : 1) * travelSign;
  pitchVelocity = popDirection * 2.0;
  board.rotation.x = 0;
  board.rotation.z = popDirection * 0.12;
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
  // A flick across the board's width creates a kickflip/heelflip.
  // Its direction comes from the swipe, and its leverage from the touch point.
  if (Math.abs(verticalDistance) > 22 && Math.abs(flipVelocity) < 0.1 &&
      Math.abs(board.rotation.x) < 0.1) {
    const flipDirection = verticalDistance > 0 ? 1 : -1;
    const flipImpulse = fingerSpeed * (3.0 + Math.abs(verticalDistance) * 0.065) *
      (0.78 + alongDeck * 0.42);
    const flipSpeed = THREE.MathUtils.clamp(flipImpulse * 3, 8.4, 39);
    flipTarget = flipDirection; // non-zero marker: a flip impulse is active
    flipVelocity += flipDirection * flipSpeed;
  }
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

function resolveObstacleContacts() {
  groundedRampAngle = 0;
  groundedRampNormal.set(0, 1, 0);
  // Two passes resolve corners where the deck meets two surfaces at once.
  for (let pass = 0; pass < 2; pass++) {
    const penetration = getObbContact();
    if (penetration === null) break;

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
      const rotationSpeed = Math.hypot(flipVelocity, shuvitVelocity, pitchVelocity);
      const uprightLanding = Math.abs(board.rotation.x) < 0.48 &&
        Math.abs(board.rotation.z) < 0.48 &&
        (!shuvitTarget || Math.abs(Math.sin(shuvitRotation / 2)) < 0.34);
      const heldTrickLanding = trickCaught || (boardTouchHold && rotationSpeed < 1.35);
      if (airborne && rotationSpeed < 1.35 && (uprightLanding || heldTrickLanding)) {
        airborne = false;
        verticalVelocity = 0;
        trickStance = heldTrickLanding && !uprightLanding;
        // Keep residual angular velocity; the board should not freeze on impact.
        flipTarget = 0;
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
  board.position.y = 0;
  board.rotation.x = 0;
  board.rotation.z = 0;
  verticalVelocity = 0;
  flipVelocity = 0;
  flipTarget = 0;
  shuvitVelocity = 0;
  shuvitRotation = 0;
  shuvitTarget = 0;
  pitchVelocity = 0;
  airborne = false;
  bailTimer = 0.8;
  velocity.multiplyScalar(0.25);
}

// Touch gestures:
// - swipe down beside the board = push
// - quick upward flick in the lower-middle screen = pop
// - horizontal drag while grounded = carve/turn
// - horizontal flick while airborne = kickflip/heelflip
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
  if (airborne && quick && Math.hypot(dx, dy) > 30 &&
      (g.manualPopTriggered || Math.hypot(dx, dy) > 35)) {
    // The full flick vector determines the trick: sideways adds shuvit torque,
    // vertical adds kickflip/heelflip torque, and diagonal flicks combine them.
    const flickDirection = Math.abs(dx) > 4 ? screenTurnDirection(dx) : (dy > 0 ? 1 : -1);
    flick(flickDirection, Math.abs(dx), g.lastMoveSpeed || (Math.hypot(dx, dy) / elapsed * 1000),
      dy, g.deckLocalX || 0);
  } else if (!airborne && !g.manualGesture && g.deckLocalX !== null && quick && Math.abs(dy) > 38) {
    // A diagonal deck flick combines the pop and shuvit into one motion:
    // vertical direction selects ollie/nollie, horizontal direction selects spin.
    const tailFlickSpeed = g.lastMoveSpeed || (Math.abs(dy) / elapsed * 1000);
    if (dy * travelSign > 0) pop('ollie', tailFlickSpeed);
    else pop('nollie', tailFlickSpeed);
    if (airborne && Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 0.35) {
      flick(screenTurnDirection(dx), Math.abs(dx), g.lastMoveSpeed || (Math.hypot(dx, dy) / elapsed * 1000),
        dy, g.deckLocalX || 0);
    }
  } else if (!airborne && g.deckLocalX === null && Math.abs(dy) > 38) {
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
  if ((key === 'j' || key === 'k') && airborne && !event.repeat) flick(key === 'j' ? -1 : 1);
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
    if (!airborne) {
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
        // Gravity projected onto the ramp plane accelerates the board downhill
        // without adding an artificial upward launch at the ramp transition.
        const downhill = new THREE.Vector3(0, -gravity, 0).addScaledVector(
          groundedRampNormal,
          gravity * groundedRampNormal.y
        );
        velocity.x += downhill.x * dt;
        velocity.z += downhill.z * dt;
      }
      if (!trickStance) {
        const targetDeckPitch = (manualActive ? manualAngle : groundedRampAngle) - steer * 0.075;
        board.rotation.z = THREE.MathUtils.damp(board.rotation.z, targetDeckPitch, manualActive ? 12 : 7, dt);
        const targetKickturnLean = manualActive ? steer * 0.17 : steer * 0.035;
        board.rotation.x = THREE.MathUtils.damp(board.rotation.x, targetKickturnLean, manualActive ? 10 : 7, dt);
      } else {
        // Preserve caught trick momentum after touchdown rather than freezing it.
        const groundAngularDamping = boardTouchHold ? 8.5 : 1.8;
        board.rotation.x += flipVelocity * dt;
        board.rotation.z += pitchVelocity * dt;
        heading += shuvitVelocity * dt;
        const damping = Math.exp(-groundAngularDamping * dt);
        flipVelocity *= damping;
        pitchVelocity *= damping;
        shuvitVelocity *= damping;
      }
    } else {
      // Limited air control; momentum remains mostly conserved.
      heading += steer * 0.32 * dt;
      velocity.multiplyScalar(Math.exp(-0.02 * dt));
      airTime += dt;
      // Free angular momentum: no preset rotation target or automatic snap.
      // Air drag slows the board gradually; touching the deck adds strong,
      // smooth damping so the player can catch and hold unusual orientations.
      const angularDamping = boardTouchHold ? 7.5 : 1.15;
      flipVelocity *= Math.exp(-angularDamping * dt);
      shuvitVelocity *= Math.exp(-angularDamping * dt);
      pitchVelocity *= Math.exp((boardTouchHold ? -8.5 : -1.7) * dt);
      board.rotation.x += flipVelocity * dt;
      shuvitRotation += shuvitVelocity * dt;
      board.rotation.z += pitchVelocity * dt;
      if (Math.abs(flipVelocity) < 0.025) flipVelocity = 0;
      if (Math.abs(shuvitVelocity) < 0.025) shuvitVelocity = 0;
      if (Math.abs(pitchVelocity) < 0.025) pitchVelocity = 0;
      if (boardTouchHold && Math.hypot(flipVelocity, shuvitVelocity, pitchVelocity) < 1.35) {
        trickCaught = true;
      }
    }

    board.position.x += velocity.x * dt;
    board.position.z += velocity.z * dt;
    speed = velocity.length();

    if (airborne) {
      board.position.y += verticalVelocity * dt;
      verticalVelocity -= gravity * dt;
      // Use the actual rotated board geometry for ground contact. The board
      // origin is not the bottom of the wheels/deck, especially during tricks.
      board.updateMatrixWorld(true);
      boardWorldBounds.setFromObject(board);
      if (boardWorldBounds.min.y <= 0 && verticalVelocity < 0) {
        board.position.y -= boardWorldBounds.min.y;
        const rotationSpeed = Math.hypot(flipVelocity, shuvitVelocity, pitchVelocity);
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
          flipTarget = 0;
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
  if (!airborne) {
    board.updateMatrixWorld(true);
    boardWorldBounds.setFromObject(board);
    if (boardWorldBounds.min.y < 0) board.position.y -= boardWorldBounds.min.y;
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
