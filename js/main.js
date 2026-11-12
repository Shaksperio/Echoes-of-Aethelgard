import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* =========================================================
   ECHOES OF AETHELGARD — Protótipo Jogável Completo
   Metroidvania 3D Arcane-Punk
   ========================================================= */

const CONFIG = {
  moveSpeed: 7.2,
  jumpForce: 11.8,
  doubleJumpForce: 10.5,
  dashForce: 26,
  dashCooldown: 1.0,
  gravity: 27,
  playerHeight: 1.65,
  attackRange: 3.2,
  attackCooldown: 0.45,
  attackDamage: 25
};

let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let gameStarted = false;
let currentRoom = 'hall';

const player = {
  velocity: new THREE.Vector3(),
  onGround: false,
  canDash: true,
  dashTimer: 0,
  canAttack: true,
  attackTimer: 0,
  health: 100,
  ether: 100,
  maxHealth: 100,
  maxEther: 100,
  hasDoubleJump: false,
  doubleJumpUsed: false,
  isAttacking: false,
  invulnerable: 0
};

const keys = {};
const enemies = [];
const savePoints = [];
const rooms = {};
let spawnPoint = new THREE.Vector3(0, 1.65, 12);

function init() {
  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0912);
  scene.fog = new THREE.Fog(0x0b0912, 16, 70);

  camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(spawnPoint);
  window.camera = camera;

  controls = new PointerLockControls(camera, document.body);

  setupLights();
  buildWorld();
  setupEvents();
  updateHUD();
  animate();
}

function setupLights() {
  scene.add(new THREE.AmbientLight(0x2e2a40, 0.7));
  scene.add(new THREE.HemisphereLight(0x5a70a0, 0x151020, 0.5));

  const moon = new THREE.DirectionalLight(0xa8c0ff, 1.2);
  moon.position.set(-16, 28, 10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.near = 3;
  moon.shadow.camera.far = 80;
  moon.shadow.camera.left = -28;
  moon.shadow.camera.right = 28;
  moon.shadow.camera.top = 28;
  moon.shadow.camera.bottom = -28;
  scene.add(moon);

  addPoint(0x4a90ff, 3.0, 20, -6, 5, 2);
  addPoint(0x3a70dd, 2.4, 16, 7, 4.5, -4);
  addPoint(0xaa6644, 2.0, 12, 0, 3, -3);
  addPoint(0x8822aa, 2.2, 18, 0, 7, -20);
}

function addPoint(color, intensity, distance, x, y, z) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(x, y, z);
  scene.add(l);
}

function buildWorld() {
  const stone = mat(0x3a3548, 0.82, 0.12);
  const dark = mat(0x262033, 0.88, 0.1);
  const accent = mat(0x4a3a55, 0.75, 0.18);
  const floorMat = mat(0x322e40, 0.85, 0.1);

  // HALL
  const hall = new THREE.Group();
  hall.name = 'hall';

  box(hall, 0, -0.6, 0, 42, 1.2, 52, floorMat);
  box(hall, -16, 6, 0, 2, 12, 52, dark);
  box(hall, 16, 6, 0, 2, 12, 52, dark);
  box(hall, 0, 6, -22, 34, 12, 2, dark);
  box(hall, 0, 12, -2, 34, 1.3, 48, dark);

  for (let i = 0; i < 6; i++) {
    box(hall, 0, i * 1.1 + 0.55, -5 - i * 1.2, 8.5, 1.1, 1.3, accent);
  }

  [[-9, -2], [9, -2], [-9, 7], [9, 7], [-9, -14], [9, -14]].forEach(([x, z]) => {
    pillar(hall, x, 0, z, stone);
  });

  box(hall, -12, 3.6, -9, 5.5, 0.65, 4.5, accent);
  box(hall, 12, 3.6, -9, 5.5, 0.65, 4.5, accent);

  box(hall, -5, 5, 12, 1.8, 10, 1.6, dark);
  box(hall, 5, 5, 12, 1.8, 10, 1.6, dark);
  box(hall, 0, 10, 12, 12, 1.8, 1.6, dark);

  crystal(hall, -15.2, 6, -5, 0x4a90ff);
  crystal(hall, 15.2, 6, -5, 0x4a90ff);
  crystal(hall, -15.2, 6, 3, 0x3a70dd);
  crystal(hall, 15.2, 6, 3, 0x3a70dd);
  crystal(hall, 0, 8.5, -20.5, 0xaa44cc);

  statue(hall, -6.5, 0, -18, 0x2a2535);
  statue(hall, 6.5, 0, -18, 0x2a2535);

  const save = createSavePillar(0, 0, 8);
  hall.add(save);
  savePoints.push({ mesh: save, pos: new THREE.Vector3(0, 1.65, 9.5) });

  const djCrystal = crystal(hall, -12, 4.5, -9, 0x66ffcc);
  djCrystal.userData.isDoubleJump = true;
  djCrystal.userData.collected = false;

  scene.add(hall);
  rooms.hall = hall;

  // CORRIDOR
  const corridor = new THREE.Group();
  corridor.name = 'corridor';
  corridor.visible = false;

  box(corridor, 0, -0.6, 0, 18, 1.2, 30, floorMat);
  box(corridor, -7, 5, 0, 1.8, 10, 30, dark);
  box(corridor, 7, 5, 0, 1.8, 10, 30, dark);
  box(corridor, 0, 5, -13, 16, 10, 1.8, dark);
  box(corridor, 0, 5, 13, 16, 10, 1.8, dark);
  box(corridor, 0, 10, 0, 16, 1.2, 28, dark);

  box(corridor, -3, 2.8, -4, 4, 0.6, 3, accent);
  box(corridor, 3, 4.5, -8, 4, 0.6, 3, accent);

  crystal(corridor, 0, 6, -11, 0x4a90ff);
  crystal(corridor, -5, 3, 5, 0x3a70dd);

  scene.add(corridor);
  rooms.corridor = corridor;

  // ANTECHAMBER
  const ante = new THREE.Group();
  ante.name = 'ante';
  ante.visible = false;

  box(ante, 0, -0.6, 0, 28, 1.2, 28, floorMat);
  box(ante, -12, 6, 0, 2, 12, 28, dark);
  box(ante, 12, 6, 0, 2, 12, 28, dark);
  box(ante, 0, 6, -12, 26, 12, 2, dark);
  box(ante, 0, 6, 12, 26, 12, 2, dark);
  box(ante, 0, 12, 0, 26, 1.3, 26, dark);

  box(ante, 0, 1.5, -4, 10, 0.8, 8, accent);
  crystal(ante, 0, 7, -10, 0xaa44cc);
  crystal(ante, -8, 5, 0, 0x4a90ff);
  crystal(ante, 8, 5, 0, 0x4a90ff);

  scene.add(ante);
  rooms.ante = ante;

  spawnEnemy('skeleton', 4, 0, -10, 'hall');
  spawnEnemy('skeleton', -5, 0, -12, 'hall');
  spawnEnemy('crawler', 0, 0, 2, 'corridor');
  spawnEnemy('crawler', 3, 0, -6, 'corridor');
  spawnEnemy('skeleton', -4, 0, 0, 'ante');
  spawnEnemy('skeleton', 4, 0, 2, 'ante');
}

function mat(color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(parent, x, y, z, w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function pillar(parent, x, y, z, material) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 2.2), material);
  base.position.y = 0.3;
  g.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 9, 10), material);
  shaft.position.y = 5;
  g.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 2.4), material);
  cap.position.y = 9.6;
  g.add(cap);
  g.position.set(x, y, z);
  g.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  parent.add(g);
}

function crystal(parent, x, y, z, color) {
  const geo = new THREE.OctahedronGeometry(0.85, 0);
  const m = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.9,
    roughness: 0.2, metalness: 0.35
  });
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.castShadow = true;
  parent.add(mesh);
  const light = new THREE.PointLight(color, 1.6, 10);
  light.position.copy(mesh.position);
  parent.add(light);
  return mesh;
}

function statue(parent, x, y, z, color) {
  const g = new THREE.Group();
  const bodyMat = mat(color, 0.9, 0.05);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.6, 4, 8), bodyMat);
  body.position.y = 1.5;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), bodyMat);
  head.position.y = 2.9;
  g.add(head);
  g.position.set(x, y, z);
  g.traverse(c => { if (c.isMesh) c.castShadow = true; });
  parent.add(g);
}

function createSavePillar(x, y, z) {
  const g = new THREE.Group();
  const stone = mat(0x3a3550, 0.7, 0.2);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.5, 8), stone);
  base.position.y = 0.25;
  g.add(base);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.2, 8), stone);
  p.position.y = 2;
  g.add(p);
  const top = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), new THREE.MeshStandardMaterial({
    color: 0x66aaff, emissive: 0x3388ff, emissiveIntensity: 1.2, roughness: 0.3
  }));
  top.position.y = 3.9;
  g.add(top);
  const light = new THREE.PointLight(0x66aaff, 2.5, 12);
  light.position.y = 3.9;
  g.add(light);
  g.position.set(x, y, z);
  g.userData.isSave = true;
  return g;
}

function spawnEnemy(type, x, y, z, roomName) {
  const g = new THREE.Group();
  let color, hp, speed, scale;

  if (type === 'skeleton') {
    color = 0x8a8a9a; hp = 50; speed = 2.8; scale = 1;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 4, 6), mat(color, 0.85, 0.1));
    body.position.y = 1.1;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), mat(0xaaaabb, 0.8, 0.1));
    head.position.y = 2.0;
    g.add(head);
  } else {
    color = 0x3a5a8a; hp = 35; speed = 3.6; scale = 0.85;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat(color, 0.7, 0.2));
    body.position.y = 0.55;
    g.add(body);
    const cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({
      color: 0x4a90ff, emissive: 0x4a90ff, emissiveIntensity: 0.8
    }));
    cry.position.set(0, 1.0, 0);
    g.add(cry);
  }

  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  g.userData = {
    type, hp, maxHp: hp, speed, room: roomName,
    state: 'patrol', patrolDir: Math.random() > 0.5 ? 1 : -1,
    attackCooldown: 0, alive: true
  };
  g.traverse(c => { if (c.isMesh) c.castShadow = true; });
  rooms[roomName].add(g);
  enemies.push(g);
}

function updateEnemies(delta) {
  const playerPos = camera.position;
  enemies.forEach(e => {
    if (!e.userData.alive || e.userData.room !== currentRoom) return;
    const data = e.userData;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, e.position);
    const dist = toPlayer.length();
    data.attackCooldown = Math.max(0, data.attackCooldown - delta);

    if (dist < 10 && dist > 1.6) {
      data.state = 'chase';
      toPlayer.y = 0;
      toPlayer.normalize();
      e.position.x += toPlayer.x * data.speed * delta;
      e.position.z += toPlayer.z * data.speed * delta;
      e.lookAt(playerPos.x, e.position.y, playerPos.z);
    } else if (dist <= 1.6) {
      data.state = 'attack';
      if (data.attackCooldown <= 0 && player.invulnerable <= 0) {
        damagePlayer(12);
        data.attackCooldown = 1.1;
      }
    } else {
      data.state = 'patrol';
      e.position.x += data.patrolDir * data.speed * 0.4 * delta;
      if (Math.abs(e.position.x) > 8) data.patrolDir *= -1;
    }
    e.position.y = 0;
  });
}

function damagePlayer(amount) {
  if (player.invulnerable > 0) return;
  player.health = Math.max(0, player.health - amount);
  player.invulnerable = 0.9;
  updateHUD();
  if (player.health <= 0) respawn();
}

function damageEnemy(enemy, amount) {
  if (!enemy.userData.alive) return;
  enemy.userData.hp -= amount;
  enemy.traverse(c => {
    if (c.isMesh && c.material && c.material.emissive) {
      c.material.emissive.setHex(0xff4444);
      c.material.emissiveIntensity = 0.6;
      setTimeout(() => {
        if (c.material && c.material.emissive) {
          c.material.emissive.setHex(0x000000);
          c.material.emissiveIntensity = 0;
        }
      }, 120);
    }
  });
  if (enemy.userData.hp <= 0) {
    enemy.userData.alive = false;
    enemy.visible = false;
    player.ether = Math.min(player.maxEther, player.ether + 12);
    updateHUD();
  }
}

function tryAttack() {
  if (!player.canAttack || !gameStarted || !controls.isLocked) return;
  player.canAttack = false;
  player.attackTimer = CONFIG.attackCooldown;
  player.isAttacking = true;
  createSlashEffect();

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  enemies.forEach(e => {
    if (!e.userData.alive || e.userData.room !== currentRoom) return;
    const toEnemy = new THREE.Vector3().subVectors(e.position, camera.position);
    const dist = toEnemy.length();
    if (dist < CONFIG.attackRange) {
      toEnemy.normalize();
      if (forward.dot(toEnemy) > 0.35) {
        damageEnemy(e, CONFIG.attackDamage);
      }
    }
  });
  setTimeout(() => { player.isAttacking = false; }, 200);
}

function createSlashEffect() {
  const geo = new THREE.PlaneGeometry(1.8, 0.15);
  const m = new THREE.MeshBasicMaterial({
    color: 0x66ccff, transparent: true, opacity: 0.75, side: THREE.DoubleSide
  });
  const slash = new THREE.Mesh(geo, m);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  slash.position.copy(camera.position).add(dir.multiplyScalar(1.8));
  slash.position.y -= 0.2;
  slash.lookAt(camera.position);
  scene.add(slash);
  let life = 0.18;
  const fade = () => {
    life -= 0.016;
    slash.material.opacity = Math.max(0, life * 4);
    if (life > 0) requestAnimationFrame(fade);
    else scene.remove(slash);
  };
  fade();
}

function checkRoomTransition() {
  const pos = camera.position;
  if (currentRoom === 'hall') {
    if (pos.x > 13 && pos.z < -6 && pos.z > -12 && pos.y > 3) {
      switchRoom('corridor', new THREE.Vector3(-5, 1.65, 0));
    }
    if (pos.z < -19 && Math.abs(pos.x) < 5) {
      switchRoom('ante', new THREE.Vector3(0, 1.65, 8));
    }
  } else if (currentRoom === 'corridor') {
    if (pos.x < -6) switchRoom('hall', new THREE.Vector3(12, 4.2, -9));
  } else if (currentRoom === 'ante') {
    if (pos.z > 10) switchRoom('hall', new THREE.Vector3(0, 1.65, -18));
  }
}

function switchRoom(name, spawn) {
  Object.values(rooms).forEach(r => r.visible = false);
  rooms[name].visible = true;
  currentRoom = name;
  camera.position.copy(spawn);
  player.velocity.set(0, 0, 0);
  const names = {
    hall: 'Hall de Entrada — Sylvan Keep',
    corridor: 'Corredor das Sombras',
    ante: 'Antecâmara do Lorde'
  };
  document.getElementById('location-name').textContent = names[name] || name;
}

function checkInteractables() {
  rooms.hall.children.forEach(c => {
    if (c.userData && c.userData.isDoubleJump && !c.userData.collected) {
      if (camera.position.distanceTo(c.position) < 2.2) {
        c.userData.collected = true;
        c.visible = false;
        player.hasDoubleJump = true;
        showMessage('Asas Etéreas adquiridas — Pulo Duplo desbloqueado');
      }
    }
  });
  savePoints.forEach(sp => {
    if (camera.position.distanceTo(sp.pos) < 2.5 && keys['KeyE']) {
      player.health = player.maxHealth;
      player.ether = player.maxEther;
      spawnPoint.copy(sp.pos);
      updateHUD();
      showMessage('Éter restaurado — Ponto de salvamento ativado');
      keys['KeyE'] = false;
    }
  });
}

function showMessage(text) {
  let el = document.getElementById('msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'msg';
    el.style.cssText = 'position:absolute;top:22%;left:50%;transform:translateX(-50%);color:#a0d0ff;font-size:1.1rem;text-shadow:0 0 12px #4080ff;pointer-events:none;z-index:20;transition:opacity 0.5s;text-align:center;max-width:80%;';
    document.getElementById('ui').appendChild(el);
  }
  el.textContent = text;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2800);
}

function respawn() {
  player.health = player.maxHealth;
  player.ether = player.maxEther * 0.6;
  player.velocity.set(0, 0, 0);
  camera.position.copy(spawnPoint);
  player.invulnerable = 1.5;
  updateHUD();
  showMessage('Você retornou ao último ponto de salvamento');
}

function setupEvents() {
  document.getElementById('start-btn').addEventListener('click', () => {
    gameStarted = true;
    controls.lock();
  });
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  document.addEventListener('mousedown', e => {
    if (e.button === 0 && controls.isLocked) tryAttack();
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const input = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp']) input.add(forward);
  if (keys['KeyS'] || keys['ArrowDown']) input.sub(forward);
  if (keys['KeyD'] || keys['ArrowRight']) input.add(right);
  if (keys['KeyA'] || keys['ArrowLeft']) input.sub(right);

  if (input.lengthSq() > 0) {
    input.normalize().multiplyScalar(CONFIG.moveSpeed);
    player.velocity.x = input.x;
    player.velocity.z = input.z;
  } else {
    player.velocity.x *= 0.8;
    player.velocity.z *= 0.8;
  }

  if (keys['Space']) {
    if (player.onGround) {
      player.velocity.y = CONFIG.jumpForce;
      player.onGround = false;
      player.doubleJumpUsed = false;
      keys['Space'] = false;
    } else if (player.hasDoubleJump && !player.doubleJumpUsed) {
      player.velocity.y = CONFIG.doubleJumpForce;
      player.doubleJumpUsed = true;
      keys['Space'] = false;
    }
  }

  if ((keys['ShiftLeft'] || keys['ShiftRight']) && player.canDash && player.ether >= 16) {
    const dir = input.lengthSq() > 0.05 ? input.clone().normalize() : forward;
    player.velocity.x = dir.x * CONFIG.dashForce;
    player.velocity.z = dir.z * CONFIG.dashForce;
    player.canDash = false;
    player.dashTimer = CONFIG.dashCooldown;
    player.ether -= 16;
    document.getElementById('ability-hint').textContent = 'Dash em recarga...';
    updateHUD();
  }
  if (!player.canDash) {
    player.dashTimer -= delta;
    if (player.dashTimer <= 0) {
      player.canDash = true;
      document.getElementById('ability-hint').textContent = player.hasDoubleJump
        ? 'Dash pronto | Pulo Duplo ativo'
        : 'Dash disponível';
    }
  }

  player.velocity.y -= CONFIG.gravity * delta;
  const pos = camera.position;
  pos.x += player.velocity.x * delta;
  pos.y += player.velocity.y * delta;
  pos.z += player.velocity.z * delta;

  if (pos.y < CONFIG.playerHeight) {
    pos.y = CONFIG.playerHeight;
    player.velocity.y = 0;
    player.onGround = true;
    player.doubleJumpUsed = false;
  }

  if (currentRoom === 'hall') {
    pos.x = THREE.MathUtils.clamp(pos.x, -14.5, 14.5);
    pos.z = THREE.MathUtils.clamp(pos.z, -20.5, 13);
  } else if (currentRoom === 'corridor') {
    pos.x = THREE.MathUtils.clamp(pos.x, -5.5, 5.5);
    pos.z = THREE.MathUtils.clamp(pos.z, -11, 11);
  } else if (currentRoom === 'ante') {
    pos.x = THREE.MathUtils.clamp(pos.x, -10, 10);
    pos.z = THREE.MathUtils.clamp(pos.z, -10, 10);
  }

  if (player.ether < player.maxEther) {
    player.ether = Math.min(player.maxEther, player.ether + 6.5 * delta);
    updateHUD();
  }

  checkRoomTransition();
  checkInteractables();
}

function updateHUD() {
  const hf = document.getElementById('health-fill');
  const ef = document.getElementById('ether-fill');
  if (hf) hf.style.width = (player.health / player.maxHealth * 100) + '%';
  if (ef) ef.style.width = (player.ether / player.maxEther * 100) + '%';
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updatePlayer(delta);
  updateEnemies(delta);
  renderer.render(scene, camera);
}

init();
