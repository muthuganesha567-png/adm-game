// Shared Three.js rendering system: renderer, active scene/camera, quality presets, resize, disposal.
import * as THREE from 'three';

const QUALITY = {
  low:    { pixelRatio: 1,   shadowSize: 512,  antialias: false, anisotropy: 1 },
  medium: { pixelRatio: 1.5, shadowSize: 1024, antialias: true,  anisotropy: 4 },
  high:   { pixelRatio: 2,   shadowSize: 2048, antialias: true,  anisotropy: 8 },
};

export class SceneManager {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.renderer = this._createRenderer();
    this.shake = { amp: 0, decay: 3 };
    this._shakeOffset = new THREE.Vector3();
    this._camBase = new THREE.Vector3();
    this.applyQuality();
    window.addEventListener('resize', () => this.resize());
    this.resize();
    settings.onChange(({ key }) => { if (['quality', 'shadows'].includes(key) || key === '*') this.applyQuality(); });
  }

  _createRenderer() {
    const q = QUALITY[this.settings.get('quality')] || QUALITY.medium;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: q.antialias, powerPreference: 'high-performance', alpha: false });
    } catch (err) {
      throw new Error('WebGL could not be initialised. Please use a modern browser with hardware acceleration enabled.\n' + err.message);
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0b1026, 1);
    return renderer;
  }

  get qualityPreset() { return QUALITY[this.settings.get('quality')] || QUALITY.medium; }

  applyQuality() {
    const q = this.qualityPreset;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));
    const shadows = !!this.settings.get('shadows') && this.settings.get('quality') !== 'low';
    if (this.renderer.shadowMap.enabled !== shadows) {
      this.renderer.shadowMap.enabled = shadows;
      // Materials need recompilation after toggling shadows
      if (this.scene) this.scene.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { m.needsUpdate = true; }); } });
    }
    if (this.scene) {
      this.scene.traverse((o) => {
        if (o.isDirectionalLight && o.shadow) { o.shadow.mapSize.set(q.shadowSize, q.shadowSize); if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; } }
      });
    }
    this.resize();
  }

  setActive(scene, camera) {
    this.scene = scene; this.camera = camera;
    if (camera) { camera.aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight); camera.updateProjectionMatrix(); }
    const q = this.qualityPreset;
    scene?.traverse((o) => { if (o.isDirectionalLight && o.shadow) o.shadow.mapSize.set(q.shadowSize, q.shadowSize); });
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    if (this.camera) { this.camera.aspect = w / Math.max(1, h); this.camera.updateProjectionMatrix(); }
  }

  addShake(amount) {
    if (!this.settings.get('screenShake')) return;
    this.shake.amp = Math.min(1.2, this.shake.amp + amount);
  }

  render(dt) {
    if (!this.scene || !this.camera) return;
    let shook = false;
    if (this.shake.amp > 0.001) {
      this._camBase.copy(this.camera.position);
      const a = this.shake.amp;
      this._shakeOffset.set((Math.random() - 0.5) * a * 0.5, (Math.random() - 0.5) * a * 0.4, (Math.random() - 0.5) * a * 0.5);
      this.camera.position.add(this._shakeOffset);
      this.shake.amp *= Math.max(0, 1 - dt * this.shake.decay);
      shook = true;
    }
    this.renderer.render(this.scene, this.camera);
    if (shook) this.camera.position.copy(this._camBase);
  }

  /** Recursively free GPU resources of a scene graph. */
  static disposeObject(root) {
    if (!root) return;
    root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          for (const k of Object.keys(m)) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
          m.dispose();
        }
      }
    });
  }

  get info() { return this.renderer.info; }
}
