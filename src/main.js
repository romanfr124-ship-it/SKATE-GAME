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
let shuvitVelocity = 0;
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
function push(power = 2.7) {
  if (airborne || bailTimer > 0) return;
  const forward = forwardVector();
  velocity.addScaledVector(forward, power);
  const current = velocity.length();
  if (current > maxSpeed) velocity.multiplyScalar(maxSpeed / current);
}
function pop(kind = 'ollie') {
  if (airborne || bailTimer > 0 || velocity.length() < 0.25) return;
  airborne = true;
  airTime = 0;
  verticalVelocity = 4.65 + Math.min(velocity.length() * 0.055, 0.55);
  flipVelocity = 0;
  // A tail pop (ollie) and nose pop (nollie) use opposite deck-pitch impulses.
  const popDirection = kind === 'nollie' ? -1 : 1;
  pitchVelocity = popDirection * 2.0;
  board.rotation.x = 0;
  board.rotation.z = popDirection * 0.12;
}
function flick(direction, distance = 45) {
  if (!airborne || airTime > 0.48) return;
  // A sideways flick spins the board around its vertical axis:
  // normal flick = shuvit; a longer flick = double shuvit.
  if (Math.abs(shuvitVelocity) < 0.1 && Math.abs(shuvitRotation) < 0.1) {
    const doubleShuvit = distance >= 82;
    shuvitTarget = (doubleShuvit ? Math.PI * 4 : Math.PI * 2) * direction;
    shuvitVelocity = direction * (doubleShuvit ? 21 : 16);
  }
}
function resetBoard() {
  board.position.y = 0;
  board.rotation.x = 0;
  board.rotation.z = 0;
  verticalVelocity = 0;
  flipVelocity = 0;
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
const canvas = renderer.domElement;
canvas.style.touchAction = 'none';

// Classify the gesture by where the finger first touches: the deck itself
// triggers ollies/nollies; the surrounding ground area is for pushing.
const touchRaycaster = new THREE.Raycaster();
const touchNdc = new THREE.Vector2();
function deckTouchLocalX(clientX, clientY) {
  touchNdc.set(
    (clientX / innerWidth) * 2 - 1,
    -(clientY / innerHeight) * 2 + 1
  );
  board.updateMatrixWorld(true);
  touchRaycaster.setFromCamera(touchNdc, camera);
  const hit = touchRaycaster.intersectObject(deck, false)[0];
  if (!hit) return null;
  return board.worldToLocal(hit.point.clone()).x;
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
    startTime: performance.now(),
    deckLocalX: deckTouchLocalX(event.clientX, event.clientY),
    manualGesture: false
  };
  touchSteer = 0;
});
canvas.addEventListener('pointermove', event => {
  if (!gesture || gesture.id !== event.pointerId) return;
  gesture.dx = event.clientX - gesture.x;
  gesture.dy = event.clientY - gesture.y;
  gesture.lastX = event.clientX;
  gesture.lastY = event.clientY;
  if (!airborne && gesture.deckLocalX !== null && gesture.deckLocalX < -0.22 &&
      gesture.dy > 12 && performance.now() - gesture.startTime > 260) {
    // A slow backward pull on the tail holds a manual; pull distance sets height.
    gesture.manualGesture = true;
    manualActive = true;
    manualAngle = THREE.MathUtils.clamp((gesture.dy - 12) / 125, 0, 0.48);
  }
  if (!airborne && gesture.manualGesture && Math.abs(gesture.dx) > 5) {
    // During a manual, horizontal movement controls a sharper rear-wheel pivot.
    touchSteer = THREE.MathUtils.clamp(-gesture.dx / 58, -1, 1);
  } else if (!airborne && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.7) {
    touchSteer = THREE.MathUtils.clamp(-gesture.dx / 78, -1, 1);
  }
});
function finishGesture(event) {
  if (!gesture || gesture.id !== event.pointerId) return;
  const g = gesture;
  const elapsed = Math.max(1, performance.now() - g.startTime);
  const dx = event.clientX - g.x;
  const dy = event.clientY - g.y;
  const quick = elapsed < 420;
  if (airborne && quick && Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.15) {
    flick(dx > 0 ? 1 : -1, Math.abs(dx));
  } else if (!airborne && !g.manualGesture && g.deckLocalX !== null && quick && Math.abs(dy) > 38) {
    // Only a quick flick that begins on the deck can pop the board.
    // Flick down = ollie; flick up = nollie.
    if (dy > 0) pop('ollie');
    else pop('nollie');
  } else if (!airborne && g.deckLocalX === null && Math.abs(dy) > 38) {
    // Vertical swipes beginning beside the board are pushes, not tricks.
    // Drag down = forward; drag up = backward, regardless of swipe speed.
    const direction = dy > 0 ? 1 : -1;
    velocity.addScaledVector(forwardVector(), direction * 2.8);
    const current = velocity.length();
    if (current > maxSpeed) velocity.multiplyScalar(maxSpeed / current);
  }
  // Steering is only applied while the finger is held down; release returns
  // the board to neutral instead of leaving it carving in a permanent circle.
  touchSteer = 0;
  manualActive = false;
  manualAngle = 0;
  gesture = null;
}
canvas.addEventListener('pointerup', finishGesture);
canvas.addEventListener('pointercancel', () => {
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
    if (!airborne) {
      // A manual kickturn pivots sharply around the rear wheels while the
      // tail stays lifted; normal carving keeps its usual, smoother response.
      const kickturnMultiplier = manualActive ? 2.35 : 1;
      heading += steer * (manualActive ? -1 : 1) * (0.30 + currentSpeed * 0.105) * kickturnMultiplier * dt;
      const desired = forwardVector().multiplyScalar(currentSpeed);
      // Preserve momentum during a manual pivot so it feels like a kickturn,
      // rather than instantly redirecting the whole board like a normal carve.
      const redirectRate = manualActive ? 0.48 : (0.95 + currentSpeed * 0.10);
      velocity.lerp(desired, 1 - Math.exp(-redirectRate * dt));
      if (braking) velocity.multiplyScalar(Math.exp(-3.2 * dt));
      else velocity.multiplyScalar(Math.exp(-0.14 * dt));
      const targetDeckPitch = (manualActive ? manualAngle : 0) - steer * 0.075;
      board.rotation.z = THREE.MathUtils.damp(board.rotation.z, targetDeckPitch, manualActive ? 12 : 7, dt);
      const targetKickturnLean = manualActive ? steer * 0.17 : steer * 0.035;
      board.rotation.x = THREE.MathUtils.damp(board.rotation.x, targetKickturnLean, manualActive ? 10 : 7, dt);
    } else {
      // Limited air control; momentum remains mostly conserved.
      heading += steer * 0.32 * dt;
      velocity.multiplyScalar(Math.exp(-0.02 * dt));
      airTime += dt;
      flipVelocity *= Math.exp(-0.12 * dt);
      board.rotation.x += flipVelocity * dt;
      // Shuvit rotation spins the whole deck around its vertical axis.
      if (Math.abs(shuvitVelocity) > 0.01) {
        const remaining = shuvitTarget - shuvitRotation;
        const direction = Math.sign(shuvitTarget || shuvitVelocity);
        if (Math.abs(remaining) < 0.08) {
          shuvitRotation = shuvitTarget;
          shuvitVelocity = 0;
        } else {
          const brakingDistance = (shuvitVelocity * shuvitVelocity) / (2 * 34);
          if (Math.abs(remaining) <= brakingDistance) {
            shuvitVelocity -= direction * 34 * dt;
          }
          shuvitRotation += shuvitVelocity * dt;
          if (Math.sign(shuvitTarget - shuvitRotation) !== direction) {
            shuvitRotation = shuvitTarget;
            shuvitVelocity = 0;
          }
        }
      }
      // Let the pop impulse pitch the deck, then naturally settle it toward level.
      pitchVelocity += (-board.rotation.z * 8 - pitchVelocity * 3) * dt;
      board.rotation.z += pitchVelocity * dt;
    }

    board.position.x += velocity.x * dt;
    board.position.z += velocity.z * dt;
    speed = velocity.length();

    if (airborne) {
      board.position.y += verticalVelocity * dt;
      verticalVelocity -= gravity * dt;
      if (board.position.y <= 0 && verticalVelocity < 0) {
        board.position.y = 0;
        const completedFlip = Math.abs(board.rotation.x) > Math.PI * 1.55;
        const flipAligned = Math.abs(Math.sin(board.rotation.x / 2)) < 0.38;
        const pitchAligned = Math.abs(board.rotation.z) < 0.48;
        const shuvitComplete = !shuvitTarget ||
          (Math.abs(shuvitRotation) >= Math.abs(shuvitTarget) * 0.94 &&
           Math.abs(Math.sin(shuvitRotation / 2)) < 0.34);
        if ((!flipVelocity || (completedFlip && flipAligned)) && pitchAligned && shuvitComplete) {
          board.rotation.x = 0;
          board.rotation.z = 0;
          manualActive = false;
          manualAngle = 0;
          airborne = false;
          verticalVelocity = 0;
          flipVelocity = 0;
          shuvitVelocity = 0;
          shuvitRotation = 0;
          shuvitTarget = 0;
          pitchVelocity = 0;
          lastLandTime = clock.elapsedTime;
          velocity.multiplyScalar(0.97);
        } else {
          resetBoard();
        }
      }
    }
  }

  board.rotation.y = heading - Math.PI / 2 + (airborne ? shuvitRotation : 0);
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
