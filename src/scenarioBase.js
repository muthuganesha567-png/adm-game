// Base class shared by all scenarios: lifecycle, event recording, colliders, timers, HUD helpers.
import * as THREE from 'three';
import { SceneManager } from './sceneManager.js';
import { ScoreSheet } from './scoringEngine.js';

export class ScenarioBase {
  /**
   * @param {object} ctx  { game, engine, input, audio, settings, hud, dialogue, notify, onComplete, difficulty }
   * @param {object} meta registry entry
   */
  constructor(ctx, meta) {
    this.ctx = ctx; this.meta = meta;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / Math.max(1, window.innerHeight), 0.1, 1200);
    this.events = []; this.flags = {}; this.time = 0; this.colliders = []; this.updatables = [];
    this.finished = false; this.started = false; this.paused = false;
    this.timers = []; this.cineActive = false;
    this.difficulty = ctx.difficulty || 'normal';
  }

  // ---------- lifecycle (override) ----------
  build() {}                 // create the environment; called once before intro
  start() { this.started = true; }   // gameplay begins (after intro)
  update(dt) {}              // per frame while playing
  evaluate(outcomeId, data) { return null; } // return scoring + mentor rules
  dispose() { SceneManager.disposeObject(this.scene); this.updatables.length = 0; this.timers.length = 0; }

  /** Content for the intro screen. Override to add scenario-specific controls/tips. */
  getIntro() {
    return { title: this.meta.name, tagline: this.meta.tagline, description: this.meta.description, objective: this.meta.objective, controls: this.meta.controls || [], tips: this.meta.tips || [], lesson: this.meta.lesson };
  }

  // ---------- helpers ----------
  record(type, data = {}) { const e = { type, t: Math.round(this.time * 10) / 10, ...data }; this.events.push(e); return e; }
  has(type) { return this.events.some((e) => e.type === type); }
  count(type) { return this.events.filter((e) => e.type === type).length; }
  first(type) { return this.events.find((e) => e.type === type) || null; }
  last(type) { for (let i = this.events.length - 1; i >= 0; i--) if (this.events[i].type === type) return this.events[i]; return null; }
  sheet(dims) { return new ScoreSheet(dims); }

  addCollider(c) { this.colliders.push(c); return c; }
  removeCollider(c) { const i = this.colliders.indexOf(c); if (i >= 0) this.colliders.splice(i, 1); }
  onUpdate(fn) { this.updatables.push(fn); return fn; }
  after(seconds, fn) { const t = { at: this.time + seconds, fn }; this.timers.push(t); return t; }
  cancelTimer(t) { const i = this.timers.indexOf(t); if (i >= 0) this.timers.splice(i, 1); }

  /** Call from update(): advances time, runs timers and registered updatables. */
  tick(dt) {
    this.time += dt;
    for (const fn of this.updatables) fn(dt, this.time);
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= this.time);
      if (due.length) { this.timers = this.timers.filter((t) => t.at > this.time); for (const t of due) t.fn(); }
    }
  }

  notify(text, kind = 'info') { this.ctx.notify(text, kind); }
  hud() { return this.ctx.hud; }
  dialogue() { return this.ctx.dialogue; }

  /** End the scenario with an outcome. The game shows results after a short cinematic pause. */
  finish(outcomeId, data = {}) {
    if (this.finished) return;
    this.finished = true;
    this.record('finish', { outcome: outcomeId });
    this.ctx.hud.setPrompt(''); this.ctx.hud.setWarning('');
    this.ctx.onComplete(outcomeId, data);
  }

  /** Difficulty multiplier helpers. */
  diff(relaxed, normal, demanding) { return this.difficulty === 'relaxed' ? relaxed : this.difficulty === 'demanding' ? demanding : normal; }

  /** Player position accessor used by interaction and camera systems. */
  playerXZ() { return this.player ? [this.player.pos.x, this.player.pos.z] : [0, 0]; }
}
