// Deterministic screenshot scenes behind ?shot=start|play|end. Each scene
// runs the real rules forward from a fresh world with a fixed seed, so
// the captured frame is a moment a genuine game actually reaches. The
// play pilot steers with care; the end pilot chases light and ignores
// danger, the way a hurried first-timer does.
import { FIELD, STEP, PLAY_TOP } from './config.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 24;
const END_LIMIT_SECONDS = 600;
const FLEE_RADIUS = 170;
const DASH_RADIUS = 78;

function steer(world, careful) {
  const player = world.player;
  let tx = FIELD.width / 2;
  let ty = (FIELD.height + PLAY_TOP) / 2;
  let bestDist = Infinity;
  // Nearest unbloomed flower wins; otherwise the nearest orb.
  for (const flower of world.flowers) {
    if (flower.bloomed) continue;
    const d = Math.hypot(flower.x - player.x, flower.y - player.y);
    if (d < bestDist) {
      bestDist = d;
      tx = flower.x;
      ty = flower.y;
    }
  }
  if (bestDist === Infinity) {
    for (const orb of world.orbs) {
      const d = Math.hypot(orb.x - player.x, orb.y - player.y);
      if (d < bestDist) {
        bestDist = d;
        tx = orb.x;
        ty = orb.y;
      }
    }
  }
  let mx = tx - player.x;
  let my = ty - player.y;
  const seekLen = Math.hypot(mx, my) || 1;
  mx /= seekLen;
  my /= seekLen;
  let dash = false;
  if (careful) {
    // Add a flee push away from every close shadow, strongest nearest.
    let fx = 0;
    let fy = 0;
    let nearest = Infinity;
    for (const shadow of world.shadows) {
      const dx = player.x - shadow.x;
      const dy = player.y - shadow.y;
      const d = Math.hypot(dx, dy);
      if (d < nearest) nearest = d;
      if (d < FLEE_RADIUS && d > 1) {
        const weight = (FLEE_RADIUS - d) / FLEE_RADIUS;
        fx += (dx / d) * weight * 1.9;
        fy += (dy / d) * weight * 1.9;
      }
    }
    mx += fx;
    my += fy;
    const len = Math.hypot(mx, my);
    if (len > 0.01) {
      mx /= len;
      my /= len;
    } else {
      mx = 0;
      my = 0;
    }
    if (nearest < DASH_RADIUS && player.dashCooldown <= 0) dash = true;
  }
  return { mx, my, dash };
}

// Set `world` to the named scene and return the screen the shell draws.
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'end') {
    // Title scene: let the garden drift a little, then show the title.
    world.reset(world.seed);
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.stepAmbient(STEP);
    }
    return 'title';
  }
  world.startRun();
  const careful = name === 'play';
  const limit = careful ? PLAY_SECONDS : END_LIMIT_SECONDS;
  const steps = Math.floor(limit / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = steer(world, careful);
    world.step(STEP, { mx: input.mx, my: input.my }, input.dash);
    if (world.status === 'over' || world.status === 'win') break;
  }
  return world.status;
}
