// Proximity-based interaction: nearest enabled interactable within range shows a prompt; E triggers it.
import * as THREE from 'three';
import { makeGlow } from './worldKit.js';

export class InteractionSystem {
  constructor({ input, hud, audio, scene }) {
    this.input = input; this.hud = hud; this.audio = audio; this.scene = scene;
    this.items = new Map(); this.current = null; this.time = 0; this.enabled = true;
  }

  add({ id, x, z, y = 2.1, radius = 2.4, prompt, onInteract, enabled = true, marker = true, markerColor = 0xf1c75b, object = null, facing = null, priority = 0 }) {
    if (this.items.has(id)) this.remove(id);
    const it = { id, x, z, y, radius, prompt, onInteract, enabled, object, facing, priority, marker: null };
    if (marker && this.scene) { const g = makeGlow(markerColor, 0.9); g.position.set(x, y, z); this.scene.add(g); it.marker = g; }
    this.items.set(id, it); return it;
  }
  remove(id) { const it = this.items.get(id); if (!it) return; if (it.marker) { this.scene.remove(it.marker); it.marker.material.map?.dispose(); it.marker.material.dispose(); } this.items.delete(id); if (this.current === it) { this.current = null; this.hud.setPrompt(''); } }
  get(id) { return this.items.get(id); }
  setEnabled(id, v) { const it = this.items.get(id); if (it) { it.enabled = v; if (it.marker) it.marker.visible = v; } }
  setPrompt(id, text) { const it = this.items.get(id); if (it) it.prompt = text; }
  setRadius(id, r) { const it = this.items.get(id); if (it) it.radius = r; }
  move(id, x, z) { const it = this.items.get(id); if (it) { it.x = x; it.z = z; if (it.marker) it.marker.position.set(x, it.y, z); } }
  clear() { for (const id of [...this.items.keys()]) this.remove(id); }

  update(dt, px, pz) {
    this.time += dt;
    let best = null, bestD = Infinity, bestP = -Infinity;
    for (const it of this.items.values()) {
      if (it.object) { it.x = it.object.position.x; it.z = it.object.position.z; }
      if (it.marker) { it.marker.position.y = it.y + Math.sin(this.time * 2.5 + it.x) * 0.12; it.marker.material.opacity = 0.55 + Math.sin(this.time * 3) * 0.25; if (it.marker.position.x !== it.x) it.marker.position.set(it.x, it.marker.position.y, it.z); }
      if (!it.enabled || !this.enabled) continue;
      const d = Math.hypot(px - it.x, pz - it.z);
      if (d <= it.radius && (it.priority > bestP || (it.priority === bestP && d < bestD))) { best = it; bestD = d; bestP = it.priority; }
    }
    if (best !== this.current) { this.current = best; this.hud.setPrompt(best ? `<span class="kbd">E</span> ${best.prompt}` : ''); }
    else if (best) this.hud.setPrompt(`<span class="kbd">E</span> ${best.prompt}`);
    if (best && this.enabled && (this.input.pressed('KeyE') || this.input.touch.action)) { this.audio?.sfx('interact'); best.onInteract(best); }
    return best;
  }
}

/** Scripted non-player character that follows waypoints and animates. */
export class NPC {
  constructor({ mesh, name = '', x = 0, z = 0, yaw = 0, waypoints = [], speed = 1.2, loop = true, pauseAt = 0 }) {
    this.mesh = mesh; this.name = name; this.x = x; this.z = z; this.yaw = yaw; this.speed = speed; this.loop = loop; this.pauseAt = pauseAt;
    this.waypoints = waypoints; this.wpIndex = 0; this.waiting = 0; this.moving = false; this.frozen = false; this.time = Math.random() * 5; this.done = false;
    this.collider = { type: 'circle', x, z, r: 0.38, tag: 'npc', npc: this };
    this.sync();
  }
  sync() { this.mesh.position.x = this.x; this.mesh.position.z = this.z; this.mesh.rotation.y = this.yaw; this.collider.x = this.x; this.collider.z = this.z; }
  setWaypoints(w, loop = this.loop) { this.waypoints = w; this.wpIndex = 0; this.loop = loop; this.done = false; }
  faceTowards(x, z) { this.yaw = Math.atan2(x - this.x, z - this.z); this.sync(); }
  teleport(x, z) { this.x = x; this.z = z; this.sync(); }
  update(dt) {
    this.time += dt; this.moving = false;
    if (!this.frozen && this.waypoints.length && !this.done) {
      if (this.waiting > 0) { this.waiting -= dt; }
      else {
        const wp = this.waypoints[this.wpIndex]; const dx = wp[0] - this.x, dz = wp[1] - this.z; const d = Math.hypot(dx, dz);
        if (d < 0.15) {
          this.wpIndex++; this.waiting = wp[2] ?? this.pauseAt;
          if (this.wpIndex >= this.waypoints.length) { if (this.loop) this.wpIndex = 0; else { this.done = true; this.wpIndex = this.waypoints.length - 1; } }
        } else {
          const step = Math.min(d, this.speed * dt); this.x += (dx / d) * step; this.z += (dz / d) * step; this.yaw = Math.atan2(dx, dz); this.moving = true;
        }
      }
    }
    this.sync(); this.mesh.userData.animate?.(this.time, this.moving, this.speed / 1.3);
  }
}

/** Cinematic camera path player (intro fly-throughs, endings). */
export class CinematicCamera {
  constructor() { this.shots = []; this.active = false; this.t = 0; this.onDone = null; this._a = new THREE.Vector3(); this._b = new THREE.Vector3(); }
  play(shots, onDone = null) { this.shots = shots.map((s) => ({ ...s, pos: new THREE.Vector3(...s.pos), look: new THREE.Vector3(...s.look), duration: s.duration ?? 3 })); this.active = this.shots.length > 1; this.t = 0; this.onDone = onDone; }
  stop() { this.active = false; }
  update(dt, camera) {
    if (!this.active) return false;
    this.t += dt;
    let acc = 0, i = 0;
    for (; i < this.shots.length - 1; i++) { if (this.t < acc + this.shots[i].duration) break; acc += this.shots[i].duration; }
    if (i >= this.shots.length - 1) { const last = this.shots[this.shots.length - 1]; camera.position.copy(last.pos); camera.lookAt(last.look); this.active = false; this.onDone?.(); return false; }
    const a = this.shots[i], b = this.shots[i + 1]; let k = (this.t - acc) / a.duration; k = k * k * (3 - 2 * k);
    camera.position.lerpVectors(a.pos, b.pos, k); this._a.lerpVectors(a.look, b.look, k); camera.lookAt(this._a);
    return true;
  }
}
