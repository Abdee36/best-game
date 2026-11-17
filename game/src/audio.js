// All sound is synthesized with the Web Audio API — no audio files, no
// network. Every call is guarded so a browser without audio (or a
// headless screenshot run) simply stays silent instead of throwing.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
      this.unlocked = true;
    } catch (err) {
      this.ctx = null;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.16;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (err) {
      // Silence is fine; never let sound break the game.
    }
  }

  click() {
    this.tone(660, 0.07, 'triangle', 0.35);
  }

  dash() {
    this.tone(320, 0.14, 'sine', 0.3, 640);
  }

  collect(combo) {
    const step = Math.min(combo, 12);
    this.tone(520 + step * 32, 0.11, 'sine', 0.5);
    this.tone(780 + step * 32, 0.09, 'triangle', 0.22);
  }

  bloom() {
    this.tone(523, 0.16, 'sine', 0.45);
    setTimeout(() => this.tone(659, 0.16, 'sine', 0.45), 70);
    setTimeout(() => this.tone(784, 0.22, 'sine', 0.45), 140);
  }

  hit() {
    this.tone(180, 0.22, 'sawtooth', 0.4, 70);
  }

  powerup() {
    this.tone(440, 0.1, 'square', 0.18);
    setTimeout(() => this.tone(587, 0.1, 'square', 0.18), 80);
    setTimeout(() => this.tone(880, 0.16, 'square', 0.18), 160);
  }

  levelClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.18, 'triangle', 0.45), i * 110);
    });
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.24, 'triangle', 0.4), i * 160);
    });
  }

  win() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.tone(freq, 0.2, 'triangle', 0.45), i * 120);
    });
  }
}
