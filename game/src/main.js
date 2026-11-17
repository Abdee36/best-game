// Shell for Lentera Senja: boot, fixed-step loop, screen flow, clicks,
// keys and the deterministic screenshot mode. The World owns the rules;
// this file owns everything around them.
import { FIELD, STEP } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import {
  draw, START_BUTTON, AGAIN_BUTTON, RESUME_BUTTON, RESTART_BUTTON,
} from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;
const shotName = params.get('shot');

const audio = new AudioEngine();
const input = new Input(canvas);
const world = new World(seed, loadBest());
let muted = false;
let running = true;

function loadBest() {
  try {
    const saved = window.localStorage.getItem('lentera-senja-best');
    return saved ? Number.parseInt(saved, 10) || 0 : 0;
  } catch (err) {
    return 0;
  }
}

function saveBest() {
  try {
    window.localStorage.setItem('lentera-senja-best', String(world.best));
  } catch (err) {
    // Best score is a nicety; losing it changes nothing.
  }
}

function playEvents(events) {
  for (const event of events) {
    if (event.type === 'collect') audio.collect(event.combo || 1);
    else if (event.type === 'bloom') audio.bloom();
    else if (event.type === 'hit') audio.hit();
    else if (event.type === 'powerup') audio.powerup();
    else if (event.type === 'dash') audio.dash();
    else if (event.type === 'shieldblock') audio.powerup();
    else if (event.type === 'levelclear') audio.levelClear();
    else if (event.type === 'over') {
      audio.gameOver();
      saveBest();
    } else if (event.type === 'win') {
      audio.win();
      saveBest();
    }
  }
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function handleClicks() {
  const clicks = input.takeClicks();
  if (clicks.length === 0) return;
  audio.unlock();
  audio.resume();
  for (const click of clicks) {
    if (world.status === 'title' && inside(click, START_BUTTON)) {
      audio.click();
      world.startRun();
    } else if ((world.status === 'over' || world.status === 'win') && inside(click, AGAIN_BUTTON)) {
      audio.click();
      world.startRun();
    } else if (world.status === 'paused') {
      if (inside(click, RESUME_BUTTON)) {
        audio.click();
        world.status = 'play';
      } else if (inside(click, RESTART_BUTTON)) {
        audio.click();
        world.startRun();
      }
    }
  }
}

function handleKeys() {
  if (input.wasPressed('KeyM')) {
    muted = audio.toggleMute();
  }
  if (input.wasPressed('Enter') || input.wasPressed('NumpadEnter')) {
    audio.unlock();
    audio.resume();
    if (world.status === 'title' || world.status === 'over' || world.status === 'win') {
      world.startRun();
    }
  }
  if (input.wasPressed('Space')) {
    audio.unlock();
    audio.resume();
    if (world.status === 'title' || world.status === 'over' || world.status === 'win') {
      world.startRun();
    }
  }
  if (input.wasPressed('KeyR')) {
    if (world.status !== 'title') world.startRun();
  }
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    if (world.status === 'play') world.status = 'paused';
    else if (world.status === 'paused') world.status = 'play';
  }
}

function frameStep(dt) {
  handleClicks();
  handleKeys();
  if (world.status === 'play' || world.status === 'levelclear') {
    const move = input.moveVector(world.player.x, world.player.y);
    const dash = input.wasPressed('Space');
    const events = world.step(dt, move, dash);
    playEvents(events);
  } else if (world.status === 'title') {
    world.stepAmbient(dt);
  } else {
    world.updateFx(dt);
  }
  input.endFrame();
}

function drawFrame() {
  draw(ctx, world, input.mouse, muted);
}

// Screenshot mode: stage one deterministic frame, draw it once, signal
// readiness. No animation loop runs, so the capture never drifts.
if (shotName) {
  try {
    stageShot(shotName, world);
    drawFrame();
    window.__shotReady = true;
  } catch (err) {
    window.__shotError = String(err && err.message ? err.message : err);
    window.__shotReady = true;
  }
} else {
  let last = performance.now();
  let acc = 0;
  let firstFrame = true;
  function loop(now) {
    if (!running) return;
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += elapsed;
    let guard = 0;
    while (acc >= STEP && guard < 40) {
      frameStep(STEP);
      acc -= STEP;
      guard += 1;
    }
    if (guard >= 40) acc = 0;
    drawFrame();
    if (firstFrame) {
      firstFrame = false;
      window.__shotReady = true;
    }
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.status === 'play') world.status = 'paused';
  });
  requestAnimationFrame(loop);
}

window.__lentera = { world, FIELD };
