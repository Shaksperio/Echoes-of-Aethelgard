import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../3d/index.html', import.meta.url), 'utf8');
const main = await readFile(new URL('../3d/js/main.js', import.meta.url), 'utf8');

test('3D prototype renders a player avatar and follows it with a third-person camera', () => {
  assert.match(main, /function createPlayerModel\(/);
  assert.match(main, /new THREE\.CapsuleGeometry\(0\.34, 0\.72/);
  assert.match(main, /function updateThirdPersonCamera\(/);
  assert.match(main, /camera\.position\.lerp\(desired, 0\.22\)/);
  assert.match(main, /updatePlayer\(delta\); updateThirdPersonCamera\(\)/);
});

test('gameplay world position is independent from the render camera', () => {
  assert.match(main, /position: new THREE\.Vector3\(0, 1\.65, 12\)/);
  assert.match(main, /const pos = player\.position/);
  assert.match(main, /const playerPos = player\.position/);
  assert.match(main, /player\.position\.distanceTo\(sp\.pos\)/);
});

test('3D page keeps the standalone module entry point', () => {
  assert.match(html, /src="js\/main\.js"/);
  assert.match(html, /three\/build\/three\.module\.js/);
});
