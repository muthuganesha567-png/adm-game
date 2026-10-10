// Settings persistence and change notification (LocalStorage).
const KEY = 'dharmaDecision.settings.v1';

export const DEFAULT_SETTINGS = Object.freeze({
  // audio
  audioEnabled: true,
  muted: false,
  masterVolume: 0.8,
  musicVolume: 0.55,
  sfxVolume: 0.8,
  // graphics
  quality: 'medium', // low | medium | high
  shadows: true,
  particles: true,
  reducedMotion: false,
  // gameplay
  mouseSensitivity: 1.0,
  invertY: false,
  mouseLook: 'drag', // drag | lock
  cameraMode: 'chase', // chase | far | hood | top
  screenShake: true,
  difficulty: 'normal', // relaxed | normal | demanding
  subtitles: true,
  showControlsHint: true,
  // AI mentor (optional, off by default)
  aiEndpoint: '',
  aiModel: '',
  aiKey: '',
});

export class SettingsManager extends EventTarget {
  constructor() {
    super();
    this.values = { ...DEFAULT_SETTINGS };
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const k of Object.keys(DEFAULT_SETTINGS)) {
          if (k in parsed && typeof parsed[k] === typeof DEFAULT_SETTINGS[k]) this.values[k] = parsed[k];
        }
      }
    } catch (err) {
      console.warn('[Settings] Could not read saved settings, using defaults.', err);
    }
  }

  persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.values)); }
    catch (err) { console.warn('[Settings] Could not persist settings.', err); }
  }

  get(key) { return this.values[key]; }
  getAll() { return { ...this.values }; }

  set(key, value, { silent = false } = {}) {
    if (!(key in DEFAULT_SETTINGS)) return;
    if (this.values[key] === value) return;
    this.values[key] = value;
    this.persist();
    if (!silent) this.dispatchEvent(new CustomEvent('change', { detail: { key, value, all: this.getAll() } }));
  }

  reset() {
    this.values = { ...DEFAULT_SETTINGS };
    this.persist();
    this.dispatchEvent(new CustomEvent('change', { detail: { key: '*', value: null, all: this.getAll() } }));
  }

  onChange(fn) { this.addEventListener('change', (e) => fn(e.detail)); }

  /** Effective numeric values after mute/enabled flags. */
  effectiveVolumes() {
    const on = this.values.audioEnabled && !this.values.muted;
    const m = on ? this.values.masterVolume : 0;
    return { master: m, music: m * this.values.musicVolume, sfx: m * this.values.sfxVolume, on };
  }
}
