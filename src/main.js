// VALOR QUEST: Chain of Deldya — Rygar-style action platformer using Valor Quest art as-is.
import * as THREE from 'three';
import Snd from './audio.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x0b1218, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b1218, 44, 95);

let viewH = 10.2;
const camera = new THREE.OrthographicCamera(-8, 8, viewH / 2 + 1.6, -viewH / 2 + 1.6, 0.1, 200);
camera.position.set(0, 2.8, 30);
camera.lookAt(0, 2.8, 0);

scene.add(new THREE.DirectionalLight(0xfff2d8, 1.2).translateX(6).translateY(12).translateZ(16));
scene.add(new THREE.AmbientLight(0x8899aa, 0.75));
scene.add(new THREE.PointLight(0xffcc77, 0.4, 20, 2));

const loader = new THREE.TextureLoader();
const TEX = {};
function loadTex(url, nearest = false) {
  return new Promise((resolve, reject) => {
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
      t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
      t.anisotropy = 4;
      resolve(t);
    }, undefined, reject);
  });
}

function billboard(tex, w, h) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, depthWrite: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.userData.h = h; m.userData.w = w;
  return m;
}

function buildDisc(scale = 1) {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dbe0, metalness: 0.98, roughness: 0.18, emissive: 0x2a1a00, emissiveIntensity: 0.35 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xf0c14b, metalness: 0.95, roughness: 0.22, emissive: 0x5a3a00, emissiveIntensity: 0.55 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32 * scale, 0.06 * scale, 10, 28), steel);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38 * scale, 0.025 * scale, 8, 28), gold);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * scale, 0.13 * scale, 0.07 * scale, 12), gold);
  hub.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.12 * scale, 16), new THREE.MeshStandardMaterial({ color: 0x2a2214, metalness: 0.6, roughness: 0.4, emissive: 0x664400, emissiveIntensity: 0.4 }));
  face.position.z = 0.04 * scale;
  g.add(ring, rim, hub, face);
  const spikeGeo = new THREE.ConeGeometry(0.055 * scale, 0.26 * scale, 6);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, metalness: 0.96, roughness: 0.16, emissive: 0x332200, emissiveIntensity: 0.25 });
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    const a = (i / 14) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.4 * scale, Math.sin(a) * 0.4 * scale, 0);
    s.rotation.z = a - Math.PI / 2;
    g.add(s);
  }
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.44 * scale, 0.72 * scale, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd578, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
  );
  g.add(halo);
  g.userData.halo = halo;
  g.userData.spin = g;
  g.userData.gold = gold;
  g.userData.steel = steel;
  return g;
}

const KINDS = {
  rat:            { file: './assets/mobs/rat.png',            w: 1.15, h: 1.2,  hp: 18, dmg: 8,  spd: 1.6, valor: 2,  gold: 8,  name: 'Rat' },
  'fat-rat':      { file: './assets/mobs/fat-rat.png',        w: 1.3,  h: 1.05, hp: 30, dmg: 10, spd: 1.2, valor: 3,  gold: 12, name: 'Fat Rat' },
  mosquito:       { file: './assets/mobs/mosquito-swarm.png', w: 1.5,  h: 1.4,  hp: 14, dmg: 6,  spd: 2.4, valor: 2,  gold: 6,  name: 'Mosquito Swarm', fly: true },
  snake:          { file: './assets/mobs/snake.png',          w: 1.15, h: 1.2,  hp: 26, dmg: 10, spd: 2.0, valor: 3,  gold: 10, name: 'Snake' },
  spider:         { file: './assets/mobs/spider.png',         w: 1.6,  h: 1.4,  hp: 36, dmg: 12, spd: 1.8, valor: 4,  gold: 16, name: 'Spider' },
  beetle:         { file: './assets/mobs/beetle.png',         w: 1.5,  h: 1.7,  hp: 44, dmg: 14, spd: 1.3, valor: 6,  gold: 22, name: 'Berserker Beetle' },
  eyeball:        { file: './assets/mobs/eyeball.png',        w: 1.2,  h: 1.1,  hp: 24, dmg: 11, spd: 1.5, valor: 4,  gold: 14, name: 'Watching Eye', fly: true },
  bug:            { file: './assets/mobs/armored-bug.png',    w: 1.3,  h: 1.45, hp: 34, dmg: 12, spd: 1.4, valor: 4,  gold: 15, name: 'Armored Bug' },
  insectoid:      { file: './assets/mobs/insectoid.png',      w: 1.15, h: 1.9,  hp: 40, dmg: 13, spd: 1.7, valor: 5,  gold: 18, name: 'Insectoid' },
  slime:          { file: './assets/mobs/slime.png',          w: 1.3,  h: 1.2,  hp: 28, dmg: 9,  spd: 1.1, valor: 3,  gold: 11, name: 'Slime' },
  demon:          { file: './assets/mobs/red-demon.png',      w: 1.4,  h: 1.25, hp: 52, dmg: 16, spd: 1.9, valor: 8,  gold: 28, name: 'Red Demon' },
  plant:          { file: './assets/mobs/plant-beast.png',    w: 1.7,  h: 1.8,  hp: 48, dmg: 14, spd: 0.9, valor: 6,  gold: 20, name: 'Plant Beast' },
  serpents:       { file: './assets/mobs/serpents.png',       w: 1.6,  h: 1.9,  hp: 46, dmg: 15, spd: 1.6, valor: 6,  gold: 20, name: 'Twin Serpents' },
  horror:         { file: './assets/mobs/winged-horror.png',  w: 2.4,  h: 2.05, hp: 70, dmg: 18, spd: 1.5, valor: 12, gold: 40, name: 'Winged Horror', fly: true },
  'green-drake':  { file: './assets/mobs/green-drake.png',    w: 2.0,  h: 2.0,  hp: 80, dmg: 18, spd: 1.4, valor: 14, gold: 45, name: 'Green Drake' },
  'pink-drake':   { file: './assets/mobs/pink-drake.png',     w: 1.7,  h: 1.3,  hp: 42, dmg: 13, spd: 2.1, valor: 7,  gold: 24, name: 'Pink Drake', fly: true },
  lizard:         { file: './assets/mobs/fire-lizard.png',    w: 1.6,  h: 0.8,  hp: 28, dmg: 11, spd: 2.2, valor: 4,  gold: 13, name: 'Fire Lizard' },
  crab:           { file: './assets/mobs/tentacle-crab.png',  w: 1.35, h: 1.15, hp: 32, dmg: 11, spd: 1.5, valor: 4,  gold: 14, name: 'Tentacle Crab' },
  'fire-drake':   { file: './assets/mobs/fire-drake.png',     w: 4.4,  h: 4.0,  hp: 220,dmg: 22, spd: 1.35,valor: 80, gold: 250,name: 'Fire Drake', boss: true, fly: true },
};

const STAGES = [
  {
    id: 'siddun', name: 'SIDDUN', sub: 'THE TREE OF LIFE',
    length: 78, bg: './assets/bg/siddun-tree.jpg', bg2: './assets/bg/siddun-market.jpg',
    map: './assets/maps/siddun-city.png', tint: 0x87a0b8,
    platforms: [
      { x: 16, y: 1.7, w: 4.8, h: 0.4 },
      { x: 24, y: 3.4, w: 3.6, h: 0.4 },
      { x: 32, y: 5.0, w: 3.4, h: 0.35 },
      { x: 42, y: 2.2, w: 5.2, h: 0.4 },
      { x: 52, y: 4.2, w: 3.8, h: 0.35 },
      { x: 62, y: 2.6, w: 4.6, h: 0.4 },
      { x: 70, y: 4.8, w: 3.2, h: 0.35 },
    ],
    enemies: [
      { kind: 'rat', x: 12 }, { kind: 'rat', x: 17 },
      { kind: 'mosquito', x: 20, y: 3.6 }, { kind: 'fat-rat', x: 26 },
      { kind: 'eyeball', x: 31, y: 5.5 }, { kind: 'snake', x: 36 },
      { kind: 'mosquito', x: 42, y: 4.4 }, { kind: 'slime', x: 46 },
      { kind: 'pink-drake', x: 54, y: 5.2 }, { kind: 'bug', x: 62 },
      { kind: 'eyeball', x: 68, y: 3.8 }, { kind: 'rat', x: 72 },
    ],
  },
  {
    id: 'nelvo', name: 'GREAT NELVO DESERT', sub: 'IMPASSE POINT',
    length: 86, bg: './assets/bg/red-ocean.jpg', bg2: './assets/bg/castle-vale.jpg',
    map: './assets/maps/nelvo-desert.png', tint: 0xc9a070,
    platforms: [
      { x: 14, y: 1.8, w: 4.0, h: 0.4 },
      { x: 22, y: 3.6, w: 3.4, h: 0.35 },
      { x: 32, y: 5.2, w: 3.2, h: 0.35 },
      { x: 42, y: 2.4, w: 5.0, h: 0.4 },
      { x: 52, y: 4.4, w: 3.6, h: 0.35 },
      { x: 64, y: 2.2, w: 4.8, h: 0.4 },
      { x: 74, y: 4.8, w: 3.4, h: 0.35 },
    ],
    enemies: [
      { kind: 'snake', x: 11 }, { kind: 'lizard', x: 17 },
      { kind: 'mosquito', x: 20, y: 4.0 }, { kind: 'crab', x: 24 },
      { kind: 'eyeball', x: 32, y: 5.8 }, { kind: 'beetle', x: 36 },
      { kind: 'pink-drake', x: 44, y: 5.0 }, { kind: 'crab', x: 50 },
      { kind: 'serpents', x: 58 }, { kind: 'horror', x: 66, y: 5.4 },
      { kind: 'beetle', x: 70 }, { kind: 'eyeball', x: 78, y: 4.2 },
    ],
  },
  {
    id: 'mines', name: 'THE MINES', sub: 'FUNGUS TOWN & THE RIFT',
    length: 88, bg: './assets/bg/stone-gate.jpg', bg2: './assets/bg/dungeon-den.jpg',
    map: './assets/maps/fungus-town.png', tint: 0x6a5a48,
    platforms: [
      { x: 12, y: 1.9, w: 4.2, h: 0.4 },
      { x: 20, y: 3.8, w: 3.4, h: 0.35 },
      { x: 30, y: 5.4, w: 3.2, h: 0.35 },
      { x: 40, y: 2.6, w: 4.8, h: 0.4 },
      { x: 50, y: 4.6, w: 3.6, h: 0.35 },
      { x: 62, y: 2.2, w: 5.0, h: 0.4 },
      { x: 74, y: 4.4, w: 3.8, h: 0.35 },
    ],
    enemies: [
      { kind: 'spider', x: 11 }, { kind: 'insectoid', x: 18 },
      { kind: 'mosquito', x: 22, y: 4.6 }, { kind: 'plant', x: 28 },
      { kind: 'horror', x: 34, y: 5.8 }, { kind: 'demon', x: 42 },
      { kind: 'pink-drake', x: 50, y: 5.4 }, { kind: 'bug', x: 56 },
      { kind: 'eyeball', x: 64, y: 4.8 }, { kind: 'green-drake', x: 70 },
      { kind: 'horror', x: 78, y: 5.2 },
    ],
  },
  {
    id: 'arena', name: 'COLOSSAL ARENA', sub: 'THE FIRE DRAKE',
    length: 52, bg: './assets/bg/fire-beast.jpg', bg2: './assets/bg/dragon-gate.jpg',
    map: './assets/maps/mt-mushroom.png', tint: 0xaa5530,
    platforms: [
      { x: 10, y: 2.0, w: 3.6, h: 0.4 },
      { x: 18, y: 3.8, w: 3.2, h: 0.35 },
      { x: 28, y: 5.2, w: 3.0, h: 0.35 },
      { x: 38, y: 2.4, w: 4.4, h: 0.4 },
    ],
    enemies: [
      { kind: 'lizard', x: 10 }, { kind: 'demon', x: 16 },
      { kind: 'pink-drake', x: 22, y: 4.8 },
    ],
    boss: { kind: 'fire-drake', x: 36, y: 1.6 },
  },
];

const input = {
  left: false, right: false, up: false, down: false,
  jump: false, jumpPressed: false,
  throw: false, throwPressed: false, throwReleased: false,
  dash: false, dashPressed: false,
};
const hero = {
  x: 3, y: 0, vx: 0, vy: 0, onGround: false, facing: 1, aimX: 1, aimY: 0,
  hp: 100, maxHp: 100, sta: 100, maxSta: 100,
  hurtT: 0, dead: false, flying: false,
  coyote: 0, jumpBuf: 0, jumpTime: 0, jumpHeld: false,
  dashT: 0, dashCool: 0, dashI: 0, jumpCut: false,
  landSquash: 0, bob: 0, lean: 0, stretch: 1,
  w: 0.75, h: 1.85,
};
const disc = {
  state: 'held', x: 0, y: 0, vx: 0, vy: 0, hits: new Set(), t: 0,
  charged: false, charge: 0, charging: false, pierce: false, caught: false,
};
const G = {
  mode: 'title', stage: 0, gold: 0, valor: 0, time: 0,
  enemies: [], platforms: [], shake: 0, hitStop: 0, msgT: 0,
  camX: 3, camY: 2.8, length: 80, deadT: 0, win: false, loaded: false,
};

const CHAIN_N = 22;
const TRAIL_N = 12;
const SPARK_N = 80;
let heroRoot, heroMesh, wingL, wingR, thrustLight, discMesh, chain, trailMesh, sparkMesh, stageRoot, shadowMesh;
const trailPos = [];
const sparks = [];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _col = new THREE.Color();

function makeChain() {
  chain = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.055, 0.018, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9b07a, metalness: 1, roughness: 0.25, emissive: 0x3a2208, emissiveIntensity: 0.35 }),
    CHAIN_N
  );
  chain.frustumCulled = false; chain.visible = false; chain.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(chain);
}

function makeTrail() {
  trailMesh = new THREE.InstancedMesh(
    new THREE.RingGeometry(0.16, 0.34, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    TRAIL_N
  );
  trailMesh.frustumCulled = false; trailMesh.visible = false;
  trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(trailMesh);
}

function makeSparks() {
  sparkMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.055, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    SPARK_N
  );
  sparkMesh.frustumCulled = false;
  sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(sparkMesh);
  for (let i = 0; i < SPARK_N; i++) sparks.push({ life: 0, x: 0, y: 0, vx: 0, vy: 0, r: 0.06, cr: 1, cg: 0.8, cb: 0.3 });
}

function burst(x, y, n = 14, speed = 6, color = [1, 0.75, 0.25]) {
  let used = 0;
  for (const s of sparks) {
    if (s.life > 0) continue;
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.4 + Math.random() * 0.8);
    s.life = 0.28 + Math.random() * 0.25;
    s.x = x; s.y = y; s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp + 1.5;
    s.r = 0.04 + Math.random() * 0.07;
    s.cr = color[0]; s.cg = color[1]; s.cb = color[2];
    if (++used >= n) break;
  }
}

function updateSparks(dt) {
  let any = false, i = 0;
  for (const s of sparks) {
    if (s.life > 0) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy -= 18 * dt;
      const k = Math.max(0, s.life * 3);
      _p.set(s.x, s.y, 0.5);
      _s.setScalar(s.r * (0.5 + k));
      _m.compose(_p, _q.identity(), _s);
      sparkMesh.setMatrixAt(i, _m);
      any = true;
    } else {
      _s.setScalar(0); _p.set(0, -20, 0); _m.compose(_p, _q.identity(), _s);
      sparkMesh.setMatrixAt(i, _m);
    }
    i++;
  }
  sparkMesh.instanceMatrix.needsUpdate = true;
  sparkMesh.visible = any;
}

function layout() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / Math.max(1, h);
  camera.left = -viewH * aspect / 2;
  camera.right = viewH * aspect / 2;
  camera.top = viewH / 2 + 1.15;
  camera.bottom = -viewH / 2 + 1.15;
  camera.updateProjectionMatrix();
}
addEventListener('resize', layout); layout();

function showMsg(t, sub, dur = 2.2) {
  document.getElementById('msg').textContent = t;
  document.getElementById('sub').textContent = sub || '';
  G.msgT = dur;
}

function hud() {
  document.getElementById('hp').style.width = Math.max(0, 100 * hero.hp / hero.maxHp) + '%';
  const stEl = document.getElementById('st');
  stEl.style.width = Math.max(0, 100 * hero.sta / hero.maxSta) + '%';
  stEl.classList.toggle('fly', hero.flying);
  stEl.classList.toggle('low', hero.sta < 18);
  document.getElementById('gold').textContent = 'GOLD ' + G.gold;
  document.getElementById('valor').textContent = 'VALOR ' + G.valor;
  const st = STAGES[G.stage] || STAGES[0];
  document.getElementById('stageName').textContent = st.name;
  document.getElementById('stageSub').textContent = st.sub;
  const boss = G.enemies.find(e => e.boss && e.hp > 0);
  const bh = document.getElementById('bossHud');
  if (boss) {
    bh.style.display = 'block';
    document.getElementById('bossName').textContent = boss.name.toUpperCase();
    document.getElementById('bossHp').style.width = Math.max(0, 100 * boss.hp / boss.maxHp) + '%';
  } else bh.style.display = 'none';
  document.querySelectorAll('.gameHud').forEach(el => {
    if (el.id !== 'bossHud') el.style.visibility = G.mode === 'title' ? 'hidden' : 'visible';
  });
}

function clearStage() {
  if (stageRoot) {
    scene.remove(stageRoot);
    stageRoot.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  }
  stageRoot = new THREE.Group(); scene.add(stageRoot);
  G.enemies = []; G.platforms = [];
}

function addPlatform(p) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9, metalness: 0.05 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, 1.4), mat);
  m.position.set(p.x, p.y - p.h / 2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.05, 0.08, 1.5), new THREE.MeshStandardMaterial({ color: 0x8a7349, roughness: 0.8 }));
  top.position.set(p.x, p.y, 0);
  stageRoot.add(m, top);
  G.platforms.push(p);
}

function spawnEnemy(spec) {
  const k = KINDS[spec.kind]; if (!k) return;
  const tex = TEX[k.file]; if (!tex) return;
  const mesh = billboard(tex, k.w, k.h);
  const fly = !!(k.fly || spec.y);
  const y = fly ? (spec.y || 2.4) : 0;
  mesh.position.set(spec.x, y + k.h / 2, 0);
  stageRoot.add(mesh);
  const e = {
    kind: spec.kind, name: k.name, mesh, w: k.w * 0.7, h: k.h,
    x: spec.x, y, vx: (Math.random() < 0.5 ? -1 : 1) * k.spd, vy: 0,
    hp: k.hp, maxHp: k.hp, dmg: k.dmg, spd: k.spd, valor: k.valor, gold: k.gold,
    hurtT: 0, dead: false, fly, boss: !!k.boss, home: spec.x, homeY: y, dir: Math.random() < 0.5 ? -1 : 1,
  };
  G.enemies.push(e);
  return e;
}

function buildGround(length, tint) {
  const g = new THREE.Mesh(new THREE.BoxGeometry(length + 20, 1.2, 6), new THREE.MeshStandardMaterial({ color: tint || 0x3a3228, roughness: 0.95 }));
  g.position.set(length / 2, -0.6, 0); stageRoot.add(g);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(length + 20, 0.08, 6.1), new THREE.MeshStandardMaterial({ color: 0x6a5a40, roughness: 0.8 }));
  strip.position.set(length / 2, 0.0, 0); stageRoot.add(strip);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1 });
  const L = new THREE.Mesh(new THREE.BoxGeometry(1.2, 14, 6), wallMat); L.position.set(-1.2, 5, 0); stageRoot.add(L);
  const R = new THREE.Mesh(new THREE.BoxGeometry(1.2, 14, 6), wallMat); R.position.set(length + 1.2, 5, 0); stageRoot.add(R);
}

function addBackdrop(texUrl, x, y, w, h, z) {
  const tex = TEX[texUrl]; if (!tex) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, depthWrite: false }));
  m.position.set(x, y, z); stageRoot.add(m);
}

function resetHeroMotion() {
  hero.x = 3; hero.y = 0; hero.vx = 0; hero.vy = 0; hero.dead = false; hero.hurtT = 0;
  hero.flying = false; hero.coyote = 0; hero.jumpBuf = 0; hero.jumpTime = 0;
  hero.dashT = 0; hero.dashCool = 0; hero.dashI = 0; hero.jumpCut = false; hero.landSquash = 0;
  hero.hp = hero.maxHp; hero.sta = hero.maxSta; hero.facing = 1; hero.aimX = 1; hero.aimY = 0;
  disc.state = 'held'; disc.charge = 0; disc.charging = false; disc.charged = false; disc.pierce = false; disc.hits = new Set();
}

function loadStage(i, resetHero = true) {
  const st = STAGES[i]; if (!st) return;
  G.stage = i; G.length = st.length;
  clearStage();
  buildGround(st.length, st.tint);
  const span = st.length + 16;
  addBackdrop(st.bg, span * 0.28, 4.6, span * 0.7, 12, -8);
  addBackdrop(st.bg2, span * 0.72, 4.6, span * 0.7, 12, -8.2);
  if (st.map) addBackdrop(st.map, st.length * 0.5, 7.4, 8.4, 4.5, -6);
  st.platforms.forEach(addPlatform);
  st.enemies.forEach(spawnEnemy);
  if (st.boss) {
    const b = spawnEnemy(st.boss);
    if (b) Snd.roar();
  }
  if (resetHero) resetHeroMotion();
  G.camX = hero.x; G.camY = 2.8;
  showMsg(st.name, st.sub, 2.6);
  hud();
}

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function collideWorld(ent, dt) {
  ent.y += ent.vy * dt;
  let grounded = false;
  if (ent.y < 0) { ent.y = 0; if (ent.vy < 0) ent.vy = 0; grounded = true; }
  for (const p of G.platforms) {
    const feet = ent.y, left = ent.x - ent.w / 2, right = ent.x + ent.w / 2;
    const pL = p.x - p.w / 2, pR = p.x + p.w / 2;
    if (right > pL && left < pR) {
      if (ent.vy <= 0.15 && feet >= p.y - 0.7 && feet <= p.y + 0.16) {
        ent.y = p.y; ent.vy = 0; grounded = true;
      }
    }
  }
  if (ent.y > 7.4) { ent.y = 7.4; if (ent.vy > 0) ent.vy = 0; }
  ent.onGround = grounded;
  ent.x = Math.max(0.6, Math.min(G.length - 0.6, ent.x + ent.vx * dt));
}

function aimDir() {
  let ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let ay = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  if (ax === 0 && ay === 0) { ax = hero.facing; ay = hero.flying ? 0 : 0; }
  const len = Math.hypot(ax, ay) || 1;
  hero.aimX = ax / len; hero.aimY = ay / len;
  if (ax !== 0) hero.facing = Math.sign(ax);
  return { x: hero.aimX, y: hero.aimY };
}

function throwDisc(charge) {
  if (disc.state !== 'held' || hero.dead || G.mode !== 'play') return false;
  const cost = charge >= 0.35 ? 12 : 6;
  if (hero.sta < cost * 0.5) return false;
  hero.sta = Math.max(0, hero.sta - cost);
  const dir = aimDir();
  const charged = charge >= 0.35;
  const speed = charged ? 26 : 22;
  disc.state = 'fly'; disc.t = 0; disc.hits = new Set();
  disc.charged = charged; disc.pierce = charged; disc.caught = false;
  disc.x = hero.x + dir.x * 0.6; disc.y = hero.y + 1.05 + dir.y * 0.25;
  disc.vx = dir.x * speed; disc.vy = dir.y * speed;
  trailPos.length = 0;
  Snd.throw();
  if (charged) { Snd.charge(); burst(disc.x, disc.y, 10, 5, [1, 0.85, 0.35]); }
  return true;
}

function catchDisc() {
  disc.state = 'held'; disc.charged = false; disc.pierce = false; disc.charging = false; disc.charge = 0; disc.vx = 0; disc.vy = 0;
  chain.visible = false; trailMesh.visible = false;
  hero.sta = Math.min(hero.maxSta, hero.sta + 5);
  disc.caught = true;
  Snd.catch();
  burst(hero.x + hero.facing * 0.4, hero.y + 1.05, 8, 4, [1, 0.95, 0.6]);
}

function updateDisc(dt) {
  const handX = hero.x + hero.facing * 0.45;
  const handY = hero.y + 1.05;
  if (disc.state === 'held') {
    if (disc.charging) {
      disc.charge = Math.min(1, disc.charge + dt * 1.35);
      if (disc.charge >= 1) throwDisc(1);
    }
    disc.x = handX; disc.y = handY;
    const pulse = disc.charging ? 1 + disc.charge * 0.55 : 1;
    discMesh.position.set(disc.x, disc.y, 0.35);
    discMesh.scale.setScalar(pulse);
    discMesh.rotateZ(dt * (disc.charging ? 14 + disc.charge * 18 : 7));
    discMesh.userData.halo.material.opacity = disc.charging ? 0.35 + disc.charge * 0.55 : 0.28;
    discMesh.userData.halo.material.color.set(disc.charge > 0.35 ? 0xffee88 : 0xffd578);
    chain.visible = false; trailMesh.visible = false; discMesh.visible = true;
    return;
  }

  // slight homing while flying out
  if (disc.state === 'fly') {
    let best = null, bestD = 9;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const ex = e.x, ey = e.y + e.h * 0.45;
      const dx = ex - disc.x, dy = ey - disc.y;
      const d = Math.hypot(dx, dy);
      const spd = Math.hypot(disc.vx, disc.vy) || 1;
      const align = (dx * disc.vx + dy * disc.vy) / (d * spd);
      if (d < bestD && align > 0.15) { best = e; bestD = d; }
    }
    if (best) {
      const ex = best.x - disc.x, ey = (best.y + best.h * 0.45) - disc.y;
      const d = Math.hypot(ex, ey) || 1;
      const steer = disc.charged ? 10 : 16;
      disc.vx += (ex / d) * steer * dt;
      disc.vy += (ey / d) * steer * dt;
      const sp = Math.hypot(disc.vx, disc.vy), cap = disc.charged ? 28 : 23;
      if (sp > cap) { disc.vx *= cap / sp; disc.vy *= cap / sp; }
    }
  }

  disc.t += dt;
  disc.x += disc.vx * dt; disc.y += disc.vy * dt;
  discMesh.position.set(disc.x, disc.y, 0.35);
  discMesh.scale.setScalar(disc.charged ? 1.55 : 1.05);
  discMesh.rotateZ(dt * (disc.charged ? 28 : 24));
  discMesh.userData.halo.material.opacity = disc.charged ? 0.85 : 0.62;
  chain.visible = true; discMesh.visible = true;

  trailPos.push({ x: disc.x, y: disc.y });
  if (trailPos.length > TRAIL_N) trailPos.shift();
  for (let i = 0; i < TRAIL_N; i++) {
    const rec = trailPos[i];
    if (!rec) { _s.setScalar(0); _p.set(0, -30, 0); }
    else {
      const k = (i + 1) / trailPos.length;
      _p.set(rec.x, rec.y, 0.2);
      _s.setScalar(0.55 + k * 0.9);
    }
    _m.compose(_p, _q.identity(), _s);
    trailMesh.setMatrixAt(i, _m);
  }
  trailMesh.instanceMatrix.needsUpdate = true;
  trailMesh.visible = trailPos.length > 1;

  for (const e of G.enemies) {
    if (e.dead || disc.hits.has(e)) continue;
    const dx = disc.x - e.x, dy = disc.y - (e.y + e.h * 0.45);
    const r = 0.9 + Math.max(e.w, e.h) * 0.42;
    if (dx * dx + dy * dy < r * r) {
      disc.hits.add(e);
      const dmg = (disc.charged ? 36 : 26) * (e.boss ? 0.85 : 1);
      e.hp -= dmg; e.hurtT = 0.2;
      Snd.hit(); Snd.spark();
      G.shake = disc.charged ? 0.32 : 0.22;
      G.hitStop = disc.charged || e.boss ? 0.07 : 0.045;
      burst(disc.x, disc.y, disc.charged ? 18 : 12, disc.charged ? 8 : 6, e.boss ? [1, 0.45, 0.15] : [1, 0.8, 0.3]);
      if (e.hp <= 0) killEnemy(e);
      if (!disc.pierce) disc.state = 'return';
    }
  }

  const dist = Math.hypot(disc.x - handX, disc.y - handY);
  if (disc.state === 'fly') {
    const maxR = disc.charged ? 13 : 8.8;
    const maxT = disc.charged ? 0.7 : 0.42;
    if (dist > maxR || disc.t > maxT || disc.x < -0.5 || disc.x > G.length + 0.5 || disc.y < -1 || disc.y > 11) {
      disc.state = 'return';
    }
  }
  if (disc.state === 'return') {
    const a = Math.atan2(handY - disc.y, handX - disc.x);
    const sp = 32;
    disc.vx = Math.cos(a) * sp; disc.vy = Math.sin(a) * sp;
    const canCatch = dist < 1.85;
    if (canCatch && input.throwPressed) { catchDisc(); return; }
    if (dist < 0.5 || disc.t > 1.5) catchDisc();
  }

  // chain
  const from = new THREE.Vector3(handX, handY, 0.2), to = new THREE.Vector3(disc.x, disc.y, 0.3);
  const sag = Math.min(1.15, from.distanceTo(to) * 0.1);
  let prev = from.clone();
  for (let i = 0; i < CHAIN_N; i++) {
    const k = (i + 1) / CHAIN_N;
    const pt = new THREE.Vector3().lerpVectors(from, to, k);
    pt.y -= Math.sin(k * Math.PI) * sag;
    const mid = new THREE.Vector3().lerpVectors(prev, pt, 0.5);
    const dir = new THREE.Vector3().subVectors(pt, prev);
    if (dir.lengthSq() < 1e-8) dir.set(1, 0, 0);
    _q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    _s.set(1, 1, 1);
    _m.compose(mid, _q, _s);
    chain.setMatrixAt(i, _m);
    prev.copy(pt);
  }
  chain.instanceMatrix.needsUpdate = true;
}

function killEnemy(e) {
  e.dead = true; e.hp = 0; e.mesh.visible = false;
  G.gold += e.gold; G.valor += e.valor;
  Snd.pickup();
  showMsg(e.name.toUpperCase() + ' FELLED', '+' + e.gold + ' gold   +' + e.valor + ' valor', 1.4);
}

function hurtHero(dmg, fromX) {
  if (hero.hurtT > 0 || hero.dashI > 0 || hero.dead || G.mode !== 'play') return;
  hero.hp -= dmg; hero.hurtT = 0.7;
  hero.vx += (hero.x < fromX ? -1 : 1) * 6.5;
  hero.vy = Math.max(hero.vy, 3.2);
  hero.flying = false;
  Snd.hurt(); G.shake = 0.26;
  document.getElementById('hurt').style.opacity = '1';
  setTimeout(() => { document.getElementById('hurt').style.opacity = '0'; }, 180);
  if (hero.hp <= 0) {
    hero.hp = 0; hero.dead = true; hero.flying = false; G.mode = 'dead'; G.deadT = 0;
    Snd.die(); showMsg('YOU HAVE FALLEN', 'Press any key to rise again at this place', 6);
  }
}

function updateHero(dt) {
  if (hero.dead) { hero.vy -= 28 * dt; hero.y = Math.max(0, hero.y + hero.vy * dt); return; }

  if (hero.onGround) hero.coyote = 0.1; else hero.coyote = Math.max(0, hero.coyote - dt);
  if (input.jumpPressed) hero.jumpBuf = 0.12; else hero.jumpBuf = Math.max(0, hero.jumpBuf - dt);
  hero.dashCool = Math.max(0, hero.dashCool - dt);
  hero.dashI = Math.max(0, hero.dashI - dt);
  hero.hurtT = Math.max(0, hero.hurtT - dt);
  hero.landSquash = Math.max(0, hero.landSquash - dt * 3.2);
  if (hero.dashT > 0) hero.dashT = Math.max(0, hero.dashT - dt);

  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (move !== 0 && hero.dashT <= 0) hero.facing = move;

  // dash
  if (input.dashPressed && hero.dashCool <= 0 && hero.sta >= 14 && (hero.onGround || hero.coyote > 0) && !hero.flying) {
    hero.vx = hero.facing * 16.5;
    hero.dashT = 0.15; hero.dashCool = 0.48; hero.dashI = 0.16;
    hero.sta -= 14; hero.coyote = 0; hero.landSquash = 0.28;
    Snd.dash(); burst(hero.x, hero.y + 0.5, 8, 4, [1, 0.85, 0.5]);
  }

  const onG = hero.onGround;
  const max = onG ? 8.0 : 7.3;
  const accel = onG ? 58 : 32;
  if (hero.dashT <= 0) {
    if (move !== 0) hero.vx += move * accel * dt;
    else hero.vx *= Math.pow(onG ? 0.001 : 0.18, dt);
    hero.vx = Math.max(-max, Math.min(max, hero.vx));
  }

  // jump (coyote + buffer)
  const canJump = (hero.onGround || hero.coyote > 0) && !hero.flying;
  if (hero.jumpBuf > 0 && canJump && hero.sta >= 3) {
    hero.vy = 11.4; hero.onGround = false; hero.coyote = 0; hero.jumpBuf = 0;
    hero.jumpTime = 0; hero.jumpCut = false; hero.sta = Math.max(0, hero.sta - 4);
    hero.stretch = 1.18; Snd.jump();
  }
  if (!hero.onGround) hero.jumpTime += dt;

  // variable jump height: cut once on release, unless already flying
  if (!hero.flying && !hero.onGround && !input.jump && !input.up && hero.vy > 4.2 && !hero.jumpCut) {
    hero.vy *= 0.48;
    hero.jumpCut = true;
  }

  // fly: hold Space or Up after a short jump window, or anytime in mid-air with Up
  const wantFly = (input.jump || input.up) && hero.sta > 2 && !hero.dead;
  const flyReady = !hero.onGround && (input.up || hero.jumpTime > 0.16);
  if (wantFly && flyReady && hero.dashT <= 0) {
    if (!hero.flying) { hero.flying = true; Snd.fly(); }
  }
  if (hero.flying) {
    if (!wantFly || hero.sta <= 0) hero.flying = false;
    else {
      hero.sta = Math.max(0, hero.sta - 26 * dt);
      if (input.up || input.jump) hero.vy = Math.min(6.6, hero.vy + 42 * dt);
      if (input.down) hero.vy = Math.max(-9, hero.vy - 32 * dt);
      else if (!input.up && !input.jump) hero.vy = Math.max(-2.8, hero.vy - 7 * dt);
      if (Math.random() < 28 * dt) {
        let n = 0;
        for (const s of sparks) {
          if (s.life > 0) continue;
          s.life = 0.24 + Math.random() * 0.2;
          s.x = hero.x + (Math.random() - 0.5) * 0.28;
          s.y = hero.y + 0.08;
          s.vx = (Math.random() - 0.5) * 1.6;
          s.vy = -3.1 - Math.random() * 2.6;
          s.r = 0.08 + Math.random() * 0.09;
          s.cr = 1; s.cg = 0.78; s.cb = 0.28;
          if (++n >= 5) break;
        }
      }
    }
  }

  if (!hero.flying) hero.vy -= 28 * dt;
  if (hero.vy < -17) hero.vy = -17;

  const wasGround = hero.onGround;
  collideWorld(hero, dt);
  if (!wasGround && hero.onGround) {
    hero.flying = false; hero.landSquash = 0.22; Snd.land();
    if (hero.vy < -1) burst(hero.x, hero.y + 0.05, 5, 3, [0.7, 0.55, 0.3]);
  }

  if (hero.onGround && !hero.flying) hero.sta = Math.min(hero.maxSta, hero.sta + 38 * dt);
  else if (!hero.flying) hero.sta = Math.min(hero.maxSta, hero.sta + 5 * dt);

  // charge / catch / throw
  if (input.throwPressed && disc.state === 'held' && !disc.charging) {
    disc.charging = true; disc.charge = 0;
  }
  if (input.throwPressed && disc.state === 'return') {
    const handX = hero.x + hero.facing * 0.45, handY = hero.y + 1.05;
    if (Math.hypot(disc.x - handX, disc.y - handY) < 2.2) catchDisc();
  }
  if (input.throwReleased && disc.charging && disc.state === 'held') {
    const c = disc.charge; disc.charging = false;
    throwDisc(c); disc.charge = 0;
  }
}

function updateEnemies(dt) {
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.hurtT = Math.max(0, e.hurtT - dt);
    e.mesh.material.color.setRGB(1, e.hurtT > 0 ? 0.45 : 1, e.hurtT > 0 ? 0.45 : 1);
    const toward = hero.x - e.x;
    const aggro = Math.abs(toward) < (e.boss ? 18 : 11);
    if (e.fly) {
      e.dir = aggro ? Math.sign(toward) || e.dir : (Math.abs(e.x - e.home) > 4.5 ? Math.sign(e.home - e.x) : e.dir);
      e.vx = e.dir * e.spd;
      e.x += e.vx * dt;
      const baseY = e.homeY || 2.4;
      e.y = baseY + Math.sin(G.time * 1.8 + e.home) * (e.boss ? 0.55 : 0.7);
      if (e.boss && aggro) e.y += (Math.max(0.4, hero.y - 0.4) - e.y) * 0.4 * dt;
      e.y = Math.max(0.4, Math.min(6.6, e.y));
    } else {
      if (aggro) e.dir = Math.sign(toward) || e.dir;
      else if (Math.abs(e.x - e.home) > 5) e.dir = Math.sign(e.home - e.x);
      e.vx = e.dir * e.spd;
      e.vy -= 28 * dt;
      collideWorld(e, dt);
    }
    e.x = Math.max(1, Math.min(G.length - 1, e.x));
    e.mesh.position.set(e.x, e.y + e.h / 2, 0);
    e.mesh.scale.x = (e.dir < 0 ? -1 : 1);
    if (!hero.dead && hero.hurtT <= 0 && hero.dashI <= 0) {
      if (aabbOverlap(hero.x - hero.w / 2, hero.y, hero.w, hero.h * 0.85, e.x - e.w / 2, e.y, e.w, e.h * 0.8)) {
        hurtHero(e.dmg, e.x);
      }
    }
  }
}

function checkAdvance() {
  if (G.mode !== 'play' || hero.dead) return;
  const st = STAGES[G.stage];
  const boss = G.enemies.find(e => e.boss);
  const bossDown = !st.boss || (boss && boss.dead);
  if (hero.x > G.length - 2.2 && bossDown) {
    if (G.stage + 1 < STAGES.length) loadStage(G.stage + 1, true);
    else {
      G.mode = 'end'; G.win = true; Snd.win();
      document.getElementById('end').style.display = 'flex';
      document.getElementById('endTitle').textContent = 'CHAMPION OF DELDYA';
      document.getElementById('endText').textContent = 'The Fire Drake is unmade. Valor ' + G.valor + '   ·   Gold ' + G.gold;
    }
  }
}

function startGame() {
  Snd.start(); Snd.fanfare();
  document.getElementById('title').style.display = 'none';
  document.getElementById('end').style.display = 'none';
  G.mode = 'play'; G.gold = 0; G.valor = 0; G.win = false;
  loadStage(0, true);
}

function retryOrAdvance() {
  if (G.mode === 'title') { startGame(); return; }
  if (G.mode === 'end') {
    document.getElementById('end').style.display = 'none';
    document.getElementById('title').style.display = 'flex';
    G.mode = 'title'; hud(); return;
  }
  if (G.mode === 'dead') { G.mode = 'play'; G.deadT = 0; loadStage(G.stage, true); }
}

function bindInput() {
  const map = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump',
    KeyF: 'throw', ControlLeft: 'throw', ControlRight: 'throw',
    ShiftLeft: 'dash', ShiftRight: 'dash', KeyC: 'dash',
  };
  addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') {
      Snd.muted = !Snd.muted;
      document.getElementById('mute').textContent = Snd.muted ? '🔇' : '🔊';
      e.preventDefault(); return;
    }
    if (G.mode !== 'play') {
      if (e.code === 'Space' || e.code === 'Enter' || e.key.length === 1) { e.preventDefault(); retryOrAdvance(); }
      return;
    }
    const k = map[e.code];
    if (!k) return;
    e.preventDefault();
    if (k === 'jump' && !input.jump) input.jumpPressed = true;
    if (k === 'up' && !input.up) input.jumpPressed = true;
    if (k === 'throw' && !input.throw) input.throwPressed = true;
    if (k === 'dash' && !input.dash) input.dashPressed = true;
    input[k] = true;
  });
  addEventListener('keyup', (e) => {
    const k = map[e.code];
    if (!k) return;
    if (k === 'throw' && input.throw) input.throwReleased = true;
    input[k] = false;
  });
  addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    Snd.start();
    if (G.mode !== 'play') { retryOrAdvance(); return; }
    input.throwPressed = true; input.throw = true;
  });
  addEventListener('mouseup', () => { if (input.throw) input.throwReleased = true; input.throw = false; });
  document.getElementById('playBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.start(); startGame(); });
  document.getElementById('mute').addEventListener('click', (e) => {
    e.stopPropagation(); Snd.muted = !Snd.muted;
    document.getElementById('mute').textContent = Snd.muted ? '🔇' : '🔊';
  });
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  function stickAt(ev) {
    const r = stick.getBoundingClientRect();
    const t = ev.touches ? ev.touches[0] : ev;
    const x = t.clientX - r.left - r.width / 2, y = t.clientY - r.top - r.height / 2;
    const m = Math.hypot(x, y), rad = 36, k = m > rad ? rad / m : 1;
    knob.style.left = (35 + x * k) + 'px'; knob.style.top = (35 + y * k) + 'px';
    input.left = x * k < -12; input.right = x * k > 12;
    input.up = y * k < -12; input.down = y * k > 12;
    if (input.up && !hero.flying) input.jumpPressed = true;
  }
  function stickEnd() {
    knob.style.left = '35px'; knob.style.top = '35px';
    input.left = input.right = input.up = input.down = false;
  }
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); stickAt(e); }, { passive: false });
  stick.addEventListener('touchmove', (e) => { e.preventDefault(); stickAt(e); }, { passive: false });
  stick.addEventListener('touchend', stickEnd);
  document.getElementById('bJump').addEventListener('touchstart', (e) => { e.preventDefault(); if (!input.jump) input.jumpPressed = true; input.jump = true; input.up = true; });
  document.getElementById('bJump').addEventListener('touchend', () => { input.jump = false; input.up = false; });
  document.getElementById('bDash').addEventListener('touchstart', (e) => { e.preventDefault(); input.dashPressed = true; input.dash = true; });
  document.getElementById('bDash').addEventListener('touchend', () => { input.dash = false; });
  document.getElementById('bDisc').addEventListener('touchstart', (e) => { e.preventDefault(); input.throwPressed = true; input.throw = true; });
  document.getElementById('bDisc').addEventListener('touchend', () => { input.throwReleased = true; input.throw = false; });
}

function snapshot() {
  return {
    mode: G.mode, hp: hero.hp, sta: hero.sta, x: hero.x, y: hero.y, vx: hero.vx, vy: hero.vy,
    onGround: hero.onGround, facing: hero.facing, flying: hero.flying,
    disc: disc.state, discX: disc.x, discY: disc.y, discVX: disc.vx, discVY: disc.vy,
    charged: disc.charged, charging: disc.charging, charge: disc.charge, pierce: disc.pierce, caught: disc.caught,
    gold: G.gold, valor: G.valor, stage: G.stage, stageName: (STAGES[G.stage] || {}).name,
    enemies: G.enemies.filter(e => !e.dead).length, totalEnemies: G.enemies.length,
    dead: hero.dead, win: G.win, length: G.length, dashT: hero.dashT, dashCool: hero.dashCool,
    aimX: hero.aimX, aimY: hero.aimY, camX: G.camX, camY: G.camY,
  };
}

function makeWings() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.12, 0.42, 0.62, 0.72, 1.28, 0.28);
  shape.bezierCurveTo(1.05, 0.08, 0.72, -0.02, 1.02, -0.42);
  shape.bezierCurveTo(0.55, -0.08, 0.22, -0.12, 0, -0.16);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffe8a8, transparent: true, opacity: 0, side: THREE.DoubleSide,
    depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  wingL = new THREE.Mesh(geo, mat.clone());
  wingR = new THREE.Mesh(geo, mat.clone());
  wingL.position.set(-0.16, 0.42, 0.16);
  wingL.scale.set(-1.15, 1.15, 1);
  wingR.position.set(0.16, 0.42, 0.16);
  wingR.scale.set(1.15, 1.15, 1);
  wingL.renderOrder = wingR.renderOrder = 4;
  heroRoot.add(wingL, wingR);
}

function presentHero(dt) {
  const spd = Math.abs(hero.vx);
  if (hero.onGround && spd > 0.4) hero.bob += dt * (8 + spd * 1.4);
  const bobY = (hero.onGround && !hero.dashT ? Math.abs(Math.sin(hero.bob)) * 0.07 * Math.min(1, spd / 5) : 0);
  const flyBob = hero.flying ? Math.sin(G.time * 9) * 0.05 : 0;
  const wantLean = hero.dead ? 1.15 : (hero.dashT > 0 ? hero.facing * 0.18 : hero.vx * 0.035 + (hero.flying ? -hero.facing * 0.04 : 0));
  hero.lean += (wantLean - hero.lean) * Math.min(1, 14 * dt);
  let sy = 1, sx = 1;
  if (hero.landSquash > 0) { sy = 1 - hero.landSquash * 0.35; sx = 1 + hero.landSquash * 0.28; }
  else if (!hero.onGround && hero.vy > 2) { sy = 1.12; sx = 0.9; }
  else if (hero.flying) { sy = 1.04 + Math.sin(G.time * 10) * 0.03; sx = 0.96; }
  hero.stretch += (1 - hero.stretch) * Math.min(1, 10 * dt);
  sy *= hero.stretch;
  heroRoot.position.set(hero.x, hero.y + hero.h / 2 * sy + bobY + flyBob, 0);
  heroRoot.scale.set(hero.facing * sx, sy, 1);
  heroRoot.rotation.z = hero.dead ? 1.2 * Math.min(1, G.deadT) : hero.lean * hero.facing;
  heroMesh.material.opacity = hero.hurtT > 0 && Math.sin(G.time * 30) > 0 ? 0.4 : 1;
  heroMesh.material.transparent = true;
  const wingOp = hero.flying ? 0.95 + Math.sin(G.time * 14) * 0.08 : Math.max(0, (wingL.material.opacity || 0) - dt * 3);
  const flap = hero.flying ? Math.sin(G.time * 14) * 0.28 : 0;
  const wingScale = hero.flying ? 1.15 + Math.sin(G.time * 14) * 0.08 : 1.0;
  wingL.material.opacity = wingOp; wingR.material.opacity = wingOp;
  wingL.rotation.z = 0.18 + flap; wingR.rotation.z = -0.18 - flap;
  wingL.scale.set(-wingScale, wingScale, 1); wingR.scale.set(wingScale, wingScale, 1);
  shadowMesh.position.set(hero.x, 0.02, 0.1);
  const sh = hero.dead ? 0.3 : Math.max(0.25, 1 - hero.y * 0.08);
  shadowMesh.scale.setScalar(sh);
}

function presentCam(dt) {
  const halfW = (camera.right - camera.left) / 2;
  const halfH = (camera.top - camera.bottom) / 2;
  const lookX = hero.facing * 2.3 + hero.vx * 0.18;
  const lookY = hero.flying ? 0.7 : hero.vy * 0.06;
  let tx = hero.x + lookX;
  let ty = Math.max(2.2, hero.y * 0.55 + 2.4 + lookY);
  tx = Math.max(halfW - 1.1, Math.min(G.length - halfW + 1.1, tx));
  ty = Math.max(2.15, Math.min(5.4, ty));
  G.camX += (tx - G.camX) * Math.min(1, 4.2 * dt);
  G.camY += (ty - G.camY) * Math.min(1, 3.6 * dt);
  const sh = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.55 : 0;
  const shY = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.35 : 0;
  G.shake = Math.max(0, G.shake - dt * 2.4);
  camera.position.x = G.camX + sh;
  camera.position.y = G.camY + shY;
  camera.lookAt(G.camX, G.camY, 0);
}

async function boot() {
  const urls = new Set(['./assets/hero/knight.png']);
  for (const k of Object.values(KINDS)) urls.add(k.file);
  for (const s of STAGES) { urls.add(s.bg); urls.add(s.bg2); if (s.map) urls.add(s.map); }
  await Promise.all([...urls].map(async (u) => {
    TEX[u] = await loadTex(u, u.includes('/mobs/') || u.includes('/hero/'));
  }));

  heroRoot = new THREE.Group();
  heroMesh = billboard(TEX['./assets/hero/knight.png'], 0.8, 1.85);
  heroRoot.add(heroMesh);
  makeWings();
  scene.add(heroRoot);
  shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
  shadowMesh.rotation.x = -Math.PI / 2; scene.add(shadowMesh);
  discMesh = buildDisc(1); scene.add(discMesh);
  makeChain(); makeTrail(); makeSparks();
  stageRoot = new THREE.Group(); scene.add(stageRoot);

  bindInput();
  G.loaded = true; window.__ready = true;
  window.__dbg = { snapshot, get mode() { return G.mode; }, get H() { return { root: heroRoot }; }, camera, project };
  window.__THREE = THREE;
  hud();
  loop(performance.now());
}

function project(x, y, z) {
  const v = new THREE.Vector3(x, y, z ?? 0);
  v.project(camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, behind: v.z > 1 };
}

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.033, (now - last) / 1000); last = now;
  if (G.hitStop > 0) {
    G.hitStop -= dt;
    updateSparks(dt);
    renderer.render(scene, camera);
    return;
  }
  G.time += dt;
  if (G.msgT > 0) { G.msgT -= dt; if (G.msgT <= 0) { document.getElementById('msg').textContent = ''; document.getElementById('sub').textContent = ''; } }
  if (G.mode === 'play') {
    updateHero(dt);
    updateDisc(dt);
    updateEnemies(dt);
    checkAdvance();
  } else if (G.mode === 'dead') {
    G.deadT += dt;
    updateDisc(dt);
    hero.vy -= 20 * dt; hero.y = Math.max(0, hero.y + hero.vy * dt);
  }
  if (heroRoot) presentHero(dt);
  updateSparks(dt);
  presentCam(dt);
  hud();
  renderer.render(scene, camera);
  input.jumpPressed = false; input.throwPressed = false; input.throwReleased = false; input.dashPressed = false;
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('msg').textContent = 'Failed to load art';
  window.__ready = true; window.__dbg = { snapshot: () => ({ mode: 'error', error: String(err) }) };
});
