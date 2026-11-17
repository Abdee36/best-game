// Keyboard and mouse input, normalized into one move vector plus edge
// events. The simulation never reads the DOM directly; it reads the
// plain object this class hands it each step.
import { FIELD } from './config.js';

const MOVE_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: FIELD.width / 2, y: FIELD.height / 2, down: false };
    this.clicks = [];
    this.onKey = (event) => {
      if (MOVE_KEYS.has(event.code) || event.code === 'Space') event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    };
    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    this.onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
    };
    this.onMouseDown = (event) => {
      this.onMouseMove(event);
      this.mouse.down = true;
      this.clicks.push({ x: this.mouse.x, y: this.mouse.y });
    };
    this.onMouseUp = () => {
      this.mouse.down = false;
    };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  takeClicks() {
    const taken = this.clicks;
    this.clicks = [];
    return taken;
  }

  endFrame() {
    this.pressed.clear();
  }

  // Move vector from keys; falls back to steering toward the pointer
  // while the mouse button is held, so mouse-only play works too.
  moveVector(playerX, playerY) {
    let mx = 0;
    let my = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) mx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) mx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) my -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) my += 1;
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      return { mx: mx / len, my: my / len };
    }
    if (this.mouse.down) {
      const dx = this.mouse.x - playerX;
      const dy = this.mouse.y - playerY;
      const dist = Math.hypot(dx, dy);
      if (dist > 14) return { mx: dx / dist, my: dy / dist };
    }
    return { mx: 0, my: 0 };
  }
}
