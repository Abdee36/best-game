// The simulation: one World holds every rule of Lentera Senja. It never
// touches the DOM or audio; step() returns the events that happened so
// the shell can play sounds for them. Fixed-step updates plus a seeded
// generator make a run fully replayable from its seed.
import {
  FIELD, PLAY_TOP, PLAYER, LIGHT, ORBS, FLOWERS, SHADOWS, POWERUPS,
  LEVELS_TO_WIN, LEVEL_CLEAR_PAUSE,
} from './config.js';
import { makeRng } from './random.js';

const POWERUP_KINDS = ['shield', 'magnet', 'slow'];

export class World {
  constructor(seed, best) {
    this.best = best || 0;
    this.reset(seed || 1);
  }

  reset(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.status = 'title';
    this.level = 1;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.hearts = PLAYER.maxHearts;
    this.light = LIGHT.start;
    this.time = 0;
    this.shake = 0;
    this.levelClearTimer = 0;
    this.overReason = '';
    this.orbsCollected = 0;
    this.flowersBloomed = 0;
    this.hitsTaken = 0;
    this.stars = [];
    for (let i = 0; i < 90; i += 1) {
      this.stars.push({
        x: this.rng.range(0, FIELD.width),
        y: this.rng.range(0, 300),
        size: this.rng.range(1, 2.6),
        twinkle: this.rng.range(0, Math.PI * 2),
      });
    }
    this.player = this.freshPlayer();
    this.spawnLevel(1);
  }

  freshPlayer() {
    return {
      x: FIELD.width / 2,
      y: (FIELD.height + PLAY_TOP) / 2,
      dashTime: 0,
      dashCooldown: 0,
      dashDirX: 0,
      dashDirY: -1,
      invuln: 0,
      moving: false,
      faceX: 1,
    };
  }

  startRun() {
    const best = this.best;
    this.reset(this.seed);
    this.best = best;
    this.status = 'play';
  }

  randomPlayPosition(margin) {
    return {
      x: this.rng.range(margin, FIELD.width - margin),
      y: this.rng.range(PLAY_TOP + margin, FIELD.height - margin),
    };
  }

  spawnLevel(level) {
    const count = FLOWERS.baseCount + (level - 1) * FLOWERS.perLevel;
    this.flowers = [];
    let guard = 0;
    while (this.flowers.length < count && guard < 400) {
      guard += 1;
      const pos = this.randomPlayPosition(70);
      const far = this.flowers.every(
        (f) => Math.hypot(f.x - pos.x, f.y - pos.y) > FLOWERS.minGap,
      );
      if (far) {
        this.flowers.push({
          x: pos.x, y: pos.y, bloomed: false, progress: 0,
          phase: this.rng.range(0, Math.PI * 2),
        });
      }
    }
    this.orbs = [];
    for (let i = 0; i < ORBS.minOnField; i += 1) this.spawnOrb();
    const shadowCount = SHADOWS.baseCount + (level - 1) * SHADOWS.perLevel;
    this.shadows = [];
    for (let i = 0; i < shadowCount; i += 1) this.spawnShadow(true);
    this.powerups = [];
    this.particles = [];
    this.floaters = [];
    this.shieldTimer = 0;
    this.magnetTimer = 0;
    this.slowTimer = 0;
    this.orbSpawnTimer = ORBS.spawnEvery;
    this.powerupSpawnTimer = POWERUPS.spawnEvery * 0.6;
  }

  spawnOrb() {
    const pos = this.randomPlayPosition(50);
    this.orbs.push({
      x: pos.x,
      y: pos.y,
      vx: this.rng.range(-26, 26),
      vy: this.rng.range(-18, 18),
      age: 0,
      life: ORBS.lifetime * this.rng.range(0.8, 1.2),
      phase: this.rng.range(0, Math.PI * 2),
    });
  }

  spawnShadow(atEdge) {
    let pos;
    if (atEdge) {
      const side = this.rng.int(0, 3);
      if (side === 0) pos = { x: this.rng.range(60, FIELD.width - 60), y: PLAY_TOP + 40 };
      else if (side === 1) pos = { x: this.rng.range(60, FIELD.width - 60), y: FIELD.height - 40 };
      else if (side === 2) pos = { x: 50, y: this.rng.range(PLAY_TOP + 40, FIELD.height - 40) };
      else pos = { x: FIELD.width - 50, y: this.rng.range(PLAY_TOP + 40, FIELD.height - 40) };
    } else {
      pos = this.randomPlayPosition(50);
    }
    this.shadows.push({
      x: pos.x,
      y: pos.y,
      phase: this.rng.range(0, Math.PI * 2),
      speed: SHADOWS.baseSpeed + (this.level - 1) * SHADOWS.speedPerLevel,
    });
  }

  spawnPowerup() {
    const pos = this.randomPlayPosition(60);
    this.powerups.push({
      x: pos.x,
      y: pos.y,
      kind: POWERUP_KINDS[this.rng.int(0, POWERUP_KINDS.length - 1)],
      age: 0,
      life: 10,
      phase: this.rng.range(0, Math.PI * 2),
    });
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng.range(0, Math.PI * 2);
      const vel = this.rng.range(speed * 0.3, speed);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        age: 0,
        life: this.rng.range(0.35, 0.7),
        color,
        size: this.rng.range(2, 4.5),
      });
    }
  }

  floater(x, y, text, color) {
    this.floaters.push({ x, y, text, color, age: 0, life: 1.0 });
  }

  finishRun(won, reason) {
    this.status = won ? 'win' : 'over';
    this.overReason = reason || '';
    if (this.score > this.best) this.best = this.score;
  }

  // Ambient motion for the title screen: orbs drift, nothing is scored.
  stepAmbient(dt) {
    this.time += dt;
    for (const orb of this.orbs) {
      orb.age += dt;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (orb.x < 30 || orb.x > FIELD.width - 30) orb.vx *= -1;
      if (orb.y < PLAY_TOP + 20 || orb.y > FIELD.height - 30) orb.vy *= -1;
    }
    this.updateFx(dt);
  }

  updateFx(dt) {
    for (const p of this.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.2 * dt;
      p.vy *= 1 - 2.2 * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    for (const f of this.floaters) {
      f.age += dt;
      f.y -= 34 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.age < f.life);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - 26 * dt);
  }

  step(dt, move, dashPressed) {
    if (this.status === 'title') {
      this.stepAmbient(dt);
      return [];
    }
    if (this.status === 'levelclear') {
      this.time += dt;
      this.levelClearTimer -= dt;
      this.updateFx(dt);
      if (this.levelClearTimer <= 0) {
        if (this.level >= LEVELS_TO_WIN) {
          this.finishRun(true, 'garden');
          return [{ type: 'win' }];
        }
        this.level += 1;
        this.player = this.freshPlayer();
        this.spawnLevel(this.level);
        this.status = 'play';
      }
      return [];
    }
    if (this.status !== 'play') {
      this.updateFx(dt);
      return [];
    }

    const events = [];
    this.time += dt;
    const player = this.player;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    this.light -= (LIGHT.drainBase + (this.level - 1) * LIGHT.drainPerLevel) * dt;
    if (this.light <= 0) {
      this.light = 0;
      this.finishRun(false, 'light');
      events.push({ type: 'over' });
      return events;
    }
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.magnetTimer > 0) this.magnetTimer -= dt;
    if (this.slowTimer > 0) this.slowTimer -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;

    // Movement, with a short dash that also dodges through shadows.
    const moving = move.mx !== 0 || move.my !== 0;
    player.moving = moving;
    if (moving) player.faceX = move.mx !== 0 ? Math.sign(move.mx) : player.faceX;
    if (dashPressed && player.dashCooldown <= 0 && moving && player.dashTime <= 0) {
      player.dashTime = PLAYER.dashTime;
      player.dashCooldown = PLAYER.dashCooldown;
      player.dashDirX = move.mx;
      player.dashDirY = move.my;
      events.push({ type: 'dash' });
    }
    if (player.dashTime > 0) {
      player.dashTime -= dt;
      player.x += player.dashDirX * PLAYER.dashSpeed * dt;
      player.y += player.dashDirY * PLAYER.dashSpeed * dt;
    } else if (moving) {
      player.x += move.mx * PLAYER.speed * dt;
      player.y += move.my * PLAYER.speed * dt;
    }
    player.x = Math.min(FIELD.width - PLAYER.radius, Math.max(PLAYER.radius, player.x));
    player.y = Math.min(
      FIELD.height - PLAYER.radius,
      Math.max(PLAY_TOP + PLAYER.radius, player.y),
    );

    // Orbs drift, age out, and respawn to keep the field stocked.
    this.orbSpawnTimer -= dt;
    if (this.orbSpawnTimer <= 0) {
      this.orbSpawnTimer = ORBS.spawnEvery;
      if (this.orbs.length < ORBS.maxOnField) this.spawnOrb();
    }
    for (const orb of this.orbs) {
      orb.age += dt;
      if (this.magnetTimer > 0) {
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const dist = Math.hypot(dx, dy);
        if (dist < POWERUPS.magnetRadius && dist > 1) {
          orb.vx += (dx / dist) * 420 * dt;
          orb.vy += (dy / dist) * 420 * dt;
        }
      }
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      if (orb.x < 30 || orb.x > FIELD.width - 30) orb.vx *= -1;
      if (orb.y < PLAY_TOP + 20 || orb.y > FIELD.height - 30) orb.vy *= -1;
    }
    this.orbs = this.orbs.filter((orb) => orb.age < orb.life);

    // Orb pickup: score grows with the combo, light comes back.
    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      const orb = this.orbs[i];
      if (Math.hypot(orb.x - player.x, orb.y - player.y) < ORBS.radius + PLAYER.radius + 4) {
        this.orbs.splice(i, 1);
        this.combo += 1;
        this.comboTimer = ORBS.comboWindow;
        const gained = ORBS.baseScore + Math.min(this.combo * 2, 30);
        this.score += gained;
        this.light = Math.min(LIGHT.max, this.light + LIGHT.orbRefill);
        this.orbsCollected += 1;
        this.burst(orb.x, orb.y, '#ffd76a', 10, 130);
        this.floater(orb.x, orb.y - 14, `+${gained}`, '#ffd76a');
        events.push({ type: 'collect', combo: this.combo });
      }
    }

    // Blooming takes a moment of stillness: linger beside a bud and its
    // ring fills; step away and it fades. Shadows close in while you
    // wait, so every bloom is a small risk taken on purpose.
    for (const flower of this.flowers) {
      if (flower.bloomed) continue;
      const near = Math.hypot(flower.x - player.x, flower.y - player.y)
        < FLOWERS.radius + PLAYER.radius + 6;
      if (near) {
        flower.progress += dt / FLOWERS.dwellTime;
      } else {
        flower.progress = Math.max(0, flower.progress - dt * 0.6);
      }
      if (flower.progress >= 1) {
        flower.bloomed = true;
        flower.progress = 1;
        this.score += FLOWERS.bloomScore;
        this.light = Math.min(LIGHT.max, this.light + LIGHT.bloomRefill);
        this.flowersBloomed += 1;
        this.burst(flower.x, flower.y, '#ff6fa5', 18, 170);
        this.floater(flower.x, flower.y - 26, `+${FLOWERS.bloomScore} BLOOM`, '#ff9ec4');
        events.push({ type: 'bloom' });
      }
    }
    if (this.flowers.every((f) => f.bloomed)) {
      const bonus = 100 * this.level;
      this.score += bonus;
      this.status = 'levelclear';
      this.levelClearTimer = LEVEL_CLEAR_PAUSE;
      this.floater(FIELD.width / 2, 200, `LEVEL CLEAR +${bonus}`, '#8ae6a0');
      events.push({ type: 'levelclear' });
      this.updateFx(dt);
      return events;
    }

    // Shadows hunt with a wobble; slow power-up halves their pace.
    const slowFactor = this.slowTimer > 0 ? POWERUPS.slowFactor : 1;
    for (const shadow of this.shadows) {
      const dx = player.x - shadow.x;
      const dy = player.y - shadow.y;
      const dist = Math.hypot(dx, dy) || 1;
      const wobble = Math.sin(this.time * 2.2 + shadow.phase) * SHADOWS.wobble;
      const nx = dx / dist;
      const ny = dy / dist;
      shadow.x += (nx * shadow.speed + -ny * wobble * 26) * slowFactor * dt;
      shadow.y += (ny * shadow.speed + nx * wobble * 26) * slowFactor * dt;
      shadow.x = Math.min(FIELD.width - 24, Math.max(24, shadow.x));
      shadow.y = Math.min(FIELD.height - 24, Math.max(PLAY_TOP + 24, shadow.y));
    }
    if (player.dashTime <= 0 && player.invuln <= 0) {
      for (const shadow of this.shadows) {
        if (Math.hypot(shadow.x - player.x, shadow.y - player.y) < SHADOWS.radius + PLAYER.radius - 2) {
          if (this.shieldTimer > 0) {
            this.shieldTimer = 0;
            player.invuln = 0.8;
            shadow.x = 50;
            shadow.y = PLAY_TOP + 50;
            this.burst(player.x, player.y, '#7fd8ff', 16, 190);
            this.floater(player.x, player.y - 26, 'SHIELD!', '#7fd8ff');
            events.push({ type: 'shieldblock' });
          } else {
            this.hearts -= 1;
            this.hitsTaken += 1;
            this.combo = 0;
            this.comboTimer = 0;
            player.invuln = PLAYER.invulnerableTime;
            this.shake = 9;
            this.burst(player.x, player.y, '#ff5a6e', 18, 210);
            events.push({ type: 'hit' });
            if (this.hearts <= 0) {
              this.finishRun(false, 'shadows');
              events.push({ type: 'over' });
              this.updateFx(dt);
              return events;
            }
          }
          break;
        }
      }
    }

    // Power-ups appear on their own clock and apply on touch.
    this.powerupSpawnTimer -= dt;
    if (this.powerupSpawnTimer <= 0) {
      this.powerupSpawnTimer = POWERUPS.spawnEvery;
      if (this.powerups.length < 2) this.spawnPowerup();
    }
    for (const p of this.powerups) p.age += dt;
    this.powerups = this.powerups.filter((p) => p.age < p.life);
    for (let i = this.powerups.length - 1; i >= 0; i -= 1) {
      const p = this.powerups[i];
      if (Math.hypot(p.x - player.x, p.y - player.y) < POWERUPS.radius + PLAYER.radius + 4) {
        this.powerups.splice(i, 1);
        this.score += 25;
        if (p.kind === 'shield') this.shieldTimer = POWERUPS.shieldTime;
        if (p.kind === 'magnet') this.magnetTimer = POWERUPS.magnetTime;
        if (p.kind === 'slow') this.slowTimer = POWERUPS.slowTime;
        this.burst(p.x, p.y, '#ffffff', 14, 160);
        this.floater(p.x, p.y - 20, p.kind.toUpperCase(), '#ffffff');
        events.push({ type: 'powerup', kind: p.kind });
      }
    }

    this.updateFx(dt);
    return events;
  }
}
