const SAVE_KEY = 'aethelgard_3d_campaign_v1';
const SAVE_VERSION = 1;
const VALID_ROOMS = new Set(['hall', 'corridor', 'ante']);

export function createCampaignSnapshot(state) {
  if (!state || !VALID_ROOMS.has(state.currentRoom)) {
    throw new TypeError('Estado de campanha inválido: região desconhecida.');
  }
  const position = state.position;
  if (!position || ![position.x, position.y, position.z].every(Number.isFinite)) {
    throw new TypeError('Posição do jogador inválida.');
  }
  const numberOr = (value, fallback) => Number.isFinite(value) ? value : fallback;
  return {
    version: SAVE_VERSION,
    currentRoom: state.currentRoom,
    position: { x: position.x, y: position.y, z: position.z },
    spawnPoint: {
      x: numberOr(state.spawnPoint?.x, 0),
      y: numberOr(state.spawnPoint?.y, 1.65),
      z: numberOr(state.spawnPoint?.z, 12)
    },
    health: Math.max(0, Math.min(100, numberOr(state.health, 100))),
    ether: Math.max(0, Math.min(100, numberOr(state.ether, 100))),
    hasDoubleJump: Boolean(state.hasDoubleJump),
    bossDefeated: Boolean(state.bossDefeated),
    savedAt: numberOr(state.savedAt, Date.now())
  };
}

export function saveCampaign(storage, state) {
  if (!storage || typeof storage.setItem !== 'function') {
    return { ok: false, reason: 'storage-unavailable' };
  }
  try {
    const snapshot = createCampaignSnapshot(state);
    storage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    return { ok: true, snapshot };
  } catch (error) {
    return { ok: false, reason: 'save-failed', error };
  }
}

export function loadCampaign(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { ok: false, reason: 'storage-unavailable' };
  }
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { ok: false, reason: 'empty' };
    const data = JSON.parse(raw);
    if (data?.version !== SAVE_VERSION || !VALID_ROOMS.has(data.currentRoom)) {
      return { ok: false, reason: 'unsupported-save' };
    }
    const snapshot = createCampaignSnapshot(data);
    return { ok: true, snapshot };
  } catch (error) {
    return { ok: false, reason: 'corrupt-save', error };
  }
}

export function clearCampaign(storage) {
  try {
    storage?.removeItem?.(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

export { SAVE_KEY, SAVE_VERSION };
