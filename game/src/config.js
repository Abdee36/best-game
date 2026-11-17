// Tuning and palette for Lentera Senja. One place for every number the
// rules use, so balance changes never touch the simulation code.
export const FIELD = { width: 1280, height: 720 };

export const HUD_HEIGHT = 64;
export const PLAY_TOP = 84;
export const STEP = 1 / 120;

export const PLAYER = {
  radius: 16,
  speed: 340,
  dashSpeed: 740,
  dashTime: 0.16,
  dashCooldown: 1.15,
  maxHearts: 3,
  invulnerableTime: 1.6,
};

export const LIGHT = {
  max: 100,
  start: 78,
  drainBase: 2.6,
  drainPerLevel: 0.4,
  orbRefill: 8,
  bloomRefill: 14,
  lowWarn: 28,
};

export const ORBS = {
  minOnField: 6,
  maxOnField: 14,
  spawnEvery: 0.85,
  lifetime: 9,
  radius: 11,
  baseScore: 10,
  comboWindow: 3.2,
};

export const FLOWERS = {
  baseCount: 6,
  perLevel: 1,
  radius: 22,
  bloomScore: 50,
  dwellTime: 1.0,
  minGap: 150,
};

export const SHADOWS = {
  baseCount: 3,
  perLevel: 1,
  radius: 20,
  baseSpeed: 95,
  speedPerLevel: 18,
  wobble: 0.9,
};

export const POWERUPS = {
  spawnEvery: 13,
  radius: 15,
  shieldTime: 8,
  magnetTime: 8,
  slowTime: 6,
  slowFactor: 0.45,
  magnetRadius: 240,
};

export const LEVELS_TO_WIN = 3;
export const LEVEL_CLEAR_PAUSE = 2.2;

export const PALETTE = {
  skyTop: '#1b1440',
  skyMid: '#3b2166',
  skyLow: '#7a3b6e',
  horizon: '#e8825a',
  hillFar: '#2c2350',
  hillNear: '#232a4a',
  grass: '#1e3a34',
  grassLight: '#2a5244',
  hudBar: 'rgba(12, 10, 30, 0.82)',
  hudLine: '#f5c86e',
  text: '#fff7e6',
  textDim: '#d9c9a8',
  gold: '#ffd76a',
  orbCore: '#ffe9a8',
  orbGlow: '#ffb52e',
  flowerBud: '#8a7aa8',
  flowerBloom: '#ff6fa5',
  flowerCenter: '#ffd76a',
  leaf: '#4fae7d',
  shadowBody: '#120e24',
  shadowEye: '#ff5a6e',
  shield: '#7fd8ff',
  magnet: '#9dff8a',
  slow: '#c9a8ff',
  danger: '#ff5a6e',
  ok: '#8ae6a0',
};
