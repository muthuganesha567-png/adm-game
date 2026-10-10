// Procedural audio: music, ambience and sound effects synthesised with the Web Audio API.
// No external audio files are required, so nothing can fail to load; if the Web Audio API
// is unavailable every method becomes a harmless no-op.

const NOTE = (semi, base = 220) => base * Math.pow(2, semi / 12);

const SCALES = {
  yaman: [0, 2, 4, 6, 7, 9, 11],      // bright, evening
  bhairav: [0, 1, 4, 5, 7, 8, 11],    // solemn, dawn
  pentatonic: [0, 2, 4, 7, 9],
  kafi: [0, 2, 3, 5, 7, 9, 10],
  minorPent: [0, 3, 5, 7, 10],
};

const TRACKS = {
  menu:   { root: 196, scale: 'yaman', bpm: 56, drone: [0, 7, 12], wave: 'sine', density: 0.55, pad: true, reverb: 0.5, vol: 0.9 },
  road:   { root: 174.6, scale: 'kafi', bpm: 72, drone: [0, 7], wave: 'triangle', density: 0.35, pad: true, reverb: 0.3, vol: 0.55, wind: 0.25 },
  city:   { root: 164.8, scale: 'pentatonic', bpm: 96, drone: [0], wave: 'triangle', density: 0.5, pad: true, reverb: 0.25, vol: 0.5, cityNoise: 0.3 },
  park:   { root: 220, scale: 'pentatonic', bpm: 64, drone: [0, 7], wave: 'sine', density: 0.4, pad: true, reverb: 0.4, vol: 0.55, birds: true, wind: 0.15 },
  office: { root: 196, scale: 'kafi', bpm: 80, drone: [0], wave: 'triangle', density: 0.3, pad: true, reverb: 0.2, vol: 0.45, hum: 0.15 },
  rain:   { root: 146.8, scale: 'minorPent', bpm: 60, drone: [0, 7], wave: 'sine', density: 0.3, pad: true, reverb: 0.5, vol: 0.5, rain: 0.5, wind: 0.2 },
  river:  { root: 174.6, scale: 'kafi', bpm: 66, drone: [0, 7], wave: 'sine', density: 0.35, pad: true, reverb: 0.4, vol: 0.5, river: 0.45, birds: true },
  camp:   { root: 164.8, scale: 'pentatonic', bpm: 60, drone: [0, 7], wave: 'sine', density: 0.35, pad: true, reverb: 0.4, vol: 0.5, wind: 0.3 },
  campus: { root: 207.6, scale: 'yaman', bpm: 76, drone: [0, 7], wave: 'triangle', density: 0.4, pad: true, reverb: 0.3, vol: 0.5, birds: true },
  battle: { root: 110, scale: 'bhairav', bpm: 52, drone: [0, 7, 12], wave: 'sawtooth', density: 0.4, pad: true, reverb: 0.6, vol: 0.8, drums: true, wind: 0.35 },
  results:{ root: 220, scale: 'yaman', bpm: 60, drone: [0, 7], wave: 'sine', density: 0.4, pad: true, reverb: 0.5, vol: 0.6 },
};

export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.unlocked = false;
    this.supported = typeof (window.AudioContext || window.webkitAudioContext) === 'function';
    this.currentTrack = null;
    this.track = null;        // active music track state
    this.loops = new Map();   // name -> { nodes:[], gain }
    this.engine = null;
    this.brakeNode = null;
    this.failedOnce = false;
    this._unlockHandler = () => this.unlock();
    window.addEventListener('pointerdown', this._unlockHandler, { passive: true });
    window.addEventListener('keydown', this._unlockHandler);
    settings.onChange(() => this.applyVolumes());
  }

  // ---------- lifecycle ----------
  unlock() {
    if (!this.supported) return;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this._buildGraph();
      } catch (err) {
        console.warn('[Audio] Web Audio unavailable; continuing silently.', err);
        this.supported = false; return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    if (!this.unlocked && this.ctx.state !== 'suspended') {
      this.unlocked = true;
      window.removeEventListener('pointerdown', this._unlockHandler);
      window.removeEventListener('keydown', this._unlockHandler);
      if (this.pendingTrack) { const t = this.pendingTrack; this.pendingTrack = null; this.playMusic(t); }
      window.dispatchEvent(new CustomEvent('dharma-audio-unlocked'));
    } else if (!this.unlocked) {
      // resume() is async; check again shortly
      setTimeout(() => { if (this.ctx && this.ctx.state === 'running') this.unlock(); }, 120);
    }
  }

  get state() {
    if (!this.supported) return 'unsupported';
    if (!this.unlocked) return 'locked';
    const v = this.settings.effectiveVolumes();
    if (!this.settings.get('audioEnabled')) return 'disabled';
    if (this.settings.get('muted') || v.master === 0) return 'muted';
    return 'on';
  }

  _buildGraph() {
    const c = this.ctx;
    this.master = c.createGain();
    this.musicGain = c.createGain();
    this.sfxGain = c.createGain();
    this.reverb = c.createConvolver();
    this.reverb.buffer = this._impulse(2.2, 2.5);
    this.reverbGain = c.createGain(); this.reverbGain.gain.value = 0.35;
    this.musicGain.connect(this.master); this.sfxGain.connect(this.master);
    this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.master);
    this.master.connect(c.destination);
    this.noiseBuffer = this._noise(2.0);
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const v = this.settings.effectiveVolumes();
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(v.master, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.settings.get('musicVolume'), t, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.settings.get('sfxVolume'), t, 0.05);
  }

  _noise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = (w * 0.6 + last * 2.5) * 0.5; }
    return buf;
  }
  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate; const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }

  // ---------- helpers ----------
  _env(gain, t, a, peak, d, s = 0, r = 0.1, hold = 0) {
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + a);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, s * peak), t + a + d);
    if (hold > 0) gain.gain.setValueAtTime(Math.max(0.0001, s * peak), t + a + d + hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + a + d + hold + r);
  }
  _osc(type, freq, t) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); return o; }
  _tone({ type = 'sine', freq = 440, t = this.ctx.currentTime, a = 0.01, d = 0.2, s = 0, r = 0.1, vol = 0.3, slide = null, dest = this.sfxGain, reverb = 0, filter = null, hold = 0 }) {
    const o = this._osc(type, freq, t); const g = this.ctx.createGain();
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + a + d);
    this._env(g, t, a, vol, d, s, r, hold);
    let node = o;
    if (filter) { const f = this.ctx.createBiquadFilter(); f.type = filter.type || 'lowpass'; f.frequency.value = filter.freq; f.Q.value = filter.q || 1; o.connect(f); node = f; }
    node.connect(g); g.connect(dest);
    if (reverb > 0) { const rg = this.ctx.createGain(); rg.gain.value = reverb; g.connect(rg); rg.connect(this.reverb); }
    o.start(t); o.stop(t + a + d + hold + r + 0.05);
    return o;
  }
  _noiseBurst({ t = this.ctx.currentTime, a = 0.005, d = 0.15, r = 0.1, vol = 0.3, filter = { type: 'lowpass', freq: 800, q: 1 }, sweep = null, dest = this.sfxGain, hold = 0 }) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = filter.type; f.frequency.setValueAtTime(filter.freq, t); f.Q.value = filter.q || 1;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + a + d);
    const g = this.ctx.createGain(); this._env(g, t, a, vol, d, 0, r, hold);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t); src.stop(t + a + d + hold + r + 0.05);
  }
  ready() { return this.supported && this.ctx && this.unlocked; }

  // ---------- SFX ----------
  sfx(name, opt = {}) {
    if (!this.ready()) return;
    try { this._sfx(name, opt); } catch (err) { if (!this.failedOnce) { this.failedOnce = true; console.warn('[Audio] sfx failed', name, err); } }
  }
  _sfx(name, opt) {
    const t = this.ctx.currentTime;
    switch (name) {
      case 'click': this._tone({ type: 'sine', freq: 720, slide: 420, d: 0.07, vol: 0.18 }); this._noiseBurst({ d: 0.03, vol: 0.05, filter: { type: 'highpass', freq: 2000 } }); break;
      case 'hover': this._tone({ type: 'sine', freq: 980, d: 0.04, vol: 0.05 }); break;
      case 'back': this._tone({ type: 'sine', freq: 420, slide: 300, d: 0.09, vol: 0.15 }); break;
      case 'interact': this._tone({ type: 'sine', freq: 880, d: 0.12, vol: 0.2, reverb: 0.3 }); this._tone({ type: 'sine', freq: 1320, t: t + 0.08, d: 0.16, vol: 0.16, reverb: 0.3 }); break;
      case 'pickup': [660, 880, 1100].forEach((f, i) => this._tone({ type: 'triangle', freq: f, t: t + i * 0.06, d: 0.12, vol: 0.16 })); break;
      case 'drop': this._tone({ type: 'triangle', freq: 500, slide: 300, d: 0.14, vol: 0.16 }); break;
      case 'notify': this._tone({ type: 'sine', freq: 1046, d: 0.5, vol: 0.14, reverb: 0.5 }); this._tone({ type: 'sine', freq: 2093, d: 0.3, vol: 0.05, reverb: 0.5 }); break;
      case 'warning': this._tone({ type: 'square', freq: 520, d: 0.12, vol: 0.08, filter: { type: 'lowpass', freq: 1500 } }); this._tone({ type: 'square', freq: 520, t: t + 0.18, d: 0.12, vol: 0.08, filter: { type: 'lowpass', freq: 1500 } }); break;
      case 'success': [0, 4, 7, 12].forEach((s, i) => this._tone({ type: 'triangle', freq: NOTE(s, 440), t: t + i * 0.11, d: 0.45, vol: 0.16, reverb: 0.6 })); break;
      case 'fail': this._tone({ type: 'sawtooth', freq: 220, slide: 150, d: 0.5, vol: 0.12, filter: { type: 'lowpass', freq: 700 }, reverb: 0.3 }); this._tone({ type: 'sawtooth', freq: 165, slide: 110, t: t + 0.25, d: 0.6, vol: 0.12, filter: { type: 'lowpass', freq: 600 }, reverb: 0.3 }); break;
      case 'chime': [0, 7, 12, 16, 19].forEach((s, i) => this._tone({ type: 'sine', freq: NOTE(s, 523), t: t + i * 0.09, d: 0.7, vol: 0.12, reverb: 0.7 })); break;
      case 'whoosh': this._noiseBurst({ a: 0.08, d: 0.3, vol: 0.2, filter: { type: 'bandpass', freq: 400, q: 0.8 }, sweep: 2400 }); break;
      case 'crash': {
        const v = Math.min(1, (opt.intensity ?? 0.6));
        this._noiseBurst({ d: 0.25 + 0.3 * v, vol: 0.35 + 0.35 * v, filter: { type: 'lowpass', freq: 900, q: 0.7 }, sweep: 200 });
        this._tone({ type: 'sine', freq: 90, slide: 30, d: 0.35, vol: 0.5 * v + 0.2 });
        if (v > 0.5) this._noiseBurst({ t: t + 0.05, d: 0.4, vol: 0.2, filter: { type: 'highpass', freq: 3000 } });
        break;
      }
      case 'bump': this._noiseBurst({ d: 0.12, vol: 0.25, filter: { type: 'lowpass', freq: 500 } }); this._tone({ type: 'sine', freq: 70, slide: 35, d: 0.18, vol: 0.3 }); break;
      case 'horn': {
        for (const f of [392, 494]) this._tone({ type: 'sawtooth', freq: f, a: 0.03, d: 0.1, s: 0.8, hold: 0.35, r: 0.12, vol: 0.12, filter: { type: 'lowpass', freq: 1800 } });
        break;
      }
      case 'siren-blip': this._tone({ type: 'square', freq: 700, slide: 950, a: 0.02, d: 0.25, vol: 0.06, filter: { type: 'lowpass', freq: 2000 } }); break;
      case 'splash': this._noiseBurst({ a: 0.02, d: 0.35, vol: 0.35, filter: { type: 'bandpass', freq: 1200, q: 0.6 }, sweep: 300 }); this._noiseBurst({ t: t + 0.1, d: 0.5, vol: 0.15, filter: { type: 'highpass', freq: 2500 } }); break;
      case 'footstep': this._noiseBurst({ d: 0.05, vol: 0.1 * (opt.vol ?? 1), filter: { type: 'lowpass', freq: 500 + Math.random() * 200, q: 1.2 } }); break;
      case 'skid': this._noiseBurst({ a: 0.02, d: 0.35, vol: 0.18, filter: { type: 'bandpass', freq: 1400, q: 4 } }); break;
      case 'conch': this._tone({ type: 'sawtooth', freq: 233, a: 0.5, d: 0.3, s: 0.9, hold: 1.8, r: 0.9, vol: 0.2, filter: { type: 'lowpass', freq: 900, q: 2 }, reverb: 0.9 }); this._tone({ type: 'sine', freq: 466, a: 0.6, d: 0.3, s: 0.7, hold: 1.6, r: 0.9, vol: 0.08, reverb: 0.9 }); break;
      case 'drum': this._tone({ type: 'sine', freq: 130, slide: 42, a: 0.005, d: 0.4, vol: 0.5, reverb: 0.4 }); this._noiseBurst({ d: 0.05, vol: 0.12, filter: { type: 'lowpass', freq: 1200 } }); break;
      case 'bell': this._tone({ type: 'sine', freq: 1567, d: 1.4, vol: 0.12, reverb: 0.8 }); this._tone({ type: 'sine', freq: 2349, d: 0.9, vol: 0.05, reverb: 0.8 }); break;
      case 'paper': this._noiseBurst({ a: 0.02, d: 0.18, vol: 0.12, filter: { type: 'highpass', freq: 1800 } }); break;
      case 'type': this._noiseBurst({ d: 0.02, vol: 0.08, filter: { type: 'highpass', freq: 3000 } }); break;
      case 'ring': [0, 0.5].forEach((o) => { this._tone({ type: 'sine', freq: 1200, t: t + o, a: 0.01, d: 0.05, s: 0.6, hold: 0.3, r: 0.05, vol: 0.08 }); this._tone({ type: 'sine', freq: 1500, t: t + o, a: 0.01, d: 0.05, s: 0.6, hold: 0.3, r: 0.05, vol: 0.05 }); }); break;
      case 'shred': this._noiseBurst({ a: 0.05, d: 0.8, vol: 0.14, filter: { type: 'bandpass', freq: 2000, q: 1.5 } }); break;
      case 'stall': this._tone({ type: 'sawtooth', freq: 90, slide: 30, a: 0.05, d: 0.9, vol: 0.2, filter: { type: 'lowpass', freq: 400 } }); break;
      case 'rescue': [0, 5, 7, 12].forEach((s, i) => this._tone({ type: 'triangle', freq: NOTE(s, 392), t: t + i * 0.13, d: 0.5, vol: 0.14, reverb: 0.5 })); break;
      default: this._tone({ type: 'sine', freq: 600, d: 0.08, vol: 0.1 });
    }
  }

  // ---------- Loops (siren, rain, etc.) ----------
  startLoop(name, { vol = 0.3 } = {}) {
    if (!this.ready() || this.loops.has(name)) return;
    const c = this.ctx; const g = c.createGain(); g.gain.value = 0; g.connect(this.sfxGain);
    const nodes = []; const t = c.currentTime;
    if (name === 'siren') {
      const o = c.createOscillator(); o.type = 'square'; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1600;
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 1.2; const lg = c.createGain(); lg.gain.value = 130;
      o.frequency.value = 780; lfo.connect(lg); lg.connect(o.frequency); o.connect(f); f.connect(g); o.start(); lfo.start(); nodes.push(o, lfo);
    } else if (name === 'rain' || name === 'river' || name === 'wind' || name === 'city' || name === 'hum' || name === 'crowd') {
      const src = c.createBufferSource(); src.buffer = this.noiseBuffer; src.loop = true;
      const f = c.createBiquadFilter();
      const cfg = { rain: ['lowpass', 3200, 0.5], river: ['bandpass', 520, 0.5], wind: ['lowpass', 380, 0.6], city: ['lowpass', 700, 0.4], hum: ['bandpass', 120, 6], crowd: ['lowpass', 260, 0.6] }[name];
      f.type = cfg[0]; f.frequency.value = cfg[1]; f.Q.value = cfg[2];
      const lfo = c.createOscillator(); lfo.frequency.value = name === 'wind' ? 0.08 : 0.3; const lg = c.createGain(); lg.gain.value = name === 'wind' ? 180 : 60;
      lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      src.connect(f); f.connect(g); src.start(); nodes.push(src, lfo);
    } else if (name === 'water-rush') {
      const src = c.createBufferSource(); src.buffer = this.noiseBuffer; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.4; src.connect(f); f.connect(g); src.start(); nodes.push(src);
    } else { return; }
    g.gain.setTargetAtTime(vol, t, 0.4);
    this.loops.set(name, { nodes, gain: g });
  }
  setLoopVolume(name, vol) { const l = this.loops.get(name); if (l && this.ctx) l.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.2); }
  stopLoop(name, fade = 0.4) {
    const l = this.loops.get(name); if (!l) return; this.loops.delete(name);
    const t = this.ctx.currentTime; l.gain.gain.setTargetAtTime(0, t, fade / 3);
    setTimeout(() => { l.nodes.forEach((n) => { try { n.stop(); } catch (_) { /* already stopped */ } }); try { l.gain.disconnect(); } catch (_) { /* ignore */ } }, fade * 1000 + 100);
  }
  stopAllLoops() { for (const n of [...this.loops.keys()]) this.stopLoop(n); }

  // ---------- Engine ----------
  startEngine(kind = 'truck') {
    if (!this.ready() || this.engine) return;
    const c = this.ctx; const t = c.currentTime;
    const g = c.createGain(); g.gain.value = 0; g.connect(this.sfxGain);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 1.5; f.connect(g);
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 45;
    const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 22.5; const g2 = c.createGain(); g2.gain.value = 0.5;
    const o3 = c.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 90; const g3 = c.createGain(); g3.gain.value = 0.35;
    o1.connect(f); o2.connect(g2); g2.connect(f); o3.connect(g3); g3.connect(f);
    o1.start(); o2.start(); o3.start();
    g.gain.setTargetAtTime(0.12, t, 0.5);
    this.engine = { g, f, o1, o2, o3, kind, base: kind === 'ambulance' ? 55 : 42 };
  }
  setEngine(speedNorm, throttle) {
    if (!this.engine || !this.ctx) return;
    const e = this.engine; const t = this.ctx.currentTime;
    const rpm = 0.25 + Math.min(1, speedNorm) * 0.9 + throttle * 0.25;
    e.o1.frequency.setTargetAtTime(e.base * rpm * 1.8, t, 0.08);
    e.o2.frequency.setTargetAtTime(e.base * rpm * 0.9, t, 0.08);
    e.o3.frequency.setTargetAtTime(e.base * rpm * 3.6, t, 0.08);
    e.f.frequency.setTargetAtTime(220 + rpm * 700, t, 0.1);
    e.g.gain.setTargetAtTime(0.08 + throttle * 0.07 + Math.min(1, speedNorm) * 0.05, t, 0.1);
  }
  stopEngine() {
    if (!this.engine) return; const e = this.engine; this.engine = null;
    const t = this.ctx.currentTime; e.g.gain.setTargetAtTime(0, t, 0.15);
    setTimeout(() => { [e.o1, e.o2, e.o3].forEach((o) => { try { o.stop(); } catch (_) { /* ignore */ } }); }, 600);
  }
  setBrake(active, strength = 1) {
    if (!this.ready()) return;
    if (active && !this.brakeNode) {
      const c = this.ctx; const src = c.createBufferSource(); src.buffer = this.noiseBuffer; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 3;
      const g = c.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start();
      this.brakeNode = { src, g };
    }
    if (this.brakeNode) {
      this.brakeNode.g.gain.setTargetAtTime(active ? 0.12 * strength : 0, this.ctx.currentTime, 0.08);
      if (!active) { const b = this.brakeNode; this.brakeNode = null; setTimeout(() => { try { b.src.stop(); } catch (_) { /* ignore */ } }, 500); }
    }
  }

  // ---------- Music ----------
  playMusic(trackId) {
    if (!this.supported) return;
    if (!this.ready()) { this.pendingTrack = trackId; return; }
    if (this.currentTrack === trackId && this.track) return;
    this.stopMusic(1.2);
    const cfg = TRACKS[trackId]; if (!cfg) return;
    this.currentTrack = trackId;
    const c = this.ctx; const t0 = c.currentTime;
    const bus = c.createGain(); bus.gain.value = 0; bus.connect(this.musicGain);
    bus.gain.setTargetAtTime(cfg.vol, t0, 1.0);
    const rev = c.createGain(); rev.gain.value = cfg.reverb; bus.connect(rev); rev.connect(this.reverb);
    const nodes = [];
    // drone (tanpura-like: slightly detuned pairs)
    for (const semi of cfg.drone) {
      for (const det of [-3, 3]) {
        const o = c.createOscillator(); o.type = cfg.wave === 'sawtooth' ? 'sawtooth' : 'triangle'; o.frequency.value = NOTE(semi, cfg.root / 2); o.detune.value = det;
        const g = c.createGain(); g.gain.value = cfg.wave === 'sawtooth' ? 0.035 : 0.05;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
        o.connect(f); f.connect(g); g.connect(bus); o.start(); nodes.push(o);
      }
    }
    // ambience layers
    if (cfg.wind) this.startLoop('wind', { vol: cfg.wind });
    if (cfg.rain) this.startLoop('rain', { vol: cfg.rain });
    if (cfg.river) this.startLoop('river', { vol: cfg.river });
    if (cfg.cityNoise) this.startLoop('city', { vol: cfg.cityNoise });
    if (cfg.hum) this.startLoop('hum', { vol: cfg.hum });
    if (cfg.drums) this.startLoop('crowd', { vol: 0.12 });
    const scale = SCALES[cfg.scale];
    const state = { cfg, bus, nodes, scale, nextBeat: t0 + 0.5, beat: 0, lastDeg: 0, timer: null, phrase: 0 };
    const beatLen = 60 / cfg.bpm;
    const schedule = () => {
      if (this.track !== state) return;
      const now = c.currentTime;
      while (state.nextBeat < now + 0.6) {
        const b = state.beat; const tb = state.nextBeat;
        // melody: random walk on scale degrees, phrase pauses
        const inPhrase = (b % 16) < 12;
        if (inPhrase && Math.random() < cfg.density) {
          const step = Math.random() < 0.6 ? (Math.random() < 0.5 ? -1 : 1) : (Math.random() < 0.5 ? -2 : 2);
          state.lastDeg = Math.max(0, Math.min(scale.length * 2 - 1, state.lastDeg + step));
          if (b % 16 === 0) state.lastDeg = Math.random() < 0.5 ? 0 : 4;
          const oct = Math.floor(state.lastDeg / scale.length); const semi = scale[state.lastDeg % scale.length] + 12 * oct;
          const freq = NOTE(semi, cfg.root * 2);
          const len = beatLen * (Math.random() < 0.3 ? 2 : 1);
          this._tone({ type: cfg.wave === 'sawtooth' ? 'triangle' : 'sine', freq, t: tb, a: 0.08, d: len * 0.8, s: 0.3, r: len * 0.6, vol: cfg.wave === 'sawtooth' ? 0.06 : 0.07, dest: bus, reverb: 0 });
          if (cfg.pad && b % 4 === 0) this._tone({ type: 'sine', freq: freq / 2, t: tb, a: 0.4, d: beatLen * 3, s: 0.4, r: 1.2, vol: 0.03, dest: bus });
        }
        if (cfg.drums && (b % 4 === 0 || b % 8 === 7)) {
          this._tone({ type: 'sine', freq: 120, slide: 40, t: tb, a: 0.005, d: 0.5, vol: b % 8 === 0 ? 0.3 : 0.18, dest: bus });
          if (b % 8 === 7) this._tone({ type: 'sine', freq: 120, slide: 40, t: tb + beatLen * 0.5, a: 0.005, d: 0.4, vol: 0.15, dest: bus });
        }
        if (cfg.birds && Math.random() < 0.08) {
          const f = 2200 + Math.random() * 1500;
          for (let i = 0; i < 3; i++) this._tone({ type: 'sine', freq: f, slide: f * 1.3, t: tb + i * 0.09, a: 0.01, d: 0.05, vol: 0.025, dest: bus });
        }
        state.nextBeat += beatLen; state.beat += 1;
      }
    };
    state.timer = setInterval(schedule, 150);
    schedule();
    this.track = state;
  }
  stopMusic(fade = 0.8) {
    const s = this.track; if (!s) { this.currentTrack = null; return; }
    this.track = null; this.currentTrack = null;
    clearInterval(s.timer);
    const t = this.ctx.currentTime; s.bus.gain.setTargetAtTime(0, t, fade / 3);
    setTimeout(() => { s.nodes.forEach((n) => { try { n.stop(); } catch (_) { /* ignore */ } }); try { s.bus.disconnect(); } catch (_) { /* ignore */ } }, fade * 1000 + 200);
    for (const n of ['wind', 'rain', 'river', 'city', 'hum', 'crowd']) this.stopLoop(n, fade);
  }

  /** Stop every scenario-related sound (used when leaving gameplay). */
  stopGameplaySounds() { this.stopEngine(); this.setBrake(false); for (const n of ['siren', 'water-rush']) this.stopLoop(n); }
}
