import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// Minimal monochrome blockout: only the 3D skatepark and skateboard are shown.
const mount = document.getElementById('game');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91d9f2);
scene.fog = new THREE.Fog(0x91d9f2, 42, 112);
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
// Keep GPU memory and fill-rate within mobile Safari limits.
let renderPixelRatio = Math.min(devicePixelRatio || 1, 2);
renderer.setPixelRatio(renderPixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
mount.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x66513f, 1.25));
const keyLight = new THREE.DirectionalLight(0xffedcf, 3.7);
keyLight.position.set(-18, 28, -16);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(3072, 3072);
keyLight.shadow.camera.left = -34;
keyLight.shadow.camera.right = 34;
keyLight.shadow.camera.top = 34;
keyLight.shadow.camera.bottom = -34;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 75;
keyLight.shadow.normalBias = 0.035;
keyLight.shadow.bias = -0.00012;
keyLight.shadow.radius = 3;
scene.add(keyLight);

// High-resolution weathered concrete and obstacle textures, generated locally.
// Broad irregular stains remain dominant; fine aggregate grain and abrasion
// add close-up detail without introducing a regular repeating visual pattern.
function makeWeatheredConcreteTexture(base, darkTones, lightTones, size = 2048, addMoss = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  let seed = 918273;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  // Large soft-edged patches of grime and water staining, not speckled grain.
  for (let i = 0; i < 150; i++) {
    const x = random() * size, y = random() * size;
    const rx = 18 + random() * 115, ry = 12 + random() * 82;
    const tone = darkTones[Math.floor(random() * darkTones.length)];
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry));
    gradient.addColorStop(0, tone + '88');
    gradient.addColorStop(0.58, tone + '42');
    gradient.addColorStop(1, tone + '00');
    ctx.fillStyle = gradient;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Short, narrow wheel-polished marks: fewer, sharper and more visible.
  for (let i = 0; i < 14; i++) {
    const x = random() * size, y = random() * size;
    ctx.globalAlpha = 0.26 + random() * 0.18;
    ctx.strokeStyle = lightTones[Math.floor(random() * lightTones.length)];
    ctx.lineWidth = 0.45 + random() * 0.65;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + (random() - 0.5) * 34, y + (random() - 0.5) * 20,
      x + (random() - 0.5) * 24, y + (random() - 0.5) * 14,
      x + (random() - 0.5) * 42, y + (random() - 0.5) * 22
    );
    ctx.stroke();
  }

  // A handful of fine branching hairline cracks, with moss tucked into
  // selected sections of the fissures instead of outlining every crack.
  for (let i = 0; i < 18; i++) {
    let x = random() * size, y = random() * size;
    const steps = 3 + Math.floor(random() * 5);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let p = 0; p < steps; p++) {
      x += (random() - 0.5) * 92; y += 5 + random() * 22;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#343a3b'; ctx.globalAlpha = 0.28 + random() * 0.22;
    ctx.lineWidth = 0.7 + random() * 1.1; ctx.stroke();
    if (random() > 0.42) {
      ctx.strokeStyle = '#454b4e'; ctx.globalAlpha = 0.42;
      ctx.lineWidth = 0.8 + random() * 1.1; ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Visible but fine aggregate grain, like exposed sand and tiny stone in old concrete.
  for (let i = 0; i < 18500; i++) {
    const x = random() * size, y = random() * size;
    ctx.globalAlpha = 0.035 + random() * 0.105;
    ctx.fillStyle = random() > 0.5 ? '#c2c6c5' : '#343a3c';
    const r = 0.35 + random() * 1.45;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.45 + random() * 0.7), random(), 0, Math.PI * 2); ctx.fill();
  }

  // Organic moss colonies with separate, irregular green mineral halos.
  // Each colony has a denser rough centre and soft, broken edges; surrounding
  // stains drift different distances away instead of forming neat outlines.
  if (addMoss) {
    const greens = ['#526b3b', '#607747', '#71804b', '#485f3c', '#687b49'];
    for (let i = 0; i < 92; i++) {
      const x = random() * size, y = random() * size;
      const rx = 82 + random() * 175, ry = rx * (0.48 + random() * 0.58);
      const green = greens[Math.floor(random() * greens.length)];

      // Uneven multi-lobed silhouette rather than a perfect circular spot.
      ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
      const moss = ctx.createRadialGradient(-rx * 0.12, -rx * 0.08, rx * 0.12, 0, 0, rx * 1.08);
      moss.addColorStop(0, green + 'b8');
      moss.addColorStop(0.48, green + '92');
      moss.addColorStop(0.78, green + '55');
      moss.addColorStop(1, green + '00');
      ctx.fillStyle = moss;
      ctx.beginPath();
      const points = 18;
      for (let p = 0; p < points; p++) {
        const a = p / points * Math.PI * 2;
        const wobble = 0.72 + random() * 0.48;
        const px = Math.cos(a) * rx * wobble;
        const py = Math.sin(a) * rx * wobble;
        if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();

      // Independent faded stains scattered around each moss colony.
      const stainCount = 2 + Math.floor(random() * 5);
      for (let k = 0; k < stainCount; k++) {
        const angle = random() * Math.PI * 2;
        const distance = rx * (0.55 + random() * 1.65);
        const sx = x + Math.cos(angle) * distance;
        const sy = y + Math.sin(angle) * distance * (ry / rx);
        const sr = 28 + random() * 105;
        const sry = sr * (0.35 + random() * 0.9);
        const stainGreen = greens[Math.floor(random() * greens.length)];
        const halo = ctx.createRadialGradient(sx, sy, 1, sx, sy, sr);
        halo.addColorStop(0, stainGreen + '65');
        halo.addColorStop(0.42, stainGreen + '3d');
        halo.addColorStop(0.78, stainGreen + '18');
        halo.addColorStop(1, stainGreen + '00');
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(random() * Math.PI);
        ctx.scale(1, sry / sr);
        ctx.fillStyle = halo; ctx.beginPath();
        ctx.ellipse(0, 0, sr, sr * (0.55 + random() * 0.55), 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      }

      // Fine, irregular mineral and moss grain concentrated within the colony.
      for (let j = 0; j < 340; j++) {
        const px = x + (random() - 0.5) * rx * 1.65;
        const py = y + (random() - 0.5) * ry * 1.65;
        ctx.globalAlpha = 0.10 + random() * 0.20;
        ctx.fillStyle = random() > 0.5 ? '#82915a' : '#354d32';
        const r = 0.45 + random() * 1.45;
        ctx.beginPath(); ctx.ellipse(px, py, r, r * (0.5 + random()), random(), 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Green growth follows every slab joint. The bands are deliberately broken,
  // with mossy clumps on the seam and wider faded mineral stains drifting away.
  if (addMoss) {
    const jointStep = size / 15; // 8 m slabs across the 120 m ground
    const jointGreens = ['#526d3d', '#66804a', '#74834d', '#405b38'];
    for (let axis = 0; axis < 2; axis++) {
      for (let seam = 0; seam <= 15; seam++) {
        const line = seam * jointStep;
        for (let along = -size * 0.05; along < size * 1.05; along += 92) {
          const cx = axis === 0 ? along : line + (random() - 0.5) * 18;
          const cy = axis === 0 ? line + (random() - 0.5) * 18 : along;
          const length = 34 + random() * 118;
          const width = 7 + random() * 27;
          const green = jointGreens[Math.floor(random() * jointGreens.length)];
          const angle = (random() - 0.5) * 0.42 + (axis === 0 ? 0 : Math.PI / 2);

          // Broad, translucent halo first, so staining fades naturally into concrete.
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
          const halo = ctx.createRadialGradient(0, 0, width * 0.15, 0, 0, length);
          halo.addColorStop(0, green + '48');
          halo.addColorStop(0.48, green + '28');
          halo.addColorStop(1, green + '00');
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.ellipse(0, 0, length, width * (1.8 + random() * 2.8), 0, 0, Math.PI * 2); ctx.fill();

          // Denser, uneven moss directly along the seam in irregular clusters.
          if (random() > 0.12) {
            const core = ctx.createRadialGradient(0, 0, 1, 0, 0, length * 0.78);
            core.addColorStop(0, green + 'c0');
            core.addColorStop(0.55, green + '86');
            core.addColorStop(1, green + '00');
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.ellipse(0, (random() - 0.5) * width, length * (0.38 + random() * 0.45), width * (0.45 + random() * 0.8), 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      }
    }
    // Grainy flecks make the green staining look embedded and organic.
    for (let i = 0; i < 26000; i++) {
      const x = random() * size, y = random() * size;
      ctx.globalAlpha = 0.10 + random() * 0.22;
      ctx.fillStyle = random() > 0.48 ? '#82915a' : '#354d32';
      const r = 0.45 + random() * 1.5;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.45 + random()), random(), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Heavier, irregular scratches and dragged wheel scuffs.
  for (let i = 0; i < 4600; i++) {
    const x = random() * size, y = random() * size;
    const length = 4 + random() * 68;
    ctx.globalAlpha = 0.13 + random() * 0.25;
    ctx.strokeStyle = random() > 0.24
      ? darkTones[Math.floor(random() * darkTones.length)]
      : lightTones[Math.floor(random() * lightTones.length)];
    ctx.lineWidth = 0.45 + random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (random() - 0.5) * 3.5);
    ctx.stroke();
  }

  // Occasional longer hairline abrasions, softened into the concrete surface.
  for (let i = 0; i < 360; i++) {
    const x = random() * size, y = random() * size;
    ctx.globalAlpha = 0.12 + random() * 0.16;
    ctx.strokeStyle = darkTones[Math.floor(random() * darkTones.length)];
    ctx.lineWidth = 0.7 + random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14 + random() * 72, y + (random() - 0.5) * 9);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  // Map the complete 4096px texture across the 120m ground; the former
  // 0.01 repeat sampled only a small central fraction and hid most moss.
  texture.repeat.set(1 / 19.2, 1 / 19.2);
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  return texture;
}
const concreteTexture = makeWeatheredConcreteTexture(
  '#696e71', ['#343a3d', '#41474a', '#4b5154', '#555b5e'],
  ['#929799', '#858b8e', '#777e81'], 4096, true
);
const asphaltTexture = concreteTexture;
const obstacleTexture = makeWeatheredConcreteTexture(
  '#c87943', ['#754a35', '#89563d', '#a66b4b'],
  ['#e0a477', '#d18d60', '#bd7950'], 2048
);
// Obstacle UVs are local 0–1, so use the full texture once per surface.
obstacleTexture.repeat.set(1, 1);
// On obstacle side faces, moss gathers at the foot of the concrete and creeps
// upward in broken, uneven tongues. This is part of the texture, not geometry.
function addBaseMossToObstacleTexture(texture) {
  const ctx = texture.image.getContext('2d');
  let seed = 381927;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const size = texture.image.width;
  for (let i = 0; i < 38; i++) {
    const x = random() * size, y = size * (0.76 + random() * 0.22);
    const width = 34 + random() * 150, height = 30 + random() * 96;
    const stain = ctx.createRadialGradient(x, y, 1, x, y, width);
    stain.addColorStop(0, '#526f4388'); stain.addColorStop(0.55, '#66814c55'); stain.addColorStop(1, '#66814c00');
    ctx.fillStyle = stain; ctx.beginPath(); ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ['#526b3b','#637d45','#75884c'][Math.floor(random() * 3)];
    ctx.globalAlpha = 0.62; ctx.beginPath(); ctx.moveTo(x - width * 0.5, y);
    for (let p = 0; p <= 8; p++) ctx.lineTo(x - width * 0.5 + width * p / 8, y - random() * height * (p % 2 ? 0.45 : 1.2));
    ctx.lineTo(x + width * 0.5, y + height * 0.3); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  }
  texture.needsUpdate = true;
}
addBaseMossToObstacleTexture(obstacleTexture);

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
  floor: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.075, roughness: 0.98 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, bumpMap: concreteTexture, bumpScale: 0.075, roughness: 0.97 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x45413d, roughness: 0.92 }),
  board: new THREE.MeshStandardMaterial({ color: 0x514078, metalness: 0.2, roughness: 0.42 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x263447, roughness: 1 }),
  metal: new THREE.MeshPhysicalMaterial({ color: 0xe0e5eb, metalness: 0.72, roughness: 0.19, clearcoat: 0.85, clearcoatRoughness: 0.12 }),
  outline: new THREE.LineBasicMaterial({ color: 0x40556a }),
  accentMint: new THREE.MeshStandardMaterial({ color: 0xffffff, map: obstacleTexture, bumpMap: obstacleTexture, bumpScale: 0.075, roughness: 0.96 }),
  accentCoral: new THREE.MeshStandardMaterial({ color: 0xffffff, map: obstacleTexture, bumpMap: obstacleTexture, bumpScale: 0.075, roughness: 0.96 }),
  accentLavender: new THREE.MeshStandardMaterial({ color: 0xffffff, map: obstacleTexture, bumpMap: obstacleTexture, bumpScale: 0.075, roughness: 0.96 }),
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
  rod.castShadow = true;
  rod.receiveShadow = true;
  scene.add(rod);
  solidObstacles.push(rod);
  grindRails.push(rod);
  addGrindEdge({ x, z: z - length / 2 }, { x, z: z + length / 2 }, height, 'rail');
  for (const offset of [-length / 2 + 0.18, length / 2 - 0.18]) {
    const support = outlinedBox(scene, 0.13, height, 0.13, mats.dark, x, height / 2, z + offset);
    support.userData.isRailSupport = true;
  }
}

// Two-level open skate landscape. Previous bowls, rails and obstacles
// are removed; this is an empty foundation for later placement.
// World coordinates are metres: X east/west, Z north/south.
const quarterPipes = [];
const rampSurfaces = [];
const bowl = { x: 0, z: 0, radiusX: 0, radiusZ: 0, depth: 0, deepExtra: 0, shallowCut: 0, flatRatio: 0 };
function bowlOutlineScale() { return 1; }
function bowlHeightAt() { return 0; }
function bowlDepthAtAngle() { return 0; }
function addSurfaceGrid() {}
function terrainHeightAt(x, z) {
  // Existing second-level terrain and its broad descent to the lower ground.
  const t = THREE.MathUtils.clamp((x + 15) / 10, 0, 1);
  const eased = t * t * (3 - 2 * t);
  const base = 3.2 * (1 - eased);

  // Flat upper platform: X=-60..-20, Z=25..60, with a soft outer edge.
  const zStartT = THREE.MathUtils.clamp((z - 25) / 3, 0, 1);
  const zStart = zStartT * zStartT * (3 - 2 * zStartT);
  const zEndT = THREE.MathUtils.clamp((63 - z) / 3, 0, 1);
  const zEnd = zEndT * zEndT * (3 - 2 * zEndT);
  const platformZFade = zStart * zEnd;
  const highSide = 5.0 * platformZFade + base * (1 - platformZFade);

  // One steep, continuous berm face across X=-20..-10, running the full Z
  // length. Blend directly into the existing base height: this removes the
  // competing max() surface that created a ridge/bump at the join. Because
  // the blend reaches 1 with a zero derivative, both height and slope meet
  // the base terrain smoothly at X=-10.
  const rampT = THREE.MathUtils.clamp((x + 20) / 10, 0, 1);
  const rampEase = rampT * rampT * (3 - 2 * rampT);
  const bermRamp = highSide * (1 - rampEase) + base * rampEase;

  if (x < -20) return highSide;
  if (x <= -10) return bermRamp;
  return base;
}
function groundHeightAt(x, z) { return terrainHeightAt(x, z); }

// Return the vertical correction needed for the lowest part of the board to
// meet the terrain. Positive means the board has penetrated the ground;
// negative means it is still above the surface. Sample each mesh's world-space
// bounding-box corners so wheels, deck and rotated trick landings are included.
function groundContactCorrection() {
  if (!board) return -Infinity;
  board.updateMatrixWorld(true);
  let lowestClearance = Infinity;
  const worldPoint = new THREE.Vector3();
  const corner = new THREE.Vector3();
  board.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    const geometry = object.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const bounds = geometry.boundingBox;
    if (!bounds || !Number.isFinite(bounds.min.y) || !Number.isFinite(bounds.max.y)) return;
    for (let ix = 0; ix < 2; ix++) {
      for (let iy = 0; iy < 2; iy++) {
        for (let iz = 0; iz < 2; iz++) {
          corner.set(
            ix ? bounds.max.x : bounds.min.x,
            iy ? bounds.max.y : bounds.min.y,
            iz ? bounds.max.z : bounds.min.z
          );
          worldPoint.copy(corner).applyMatrix4(object.matrixWorld);
          const clearance = worldPoint.y - terrainHeightAt(worldPoint.x, worldPoint.z);
          if (clearance < lowestClearance) lowestClearance = clearance;
        }
      }
    }
  });
  return lowestClearance === Infinity ? -Infinity : -lowestClearance;
}
function rampAngleAt() { return 0; }
const terrainPositions = [], terrainUvs = [], terrainIndices = [];
const terrainSegments = 336, terrainMin = -60, terrainMax = 60;
for (let iz = 0; iz <= terrainSegments; iz++) {
  const z = terrainMin + (terrainMax - terrainMin) * iz / terrainSegments;
  for (let ix = 0; ix <= terrainSegments; ix++) {
    const x = terrainMin + (terrainMax - terrainMin) * ix / terrainSegments;
    terrainPositions.push(x, terrainHeightAt(x, z), z);
    terrainUvs.push(x * 0.16, z * 0.16);
  }
}
for (let iz = 0; iz < terrainSegments; iz++) for (let ix = 0; ix < terrainSegments; ix++) {
  const a = iz * (terrainSegments + 1) + ix, b = a + terrainSegments + 1;
  terrainIndices.push(a, b, a + 1, b, b + 1, a + 1);
}
const terrainGeometry = new THREE.BufferGeometry();
terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(terrainPositions, 3));
terrainGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(terrainUvs, 2));
terrainGeometry.setIndex(terrainIndices);
terrainGeometry.computeVertexNormals();
const terrain = new THREE.Mesh(terrainGeometry, mats.concrete);
terrain.receiveShadow = true; terrain.castShadow = true; scene.add(terrain);
function addConcreteJoints() {
  const jointMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, metalness: 0
  });
  const mossMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x405b31, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x526b39, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x687b43, roughness: 1 })
  ];

  // A shallow concave profile is drawn directly over the slab surface.
  // Its dark centre and graduated rounded shoulders make the cut readable
  // without adding a raised strip above the concrete.
  const addJoint = (axis, fixed) => {
    const cross = [-0.145, -0.112, -0.078, -0.044, 0, 0.044, 0.078, 0.112, 0.145];
    const shades = [
      [0.39, 0.41, 0.42], [0.30, 0.32, 0.33], [0.20, 0.22, 0.23],
      [0.105, 0.12, 0.12], [0.055, 0.065, 0.065],
      [0.105, 0.12, 0.12], [0.20, 0.22, 0.23], [0.30, 0.32, 0.33],
      [0.39, 0.41, 0.42]
    ];
    const positions = [], colors = [], indices = [];
    const segments = 240;
    for (let i = 0; i <= segments; i++) {
      const t = -60 + (120 * i / segments);
      for (let j = 0; j < cross.length; j++) {
        const x = axis === 'x' ? t : fixed + cross[j];
        const z = axis === 'x' ? fixed + cross[j] : t;
        positions.push(x, terrainHeightAt(x, z) + 0.006, z);
        colors.push(...shades[j]);
        if (i < segments && j < cross.length - 1) {
          const a = i * cross.length + j, b = a + cross.length;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, jointMaterial);
    mesh.receiveShadow = true;
    mesh.renderOrder = 2;
    scene.add(mesh);
  };

  // Recessed rounded joints, visible as dark concave seams rather than ridges.
  for (let p = -56; p <= 56; p += 8) {
    addJoint('x', p);
    addJoint('z', p);
  }


}
addConcreteJoints();
// No obstacle constructors are called in this foundation build.
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
deck.position.y = 0.395;
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
  color: 0x514078,
  metalness: 0.12,
  roughness: 0.48,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  depthWrite: false
});
makeDeckTop(0.992, 0.985, deckTopMaterial, 0.009, 3);

// A separate mapped face on the actual underside. This avoids relying on the
// extruded deck's side-face UVs, which caused the default artwork to show instead.
const undersideGraphicMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: boardGraphicTexture,
  metalness: 0.12,
  roughness: 0.48,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  depthWrite: false
});
makeDeckTop(0.992, 0.985, undersideGraphicMaterial, -0.109, 4);

/* Board graphic customisation: procedural, high-resolution deck artwork. */
const deckGraphicState = {
  category: 'Vintage',
  design: 0,
  graffitiStyle: 0,
  message: 'YOUR TEXT',
  colorA: '#f5c542',
  colorB: '#e64c35',
  outline: '#111111',
  deckColor: '#514078',
  fade: 'Vertical fade'
};
const deckGraphicCatalog = {
  Vintage: ['Skull & Roses','Flaming Panther','Retro Racing','Broken Heart','Lucky Dice','Desert Sunset','Classic Eagle','Wild Tiger','Vintage Comic','Snake Bite','Old School Star','Distressed Badge'],
  Japanese: ['Rising Dragon','Koi Current','Oni Mask','Samurai Spirit','Great Wave','Hannya Bloom','Crane & Sun','Tiger Scroll','Lotus Garden','Kabuki Eyes','Mountain Shrine','Serpent Seal'],
  Psychedelic: ['Liquid Dream','Warped Reality','Melting Smile','Cosmic Garden','Swirl Theory','Electric Daze','Prism Trip','Acid Bloom','Fever Dream','Neon Mirage','Solar Flare','Chromatic Maze','Jelly Vision','Hypnotic Eye','Space Ritual','Colour Collapse','Dream Spiral','Vapor Trails','Freak Scene','Infinity Melt','Magic Mushroom','Sonic Bloom','Kaleidoscope','Lunar Ooze']
};
const graffitiStyleNames = ['Wildstyle','Bubble letters','Throw-up','Block letters','Tag script','Chrome burner','Drip letters','3D extrusion','Stencil','Brush marker','Sharpie tag','Blackletter','Rounded bold','Inline racing','Speed slant','Hollow outline','Retro sign','Angular tech','Fat cap','Stacked wildstyle'];
const graffitiFonts = ['900 142px Impact','900 150px Arial Black,Arial','900 150px Impact','900 142px Arial Black,Arial','italic 900 145px cursive','900 145px Impact','900 145px Impact','900 145px Arial Black,Arial','900 145px Impact','italic 900 145px Georgia','italic 900 145px Arial','900 132px Georgia','900 150px Arial Rounded MT Bold,Arial','italic 900 145px Impact','italic 900 145px Impact','900 145px Arial Black,Arial','900 138px Georgia','900 140px Arial Black,Arial','900 150px Impact','italic 900 140px Impact'];
const fadeStyles = ['Vertical fade','Dot fade','Metallic fade','Liquid fade','Flame fade','Neon fade','Spray fade','Holographic fade','Checker fade','Cracked fade','Sunburst fade','Striped fade','Halftone fade','Iridescent fade','Marble fade'];
function graphicRandom(seed) {
  let n=seed>>>0;
  return ()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
}
function drawDeckGraphic(canvas, topSide) {
  const ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
  const st=deckGraphicState, rnd=graphicRandom(92831+st.design*7919+(st.category==='Japanese'?2200:st.category==='Psychedelic'?4400:st.category==='Graffiti'?6600:0));
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=st.deckColor;ctx.fillRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#ffffff18');bg.addColorStop(.5,'#00000008');bg.addColorStop(1,'#00000030');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const palette=[st.colorA,st.colorB,'#f3e6c8','#202020','#e9e1d2'];
  if(st.category==='Graffiti'){
    const text=st.message.trim()||'YOUR TEXT';
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-0.045);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=graffitiFonts[st.graffitiStyle];
    let size=142;while(ctx.measureText(text).width>W*.82&&size>36){size-=5;ctx.font=graffitiFonts[st.graffitiStyle].replace(/\d+px/,size+'px');}
    let grad;
    if(st.fade==='Metallic fade'){
      grad=ctx.createLinearGradient(0,-110,0,110);grad.addColorStop(0,'#fff');grad.addColorStop(.16,st.colorA);grad.addColorStop(.34,'#fff');grad.addColorStop(.52,st.colorB);grad.addColorStop(.68,'#555');grad.addColorStop(.82,'#fff');grad.addColorStop(1,st.colorA);
    } else if(st.fade==='Neon fade'||st.fade==='Holographic fade'||st.fade==='Iridescent fade'){
      grad=ctx.createLinearGradient(-W*.4,-100,W*.4,100);grad.addColorStop(0,st.colorA);grad.addColorStop(.35,st.colorB);grad.addColorStop(.62,'#fff');grad.addColorStop(1,st.colorA);
    } else if(st.fade==='Sunburst fade'){
      grad=ctx.createRadialGradient(-80,-30,10,0,0,W*.6);grad.addColorStop(0,st.colorA);grad.addColorStop(1,st.colorB);
    } else {
      grad=ctx.createLinearGradient(0,-120,0,120);grad.addColorStop(0,st.colorA);grad.addColorStop(1,st.colorB);
    }
    ctx.shadowColor='#000';ctx.shadowBlur=18;ctx.shadowOffsetX=13;ctx.shadowOffsetY=17;
    ctx.fillStyle=grad;ctx.fillText(text,0,0,W*.86);
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    if(['Dot fade','Halftone fade','Checker fade','Striped fade','Cracked fade','Marble fade','Liquid fade','Flame fade','Spray fade'].includes(st.fade)){
      const overlay=document.createElement('canvas');overlay.width=W;overlay.height=H;
      const o=overlay.getContext('2d');
      if(st.fade==='Dot fade'||st.fade==='Halftone fade'){
        for(let y=0;y<H;y+=18)for(let x=0;x<W;x+=18){o.fillStyle='#111';o.globalAlpha=.2+(y/H)*.55;o.beginPath();o.arc(x,y,2+(y/H)*8,0,Math.PI*2);o.fill();}o.globalAlpha=1;
      } else if(st.fade==='Checker fade'){
        for(let y=0;y<H;y+=34)for(let x=0;x<W;x+=34)if((Math.floor(x/34)+Math.floor(y/34))%2===0){o.fillStyle='#fff';o.globalAlpha=.35;o.fillRect(x,y,34,34);}o.globalAlpha=1;
      } else if(st.fade==='Striped fade'){
        o.strokeStyle='#fff';o.globalAlpha=.42;o.lineWidth=12;for(let x=-H;x<W;x+=38){o.beginPath();o.moveTo(x,0);o.lineTo(x+H,H);o.stroke();}o.globalAlpha=1;
      } else if(st.fade==='Cracked fade'||st.fade==='Marble fade'||st.fade==='Liquid fade'){
        o.strokeStyle='#fff';o.globalAlpha=.42;o.lineWidth=6;for(let n=0;n<34;n++){let x=rnd()*W,y=rnd()*H;o.beginPath();o.moveTo(x,y);o.bezierCurveTo(x+70,y-90,x-80,y+100,x+150,y+30);o.stroke();}o.globalAlpha=1;
      } else if(st.fade==='Flame fade'){
        for(let n=0;n<24;n++){const x=rnd()*W;o.fillStyle=n%2?st.colorA:st.colorB;o.globalAlpha=.55;o.beginPath();o.moveTo(x,H);o.quadraticCurveTo(x-55,H*.55,x+20,rnd()*H*.1);o.quadraticCurveTo(x+75,H*.55,x+42,H);o.fill();}o.globalAlpha=1;
      } else if(st.fade==='Spray fade'){
        for(let n=0;n<1100;n++){o.fillStyle=n%2?st.colorA:st.colorB;o.globalAlpha=.3+rnd()*.55;o.beginPath();o.arc(rnd()*W,rnd()*H,1+rnd()*8,0,Math.PI*2);o.fill();}o.globalAlpha=1;
      }
      const mask=document.createElement('canvas');mask.width=W;mask.height=H;
      const m=mask.getContext('2d');m.translate(W/2,H/2);m.rotate(-0.045);m.textAlign='center';m.textBaseline='middle';m.font=ctx.font;m.fillStyle='#fff';m.fillText(text,0,0,W*.86);
      o.globalCompositeOperation='destination-in';o.drawImage(mask,0,0);
      ctx.drawImage(overlay,-W/2,-H/2);
    }
    ctx.lineJoin='round';ctx.lineWidth=34;ctx.strokeStyle=st.outline;ctx.strokeText(text,0,0,W*.86);
    ctx.restore();
    ctx.restore();
    // Fixed natural drop shadow is part of the lettering; outline is only black or white.
    ctx.textAlign='center';ctx.font='bold 30px Arial';ctx.fillStyle='#ffffffaa';ctx.fillText(st.graffitiStyleNames||'',W/2,H*.84);
  } else {
    const cat=st.category, idx=st.design;
    ctx.save();ctx.translate(W/2,H/2);
    if(cat==='Vintage'){
      // Each catalogue entry has its own central illustration, not just a changed title.
      const labels=['SKULL & ROSES','FLAMING PANTHER','RETRO RACING','BROKEN HEART','LUCKY DICE','DESERT SUNSET','CLASSIC EAGLE','WILD TIGER','VINTAGE COMIC','SNAKE BITE','OLD SCHOOL STAR','DISTRESSED BADGE'];
      ctx.fillStyle=idx%2?'#171717':'#f1dfbd';ctx.globalAlpha=.24;ctx.fillRect(-W/2,-H/2,W,H);ctx.globalAlpha=1;
      ctx.save();ctx.translate(0,-55);ctx.strokeStyle=palette[(idx+1)%2];ctx.fillStyle=palette[(idx+1)%2];ctx.lineWidth=24;
      if(idx===0){
        ctx.beginPath();ctx.arc(0,-20,125,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#171717';ctx.beginPath();ctx.arc(-43,-38,24,0,Math.PI*2);ctx.arc(43,-38,24,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(-48,55);ctx.lineTo(48,55);ctx.lineTo(30,120);ctx.lineTo(-30,120);ctx.closePath();ctx.fill();
        ctx.strokeStyle=palette[0];ctx.lineWidth=17;for(const x of [-95,0,95]){ctx.beginPath();ctx.moveTo(x,105);ctx.bezierCurveTo(x-90,180,x+90,195,x+15,245);ctx.stroke();}
      }else if(idx===1){
        ctx.beginPath();ctx.moveTo(-145,-100);ctx.lineTo(-75,-175);ctx.lineTo(-25,-90);ctx.quadraticCurveTo(0,-120,25,-90);ctx.lineTo(75,-175);ctx.lineTo(145,-100);ctx.quadraticCurveTo(175,80,0,145);ctx.quadraticCurveTo(-175,80,-145,-100);ctx.fill();
        ctx.fillStyle='#171717';ctx.beginPath();ctx.ellipse(-55,-5,22,13,0,0,Math.PI*2);ctx.ellipse(55,-5,22,13,0,0,Math.PI*2);ctx.fill();
      }else if(idx===2){
        ctx.font='900 330px Impact';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('94',0,5);
        ctx.strokeStyle=palette[0];ctx.lineWidth=24;for(let n=0;n<4;n++){ctx.beginPath();ctx.moveTo(-300,105+n*38);ctx.lineTo(300,105+n*38);ctx.stroke();}
      }else if(idx===3){
        ctx.beginPath();ctx.moveTo(0,135);ctx.bezierCurveTo(-330,-60,-170,-230,0,-95);ctx.bezierCurveTo(170,-230,330,-60,0,135);ctx.fill();
        ctx.strokeStyle='#171717';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(0,-130);ctx.lineTo(-30,-15);ctx.lineTo(35,25);ctx.lineTo(-12,135);ctx.stroke();
      }else if(idx===4){
        for(const x of [-95,95]){ctx.save();ctx.translate(x,0);ctx.rotate(-.12);ctx.fillRect(-72,-112,144,224);ctx.fillStyle='#171717';for(const [dx,dy] of [[-35,-65],[35,-65],[0,0],[-35,65],[35,65]]){ctx.beginPath();ctx.arc(dx,dy,13,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.fillStyle=palette[(idx+1)%2];}
      }else if(idx===5){
        ctx.beginPath();ctx.arc(0,-5,135,0,Math.PI*2);ctx.fill();ctx.strokeStyle=palette[0];ctx.lineWidth=25;
        for(let a=0;a<Math.PI*2;a+=Math.PI/8){ctx.beginPath();ctx.moveTo(Math.cos(a)*155,Math.sin(a)*155-5);ctx.lineTo(Math.cos(a)*235,Math.sin(a)*235-5);ctx.stroke();}
        ctx.strokeStyle='#171717';ctx.lineWidth=18;for(let n=0;n<5;n++){ctx.beginPath();ctx.moveTo(-260,80+n*35);ctx.quadraticCurveTo(0,20+n*35,260,80+n*35);ctx.stroke();}
      }else if(idx===6){
        ctx.beginPath();ctx.moveTo(0,-150);ctx.bezierCurveTo(-85,-90,-160,-170,-270,-80);ctx.bezierCurveTo(-210,35,-110,90,0,65);ctx.bezierCurveTo(110,90,210,35,270,-80);ctx.bezierCurveTo(160,-170,85,-90,0,-150);ctx.fill();
        ctx.fillStyle='#171717';ctx.beginPath();ctx.moveTo(0,-80);ctx.lineTo(-45,35);ctx.lineTo(0,10);ctx.lineTo(45,35);ctx.closePath();ctx.fill();
      }else if(idx===7){
        ctx.beginPath();ctx.ellipse(0,0,150,190,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#171717';ctx.lineWidth=28;for(let n=-2;n<=2;n++){ctx.beginPath();ctx.moveTo(n*55-80,-150);ctx.quadraticCurveTo(n*60+90,0,n*55-80,150);ctx.stroke();}
      }else if(idx===8){
        ctx.beginPath();for(let n=0;n<24;n++){const a=n*Math.PI/12,r=n%2?125:220,x=Math.cos(a)*r,y=Math.sin(a)*r; if(n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();
        ctx.fillStyle='#171717';ctx.font='900 120px Impact';ctx.textAlign='center';ctx.fillText('POW!',0,30);
      }else if(idx===9){
        ctx.beginPath();ctx.moveTo(-170,100);ctx.bezierCurveTo(-250,-180,240,-220,140,20);ctx.bezierCurveTo(60,190,-160,80,-70,-55);ctx.bezierCurveTo(0,-155,160,-85,80,0);ctx.stroke();
        ctx.fillStyle='#171717';ctx.beginPath();ctx.arc(80,-2,18,0,Math.PI*2);ctx.fill();
      }else if(idx===10){
        ctx.beginPath();for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,r=n%2?90:205,x=Math.cos(a)*r,y=Math.sin(a)*r;if(n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();
      }else{
        ctx.beginPath();ctx.roundRect(-190,-145,380,290,38);ctx.fill();
        ctx.strokeStyle='#171717';ctx.lineWidth=17;ctx.strokeRect(-145,-100,290,200);
        ctx.fillStyle='#171717';ctx.font='900 110px Georgia';ctx.textAlign='center';ctx.fillText('EST',0,35);
      }
      ctx.restore();
      ctx.fillStyle=palette[(idx+1)%2];ctx.font='900 96px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(labels[idx],0,245,1050);
      ctx.font='bold 42px Arial';ctx.fillText('SKATE DEPT.  •  EST. 1994',0,315,1000);
      for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.fillStyle=palette[i%2];ctx.beginPath();ctx.arc(Math.cos(a)*560,Math.sin(a)*340,12+rnd()*14,0,Math.PI*2);ctx.fill();}
    } else if(cat==='Japanese'){
      // Sun disc, layered wave crests and a central stylised dragon/oni motif.
      ctx.fillStyle=idx%2?'#d54b35':'#e9c77d';ctx.beginPath();ctx.arc(0,-30,300,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=palette[0];ctx.lineWidth=24;for(let k=0;k<5;k++){ctx.beginPath();ctx.moveTo(-650,170+k*55);for(let x=-650;x<=650;x+=20)ctx.lineTo(x,170+k*55+Math.sin(x/65+k)*45);ctx.stroke();}
      ctx.fillStyle=idx%3===0?'#171717':'#f4e9d2';ctx.font='900 230px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(['龍','鯉','鬼','侍','波','虎','蓮','鶴','蛇','月','花','風'][idx],0,-40);
      ctx.strokeStyle='#171717';ctx.lineWidth=10;ctx.beginPath();ctx.arc(0,-30,315,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#171717';ctx.font='bold 44px Arial';ctx.fillText(['RYU','KOI','ONI','SAMURAI','NAMI','TORA','LOTUS','TSURU','HEBI','TSUKI','HANA','KAZE'][idx],0,350);
    } else {
      // Psychedelic layered rings, warped ribbons, liquid blobs and stars.
      for(let r=480;r>45;r-=42){ctx.strokeStyle=palette[Math.floor(r/42)%2];ctx.globalAlpha=.28+(480-r)/700;ctx.lineWidth=18;ctx.beginPath();ctx.ellipse(Math.sin(r)*35,Math.cos(r)*25,r,r*.58,Math.sin(r/100),0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;
      for(let k=0;k<11;k++){ctx.strokeStyle=palette[k%2];ctx.lineWidth=16+k%3*8;ctx.beginPath();const yy=-360+k*72;ctx.moveTo(-W*.45,yy);ctx.bezierCurveTo(-300,yy-160,300,yy+170,W*.45,yy-30);ctx.stroke();}
      ctx.fillStyle=palette[idx%2];ctx.font='900 140px Impact';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(['TRIP','DREAM','FUZZ','COSMIC','MELT','VIBE','WARP','ODDITY'][idx%8],0,0,950);
      for(let i=0;i<28;i++){ctx.fillStyle=palette[i%2];ctx.beginPath();ctx.arc((rnd()-.5)*W,(rnd()-.5)*H,5+rnd()*28,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
    // Fine worn-print speckle, deliberately subtle.
    for(let i=0;i<2600;i++){ctx.globalAlpha=.08+rnd()*.12;ctx.fillStyle=i%2?'#fff':'#111';ctx.fillRect(rnd()*W,rnd()*H,1+rnd()*3,1+rnd()*2);}ctx.globalAlpha=1;
  }
  if(topSide){
    ctx.strokeStyle='#ffffff55';ctx.lineWidth=9;ctx.strokeRect(35,35,W-70,H-70);
  }
}
function refreshDeckGraphic() {
  // Redraw the selected catalogue entry into the exact canvas used by the
  // underside material. Keep the top face and deck edge independent.
  const artworkCanvas=boardGraphicTexture.image;
  drawDeckGraphic(artworkCanvas,false);
  boardGraphicTexture.needsUpdate=true;
  undersideGraphicMaterial.map=boardGraphicTexture;
  undersideGraphicMaterial.needsUpdate=true;
  mats.board.color.set(deckGraphicState.deckColor);
  deckTopMaterial.color.set(deckGraphicState.deckColor);
  deckTopMaterial.needsUpdate=true;
  mats.board.needsUpdate=true;
  renderer.render(scene,camera);
}
refreshDeckGraphic();


// Trucks: base plates, hangers, axles and kingpins.
const wheelMeshes = [];
for (const x of [-0.69, 0.69]) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.05, 0.25),
    mats.metal
  );
  base.position.set(x, 0.240, 0);
  board.add(base);

  const hanger = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.66, 12),
    mats.metal
  );
  hanger.rotation.x = Math.PI / 2;
  hanger.position.set(x, 0.180, 0);
  board.add(hanger);

  const kingpin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8),
    mats.dark
  );
  kingpin.position.set(x, 0.195, 0);
  board.add(kingpin);

  // Rounded white urethane wheels with black/green/black side graphics.
  for (const z of [-0.30, 0.30]) {
    const profile=[
      new THREE.Vector2(0.097,-0.055),new THREE.Vector2(0.122,-0.048),
      new THREE.Vector2(0.132,-0.032),new THREE.Vector2(0.135,0),
      new THREE.Vector2(0.132,0.032),new THREE.Vector2(0.122,0.048),
      new THREE.Vector2(0.097,0.055)
    ];
    const wheel=new THREE.Mesh(new THREE.LatheGeometry(profile,32),mats.wheel);
    wheel.rotation.x=Math.PI/2;wheel.position.set(x,0.145,z);board.add(wheel);wheelMeshes.push(wheel);
    for(const side of [-1,1]){
      const sideDisc=(radius,depth,material,offset)=>{
        const disc=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,32),material);
        disc.rotation.x=Math.PI/2;disc.position.set(x,0.145,z+side*offset);board.add(disc);
      };
      sideDisc(0.072,0.008,mats.wheelBlack,0.056);
      sideDisc(0.056,0.009,mats.wheelGreen,0.062);
      sideDisc(0.024,0.010,mats.wheelBlack,0.068);
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
// Small decaying offset blends the board onto a grind instead of snapping it.
const grindEntryOffset = new THREE.Vector3();
let grindEntryBlend = 0;
let grindBalance = 0;
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
function push(power = 3.375) {
  if (airborne || bailTimer > 0) return;
  const forward = travelForwardVector();
  velocity.addScaledVector(forward, power);
  const current = velocity.length();
  if (current > maxSpeed) velocity.multiplyScalar(maxSpeed / current);
}
function releaseGrind(side = 0, flickSpeed = 500) {
  if (!grinding || !grindRail) return false;
  const edge=grindRail;
  const tangentSpeed=velocity.x*edge.tangent.x+velocity.z*edge.tangent.z;
  // Carry the existing grind momentum into the air instead of freezing or
  // redirecting the skater when the player deliberately exits.
  velocity.set(edge.tangent.x*tangentSpeed,0,edge.tangent.z*tangentSpeed);
  if(side!==0){
    const away=new THREE.Vector3(-edge.tangent.z,0,edge.tangent.x);
    const boardSide=Math.sign(side);
    velocity.addScaledVector(away,boardSide*(1.7+Math.min(flickSpeed/650,1.5)*1.25));
  }
  grinding=false;grindRail=null;grindBalance=0;grindReadout.style.display='none';
  airborne=true;airTime=0;verticalVelocity=3.9+Math.min(flickSpeed/1600,1.1);
  trickCaught=false;trickStance=false;
  board.rotation.x=0;board.rotation.z=0;
  return true;
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
  // A grind is a real descending contact, not a proximity magnet. The board
  // must be almost centred over the coping/rail and actually reach its height.
  if (!airborne || verticalVelocity > -0.8) return false;
  const speedNow = velocity.length();
  if (speedNow < 1.35) return false;
  const boardForward = forwardVector();
  for (const edge of grindEdges) {
    const relative = new THREE.Vector3(board.position.x - edge.start.x, 0, board.position.z - edge.start.z);
    const rawAlong = relative.dot(edge.tangent);
    const along = THREE.MathUtils.clamp(rawAlong, 0, edge.length);
    const closest = edge.start.clone().addScaledVector(edge.tangent, along);
    const lateral = Math.hypot(board.position.x - closest.x, board.position.z - closest.z);
    // Require the board centre to genuinely arrive over the edge. This keeps
    // ollies near a rail from being pulled sideways/up onto it.
    if (lateral > 0.24) continue;
    const targetY = edge.y - 0.416;
    if (Math.abs(board.position.y - targetY) > 0.095) continue;
    const boardAlignment = Math.abs(boardForward.dot(edge.tangent));
    const velocityAlong = velocity.x * edge.tangent.x + velocity.z * edge.tangent.z;
    const velocityAcross = Math.abs(velocity.x * edge.tangent.z - velocity.z * edge.tangent.x);
    // Accept both a lengthwise grind and a perpendicular boardslide. The
    // approach can be across the rail; the landing redirects onto its length.
    const entryPosition = board.position.clone();
    board.position.set(closest.x, targetY, closest.z);
    board.updateMatrixWorld(true);
    grindContactPoint.set(closest.x, edge.y, closest.z);
    grindLocalPoint.copy(grindContactPoint);
    board.worldToLocal(grindLocalPoint);
    // Preserve the approach offset and ease it away over a fraction of a second.
    // This avoids the hard positional snap that made grind entries feel choppy.
    grindEntryOffset.copy(entryPosition).sub(board.position);
    grindEntryBlend = 0.22;
    grindBalance = 0;
    board.position.copy(entryPosition);
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
      if (airborne) {
        // Contact is a physical touchdown, not a trick-completion animation.
        // Preserve the board's current orientation and angular momentum even
        // when the shuv is still rotating or the deck is not perfectly level.
        airborne = false;
        verticalVelocity = 0;
        // Once the wheels touch down, resume continuous terrain alignment.
        // The board keeps its impact orientation initially and eases onto the
        // ramp through the normal damped pitch/roll response.
        trickStance = false;
        heading += shuvitRotation;
        shuvitRotation = 0;
        shuvitTarget = 0;
        manualActive = false;
        manualAngle = 0;
        lastLandTime = clock.elapsedTime;
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

      // Hard obstacle contact should deflect the board, not trigger a
      // canned bail/reset that kills the trick's motion and looks like a snap.
      if (impactSpeed > 5.5) {
        velocity.multiplyScalar(0.88);
        verticalVelocity = Math.max(verticalVelocity, 0.35);
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
  grindBalance = 0;
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
  // deckLocalX is already measured in the board's own coordinate frame,
  // so its tail/nose identity must not be flipped when riding switch.
  const tailSide = gesture.deckLocalX !== null && gesture.deckLocalX < -0.04;
  const noseSide = gesture.deckLocalX !== null && gesture.deckLocalX > 0.04;
  // Manuals require a deliberate vertical drag on the correct end of the
  // deck. Ignore small vertical drift during ordinary horizontal steering.
  // A manual begins as soon as a deliberate pull starts on the correct end
  // of the deck. The board angle then builds progressively with finger travel.
  const verticalIntent = Math.abs(gesture.dy) > 8 &&
    Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.35;
  // Screen-space pull direction reverses with the board's travel direction.
  const pullingTail = tailSide && gesture.dy * travelSign > 8 && verticalIntent;
  const pullingNose = noseSide && gesture.dy * travelSign < -8 && verticalIntent;
  // Fast vertical flicks are ollies/nollies, not manual holds. Slow pulls
  // still activate a manual immediately on the first deliberate movement.
  if (!airborne && (pullingTail || pullingNose) && moveDuration > 0 &&
      gesture.lastMoveSpeed < 600) {
    gesture.manualGesture = true;
    manualActive = true;
    manualSide = pullingTail ? 1 : -1;
    manualAngle = manualSide * THREE.MathUtils.clamp((Math.abs(gesture.dy) - 8) / 140, 0, 0.58);
  }
  // A quick flick pops directly out of a manual: tail manual = ollie,
  // nose manual = nollie. The pop flick is separate from the slower manual pull.
  // Either pop can also be triggered while kickturning.
  const manualPopDirection = manualSide === 1
    ? moveDy * travelSign > 28
    : moveDy * travelSign < -28;
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
    const noseManualSteer = manualSide === -1 ? -1 : 1;
    touchSteer = THREE.MathUtils.clamp(-gesture.dx / 58 * travelSign * noseManualSteer, -1, 1);
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
  if (grinding && quick && Math.abs(dx) > 30) {
    // A horizontal swipe is an intentional lateral grind exit, not a shuvit.
    releaseGrind(screenTurnDirection(dx),g.lastMoveSpeed || (Math.abs(dx)/elapsed*1000));
  } else if (grinding && g.deckLocalX !== null && quick && Math.abs(dy) > 38) {
    // A vertical deck flick pops cleanly off the obstacle.
    pop('ollie',g.lastMoveSpeed || (Math.abs(dy)/elapsed*1000));
  } else if (airborne && quick && Math.abs(dx) > 30) {
    const flickDirection=screenTurnDirection(dx);
    flick(flickDirection,Math.abs(dx),g.lastMoveSpeed || (Math.hypot(dx,dy)/elapsed*1000),0,g.deckLocalX || 0);
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
    velocity.addScaledVector(travelForwardVector(), direction * 3.5);
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
  if ((key === 'w' || key === 'arrowup') && !event.repeat) push(2.75);
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

// The park map remains available inside the pause menu rather than on the HUD.
let gamePaused = false;
function pauseBoard() {
  gamePaused = true;
  velocity.set(0, 0, 0);
  verticalVelocity = 0;
  touchSteer = 0;
  keys.clear();
  gesture = null;
  boardTouchHold = false;
  manualActive = false;
  manualAngle = 0;
}
const menuButton = document.createElement('button');
menuButton.type = 'button';
menuButton.textContent = '☰';
menuButton.setAttribute('aria-label', 'Open game menu');
menuButton.setAttribute('aria-expanded', 'false');
menuButton.style.cssText = 'position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);left:14px;z-index:40;width:48px;height:46px;border:2px solid rgba(255,255,255,.9);border-radius:12px;background:rgba(28,35,37,.88);color:#fff;font:900 27px/1 Arial,sans-serif;box-shadow:0 4px 14px #0006;touch-action:manipulation;';
mount.appendChild(menuButton);

const menuPanel = document.createElement('div');
menuPanel.style.cssText = 'position:absolute;top:calc(env(safe-area-inset-top,0px) + 70px);left:14px;z-index:41;display:none;min-width:230px;padding:10px;border:1px solid #ffffff66;border-radius:15px;background:rgba(25,32,34,.96);box-shadow:0 12px 32px #0008;backdrop-filter:blur(12px);font-family:Arial,sans-serif;';
const menuTitle = document.createElement('div');
menuTitle.textContent = 'GAME MENU';
menuTitle.style.cssText = 'padding:8px 10px 12px;color:#aeb9b7;font-size:10px;font-weight:900;letter-spacing:2px;';
menuPanel.appendChild(menuTitle);
function makeMenuOption(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = 'display:block;width:100%;padding:14px 12px;margin:3px 0;border:1px solid #ffffff20;border-radius:9px;background:#ffffff0d;color:#fff;text-align:left;font:700 14px Arial,sans-serif;letter-spacing:.3px;touch-action:manipulation;';
  menuPanel.appendChild(button);
  return button;
}
const menuMapOption = makeMenuOption('Map');
const customizeOption = makeMenuOption('Board customization');
const parksOption = makeMenuOption('Parks and missions');
mount.appendChild(menuPanel);

const sectionPanel = document.createElement('div');
sectionPanel.style.cssText = 'position:absolute;inset:0;z-index:32;display:none;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 12px;background:rgba(12,17,18,.82);backdrop-filter:blur(8px);font-family:Arial,sans-serif;box-sizing:border-box;';
const sectionCard = document.createElement('div');
sectionCard.style.cssText = 'width:min(100%,680px);max-height:92%;overflow:auto;padding:18px;border:1px solid #ffffff55;border-radius:18px;background:#20292b;color:#fff;box-shadow:0 16px 42px #0008;box-sizing:border-box;';
const sectionTitle = document.createElement('div');
sectionTitle.style.cssText = 'margin-bottom:12px;font-size:18px;font-weight:900;letter-spacing:1px;';
const sectionMessage = document.createElement('div');
sectionMessage.style.cssText = 'margin-bottom:14px;color:#c2cecb;font-size:13px;line-height:1.5;';
const sectionContent = document.createElement('div');
const sectionBack = document.createElement('button');
sectionBack.type = 'button';
sectionBack.textContent = 'BACK TO MENU';
sectionBack.style.cssText = 'margin-top:18px;padding:12px 15px;border:0;border-radius:9px;background:#e6ece9;color:#20292b;font-size:11px;font-weight:900;letter-spacing:1px;touch-action:manipulation;';
sectionCard.append(sectionTitle, sectionMessage, sectionContent, sectionBack);
sectionPanel.appendChild(sectionCard);
mount.appendChild(sectionPanel);

// The editor reuses the live 3D skateboard, isolating it from the park while
// the game is paused. The original scene and camera are restored on exit.
const editorStage=document.createElement('div');
editorStage.style.cssText='position:absolute;inset:0 0 0 170px;z-index:1;touch-action:none;cursor:grab;';
const editorHint=document.createElement('div');
editorHint.textContent='DRAG TO ROTATE  •  LIVE 3D PREVIEW';
editorHint.style.cssText='position:absolute;right:18px;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);padding:9px 12px;border:1px solid #ffffff30;border-radius:20px;background:#101719bb;color:#dce5e2;font:800 10px Arial,sans-serif;letter-spacing:1px;pointer-events:none;';
editorStage.appendChild(editorHint);
sectionPanel.appendChild(editorStage);
sectionPanel.style.background='transparent';
sectionPanel.style.backdropFilter='none';
sectionPanel.style.webkitBackdropFilter='none';
sectionPanel.style.alignItems='stretch';
sectionPanel.style.justifyContent='flex-start';
sectionCard.style.cssText='position:relative;z-index:3;width:170px;min-width:170px;height:100%;max-height:none;overflow:auto;margin:0 auto 0 0;padding:calc(env(safe-area-inset-top,0px) + 16px) 10px calc(env(safe-area-inset-bottom,0px) + 16px);border:0;border-right:1px solid #ffffff24;border-radius:0 16px 16px 0;background:rgba(20,28,30,.97);color:#fff;box-shadow:12px 0 35px #0005;box-sizing:border-box;';
let editorPreviewActive=false, editorSavedScene=null, editorSavedCamera=null, editorSavedBoard=null;
let editorCategory='Deck graphics', editorTargetRotation=null, editorDrag=null;
function activateBoardEditorPreview(){
  if(editorPreviewActive)return;
  editorPreviewActive=true;
  editorSavedScene={background:scene.background,children:scene.children.map(o=>({object:o,visible:o.visible}))};
  editorSavedCamera={position:camera.position.clone(),quaternion:camera.quaternion.clone(),up:camera.up.clone(),aspect:camera.aspect};
  editorSavedBoard={
    position:board.position.clone(),rotation:board.rotation.clone(),scale:board.scale.clone(),
    childPositions:board.children.map(child=>({child,position:child.position.clone()}))
  };
  // Rebase the model around the deck's centre before rotating it. The physics
  // model normally uses the ground-level board origin; the editor must pivot
  // around the deck itself so it spins in place instead of orbiting in a circle.
  const deckCentreY=0.395;
  for(const child of board.children) child.position.y-=deckCentreY;
  // The customization preview is a clean floating-board display: hide every
  // park surface, obstacle, grid and ground mesh, keeping only the board/lights.
  for(const child of scene.children) child.visible=(child===board||child.isLight);
  scene.background=new THREE.Color('#171e20');
  board.position.set(0,1.45,0.82);
  board.rotation.set(0,0,Math.PI/2);
  board.scale.setScalar(0.72);
  camera.up.set(0,1,0);
  camera.position.set(-4.4,1.45,0.48);
  camera.lookAt(0,1.45,0.48);
  camera.updateProjectionMatrix();
  editorTargetRotation=board.rotation.clone();
  renderer.render(scene,camera);
}
function restoreBoardEditorPreview(){
  if(!editorPreviewActive)return;
  editorPreviewActive=false;
  if(editorSavedScene){
    scene.background=editorSavedScene.background;
    for(const entry of editorSavedScene.children) entry.object.visible=entry.visible;
  }
  if(editorSavedBoard){
    for(const saved of editorSavedBoard.childPositions) saved.child.position.copy(saved.position);
    board.position.copy(editorSavedBoard.position);
    board.rotation.copy(editorSavedBoard.rotation);
    board.scale.copy(editorSavedBoard.scale);
  }
  if(editorSavedCamera){
    camera.position.copy(editorSavedCamera.position);
    camera.quaternion.copy(editorSavedCamera.quaternion);
    camera.up.copy(editorSavedCamera.up);
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
  }
  editorSavedScene=null;editorSavedCamera=null;editorSavedBoard=null;editorTargetRotation=null;
  renderer.render(scene,camera);
}
function aimEditorBoard(category){
  const underside=['Deck graphics','Trucks','Wheels'].includes(category);
  // Keep the camera fixed on the negative-X side. Rotate around world Y:
  // the previous X rotation was cancelled by the board's Z=90° pose, so it
  // never turned the underside toward the camera.
  camera.position.x=-4.4;
  camera.lookAt(0,1.45,0.48);
  camera.updateProjectionMatrix();
  editorTargetRotation=new THREE.Euler(0,underside?Math.PI:0,Math.PI/2,'YXZ');
}
editorStage.addEventListener('pointerdown',event=>{
  if(!editorPreviewActive)return;
  editorDrag={x:event.clientX,y:event.clientY,rotation:board.rotation.clone()};
  editorStage.setPointerCapture(event.pointerId);
  editorStage.style.cursor='grabbing';
});
editorStage.addEventListener('pointermove',event=>{
  if(!editorDrag||!editorPreviewActive)return;
  const dx=event.clientX-editorDrag.x,dy=event.clientY-editorDrag.y;
  board.rotation.y=editorDrag.rotation.y+dx*.012;
  board.rotation.x=editorDrag.rotation.x+dy*.012;
  editorTargetRotation=null;
  renderer.render(scene,camera);
});
function endEditorDrag(){editorDrag=null;editorStage.style.cursor='grab';}
editorStage.addEventListener('pointerup',endEditorDrag);
editorStage.addEventListener('pointercancel',endEditorDrag);
function updateEditorPreview(dt){
  if(!editorPreviewActive||!editorTargetRotation)return;
  board.rotation.x=THREE.MathUtils.damp(board.rotation.x,editorTargetRotation.x,7,dt);
  board.rotation.y=THREE.MathUtils.damp(board.rotation.y,editorTargetRotation.y,7,dt);
  board.rotation.z=THREE.MathUtils.damp(board.rotation.z,editorTargetRotation.z,7,dt);
  if(Math.abs(board.rotation.x-editorTargetRotation.x)+Math.abs(board.rotation.y-editorTargetRotation.y)+Math.abs(board.rotation.z-editorTargetRotation.z)<.004){
    board.rotation.copy(editorTargetRotation);editorTargetRotation=null;
  }
}

function makeEditorLabel(text) {
  const label=document.createElement('label');
  label.textContent=text;
  label.style.cssText='display:block;margin:12px 0 6px;color:#dce5e2;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;';
  return label;
}
function makeEditorSelect(options,value,onChange) {
  const el=document.createElement('select');
  el.style.cssText='width:100%;min-height:42px;padding:9px 11px;border:1px solid #ffffff35;border-radius:9px;background:#11191b;color:#fff;font:600 13px Arial,sans-serif;';
  options.forEach((v,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=v;el.appendChild(o);});
  el.value=String(value);el.addEventListener('change',()=>onChange(Number(el.value)));return el;
}
function makeEditorColor(value,onChange) {
  const el=document.createElement('input');el.type='color';el.value=value;
  el.style.cssText='width:100%;height:42px;padding:3px;border:1px solid #ffffff35;border-radius:9px;background:#11191b;';
  el.addEventListener('input',()=>onChange(el.value));return el;
}
function makeEditorText(value,onChange) {
  const el=document.createElement('input');el.type='text';el.maxLength=24;el.value=value;el.placeholder='Type your message';
  el.style.cssText='width:100%;height:42px;padding:0 11px;box-sizing:border-box;border:1px solid #ffffff35;border-radius:9px;background:#11191b;color:#fff;font:600 14px Arial,sans-serif;';
  el.addEventListener('input',()=>onChange(el.value));return el;
}
function editorField(label,control) {
  const wrap=document.createElement('div');wrap.append(makeEditorLabel(label),control);return wrap;
}
function buildDeckCustomizationUI() {
  sectionCard.style.cssText='position:relative;z-index:3;width:170px;min-width:170px;height:100%;max-height:none;overflow:auto;margin:0 auto 0 0;padding:calc(env(safe-area-inset-top,0px) + 16px) 12px calc(env(safe-area-inset-bottom,0px) + 16px);border:0;border-right:1px solid #ffffff24;border-radius:0 16px 16px 0;background:rgba(20,28,30,.97);color:#fff;box-shadow:12px 0 35px #0005;box-sizing:border-box;';
  sectionContent.replaceChildren();
  sectionTitle.textContent='BOARD CUSTOMIZATION';
  sectionMessage.textContent='Choose a component. Drag the board to inspect it from any angle.';
  const nav=document.createElement('div');
  nav.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 14px;';
  const categories=['Deck graphics','Deck shape','Wheels','Trucks','Grip tape','Grip tape graphics','Deck colour'];
  for(const name of categories){
    const button=document.createElement('button');
    button.type='button';button.textContent=name;
    button.style.cssText='min-height:38px;padding:7px 6px;border:1px solid '+(editorCategory===name?'#b8d4ca':'#ffffff22')+';border-radius:8px;background:'+(editorCategory===name?'#dce9e3':'#ffffff0b')+';color:'+(editorCategory===name?'#17211f':'#e6eeeb')+';font:800 10px Arial,sans-serif;letter-spacing:.25px;touch-action:manipulation;';
    button.addEventListener('click',()=>{editorCategory=name;aimEditorBoard(name);buildDeckCustomizationUI();});
    nav.appendChild(button);
  }
  sectionContent.appendChild(nav);
  if(editorCategory==='Deck graphics'){
    const intro=document.createElement('div');intro.textContent='Choose a graphic and customise it. The 3D preview updates immediately.';
    intro.style.cssText='margin-bottom:10px;color:#c2cecb;font-size:11px;line-height:1.45;';sectionContent.appendChild(intro);
    const categoryOptions=['Vintage','Japanese','Psychedelic','Graffiti'];
    const category=makeEditorSelect(categoryOptions,categoryOptions.indexOf(deckGraphicState.category),i=>{
      deckGraphicState.category=categoryOptions[i];deckGraphicState.design=0;buildDeckCustomizationUI();refreshDeckGraphic();
    });
    sectionContent.appendChild(editorField('Graphic collection',category));
    if(deckGraphicState.category==='Graffiti'){
      sectionContent.appendChild(editorField('Lettering style',makeEditorSelect(graffitiStyleNames,deckGraphicState.graffitiStyle,i=>{deckGraphicState.graffitiStyle=i;refreshDeckGraphic();})));
      sectionContent.appendChild(editorField('Your message',makeEditorText(deckGraphicState.message,v=>{deckGraphicState.message=v;refreshDeckGraphic();})));
      sectionContent.appendChild(editorField('Fill effect',makeEditorSelect(fadeStyles,fadeStyles.indexOf(deckGraphicState.fade),i=>{deckGraphicState.fade=fadeStyles[i];refreshDeckGraphic();})));
      sectionContent.appendChild(editorField('Outline',makeEditorSelect(['Black','White'],deckGraphicState.outline==='#ffffff'?1:0,i=>{deckGraphicState.outline=i?'#ffffff':'#111111';refreshDeckGraphic();})));
      const colors=document.createElement('div');colors.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;';
      colors.append(editorField('Main colour',makeEditorColor(deckGraphicState.colorA,v=>{deckGraphicState.colorA=v;refreshDeckGraphic();})),editorField('Fade to',makeEditorColor(deckGraphicState.colorB,v=>{deckGraphicState.colorB=v;refreshDeckGraphic();})));
      sectionContent.appendChild(colors);
      const note=document.createElement('div');note.textContent='Outline thickness and the natural shadow are fixed.';note.style.cssText='margin-top:10px;color:#94a5a0;font-size:10px;line-height:1.4;';sectionContent.appendChild(note);
    }else{
      const designs=deckGraphicCatalog[deckGraphicState.category];
      sectionContent.appendChild(editorField('Choose a design',makeEditorSelect(designs,deckGraphicState.design,i=>{deckGraphicState.design=i;refreshDeckGraphic();})));
      sectionContent.appendChild(editorField('Graphic colour',makeEditorColor(deckGraphicState.colorA,v=>{deckGraphicState.colorA=v;refreshDeckGraphic();})));
    }
  }else if(editorCategory==='Deck colour'){
    sectionContent.appendChild(editorField('Deck colour',makeEditorColor(deckGraphicState.deckColor,v=>{deckGraphicState.deckColor=v;refreshDeckGraphic();})));
    const note=document.createElement('div');note.textContent='This changes the board colour independently of the deck artwork.';note.style.cssText='margin-top:10px;color:#94a5a0;font-size:10px;line-height:1.45;';sectionContent.appendChild(note);
  }else{
    const note=document.createElement('div');
    note.textContent=editorCategory+' controls will be added after we decide the available options for this component. The board has moved to show it in the preview.';
    note.style.cssText='padding:12px;border:1px solid #ffffff20;border-radius:9px;background:#ffffff08;color:#c2cecb;font-size:11px;line-height:1.5;';
    sectionContent.appendChild(note);
  }
}
function openSection(title) {
  menuPanel.style.display = 'none';
  sectionContent.replaceChildren();
  sectionPanel.style.display = 'flex';
  if(title==='Board customization'){
    activateBoardEditorPreview();
    editorCategory='Deck graphics';
    aimEditorBoard(editorCategory);
    buildDeckCustomizationUI();
  }else{
    sectionTitle.textContent=title.toUpperCase();
    sectionMessage.textContent='Parks and missions features will be designed separately.';
    const note=document.createElement('div');note.textContent='This section is ready for its own design session.';sectionContent.appendChild(note);
    sectionCard.style.cssText='position:relative;z-index:3;width:min(100%,680px);max-height:92%;overflow:auto;margin:auto;padding:18px;border:1px solid #ffffff55;border-radius:18px;background:#20292b;color:#fff;box-shadow:0 16px 42px #0008;box-sizing:border-box;';
  }
}
function showGameMenu() {
  gamePaused = true;
  menuButton.setAttribute('aria-expanded', 'true');
  menuPanel.style.display = 'block';
}
function hideGameMenu() {
  menuPanel.style.display = 'none';
  menuButton.setAttribute('aria-expanded', 'false');
  gamePaused = false;
}
menuButton.addEventListener('click', () => {
  if (gamePaused && menuPanel.style.display === 'block') hideGameMenu();
  else {
    pauseBoard();
    showGameMenu();
  }
});
menuMapOption.addEventListener('click', () => {
  menuPanel.style.display = 'none';
  mapPanel.style.display = 'flex';
  drawSkateparkMap();
});
customizeOption.addEventListener('click', () => openSection('Board customization'));
parksOption.addEventListener('click', () => openSection('Parks and missions'));
sectionBack.addEventListener('click', () => {
  sectionPanel.style.display = 'none';
  restoreBoardEditorPreview();
  sectionCard.style.cssText='width:min(100%,680px);max-height:92%;overflow:auto;padding:18px;border:1px solid #ffffff55;border-radius:18px;background:#20292b;color:#fff;box-shadow:0 16px 42px #0008;box-sizing:border-box;';
  showGameMenu();
});

// Full skatepark map. Tap any point on the plan to teleport the skater there.
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
mapHint.textContent = 'X = LEFT / RIGHT  •  Z = UP / DOWN  •  Y = HEIGHT  •  TAP MAP TO TELEPORT';
mapHint.style.cssText = 'flex:none;color:#66818a;font-size:10px;font-weight:900;letter-spacing:1.2px;';
const mapCanvas = document.createElement('canvas');
mapCanvas.style.cssText = 'display:block;width:100%;height:100%;min-height:0;flex:1;border:3px solid #fff;border-radius:16px;background:#a9dfce;box-shadow:inset 0 4px 12px #527f7166;touch-action:pan-x pan-y;';
mapCard.append(mapHeader,mapHint,mapCanvas);
mapPanel.appendChild(mapCard);
mount.appendChild(mapPanel);

const mapCtx = mapCanvas.getContext('2d');
const mapBounds = { minX: -60, maxX: 60, minZ: -60, maxZ: 60 };
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
  const bg=mapCtx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#b8c0bd');bg.addColorStop(1,'#777f7e');
  mapCtx.fillStyle=bg;mapCtx.fillRect(0,0,w,h);
  const polygon=(pts,fill)=>{mapCtx.beginPath();pts.forEach((q,i)=>i?mapCtx.lineTo(q[0],q[1]):mapCtx.moveTo(q[0],q[1]));mapCtx.closePath();mapCtx.fillStyle=fill;mapCtx.fill();};
  polygon([p(-60,-60),p(-15,-60),p(-15,60),p(-60,60)],'#aeb6b3');
  polygon([p(-15,-60),p(-5,-60),p(-5,60),p(-15,60)],'#929b98');
  polygon([p(-5,-60),p(60,-60),p(60,60),p(-5,60)],'#737c7b');
  mapCtx.lineWidth=1;mapCtx.strokeStyle='rgba(255,255,255,.25)';
  for(let v=-60;v<=60;v+=5){let a=p(v,-60),b=p(v,60);mapCtx.beginPath();mapCtx.moveTo(...a);mapCtx.lineTo(...b);mapCtx.stroke();a=p(-60,v);b=p(60,v);mapCtx.beginPath();mapCtx.moveTo(...a);mapCtx.lineTo(...b);mapCtx.stroke();}
  mapCtx.lineWidth=2;mapCtx.strokeStyle='rgba(255,255,255,.85)';let a=p(-10,-60),b=p(-10,60);mapCtx.beginPath();mapCtx.moveTo(...a);mapCtx.lineTo(...b);mapCtx.stroke();
  label('EXPANDED UPPER LEVEL  Y=3.2m',-37,-4,'#263332',9);
  label('LOWER LEVEL  Y=0m',-1,3,'#f1f2ed',9);
  label('SLOPED CONNECTION',-10,30,'#263332',8);
  // Map overlay: platform footprint and the berm's full north-south run.
  polygon([p(-60,25),p(-20,25),p(-20,60),p(-60,60)],'rgba(218,226,218,.72)');
  polygon([p(-20,-60),p(-10,-60),p(-10,60),p(-20,60)],'rgba(185,197,190,.82)');
  label('RAISED PLATFORM X -60 TO -20',-40,42,'#263332',8);
  label('Z 25 TO 60',-40,46,'#263332',7);
  label('BERM X -20 TO -10 (FULL Z)',-15,0,'#263332',7);
  mapCtx.font='900 11px Arial';mapCtx.fillStyle='#fff';mapCtx.textAlign='center';
  mapCtx.fillText('X  (LEFT ↔ RIGHT)',w/2,h-8);
  mapCtx.save();mapCtx.translate(12,h/2);mapCtx.rotate(-Math.PI/2);mapCtx.fillText('Z  (UP ↔ DOWN)',0,0);mapCtx.restore();
  for(let v=-60;v<=60;v+=10){let q=p(v,-60);mapCtx.fillText(String(v),q[0],Math.max(10,q[1]+10));q=p(-60,v);mapCtx.textAlign='left';mapCtx.fillText(String(v),q[0]+3,q[1]);mapCtx.textAlign='center';}
  const [sx,sy]=p(board.position.x,board.position.z);
  mapCtx.beginPath();mapCtx.arc(sx,sy,11,0,Math.PI*2);mapCtx.fillStyle='#fff8d9aa';mapCtx.fill();
  mapCtx.beginPath();mapCtx.arc(sx,sy,6.5,0,Math.PI*2);mapCtx.fillStyle='#ff6e73';mapCtx.fill();mapCtx.strokeStyle='#fff';mapCtx.lineWidth=2.5;mapCtx.stroke();
  const [hx,hy]=p(board.position.x+Math.sin(heading)*2.4,board.position.z+Math.cos(heading)*2.4);
  mapCtx.beginPath();mapCtx.moveTo(sx,sy);mapCtx.lineTo(hx,hy);mapCtx.strokeStyle='#31516a';mapCtx.lineWidth=3;mapCtx.lineCap='round';mapCtx.stroke();
  label('YOU',board.position.x,board.position.z-1.7,'#e95e6c',8);
}
function closeParkMap() {
  mapPanel.style.display = 'none';
  showGameMenu();
}
window.addEventListener('resize', drawSkateparkMap);
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
  // Keep rendering the park while paused, but do not advance any board,
  // trick, camera-follow, or physics state until the menu is dismissed.
  if (gamePaused) {
    updateEditorPreview(dt);
    renderer.render(scene, camera);
    const errorPanel = document.getElementById('load-error');
    if (errorPanel) errorPanel.style.display = 'none';
    return;
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
        const entryEase = grindEntryBlend;
        grindEntryBlend *= Math.exp(-18 * dt);
        if (grindEntryBlend < 0.015) grindEntryBlend = 0;
        const across = new THREE.Vector3(-edge.tangent.z, 0, edge.tangent.x);
        // Manual pressure and steering shift the skater's centre of mass.
        // Small corrections stay on the rail; sustained over-lean spills off.
        const balanceInput = (manualActive ? manualAngle * 1.7 : 0) + steer * 0.48;
        grindBalance = THREE.MathUtils.clamp(grindBalance + balanceInput * dt - grindBalance * 0.32 * dt, -1, 1);
        if (Math.abs(grindBalance) > 0.72) {
          const fallSide = Math.sign(grindBalance);
          grinding = false;
          grindRail = null;
          grindReadout.style.display = 'none';
          airborne = true;
          verticalVelocity = 0.75;
          velocity.addScaledVector(across, fallSide * 1.15);
          board.rotation.x = fallSide * 0.24;
          board.rotation.z = manualAngle * 0.55;
          grindBalance = 0;
        } else {
          const balanceOffset = grindBalance * 0.12;
          board.position.set(
            next.x + across.x * balanceOffset + grindEntryOffset.x * entryEase,
            edge.y - 0.416 + grindEntryOffset.y * entryEase,
            next.z + across.z * balanceOffset + grindEntryOffset.z * entryEase
          );
          board.rotation.x = THREE.MathUtils.damp(board.rotation.x, grindBalance * 0.30 + steer * 0.07, 10, dt);
          board.rotation.z = THREE.MathUtils.damp(board.rotation.z, manualActive ? manualAngle : 0, 9, dt);
          velocity.x = edge.tangent.x * alongVelocity * Math.exp(-0.05625 * dt);
          velocity.z = edge.tangent.z * alongVelocity * Math.exp(-0.05625 * dt);
        }
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
      else velocity.multiplyScalar(Math.exp(-0.105 * dt));
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
        // Align the deck to the actual local ground tangent, not just the
        // quarter-pipe angle. This includes both axes of the bowl transition.
        // The deck's nose keeps its own heading when rolling fakie.
        // Measure the terrain gradient along the board's nose axis, not the
        // direction of motion; otherwise reversing flips the pitch twice.
        const noseDirection = forwardVector();
        const pitchAlongNose = slopeX * noseDirection.x + slopeZ * noseDirection.z;
        const terrainPitch = Math.atan(pitchAlongNose);
        // The board's local Z axis spans its width. Sample the cross-slope too,
        // so banks and quarter-pipes tilt the deck sideways as well as nose-up/down.
        const acrossDirection = new THREE.Vector3(-noseDirection.z, 0, noseDirection.x);
        const slopeAcrossDeck = slopeX * acrossDirection.x + slopeZ * acrossDirection.z;
        const terrainRoll = -Math.atan(slopeAcrossDeck);
        const targetDeckPitch = (manualActive ? manualAngle : terrainPitch) - steer * 0.075;
        const targetDeckRoll = (manualActive ? steer * 0.17 : terrainRoll + steer * 0.035);
        board.rotation.z = THREE.MathUtils.damp(board.rotation.z, targetDeckPitch, manualActive ? 12 : 10, dt);
        board.rotation.x = THREE.MathUtils.damp(board.rotation.x, targetDeckRoll, manualActive ? 10 : 9, dt);
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
      velocity.multiplyScalar(Math.exp(-0.015 * dt));
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

    // Update yaw before terrain and obstacle contact tests. Previously the
    // collision solver used last frame's board angle during a shuv, which
    // could leave the deck hovering until the next push refreshed its pose.
    board.rotation.y = heading - Math.PI / 2 + (airborne ? shuvitRotation : 0);
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
        // Let the deck touch down in whatever orientation its momentum gives
        // it. No forced catch, rotation threshold, snap-to-upright or bail.
        airborne = false;
        verticalVelocity = 0;
        // Once the wheels touch down, resume continuous terrain alignment.
        // The board keeps its impact orientation initially and eases onto the
        // ramp through the normal damped pitch/roll response.
        trickStance = false;
        heading += shuvitRotation;
        shuvitRotation = 0;
        shuvitTarget = 0;
        manualActive = false;
        manualAngle = 0;
        lastLandTime = clock.elapsedTime;
        velocity.multiplyScalar(0.99);
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

    // Let either end of the deck scrape during its matching manual.
    // Ground contact correction keeps the wheels/deck from penetrating while
    // the raised end pivots down toward the concrete.
    if (manualActive) {
      board.updateMatrixWorld(true);
      let endScraping = false;
      const scrapeEndX = manualSide === 1 ? -1.055 : 1.055;
      for (const localZ of [-0.13, 0, 0.13]) {
        const endPoint = board.localToWorld(new THREE.Vector3(scrapeEndX, 0.410, localZ));
        const clearance = endPoint.y - terrainHeightAt(endPoint.x, endPoint.z);
        if (clearance <= 0.025) {
          endScraping = true;
          break;
        }
      }
      if (endScraping) {
        const scrapeSpeed = velocity.length();
        // Strong exponential drag applies to both tail and nose scrapes.
        const lowSpeedMultiplier = 1 + 4 * Math.exp(-scrapeSpeed * 10);
        const scrapeDragRate = 8 * lowSpeedMultiplier;
        velocity.multiplyScalar(Math.exp(-scrapeDragRate * dt));
        if (velocity.length() < 0.12) velocity.set(0, 0, 0);
        speed = velocity.length();
      }
    }
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
