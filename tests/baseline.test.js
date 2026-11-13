import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const game = await readFile(new URL('../js/game.js', import.meta.url), 'utf8');
const style = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
const threeHtml = await readFile(new URL('../3d/index.html', import.meta.url), 'utf8');
const threeMain = await readFile(new URL('../3d/js/main.js', import.meta.url), 'utf8');

test('página principal mantém canvas e entrada do jogo', () => {
  assert.match(html, /<canvas[^>]+id="c"/);
  assert.match(html, /<script src="js\/game\.js"><\/script>/);
  assert.match(game, /requestAnimationFrame\(loop\)/);
  assert.match(game, /window\.__game=/);
});

test('controles de toque continuam disponíveis', () => {
  assert.match(html, /id="touch"/);
  assert.match(html, /data-k="left"/);
  assert.match(html, /data-k="jump"/);
  assert.match(game, /pointerdown/);
  assert.match(game, /pointercancel/);
  assert.match(style, /pointer:\s*coarse/);
});

test('persistência local e recuperação de save continuam implementadas', () => {
  assert.match(game, /const SAVEKEY=/);
  assert.match(game, /function saveGame\(/);
  assert.match(game, /function loadGame\(/);
  assert.match(game, /function hasSave\(/);
  assert.match(game, /JSON\.parse\(s\)/);
});

test('sistemas centrais de progressão e exploração permanecem presentes', () => {
  for (const token of ['function enterRegion(', 'function updPlayer(', 'function renderWorld(', 'function updBoss(', 'function drawMap(', 'function drawEquip(']) {
    assert.ok(game.includes(token), 'Sistema ausente: ' + token);
  }
  for (const territory of ['Vila Ferrugem', 'Floresta Sussurrante', 'Cavernas Cristalinas', 'Charco Corroído', 'Picos de Vidro', 'Forja Abissal', 'Cidadela do Vazio']) {
    assert.ok(html.includes(territory), 'Território ausente: ' + territory);
  }
});

test('protótipo Three.js permanece isolado e carregável', () => {
  assert.match(threeHtml, /type="module"/);
  assert.match(threeHtml, /src="js\/main\.js"/);
  assert.match(threeMain, /new THREE\.WebGLRenderer/);
  assert.match(threeMain, /function buildWorld\(/);
});

test('a versão 3D ainda não é confundida com a campanha principal', () => {
  assert.match(html, /id="c"/);
  assert.doesNotMatch(html, /3d\/js\/main\.js/);
});
