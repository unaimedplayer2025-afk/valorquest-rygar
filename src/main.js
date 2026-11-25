// VALOR QUEST: Chain of Deldya — Rygar-style action platformer using Valor Quest art as-is.
import * as THREE from 'three';
import Snd from './audio.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x0b1218, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b1218, 40, 90);

let viewH = 9;
const camera = new THREE.OrthographicCamera(-8, 8, viewH / 2 + 1.5, -viewH / 2 + 1.5, 0.1, 200);
camera.position.set(0, 2.4, 30);
camera.lookAt(0, 2.4, 0);

const light = new THREE.DirectionalLight(0xfff2d8, 1.15);
light.position.set(6, 12, 16);
scene.add(light, new THREE.AmbientLight(0x8899aa, 0.7));

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
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.28 * scale, 0.055 * scale, 8, 18),
    new THREE.MeshStandardMaterial({ color: 0xc0c4cc, metalness: 0.95, roughness: 0.25, emissive: 0x221100 })
  );
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.08 * scale, 10),
    new THREE.MeshStandardMaterial({ color: 0x888890, metalness: 1, roughness: 0.3 })
  );
  hub.rotation.x = Math.PI / 2;
  g.add(ring, hub);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xddd8d0, metalness: 0.9, roughness: 0.2 });
  const spikeGeo = new THREE.ConeGeometry(0.05 * scale, 0.2 * scale, 5);
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    const a = (i / 10) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.34 * scale, Math.sin(a) * 0.34 * scale, 0);
    s.rotation.z = a - Math.PI / 2;
    g.add(s);
  }
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.38 * scale, 0.52 * scale, 20),
    new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  g.add(halo); g.userData.halo = halo; g.userData.spin = ring;
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
  'fire-drake':   { file: './assets/mobs/fire-drake.png',     w: 4.4,  h: 4.0,  hp: 220,dmg: 22, spd: 1.35,valor: 80, gold: 250,name: 'Fire Drake', boss: true },
};

const STAGES = [
  {
    id: 'siddun', name: 'SIDDUN', sub: 'THE TREE OF LIFE',
    length: 78, bg: './assets/bg/siddun-tree.jpg', bg2: './assets/bg/siddun-market.jpg',
    map: './assets/maps/siddun-city.png', tint: 0x87a0b8,
    platforms: [
      { x: 18, y: 1.6, w: 5.5, h: 0.4 },
      { x: 28, y: 2.6, w: 4.2, h: 0.4 },
      { x: 40, y: 1.8, w: 6.0, h: 0.4 },
      { x: 55, y: 2.4, w: 4.5, h: 0.4 },
      { x: 66, y: 1.7, w: 5.0, h: 0.4 },
    ],
    enemies: [
      { kind: 'rat', x: 12 }, { kind: 'rat', x: 16 }, { kind: 'mosquito', x: 20, y: 2.4 },
      { kind: 'fat-rat', x: 26 }, { kind: 'snake', x: 34 }, { kind: 'rat', x: 38 },
      { kind: 'slime', x: 46 }, { kind: 'mosquito', x: 50, y: 2.8 }, { kind: 'eyeball', x: 58, y: 2.6 },
      { kind: 'bug', x: 64 }, { kind: 'rat', x: 70 },
    ],
  },
  {
    id: 'nelvo', name: 'GREAT NELVO DESERT', sub: 'IMPASSE POINT',
    length: 86, bg: './assets/bg/red-ocean.jpg', bg2: './assets/bg/castle-vale.jpg',
    map: './assets/maps/nelvo-desert.png', tint: 0xc9a070,
    platforms: [
      { x: 14, y: 1.7, w: 4.0, h: 0.4 },
      { x: 24, y: 2.8, w: 3.6, h: 0.4 },
      { x: 36, y: 1.9, w: 5.5, h: 0.4 },
      { x: 50, y: 2.7, w: 4.0, h: 0.4 },
      { x: 62, y: 1.8, w: 5.0, h: 0.4 },
      { x: 74, y: 2.5, w: 4.2, h: 0.4 },
    ],
    enemies: [
      { kind: 'snake', x: 11 }, { kind: 'lizard', x: 17 }, { kind: 'crab', x: 22 },
      { kind: 'beetle', x: 30 }, { kind: 'snake', x: 36 }, { kind: 'pink-drake', x: 42, y: 3.2 },
      { kind: 'crab', x: 48 }, { kind: 'serpents', x: 56 }, { kind: 'beetle', x: 64 },
      { kind: 'lizard', x: 70 }, { kind: 'eyeball', x: 76, y: 2.8 },
    ],
  },
  {
    id: 'mines', name: 'THE MINES', sub: 'FUNGUS TOWN & THE RIFT',
    length: 88, bg: './assets/bg/stone-gate.jpg', bg2: './assets/bg/dungeon-den.jpg',
    map: './assets/maps/fungus-town.png', tint: 0x6a5a48,
    platforms: [
      { x: 12, y: 1.8, w: 4.5, h: 0.4 },
      { x: 22, y: 3.0, w: 3.8, h: 0.4 },
      { x: 33, y: 2.0, w: 5.2, h: 0.4 },
      { x: 46, y: 3.1, w: 4.0, h: 0.4 },
      { x: 58, y: 1.9, w: 5.5, h: 0.4 },
      { x: 72, y: 2.6, w: 4.6, h: 0.4 },
    ],
    enemies: [
      { kind: 'spider', x: 11 }, { kind: 'insectoid', x: 18 }, { kind: 'plant', x: 25 },
      { kind: 'bug', x: 32 }, { kind: 'demon', x: 40 }, { kind: 'horror', x: 48, y: 3.4 },
      { kind: 'spider', x: 55 }, { kind: 'plant', x: 62 }, { kind: 'green-drake', x: 70 },
      { kind: 'demon', x: 78 },
    ],
  },
  {
    id: 'arena', name: 'COLOSSAL ARENA', sub: 'THE FIRE DRAKE',
    length: 48, bg: './assets/bg/fire-beast.jpg', bg2: './assets/bg/dragon-gate.jpg',
    map: './assets/maps/mt-mushroom.png', tint: 0xaa5530,
    platforms: [
      { x: 12, y: 1.8, w: 4.0, h: 0.4 },
      { x: 22, y: 2.6, w: 3.6, h: 0.4 },
      { x: 34, y: 1.8, w: 4.5, h: 0.4 },
    ],
    enemies: [
      { kind: 'lizard', x: 10 }, { kind: 'demon', x: 16 },
    ],
    boss: { kind: 'fire-drake', x: 34 },
  },
];

const input = { left: false, right: false, jump: false, jumpPressed: false, throw: false, throwPressed: false };
const keys = {};
const hero = {
  x: 3, y: 0, vx: 0, vy: 0, onGround: false, facing: 1,
  hp: 100, maxHp: 100, sta: 100, maxSta: 100,
  hurtT: 0, dead: false, jumpHeld: false,
  w: 0.75, h: 1.85,
};
const disc = { state: 'held', x: 0, y: 0, vx: 0, vy: 0, hits: new Set(), t: 0 };
const G = {
  mode: 'title', stage: 0, gold: 0, valor: 0, time: 0,
  enemies: [], platforms: [], solids: [], bg: null, shake: 0, msgT: 0,
  camX: 3, length: 80, deadT: 0, win: false, loaded: false,
};

const CHAIN_N = 14;
let heroMesh, discMesh, chain, groundMesh, stageRoot, shadowMesh;

function makeChain() {
  chain = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x8a8a90, metalness: 1, roughness: 0.3, emissive: 0x301000 }),
    CHAIN_N
  );
  chain.frustumCulled = false; chain.visible = false; scene.add(chain);
}

function layout() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / Math.max(1, h);
  viewH = 9;
  camera.left = -viewH * aspect / 2;
  camera.right = viewH * aspect / 2;
  camera.top = viewH / 2 + 1.2;
  camera.bottom = -viewH / 2 + 1.2;
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
  document.getElementById('st').style.width = Math.max(0, 100 * hero.sta / hero.maxSta) + '%';
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
  const playing = G.mode === 'play' || G.mode === 'dead';
  document.querySelectorAll('.gameHud').forEach(el => { if (el.id !== 'bossHud') el.style.visibility = (playing && G.mode !== 'title') ? 'visible' : (G.mode === 'title' ? 'hidden' : 'visible'); });
}

function clearStage() {
  if (stageRoot) { scene.remove(stageRoot); stageRoot.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
      else o.material.dispose();
    }
  }); }
  stageRoot = new THREE.Group(); scene.add(stageRoot);
  G.enemies.forEach(e => { if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); });
  G.enemies = []; G.platforms = []; G.solids = [];
}

function addPlatform(p) {
  const geo = new THREE.BoxGeometry(p.w, p.h, 1.4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9, metalness: 0.05 });
  const m = new THREE.Mesh(geo, mat);
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
    hurtT: 0, dead: false, fly, boss: !!k.boss, home: spec.x, dir: Math.random() < 0.5 ? -1 : 1,
  };
  G.enemies.push(e);
  return e;
}

function buildGround(length, tint) {
  const g = new THREE.Mesh(
    new THREE.BoxGeometry(length + 20, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: tint || 0x3a3228, roughness: 0.95 })
  );
  g.position.set(length / 2, -0.6, 0); stageRoot.add(g);
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(length + 20, 0.08, 6.1),
    new THREE.MeshStandardMaterial({ color: 0x6a5a40, roughness: 0.8 })
  );
  strip.position.set(length / 2, 0.0, 0); stageRoot.add(strip);
  // far walls / floor bounds
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1 });
  const L = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 6), wallMat); L.position.set(-1.2, 4, 0); stageRoot.add(L);
  const R = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 6), wallMat); R.position.set(length + 1.2, 4, 0); stageRoot.add(R);
}

function addBackdrop(texUrl, x, y, w, h, z) {
  const tex = TEX[texUrl]; if (!tex) return;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, depthWrite: false })
  );
  m.position.set(x, y, z); stageRoot.add(m);
}

function loadStage(i, resetHero = true) {
  const st = STAGES[i]; if (!st) return;
  G.stage = i; G.length = st.length;
  clearStage();
  buildGround(st.length, st.tint);
  // two painted backdrops spanning the stage
  const span = st.length + 16;
  addBackdrop(st.bg, span * 0.28, 4.2, span * 0.7, 10.5, -8);
  addBackdrop(st.bg2, span * 0.72, 4.2, span * 0.7, 10.5, -8.2);
  if (st.map) addBackdrop(st.map, st.length * 0.5, 6.6, 8.4, 4.5, -6);
  st.platforms.forEach(addPlatform);
  st.enemies.forEach(spawnEnemy);
  if (st.boss) {
    const b = spawnEnemy(st.boss);
    if (b) Snd.roar();
  }
  if (resetHero) {
    hero.x = 3; hero.y = 0; hero.vx = 0; hero.vy = 0; hero.dead = false; hero.hurtT = 0;
    hero.hp = hero.maxHp; hero.sta = hero.maxSta; disc.state = 'held';
  }
  G.camX = hero.x;
  showMsg(st.name, st.sub, 2.6);
  hud();
}

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function collideWorld(ent, dt) {
  ent.y += ent.vy * dt;
  // ground
  if (ent.y < 0) { ent.y = 0; if (ent.vy < 0) ent.vy = 0; ent.onGround = true; }
  else ent.onGround = ent.y <= 0.001;
  // platforms (land from above)
  for (const p of G.platforms) {
    const feet = ent.y, head = ent.y + ent.h, left = ent.x - ent.w / 2, right = ent.x + ent.w / 2;
    const pL = p.x - p.w / 2, pR = p.x + p.w / 2;
    if (right > pL && left < pR) {
      if (ent.vy <= 0 && feet >= p.y - 0.6 && feet <= p.y + 0.15) {
        ent.y = p.y; ent.vy = 0; ent.onGround = true;
      }
    }
  }
  ent.x = Math.max(0.6, Math.min(G.length - 0.6, ent.x + ent.vx * dt));
}

function throwDisc() {
  if (disc.state !== 'held' || hero.dead || G.mode !== 'play') return;
  if (hero.sta < 8) return;
  hero.sta = Math.max(0, hero.sta - 8);
  disc.state = 'fly'; disc.t = 0; disc.hits = new Set();
  disc.x = hero.x + hero.facing * 0.55; disc.y = hero.y + 1.05;
  const speed = 18;
  disc.vx = hero.facing * speed; disc.vy = 0;
  Snd.throw();
}

function updateDisc(dt) {
  const handX = hero.x + hero.facing * 0.4;
  const handY = hero.y + 1.05;
  if (disc.state === 'held') {
    disc.x = handX; disc.y = handY;
    discMesh.position.set(disc.x, disc.y, 0.3);
    discMesh.userData.spin.rotation.z += dt * 6;
    discMesh.userData.halo.material.opacity = 0.25;
    chain.visible = false; discMesh.visible = true;
    return;
  }
  disc.t += dt;
  disc.x += disc.vx * dt; disc.y += disc.vy * dt;
  discMesh.position.set(disc.x, disc.y, 0.3);
  discMesh.userData.spin.rotation.z += dt * 22;
  discMesh.userData.halo.material.opacity = 0.7;
  chain.visible = true;

  // hit enemies
  for (const e of G.enemies) {
    if (e.dead || disc.hits.has(e)) continue;
    const dx = disc.x - e.x, dy = disc.y - (e.y + e.h * 0.45);
    const r = 0.85 + Math.max(e.w, e.h) * 0.4;
    if (dx * dx + dy * dy < r * r) {
      disc.hits.add(e);
      const dmg = e.boss ? 22 : 26;
      e.hp -= dmg; e.hurtT = 0.18;
      Snd.hit(); G.shake = 0.18;
      if (e.hp <= 0) killEnemy(e);
    }
  }

  const dist = Math.hypot(disc.x - handX, disc.y - handY);
  if (disc.state === 'fly') {
    if (dist > 8.5 || disc.t > 0.55 || disc.x < 0 || disc.x > G.length) disc.state = 'return';
  }
  if (disc.state === 'return') {
    const a = Math.atan2(handY - disc.y, handX - disc.x);
    const sp = 22;
    disc.vx = Math.cos(a) * sp; disc.vy = Math.sin(a) * sp;
    if (dist < 0.55 || disc.t > 1.6) { disc.state = 'held'; chain.visible = false; }
  }

  // chain sag
  const cm = new THREE.Matrix4(), cq = new THREE.Quaternion(), cs = new THREE.Vector3(), mid = new THREE.Vector3();
  const from = new THREE.Vector3(handX, handY, 0.2), to = new THREE.Vector3(disc.x, disc.y, 0.3);
  let prev = from.clone();
  const sag = Math.min(1.1, dist * 0.12);
  for (let i = 0; i < CHAIN_N; i++) {
    const k = (i + 1) / CHAIN_N;
    const pt = new THREE.Vector3().lerpVectors(from, to, k);
    pt.y -= Math.sin(k * Math.PI) * sag;
    const len = prev.distanceTo(pt);
    mid.lerpVectors(prev, pt, 0.5);
    const dir = new THREE.Vector3().subVectors(pt, prev);
    cq.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
    cs.set(1, 1, Math.min(5, len / 0.14));
    cm.compose(mid, cq, cs);
    chain.setMatrixAt(i, cm);
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
  if (hero.hurtT > 0 || hero.dead || G.mode !== 'play') return;
  hero.hp -= dmg; hero.hurtT = 0.7;
  hero.vx += (hero.x < fromX ? -1 : 1) * 6;
  hero.vy = Math.max(hero.vy, 3.5);
  Snd.hurt(); G.shake = 0.25;
  document.getElementById('hurt').style.opacity = '1';
  setTimeout(() => { document.getElementById('hurt').style.opacity = '0'; }, 180);
  if (hero.hp <= 0) {
    hero.hp = 0; hero.dead = true; G.mode = 'dead'; G.deadT = 0;
    Snd.die(); showMsg('YOU HAVE FALLEN', 'Press any key to rise again at this place', 6);
  }
}

function updateHero(dt) {
  if (hero.dead) { hero.vy -= 28 * dt; hero.y = Math.max(0, hero.y + hero.vy * dt); return; }
  const move = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const accel = hero.onGround ? 40 : 22;
  const max = 7.2;
  if (move !== 0) { hero.facing = move; hero.vx += move * accel * dt; hero.sta = Math.max(0, hero.sta - 4 * dt); }
  else hero.vx *= Math.pow(hero.onGround ? 0.001 : 0.15, dt);
  hero.vx = Math.max(-max, Math.min(max, hero.vx));
  if ((input.jumpPressed || (input.jump && !hero.jumpHeld && hero.onGround)) && hero.onGround && hero.sta >= 6) {
    hero.vy = 11.2; hero.onGround = false; hero.sta -= 6; Snd.jump();
  }
  hero.jumpHeld = input.jump;
  hero.vy -= 28 * dt;
  if (hero.vy < -16) hero.vy = -16;
  const wasGround = hero.onGround;
  collideWorld(hero, dt);
  if (!wasGround && hero.onGround && hero.vy <= 0.01) Snd.land();
  hero.hurtT = Math.max(0, hero.hurtT - dt);
  // regen
  hero.sta = Math.min(hero.maxSta, hero.sta + 12 * dt);
  if (input.throwPressed) throwDisc();
}

function updateEnemies(dt) {
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.hurtT = Math.max(0, e.hurtT - dt);
    e.mesh.material.color.setRGB(1, e.hurtT > 0 ? 0.45 : 1, e.hurtT > 0 ? 0.45 : 1);
    const toward = hero.x - e.x;
    const aggro = Math.abs(toward) < (e.boss ? 16 : 10);
    if (e.fly) {
      e.dir = aggro ? Math.sign(toward) || e.dir : (Math.abs(e.x - e.home) > 4 ? Math.sign(e.home - e.x) : e.dir);
      e.vx = e.dir * e.spd;
      e.x += e.vx * dt;
      e.y += Math.sin(G.time * 2.4 + e.home) * 0.6 * dt;
      e.y = Math.max(1.1, Math.min(4.4, e.y));
    } else {
      if (aggro) e.dir = Math.sign(toward) || e.dir;
      else if (Math.abs(e.x - e.home) > 5) e.dir = Math.sign(e.home - e.x);
      e.vx = e.dir * e.spd * (e.boss ? (hero.x < e.x ? -1 : 1) === e.dir ? 1 : 1 : 1);
      if (e.boss && aggro) e.dir = Math.sign(toward) || e.dir;
      e.vy -= 28 * dt;
      collideWorld(e, dt);
    }
    e.x = Math.max(1, Math.min(G.length - 1, e.x));
    e.mesh.position.set(e.x, e.y + e.h / 2, 0);
    e.mesh.scale.x = (e.dir < 0 ? -1 : 1);
    // contact
    if (!hero.dead && hero.hurtT <= 0) {
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
    if (G.stage + 1 < STAGES.length) {
      loadStage(G.stage + 1, true);
    } else {
      G.mode = 'end'; G.win = true;
      Snd.win();
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
  hero.hp = hero.maxHp; hero.sta = hero.maxSta; hero.dead = false;
  loadStage(0, true);
}

function retryOrAdvance() {
  if (G.mode === 'title') { startGame(); return; }
  if (G.mode === 'end') {
    document.getElementById('end').style.display = 'none';
    document.getElementById('title').style.display = 'flex';
    G.mode = 'title'; hud(); return;
  }
  if (G.mode === 'dead') {
    hero.dead = false; hero.hp = hero.maxHp; hero.sta = hero.maxSta;
    hero.x = 3; hero.y = 0; hero.vx = 0; hero.vy = 0; disc.state = 'held';
    G.mode = 'play'; G.deadT = 0;
    // restore enemies of this stage
    loadStage(G.stage, true);
  }
}

function bindInput() {
  const map = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    KeyF: 'throw', ControlLeft: 'throw', ControlRight: 'throw',
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
    if (k) {
      e.preventDefault();
      if (k === 'jump' && !input.jump) input.jumpPressed = true;
      if (k === 'throw' && !input.throw) input.throwPressed = true;
      input[k] = true;
    }
  });
  addEventListener('keyup', (e) => {
    const k = map[e.code];
    if (k) { input[k] = false; }
  });
  addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    Snd.start();
    if (G.mode !== 'play') { retryOrAdvance(); return; }
    input.throwPressed = true; input.throw = true;
  });
  addEventListener('mouseup', () => { input.throw = false; });
  document.getElementById('playBtn').addEventListener('click', (e) => { e.stopPropagation(); Snd.start(); startGame(); });
  document.getElementById('mute').addEventListener('click', (e) => {
    e.stopPropagation(); Snd.muted = !Snd.muted;
    document.getElementById('mute').textContent = Snd.muted ? '🔇' : '🔊';
  });
  // touch
  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  function stickAt(ev) {
    const r = stick.getBoundingClientRect();
    const t = ev.touches ? ev.touches[0] : ev;
    const x = t.clientX - r.left - r.width / 2, y = t.clientY - r.top - r.height / 2;
    const m = Math.hypot(x, y), rad = 36, k = m > rad ? rad / m : 1;
    knob.style.left = (35 + x * k) + 'px'; knob.style.top = (35 + y * k) + 'px';
    input.left = x * k < -12; input.right = x * k > 12;
  }
  function stickEnd() { knob.style.left = '35px'; knob.style.top = '35px'; input.left = input.right = false; }
  stick.addEventListener('touchstart', (e) => { e.preventDefault(); stickAt(e); }, { passive: false });
  stick.addEventListener('touchmove', (e) => { e.preventDefault(); stickAt(e); }, { passive: false });
  stick.addEventListener('touchend', stickEnd);
  document.getElementById('bJump').addEventListener('touchstart', (e) => { e.preventDefault(); if (!input.jump) input.jumpPressed = true; input.jump = true; });
  document.getElementById('bJump').addEventListener('touchend', () => { input.jump = false; });
  document.getElementById('bDisc').addEventListener('touchstart', (e) => { e.preventDefault(); input.throwPressed = true; input.throw = true; });
  document.getElementById('bDisc').addEventListener('touchend', () => { input.throw = false; });
}

function snapshot() {
  return {
    mode: G.mode, hp: hero.hp, sta: hero.sta, x: hero.x, y: hero.y, vx: hero.vx, vy: hero.vy,
    onGround: hero.onGround, facing: hero.facing, disc: disc.state, discX: disc.x, discY: disc.y,
    gold: G.gold, valor: G.valor, stage: G.stage, stageName: (STAGES[G.stage] || {}).name,
    enemies: G.enemies.filter(e => !e.dead).length, totalEnemies: G.enemies.length,
    dead: hero.dead, win: G.win, length: G.length,
  };
}

async function boot() {
  const urls = new Set(['./assets/hero/knight.png']);
  for (const k of Object.values(KINDS)) urls.add(k.file);
  for (const s of STAGES) { urls.add(s.bg); urls.add(s.bg2); if (s.map) urls.add(s.map); }
  const jobs = [...urls].map(async (u) => {
    const near = u.includes('/mobs/') || u.includes('/hero/');
    TEX[u] = await loadTex(u, near);
  });
  await Promise.all(jobs);

  heroMesh = billboard(TEX['./assets/hero/knight.png'], 0.8, 1.85);
  scene.add(heroMesh);
  shadowMesh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
  shadowMesh.rotation.x = -Math.PI / 2; scene.add(shadowMesh);
  discMesh = buildDisc(0.85); scene.add(discMesh);
  makeChain();
  stageRoot = new THREE.Group(); scene.add(stageRoot);

  bindInput();
  G.loaded = true; window.__ready = true;
  window.__dbg = { snapshot, get mode() { return G.mode; }, get H() { return { root: heroMesh }; }, camera, project };
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
  // present
  if (heroMesh) {
    heroMesh.position.set(hero.x, hero.y + hero.h / 2, 0);
    heroMesh.scale.x = hero.facing;
    heroMesh.material.opacity = hero.hurtT > 0 && Math.sin(G.time * 30) > 0 ? 0.4 : 1;
    heroMesh.material.transparent = true;
    if (hero.dead) heroMesh.rotation.z = 1.2 * Math.min(1, G.deadT);
    else heroMesh.rotation.z = 0;
    shadowMesh.position.set(hero.x, 0.02, 0.1);
    shadowMesh.scale.setScalar(hero.dead ? 0.3 : 1);
  }
  const half = (camera.right - camera.left) / 2;
  const target = Math.max(half - 1, Math.min(G.length - half + 1, hero.x));
  G.camX += (target - G.camX) * Math.min(1, 6 * dt);
  const sh = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.4 : 0;
  G.shake = Math.max(0, G.shake - dt * 2);
  camera.position.x = G.camX + sh;
  camera.position.y = 2.4 + sh;
  camera.lookAt(G.camX, 2.4, 0);
  hud();
  renderer.render(scene, camera);
  input.jumpPressed = false; input.throwPressed = false;
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('msg').textContent = 'Failed to load art';
  window.__ready = true; window.__dbg = { snapshot: () => ({ mode: 'error', error: String(err) }) };
});
