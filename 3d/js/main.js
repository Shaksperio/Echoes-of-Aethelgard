import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { saveCampaign, loadCampaign } from './campaign-save.js';

/* Echoes of Aethelgard 3D Prototype - Sylvan Keep */
const CONFIG = {
  moveSpeed: 7.4, jumpForce: 12.2, doubleJumpForce: 11.0, dashForce: 28,
  dashCooldown: 0.95, gravity: 28, playerHeight: 1.65,
  attackRange: 3.4, attackCooldown: 0.42, attackDamage: 28
};

let scene, camera, renderer, controls, audioCtx;
let clock = new THREE.Clock();
let gameStarted = false, currentRoom = 'hall', bossDefeated = false, gameWon = false;

const player = {
  position: new THREE.Vector3(0, 1.65, 12),
  model: null,
  velocity: new THREE.Vector3(), onGround: false, canDash: true, dashTimer: 0,
  canAttack: true, attackTimer: 0, health: 100, ether: 100, maxHealth: 100, maxEther: 100,
  hasDoubleJump: false, doubleJumpUsed: false, invulnerable: 0
};

const keys = {}, enemies = [], savePoints = [], rooms = {};
let spawnPoint = new THREE.Vector3(0, 1.65, 12);

function initAudio() {
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
}
function playTone(freq, duration, type = 'square', volume = 0.08) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}
function sfx(name) {
  if (!audioCtx) return;
  const map = {
    jump: [320, 0.12, 'square', 0.06], dash: [180, 0.18, 'sawtooth', 0.07],
    attack: [520, 0.08, 'square', 0.09], hit: [140, 0.15, 'sawtooth', 0.1],
    collect: [660, 0.2, 'sine', 0.08], save: [440, 0.3, 'sine', 0.07],
    hurt: [90, 0.25, 'sawtooth', 0.12], bossHit: [70, 0.3, 'sawtooth', 0.14]
  };
  const t = map[name];
  if (t) playTone(...t);
  if (name === 'attack') playTone(780, 0.06, 'triangle', 0.05);
  if (name === 'collect') playTone(880, 0.25, 'sine', 0.06);
  if (name === 'save') playTone(660, 0.35, 'sine', 0.05);
  if (name === 'win') { playTone(523, 0.4, 'sine', 0.08); setTimeout(() => playTone(659, 0.4, 'sine', 0.08), 200); setTimeout(() => playTone(784, 0.6, 'sine', 0.08), 400); }
}

function init() {
  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.85;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0c18);
  scene.fog = new THREE.Fog(0x0e0c18, 22, 85);

  camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 120);
  player.position.copy(spawnPoint);
  window.camera = camera;
  controls = new PointerLockControls(camera, document.body);

  setupLights(); buildWorld(); createPlayerModel(); restoreCampaign(); setupEvents(); updateHUD(); updateThirdPersonCamera(); animate();
}

function createPlayerModel() {
  const model = new THREE.Group();
  const armor = new THREE.MeshStandardMaterial({ color: 0x26364b, roughness: 0.48, metalness: 0.62 });
  const cloak = new THREE.MeshStandardMaterial({ color: 0x18202e, roughness: 0.92 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x62d8e8, emissive: 0x168ba8, emissiveIntensity: 1.25, metalness: 0.25 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 4, 8), armor);
  torso.position.y = 1.05; model.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), armor);
  head.position.y = 1.82; model.add(head);
  const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.05, 8), cloak);
  mantle.position.set(0, 0.9, 0.22); mantle.rotation.x = -0.12; model.add(mantle);
  const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), armor);
  leftShoulder.position.set(-0.42, 1.35, 0); model.add(leftShoulder);
  const rightShoulder = leftShoulder.clone(); rightShoulder.position.x = 0.42; model.add(rightShoulder);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), glow);
  core.position.set(0, 1.08, -0.34); model.add(core);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.12), glow);
  blade.position.set(0.55, 0.95, -0.05); blade.rotation.z = -0.22; model.add(blade);
  model.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
  scene.add(model);
  player.model = model;
}

function updateThirdPersonCamera() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
  direction.normalize();
  const desired = player.position.clone().addScaledVector(direction, -5.8);
  desired.y += 2.45;
  camera.position.lerp(desired, 0.22);
  if (player.model) {
    player.model.position.set(player.position.x, player.position.y - CONFIG.playerHeight, player.position.z);
    if (player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z > 0.15) {
      player.model.rotation.y = Math.atan2(player.velocity.x, player.velocity.z);
    }
    player.model.visible = true;
  }
}

function setupLights() {
  scene.add(new THREE.AmbientLight(0x4a4560, 1.15));
  scene.add(new THREE.HemisphereLight(0x7a90c0, 0x1a1528, 0.7));
  const moon = new THREE.DirectionalLight(0xc0d4ff, 1.6);
  moon.position.set(-14, 30, 12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 3; moon.shadow.camera.far = 90;
  moon.shadow.camera.left = -32; moon.shadow.camera.right = 32;
  moon.shadow.camera.top = 32; moon.shadow.camera.bottom = -32;
  scene.add(moon);
  [[0x5aa0ff, 4.0, 24, -6, 5.5, 2], [0x4a80ee, 3.2, 20, 7, 5, -4],
   [0xcc7744, 2.8, 16, 0, 3.5, -3], [0xaa33cc, 3.0, 22, 0, 8, -20],
   [0x66ddaa, 2.5, 14, -12, 5, -9]].forEach(([c, i, d, x, y, z]) => {
    const l = new THREE.PointLight(c, i, d); l.position.set(x, y, z); scene.add(l);
  });
}

function mat(color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function box(parent, x, y, z, w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function pillar(parent, x, y, z, material) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.65, 2.3), material); base.position.y = 0.32; g.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 9.5, 10), material); shaft.position.y = 5.2; g.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 2.5), material); cap.position.y = 10; g.add(cap);
  g.position.set(x, y, z);
  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  parent.add(g);
}
function crystal(parent, x, y, z, color) {
  const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.1, roughness: 0.18, metalness: 0.35
  }));
  mesh.position.set(x, y, z); mesh.rotation.y = Math.random() * Math.PI; mesh.castShadow = true;
  parent.add(mesh);
  const light = new THREE.PointLight(color, 2.2, 12); light.position.copy(mesh.position); parent.add(light);
  return mesh;
}
function statue(parent, x, y, z, color) {
  const g = new THREE.Group();
  const bodyMat = mat(color, 0.88, 0.05);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.52, 1.7, 4, 8), bodyMat); body.position.y = 1.55; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bodyMat); head.position.y = 3.0; g.add(head);
  g.position.set(x, y, z); g.traverse(c => { if (c.isMesh) c.castShadow = true; }); parent.add(g);
}
function createSavePillar(x, y, z) {
  const g = new THREE.Group();
  const stone = mat(0x4a4560, 0.65, 0.2);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.55, 8), stone); base.position.y = 0.27; g.add(base);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 3.4, 8), stone); p.position.y = 2.1; g.add(p);
  const top = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshStandardMaterial({
    color: 0x66bbff, emissive: 0x3399ff, emissiveIntensity: 1.4, roughness: 0.25
  })); top.position.y = 4.1; g.add(top);
  const light = new THREE.PointLight(0x66bbff, 3.2, 14); light.position.y = 4.1; g.add(light);
  g.position.set(x, y, z); g.userData.isSave = true; return g;
}

function restoreCampaign() {
  const result = loadCampaign(window.localStorage);
  if (!result.ok) return;
  const saved = result.snapshot;
  currentRoom = saved.currentRoom;
  Object.values(rooms).forEach(room => { room.visible = room.name === currentRoom; });
  player.position.set(saved.position.x, saved.position.y, saved.position.z);
  spawnPoint.set(saved.spawnPoint.x, saved.spawnPoint.y, saved.spawnPoint.z);
  player.health = saved.health;
  player.ether = saved.ether;
  player.hasDoubleJump = saved.hasDoubleJump;
  bossDefeated = saved.bossDefeated;
  if (bossDefeated) {
    enemies.filter(enemy => enemy.userData.isBoss).forEach(enemy => {
      enemy.userData.alive = false;
      enemy.visible = false;
    });
  }
  const names = { hall: 'Hall de Entrada — Sylvan Keep', corridor: 'Corredor das Sombras', ante: bossDefeated ? 'Antecâmara Purificada' : 'Antecâmara do Lorde' };
  document.getElementById('location-name').textContent = names[currentRoom];
  if (player.hasDoubleJump) document.getElementById('ability-hint').textContent = 'Dash disponível | Pulo Duplo ativo';
  document.getElementById('start-btn').textContent = 'Continuar campanha';
  showMessage('Progresso local restaurado.');
}

function persistCampaign() {
  const result = saveCampaign(window.localStorage, {
    currentRoom,
    position: player.position,
    spawnPoint,
    health: player.health,
    ether: player.ether,
    hasDoubleJump: player.hasDoubleJump,
    bossDefeated
  });
  if (!result.ok) showMessage('Não foi possível salvar neste dispositivo.');
  return result.ok;
}

function buildWorld() {
  const stone = mat(0x4a4558, 0.78, 0.12), dark = mat(0x322c42, 0.85, 0.1);
  const accent = mat(0x5a4a68, 0.7, 0.18), floorMat = mat(0x3e3a50, 0.8, 0.1);

  const hall = new THREE.Group(); hall.name = 'hall';
  box(hall, 0, -0.6, 0, 44, 1.2, 54, floorMat);
  box(hall, -17, 6.5, 0, 2.2, 13, 54, dark); box(hall, 17, 6.5, 0, 2.2, 13, 54, dark);
  box(hall, 0, 6.5, -23, 36, 13, 2.2, dark); box(hall, 0, 13, -2, 36, 1.4, 50, dark);
  for (let i = 0; i < 7; i++) box(hall, 0, i * 1.05 + 0.52, -4.5 - i * 1.15, 9, 1.05, 1.3, accent);
  [[-10, -1], [10, -1], [-10, 8], [10, 8], [-10, -15], [10, -15]].forEach(([x, z]) => pillar(hall, x, 0, z, stone));
  box(hall, -13, 3.8, -9, 6, 0.7, 5, accent); box(hall, 13, 3.8, -9, 6, 0.7, 5, accent);
  box(hall, -13, 6.5, -14, 5, 0.65, 4, accent); box(hall, 13, 6.5, -14, 5, 0.65, 4, accent);
  box(hall, -5.5, 5.5, 13, 2, 11, 1.8, dark); box(hall, 5.5, 5.5, 13, 2, 11, 1.8, dark); box(hall, 0, 11, 13, 13, 2, 1.8, dark);
  crystal(hall, -16, 6.5, -5, 0x5aa0ff); crystal(hall, 16, 6.5, -5, 0x5aa0ff);
  crystal(hall, -16, 6.5, 4, 0x4a80ee); crystal(hall, 16, 6.5, 4, 0x4a80ee);
  crystal(hall, 0, 9, -21.5, 0xbb44dd);
  const dj = crystal(hall, -13, 4.8, -9, 0x55ffcc); dj.userData.isDoubleJump = true; dj.userData.collected = false; dj.scale.setScalar(1.25);
  statue(hall, -7, 0, -19, 0x353045); statue(hall, 7, 0, -19, 0x353045);
  const save = createSavePillar(0, 0, 8); hall.add(save);
  savePoints.push({ mesh: save, pos: new THREE.Vector3(0, 1.65, 9.5) });
  scene.add(hall); rooms.hall = hall;

  const corridor = new THREE.Group(); corridor.name = 'corridor'; corridor.visible = false;
  box(corridor, 0, -0.6, 0, 18, 1.2, 32, floorMat);
  box(corridor, -7.5, 5.5, 0, 2, 11, 32, dark); box(corridor, 7.5, 5.5, 0, 2, 11, 32, dark);
  box(corridor, 0, 5.5, -14, 17, 11, 2, dark); box(corridor, 0, 5.5, 14, 17, 11, 2, dark);
  box(corridor, 0, 11, 0, 17, 1.3, 30, dark);
  box(corridor, -3.5, 2.9, -3, 4.5, 0.65, 3.5, accent); box(corridor, 3.5, 4.8, -8, 4.5, 0.65, 3.5, accent);
  box(corridor, 0, 7.2, -11, 5, 0.65, 3, accent);
  crystal(corridor, 0, 6.5, -12, 0x5aa0ff); crystal(corridor, -5, 3.5, 6, 0x4a80ee);
  scene.add(corridor); rooms.corridor = corridor;

  const ante = new THREE.Group(); ante.name = 'ante'; ante.visible = false;
  box(ante, 0, -0.6, 0, 30, 1.2, 30, floorMat);
  box(ante, -13, 6.5, 0, 2.2, 13, 30, dark); box(ante, 13, 6.5, 0, 2.2, 13, 30, dark);
  box(ante, 0, 6.5, -13, 28, 13, 2.2, dark); box(ante, 0, 6.5, 13, 28, 13, 2.2, dark);
  box(ante, 0, 13, 0, 28, 1.4, 28, dark);
  box(ante, 0, 1.4, -3, 12, 0.9, 10, accent);
  crystal(ante, 0, 8, -11, 0xbb44dd); crystal(ante, -9, 5.5, 0, 0x5aa0ff); crystal(ante, 9, 5.5, 0, 0x5aa0ff);
  scene.add(ante); rooms.ante = ante;

  spawnEnemy('skeleton', 5, 0, -11, 'hall'); spawnEnemy('skeleton', -6, 0, -13, 'hall');
  spawnEnemy('crawler', 2, 0, 1, 'corridor'); spawnEnemy('crawler', -2, 0, -5, 'corridor');
  spawnEnemy('skeleton', -5, 0, 1, 'ante'); spawnEnemy('skeleton', 5, 0, 3, 'ante');
  spawnBoss(0, 1.4, -5, 'ante');
}

function spawnEnemy(type, x, y, z, roomName) {
  const g = new THREE.Group();
  let color, hp, speed, scale;
  if (type === 'skeleton') {
    color = 0x9a9aaa; hp = 55; speed = 3.0; scale = 1;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.15, 4, 6), mat(color, 0.82, 0.1)); body.position.y = 1.15; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), mat(0xb0b0c0, 0.75, 0.1)); head.position.y = 2.1; g.add(head);
  } else {
    color = 0x3a5a8a; hp = 40; speed = 3.8; scale = 0.9;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 8, 6), mat(color, 0.65, 0.2)); body.position.y = 0.58; g.add(body);
    const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), new THREE.MeshStandardMaterial({ color: 0x5aa0ff, emissive: 0x5aa0ff, emissiveIntensity: 0.9 })); cry.position.set(0, 1.05, 0); g.add(cry);
  }
  g.position.set(x, y, z); g.scale.setScalar(scale);
  g.userData = { type, hp, maxHp: hp, speed, room: roomName, state: 'patrol', patrolDir: Math.random() > 0.5 ? 1 : -1, attackCooldown: 0, alive: true, isBoss: false };
  g.traverse(c => { if (c.isMesh) c.castShadow = true; });
  rooms[roomName].add(g); enemies.push(g);
}

function spawnBoss(x, y, z, roomName) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.2, 6, 10), mat(0x3a2a4a, 0.7, 0.25)); body.position.y = 2.2; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), new THREE.MeshStandardMaterial({ color: 0x220033, emissive: 0xaa22cc, emissiveIntensity: 1.3, roughness: 0.3, metalness: 0.4 })); head.position.y = 4.0; g.add(head);
  const shL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), mat(0x4a3a5a, 0.6, 0.3)); shL.position.set(-1.1, 3.2, 0); g.add(shL);
  const shR = shL.clone(); shR.position.x = 1.1; g.add(shR);
  g.position.set(x, y, z);
  g.userData = { type: 'boss', hp: 220, maxHp: 220, speed: 2.4, room: roomName, state: 'idle', attackCooldown: 0, alive: true, isBoss: true };
  g.traverse(c => { if (c.isMesh) c.castShadow = true; });
  rooms[roomName].add(g); enemies.push(g);
}

function updateEnemies(delta) {
  const playerPos = player.position;
  enemies.forEach(e => {
    if (!e.userData.alive || e.userData.room !== currentRoom) return;
    const data = e.userData;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, e.position);
    const dist = toPlayer.length();
    data.attackCooldown = Math.max(0, data.attackCooldown - delta);
    if (data.isBoss) {
      if (dist < 14 && dist > 2.4) {
        toPlayer.y = 0; toPlayer.normalize();
        e.position.x += toPlayer.x * data.speed * delta;
        e.position.z += toPlayer.z * data.speed * delta;
        e.lookAt(playerPos.x, e.position.y, playerPos.z);
      } else if (dist <= 2.4 && data.attackCooldown <= 0 && player.invulnerable <= 0) {
        damagePlayer(18); data.attackCooldown = 1.35; sfx('bossHit');
      }
      e.position.y = 1.4; return;
    }
    if (dist < 11 && dist > 1.7) {
      toPlayer.y = 0; toPlayer.normalize();
      e.position.x += toPlayer.x * data.speed * delta;
      e.position.z += toPlayer.z * data.speed * delta;
      e.lookAt(playerPos.x, e.position.y, playerPos.z);
    } else if (dist <= 1.7 && data.attackCooldown <= 0 && player.invulnerable <= 0) {
      damagePlayer(13); data.attackCooldown = 1.05; sfx('hurt');
    } else {
      e.position.x += data.patrolDir * data.speed * 0.4 * delta;
      if (Math.abs(e.position.x) > 8) data.patrolDir *= -1;
    }
    e.position.y = 0;
  });
}

function damagePlayer(amount) {
  if (player.invulnerable > 0 || gameWon) return;
  player.health = Math.max(0, player.health - amount);
  player.invulnerable = 0.95; sfx('hurt'); updateHUD();
  if (player.health <= 0) respawn();
}
function damageEnemy(enemy, amount) {
  if (!enemy.userData.alive) return;
  enemy.userData.hp -= amount; sfx(enemy.userData.isBoss ? 'bossHit' : 'hit');
  enemy.traverse(c => {
    if (c.isMesh && c.material && c.material.emissive) {
      const prev = c.material.emissive.getHex();
      c.material.emissive.setHex(0xff4455); c.material.emissiveIntensity = 0.7;
      setTimeout(() => { if (c.material && c.material.emissive) { c.material.emissive.setHex(prev); c.material.emissiveIntensity = enemy.userData.isBoss ? 1.3 : 0; } }, 130);
    }
  });
  if (enemy.userData.hp <= 0) {
    enemy.userData.alive = false; enemy.visible = false;
    player.ether = Math.min(player.maxEther, player.ether + (enemy.userData.isBoss ? 40 : 14)); updateHUD();
    if (enemy.userData.isBoss) {
      bossDefeated = true; persistCampaign(); sfx('win');
      showMessage('Malakor fragmentado! A Antecâmara foi purificada.');
      setTimeout(() => { gameWon = true; showMessage('Área limpa — Sylvan Keep dominado.'); }, 3200);
    }
  }
}

function tryAttack() {
  if (!player.canAttack || !gameStarted || !controls.isLocked || gameWon) return;
  player.canAttack = false; player.attackTimer = CONFIG.attackCooldown; sfx('attack');
  const geo = new THREE.PlaneGeometry(2.0, 0.18);
  const m = new THREE.MeshBasicMaterial({ color: 0x77ddff, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const slash = new THREE.Mesh(geo, m);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  slash.position.copy(camera.position).add(dir.multiplyScalar(1.9)); slash.position.y -= 0.15;
  slash.lookAt(camera.position); scene.add(slash);
  let life = 0.16;
  const fade = () => { life -= 0.016; slash.material.opacity = Math.max(0, life * 5); if (life > 0) requestAnimationFrame(fade); else scene.remove(slash); };
  fade();
  const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
  enemies.forEach(e => {
    if (!e.userData.alive || e.userData.room !== currentRoom) return;
    const toEnemy = new THREE.Vector3().subVectors(e.position, player.position);
    const dist = toEnemy.length();
    const range = e.userData.isBoss ? CONFIG.attackRange + 0.8 : CONFIG.attackRange;
    if (dist < range) { toEnemy.normalize(); if (forward.dot(toEnemy) > 0.3) damageEnemy(e, CONFIG.attackDamage); }
  });
}

function checkRoomTransition() {
  const pos = player.position;
  if (currentRoom === 'hall') {
    if (pos.x > 14 && pos.z < -6 && pos.z > -13 && pos.y > 3.2) switchRoom('corridor', new THREE.Vector3(-5, 1.65, 0));
    if (pos.z < -20 && Math.abs(pos.x) < 5.5) switchRoom('ante', new THREE.Vector3(0, 1.65, 9));
  } else if (currentRoom === 'corridor' && pos.x < -6.5) switchRoom('hall', new THREE.Vector3(13, 4.3, -9));
  else if (currentRoom === 'ante' && pos.z > 11) switchRoom('hall', new THREE.Vector3(0, 1.65, -18));
}
function switchRoom(name, spawn) {
  Object.values(rooms).forEach(r => r.visible = false);
  rooms[name].visible = true; currentRoom = name;
  player.position.copy(spawn); player.velocity.set(0, 0, 0);
  persistCampaign();
  const names = { hall: 'Hall de Entrada — Sylvan Keep', corridor: 'Corredor das Sombras', ante: bossDefeated ? 'Antecâmara Purificada' : 'Antecâmara do Lorde' };
  document.getElementById('location-name').textContent = names[name] || name;
}

function checkInteractables() {
  rooms.hall.children.forEach(c => {
    if (c.userData && c.userData.isDoubleJump && !c.userData.collected && player.position.distanceTo(c.position) < 2.4) {
      c.userData.collected = true; c.visible = false; player.hasDoubleJump = true; sfx('collect');
      showMessage('Asas Etéreas adquiridas — Pulo Duplo desbloqueado!');
      document.getElementById('ability-hint').textContent = 'Dash pronto | Pulo Duplo ativo';
    }
  });
  savePoints.forEach(sp => {
    if (camera.position.distanceTo(sp.pos) < 2.6 && keys['KeyE']) {
      player.health = player.maxHealth; player.ether = player.maxEther; spawnPoint.copy(sp.pos);
      updateHUD();
      if (persistCampaign()) { sfx('save'); showMessage('Campanha salva neste dispositivo.'); }
      keys['KeyE'] = false;
    }
  });
}
function showMessage(text) {
  let el = document.getElementById('msg');
  if (!el) {
    el = document.createElement('div'); el.id = 'msg';
    el.style.cssText = 'position:absolute;top:20%;left:50%;transform:translateX(-50%);color:#b0e0ff;font-size:1.15rem;text-shadow:0 0 14px #4080ff;pointer-events:none;z-index:20;transition:opacity 0.5s;text-align:center;max-width:80%;line-height:1.4;';
    document.getElementById('ui').appendChild(el);
  }
  el.textContent = text; el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 3200);
}
function respawn() {
  player.health = player.maxHealth; player.ether = player.maxEther * 0.65;
  player.velocity.set(0, 0, 0); player.position.copy(spawnPoint); player.invulnerable = 1.6;
  updateHUD(); showMessage('Você retornou ao último ponto de salvamento');
}

function setupEvents() {
  document.getElementById('start-btn').addEventListener('click', () => {
    gameStarted = true; initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    controls.lock();
  });
  document.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  document.addEventListener('mousedown', e => { if (e.button === 0 && controls.isLocked) tryAttack(); });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
  });
  controls.addEventListener('lock', () => {
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('crosshair').classList.remove('hidden');
  });
}

function updatePlayer(delta) {
  if (!gameStarted || !controls.isLocked) return;
  player.invulnerable = Math.max(0, player.invulnerable - delta);
  player.attackTimer = Math.max(0, player.attackTimer - delta);
  if (player.attackTimer <= 0) player.canAttack = true;

  const forward = new THREE.Vector3(), right = new THREE.Vector3();
  camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const input = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp']) input.add(forward);
  if (keys['KeyS'] || keys['ArrowDown']) input.sub(forward);
  if (keys['KeyD'] || keys['ArrowRight']) input.add(right);
  if (keys['KeyA'] || keys['ArrowLeft']) input.sub(right);
  if (input.lengthSq() > 0) { input.normalize().multiplyScalar(CONFIG.moveSpeed); player.velocity.x = input.x; player.velocity.z = input.z; }
  else { player.velocity.x *= 0.8; player.velocity.z *= 0.8; }

  if (keys['Space']) {
    if (player.onGround) { player.velocity.y = CONFIG.jumpForce; player.onGround = false; player.doubleJumpUsed = false; keys['Space'] = false; sfx('jump'); }
    else if (player.hasDoubleJump && !player.doubleJumpUsed) { player.velocity.y = CONFIG.doubleJumpForce; player.doubleJumpUsed = true; keys['Space'] = false; sfx('jump'); }
  }
  if ((keys['ShiftLeft'] || keys['ShiftRight']) && player.canDash && player.ether >= 15) {
    const dir = input.lengthSq() > 0.05 ? input.clone().normalize() : forward;
    player.velocity.x = dir.x * CONFIG.dashForce; player.velocity.z = dir.z * CONFIG.dashForce;
    player.canDash = false; player.dashTimer = CONFIG.dashCooldown; player.ether -= 15; sfx('dash');
    document.getElementById('ability-hint').textContent = 'Dash em recarga...'; updateHUD();
  }
  if (!player.canDash) {
    player.dashTimer -= delta;
    if (player.dashTimer <= 0) {
      player.canDash = true;
      document.getElementById('ability-hint').textContent = player.hasDoubleJump ? 'Dash pronto | Pulo Duplo ativo' : 'Dash disponível';
    }
  }

  player.velocity.y -= CONFIG.gravity * delta;
  const pos = player.position;
  pos.x += player.velocity.x * delta; pos.y += player.velocity.y * delta; pos.z += player.velocity.z * delta;

  let groundY = CONFIG.playerHeight;
  if (currentRoom === 'hall') {
    if (pos.x < -10 && pos.x > -16 && pos.z < -6.5 && pos.z > -12 && pos.y < 5.5) groundY = Math.max(groundY, 4.15);
    if (pos.x > 10 && pos.x < 16 && pos.z < -6.5 && pos.z > -12 && pos.y < 5.5) groundY = Math.max(groundY, 4.15);
    if (pos.x < -10 && pos.x > -16 && pos.z < -11.5 && pos.z > -16.5 && pos.y < 8) groundY = Math.max(groundY, 6.85);
    if (pos.x > 10 && pos.x < 16 && pos.z < -11.5 && pos.z > -16.5 && pos.y < 8) groundY = Math.max(groundY, 6.85);
    if (Math.abs(pos.x) < 5 && pos.z < -3 && pos.z > -13) {
      const step = Math.floor((-pos.z - 3.5) / 1.15);
      if (step >= 0 && step < 7) groundY = Math.max(groundY, step * 1.05 + 0.75);
    }
  }
  if (currentRoom === 'corridor') {
    if (pos.x < -1 && pos.x > -6 && pos.z < -1 && pos.z > -5.5 && pos.y < 4.5) groundY = Math.max(groundY, 3.25);
    if (pos.x > 1 && pos.x < 6 && pos.z < -6 && pos.z > -10.5 && pos.y < 6.5) groundY = Math.max(groundY, 5.15);
    if (Math.abs(pos.x) < 3 && pos.z < -9 && pos.z > -13 && pos.y < 9) groundY = Math.max(groundY, 7.55);
  }
  if (currentRoom === 'ante' && Math.abs(pos.x) < 6.5 && pos.z < 2 && pos.z > -8.5) groundY = Math.max(groundY, 1.75);

  if (pos.y < groundY) { pos.y = groundY; player.velocity.y = 0; player.onGround = true; player.doubleJumpUsed = false; }
  else player.onGround = false;

  if (currentRoom === 'hall') { pos.x = THREE.MathUtils.clamp(pos.x, -15.5, 15.5); pos.z = THREE.MathUtils.clamp(pos.z, -21.5, 14); }
  else if (currentRoom === 'corridor') { pos.x = THREE.MathUtils.clamp(pos.x, -6, 6); pos.z = THREE.MathUtils.clamp(pos.z, -12.5, 12.5); }
  else if (currentRoom === 'ante') { pos.x = THREE.MathUtils.clamp(pos.x, -11, 11); pos.z = THREE.MathUtils.clamp(pos.z, -11, 11); }

  if (player.ether < player.maxEther) { player.ether = Math.min(player.maxEther, player.ether + 7 * delta); updateHUD(); }
  checkRoomTransition(); checkInteractables();
}

function updateHUD() {
  const hf = document.getElementById('health-fill'), ef = document.getElementById('ether-fill');
  if (hf) hf.style.width = (player.health / player.maxHealth * 100) + '%';
  if (ef) ef.style.width = (player.ether / player.maxEther * 100) + '%';
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updatePlayer(delta); updateThirdPersonCamera(); updateEnemies(delta); renderer.render(scene, camera);
}

init();
