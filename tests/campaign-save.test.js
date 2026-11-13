import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignSnapshot, saveCampaign, loadCampaign, clearCampaign, SAVE_KEY } from '../3d/js/campaign-save.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

const sample = {
  currentRoom: 'corridor',
  position: { x: 2.5, y: 1.65, z: -4 },
  spawnPoint: { x: 0, y: 1.65, z: 9.5 },
  health: 72, ether: 41, hasDoubleJump: true, bossDefeated: false,
  savedAt: 123456
};

test('serializes only stable campaign state and clamps resources', () => {
  const snapshot = createCampaignSnapshot({ ...sample, health: 140, ether: -8 });
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.health, 100);
  assert.equal(snapshot.ether, 0);
  assert.deepEqual(snapshot.position, sample.position);
});

test('saves and restores campaign after a page reload', () => {
  const storage = memoryStorage();
  assert.equal(saveCampaign(storage, sample).ok, true);
  const result = loadCampaign(storage);
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.currentRoom, 'corridor');
  assert.equal(result.snapshot.health, 72);
  assert.equal(result.snapshot.hasDoubleJump, true);
  assert.equal(result.snapshot.savedAt, 123456);
});

test('rejects unknown regions and malformed positions', () => {
  assert.throws(() => createCampaignSnapshot({ ...sample, currentRoom: 'void' }), TypeError);
  assert.throws(() => createCampaignSnapshot({ ...sample, position: { x: NaN, y: 0, z: 0 } }), TypeError);
});

test('reports corrupt and unsupported saves without crashing', () => {
  const storage = memoryStorage();
  storage.setItem(SAVE_KEY, '{broken');
  assert.equal(loadCampaign(storage).reason, 'corrupt-save');
  storage.setItem(SAVE_KEY, JSON.stringify({ ...sample, version: 99 }));
  assert.equal(loadCampaign(storage).reason, 'unsupported-save');
});

test('clears the local campaign save', () => {
  const storage = memoryStorage();
  saveCampaign(storage, sample);
  assert.equal(clearCampaign(storage), true);
  assert.equal(loadCampaign(storage).reason, 'empty');
});
