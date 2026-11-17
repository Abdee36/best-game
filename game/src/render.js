// Every pixel of Lentera Senja, drawn on one 2D canvas: the dusk garden,
// the creatures, the HUD and the menu screens. Nothing here loads a
// file; all art is shapes, gradients and text.
import { FIELD, HUD_HEIGHT, PLAY_TOP, PLAYER, LIGHT, PALETTE } from './config.js';

export const START_BUTTON = { x: 490, y: 508, w: 300, h: 64 };
export const AGAIN_BUTTON = { x: 490, y: 516, w: 300, h: 64 };
export const RESUME_BUTTON = { x: 490, y: 392, w: 300, h: 60 };
export const RESTART_BUTTON = { x: 490, y: 466, w: 300, h: 60 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.font = `${weight || 'bold'} ${size}px Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function outlinedText(ctx, str, x, y, size, color, align) {
  ctx.font = `bold ${size}px Verdana, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(10, 8, 26, 0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -11, 0, -5);
  ctx.bezierCurveTo(6, -11, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff5a6e' : 'rgba(255,255,255,0.22)';
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx, world) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.45, PALETTE.skyMid);
  grad.addColorStop(0.72, PALETTE.skyLow);
  grad.addColorStop(1, PALETTE.horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Moon and its halo.
  const moon = ctx.createRadialGradient(1080, 92, 8, 1080, 92, 90);
  moon.addColorStop(0, 'rgba(255, 240, 200, 0.95)');
  moon.addColorStop(0.35, 'rgba(255, 230, 170, 0.35)');
  moon.addColorStop(1, 'rgba(255, 230, 170, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(970, 0, 220, 200);
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.arc(1080, 92, 34, 0, Math.PI * 2);
  ctx.fill();

  // Stars, twinkling on their own phase.
  for (const star of world.stars) {
    const alpha = 0.45 + 0.45 * Math.sin(world.time * 1.6 + star.twinkle);
    ctx.fillStyle = `rgba(255, 246, 220, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling hills and the garden floor.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.ellipse(320, 470, 460, 130, 0, Math.PI, Math.PI * 2);
  ctx.ellipse(980, 480, 520, 140, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.ellipse(640, 560, 760, 150, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, 470, FIELD.width, FIELD.height - 470);
  ctx.fillStyle = PALETTE.grassLight;
  for (let i = 0; i < 46; i += 1) {
    const gx = ((i * 197) % 1240) + 20;
    const gy = 490 + ((i * 89) % 210);
    ctx.beginPath();
    ctx.ellipse(gx, gy, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fence posts along the back of the garden.
  ctx.fillStyle = '#3a2c22';
  for (let x = 30; x < FIELD.width; x += 90) {
    ctx.fillRect(x, 448, 10, 34);
  }
  ctx.fillRect(0, 458, FIELD.width, 6);
}

function drawFlower(ctx, flower, time) {
  const sway = Math.sin(time * 1.4 + flower.phase) * 3;
  ctx.strokeStyle = PALETTE.leaf;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(flower.x, flower.y + 30);
  ctx.quadraticCurveTo(flower.x + sway, flower.y + 10, flower.x + sway, flower.y);
  ctx.stroke();
  ctx.fillStyle = PALETTE.leaf;
  ctx.beginPath();
  ctx.ellipse(flower.x - 10 + sway * 0.5, flower.y + 18, 10, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  if (flower.bloomed) {
    const glow = ctx.createRadialGradient(flower.x, flower.y, 4, flower.x, flower.y, 46);
    glow.addColorStop(0, 'rgba(255, 111, 165, 0.5)');
    glow.addColorStop(1, 'rgba(255, 111, 165, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(flower.x - 46, flower.y - 46, 92, 92);
    ctx.fillStyle = PALETTE.flowerBloom;
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(
        flower.x + sway + Math.cos(angle) * 13,
        flower.y + Math.sin(angle) * 13,
        11, 8, angle, 0, Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.flowerCenter;
    ctx.beginPath();
    ctx.arc(flower.x + sway, flower.y, 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.flowerBud;
    ctx.beginPath();
    ctx.arc(flower.x + sway, flower.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(flower.x + sway - 3, flower.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    // Bloom ring: fills while the lantern lingers beside the bud.
    if (flower.progress > 0) {
      ctx.strokeStyle = PALETTE.flowerBloom;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(flower.x + sway, flower.y, 19, -Math.PI / 2, -Math.PI / 2 + flower.progress * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawOrb(ctx, orb, time) {
  const pulse = 1 + 0.16 * Math.sin(time * 3 + orb.phase);
  const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, 30 * pulse);
  glow.addColorStop(0, 'rgba(255, 213, 106, 0.85)');
  glow.addColorStop(0.4, 'rgba(255, 181, 46, 0.35)');
  glow.addColorStop(1, 'rgba(255, 181, 46, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(orb.x - 32, orb.y - 32, 64, 64);
  ctx.fillStyle = PALETTE.orbCore;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, 9 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // Fading ring when the orb is about to vanish.
  if (orb.age > orb.life - 2) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawShadow(ctx, shadow, world) {
  const dx = world.player.x - shadow.x;
  const dy = world.player.y - shadow.y;
  const dist = Math.hypot(dx, dy) || 1;
  ctx.fillStyle = PALETTE.shadowBody;
  ctx.beginPath();
  ctx.arc(shadow.x, shadow.y - 4, 20, Math.PI, 0);
  ctx.lineTo(shadow.x + 20, shadow.y + 14);
  for (let i = 0; i < 4; i += 1) {
    ctx.lineTo(shadow.x + 12 - i * 10, shadow.y + 6 + (i % 2) * 8);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.shadowEye;
  const lookX = (dx / dist) * 3;
  const lookY = (dy / dist) * 3;
  ctx.beginPath();
  ctx.arc(shadow.x - 7 + lookX, shadow.y - 6 + lookY, 4, 0, Math.PI * 2);
  ctx.arc(shadow.x + 7 + lookX, shadow.y - 6 + lookY, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerup(ctx, p, time) {
  const bob = Math.sin(time * 2.4 + p.phase) * 4;
  const y = p.y + bob;
  const colors = { shield: PALETTE.shield, magnet: PALETTE.magnet, slow: PALETTE.slow };
  ctx.save();
  ctx.translate(p.x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = 'rgba(12, 10, 30, 0.9)';
  ctx.strokeStyle = colors[p.kind];
  ctx.lineWidth = 3;
  rr(ctx, -15, -15, 30, 30, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = colors[p.kind];
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glyph = p.kind === 'shield' ? 'S' : p.kind === 'magnet' ? 'M' : 'Z';
  ctx.fillText(glyph, p.x, y + 1);
}

function drawPlayer(ctx, world) {
  const player = world.player;
  const blink = player.invuln > 0 && Math.floor(world.time * 12) % 2 === 0;
  const halo = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, 74);
  const strength = 0.35 + 0.45 * (world.light / LIGHT.max);
  halo.addColorStop(0, `rgba(255, 215, 106, ${strength.toFixed(3)})`);
  halo.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(player.x - 74, player.y - 74, 148, 148);
  if (player.dashTime > 0) {
    ctx.strokeStyle = 'rgba(255, 233, 168, 0.7)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(player.x - player.dashDirX * 34, player.y - player.dashDirY * 34);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
  }
  ctx.globalAlpha = blink ? 0.45 : 1;
  // Wings.
  const flap = Math.sin(world.time * 26) * 0.5;
  ctx.fillStyle = 'rgba(220, 240, 255, 0.75)';
  ctx.save();
  ctx.translate(player.x, player.y - 8);
  ctx.rotate(-0.5 - flap * 0.3);
  ctx.beginPath();
  ctx.ellipse(-12, -6, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(player.x, player.y - 8);
  ctx.rotate(0.5 + flap * 0.3);
  ctx.beginPath();
  ctx.ellipse(12, -6, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Body: the lantern itself.
  ctx.fillStyle = '#ffcf5e';
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b87a1e';
  ctx.beginPath();
  ctx.arc(player.x, player.y + 5, PLAYER.radius - 3, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#1b1440';
  const look = player.faceX * 3;
  ctx.beginPath();
  ctx.arc(player.x - 5 + look, player.y - 3, 2.6, 0, Math.PI * 2);
  ctx.arc(player.x + 5 + look, player.y - 3, 2.6, 0, Math.PI * 2);
  ctx.fill();
  if (world.shieldTimer > 0) {
    ctx.strokeStyle = PALETTE.shield;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world, muted) {
  ctx.fillStyle = PALETTE.hudBar;
  ctx.fillRect(0, 0, FIELD.width, HUD_HEIGHT);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, HUD_HEIGHT, FIELD.width, 3);
  text(ctx, `SCORE ${world.score}`, 24, 26, 24, PALETTE.text);
  text(ctx, `BEST ${world.best}`, 24, 50, 14, PALETTE.textDim);
  const bloomed = world.flowers.filter((f) => f.bloomed).length;
  text(ctx, `LEVEL ${world.level}/3`, 300, 26, 22, PALETTE.text);
  text(ctx, `FLOWERS ${bloomed}/${world.flowers.length}`, 300, 50, 14, PALETTE.textDim);
  // Hearts.
  for (let i = 0; i < PLAYER.maxHearts; i += 1) {
    drawHeart(ctx, 560 + i * 34, 32, 26, i < world.hearts);
  }
  // Light bar.
  text(ctx, 'LIGHT', 690, 22, 15, PALETTE.textDim);
  const barX = 690;
  const barY = 34;
  const barW = 240;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, barX, barY, barW, 16, 8);
  ctx.fill();
  const frac = Math.max(0, world.light / LIGHT.max);
  const low = world.light < LIGHT.lowWarn;
  ctx.fillStyle = low ? PALETTE.danger : PALETTE.gold;
  if (frac > 0) {
    rr(ctx, barX, barY, Math.max(16, barW * frac), 16, 8);
    ctx.fill();
  }
  if (low && Math.floor(world.time * 3) % 2 === 0) {
    text(ctx, 'LOW!', barX + barW + 14, 42, 16, PALETTE.danger);
  }
  // Combo badge.
  if (world.combo >= 3) {
    ctx.fillStyle = 'rgba(255, 111, 165, 0.9)';
    rr(ctx, 990, 16, 118, 32, 16);
    ctx.fill();
    text(ctx, `COMBO x${world.combo}`, 1049, 33, 17, '#ffffff', 'center');
  }
  // Active power-ups, one line so they never overlap each other.
  const pills = [];
  if (world.shieldTimer > 0) pills.push(`SHIELD ${Math.ceil(world.shieldTimer)}s`);
  if (world.magnetTimer > 0) pills.push(`MAGNET ${Math.ceil(world.magnetTimer)}s`);
  if (world.slowTimer > 0) pills.push(`SLOW ${Math.ceil(world.slowTimer)}s`);
  if (pills.length > 0) {
    text(ctx, pills.join('  ·  '), 1256, 26, 13, PALETTE.textDim, 'right');
  }
  text(ctx, muted ? 'SOUND OFF (M)' : 'SOUND ON (M)', 1256, 50, 13, PALETTE.textDim, 'right');
  text(ctx, 'WASD / ARROWS move · SPACE dash · P pause', 640, FIELD.height - 16, 13, 'rgba(255,247,230,0.6)', 'center', 'normal');
}

function drawButton(ctx, rect, label, hover) {
  ctx.fillStyle = hover ? '#ffb52e' : PALETTE.gold;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 14);
  ctx.fill();
  ctx.fillStyle = '#1b1440';
  ctx.font = 'bold 26px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
}

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(10, 8, 26, ${alpha})`;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

export function drawTitle(ctx, world, mouse) {
  dim(ctx, 0.45);
  outlinedText(ctx, 'LENTERA SENJA', 640, 118, 68, PALETTE.gold, 'center');
  text(ctx, 'D U S K   L A N T E R N', 640, 168, 20, PALETTE.textDim, 'center');
  text(ctx, 'Keep your lantern lit. Bloom every flower before the night wins.', 640, 208, 19, PALETTE.text, 'center', 'normal');
  ctx.fillStyle = 'rgba(12, 10, 30, 0.78)';
  rr(ctx, 340, 240, 600, 228, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  rr(ctx, 340, 240, 600, 228, 16);
  ctx.stroke();
  const lines = [
    ['Collect glowing orbs', 'to feed your light'],
    ['Linger beside each bud', 'until its ring fills to bloom it'],
    ['Dodge the shadows', 'or dash straight through them'],
    ['Grab S / M / Z charms', 'for shield, magnet and slow-time'],
  ];
  lines.forEach(([head, tail], i) => {
    const y = 272 + i * 48;
    text(ctx, head, 372, y, 19, PALETTE.text);
    text(ctx, tail, 372, y + 20, 15, PALETTE.textDim, 'left', 'normal');
  });
  const hover = mouse.x >= START_BUTTON.x && mouse.x <= START_BUTTON.x + START_BUTTON.w
    && mouse.y >= START_BUTTON.y && mouse.y <= START_BUTTON.y + START_BUTTON.h;
  drawButton(ctx, START_BUTTON, 'START  ▶', hover);
  text(ctx, 'or press ENTER', 640, 596, 15, PALETTE.textDim, 'center', 'normal');
  if (world.best > 0) text(ctx, `BEST SCORE  ${world.best}`, 640, 636, 17, PALETTE.gold, 'center');
  text(ctx, 'WASD / ARROWS move · hold mouse to steer · SPACE dash · P pause · M sound', 640, 688, 14, PALETTE.textDim, 'center', 'normal');
}

function drawStats(ctx, world, y) {
  const stats = `SCORE ${world.score}   ·   BEST ${world.best}   ·   ORBS ${world.orbsCollected}   ·   BLOOMS ${world.flowersBloomed}`;
  text(ctx, stats, 640, y, 18, PALETTE.text, 'center', 'normal');
}

export function drawEnd(ctx, world, mouse) {
  dim(ctx, 0.62);
  if (world.status === 'win') {
    outlinedText(ctx, 'THE GARDEN GLOWS!', 640, 150, 56, PALETTE.gold, 'center');
    text(ctx, 'Every flower is blooming. The night is yours, little lantern.', 640, 206, 19, PALETTE.text, 'center', 'normal');
  } else {
    const title = world.overReason === 'light' ? 'THE LANTERN WENT DARK' : 'THE SHADOWS CAUGHT YOU';
    outlinedText(ctx, title, 640, 150, 50, PALETTE.danger, 'center');
    text(ctx, world.overReason === 'light'
      ? 'Your light ran out. Orbs and blooms feed it — keep moving.'
      : 'Three hits and the garden goes quiet. Dash through danger!', 640, 206, 19, PALETTE.text, 'center', 'normal');
  }
  text(ctx, `YOU REACHED LEVEL ${world.level} OF 3`, 640, 258, 20, PALETTE.textDim, 'center');
  drawStats(ctx, world, 306);
  const hover = mouse.x >= AGAIN_BUTTON.x && mouse.x <= AGAIN_BUTTON.x + AGAIN_BUTTON.w
    && mouse.y >= AGAIN_BUTTON.y && mouse.y <= AGAIN_BUTTON.y + AGAIN_BUTTON.h;
  drawButton(ctx, AGAIN_BUTTON, 'PLAY AGAIN  ↻', hover);
  text(ctx, 'or press R', 640, 606, 15, PALETTE.textDim, 'center', 'normal');
}

export function drawPause(ctx, mouse) {
  dim(ctx, 0.6);
  outlinedText(ctx, 'PAUSED', 640, 220, 54, PALETTE.text, 'center');
  const hoverResume = mouse.x >= RESUME_BUTTON.x && mouse.x <= RESUME_BUTTON.x + RESUME_BUTTON.w
    && mouse.y >= RESUME_BUTTON.y && mouse.y <= RESUME_BUTTON.y + RESUME_BUTTON.h;
  const hoverRestart = mouse.x >= RESTART_BUTTON.x && mouse.x <= RESTART_BUTTON.x + RESTART_BUTTON.w
    && mouse.y >= RESTART_BUTTON.y && mouse.y <= RESTART_BUTTON.y + RESTART_BUTTON.h;
  drawButton(ctx, RESUME_BUTTON, 'RESUME', hoverResume);
  drawButton(ctx, RESTART_BUTTON, 'RESTART', hoverRestart);
  text(ctx, 'P resumes · R restarts', 640, 556, 15, PALETTE.textDim, 'center', 'normal');
}

export function draw(ctx, world, mouse, muted) {
  ctx.save();
  if (world.shake > 0) {
    const sx = (Math.random() - 0.5) * world.shake;
    const sy = (Math.random() - 0.5) * world.shake;
    ctx.translate(sx, sy);
  }
  drawBackground(ctx, world);
  for (const flower of world.flowers) drawFlower(ctx, flower, world.time);
  for (const orb of world.orbs) drawOrb(ctx, orb, world.time);
  for (const p of world.powerups) drawPowerup(ctx, p, world.time);
  for (const shadow of world.shadows) drawShadow(ctx, shadow, world);
  drawPlayer(ctx, world);
  for (const p of world.particles) {
    const alpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floaters) {
    const alpha = Math.max(0, 1 - f.age / f.life);
    ctx.globalAlpha = alpha;
    outlinedText(ctx, f.text, f.x, f.y, 18, f.color, 'center');
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (world.status !== 'title') drawHud(ctx, world, muted);
  if (world.status === 'levelclear') {
    outlinedText(ctx, 'LEVEL CLEAR!', 640, 170, 52, PALETTE.ok, 'center');
    text(ctx, world.level >= 3 ? 'The last garden wakes…' : 'The next garden is darker…', 640, 216, 19, PALETTE.text, 'center', 'normal');
  }
  if (world.status === 'title') drawTitle(ctx, world, mouse);
  if (world.status === 'paused') drawPause(ctx, mouse);
  if (world.status === 'over' || world.status === 'win') drawEnd(ctx, world, mouse);
}
