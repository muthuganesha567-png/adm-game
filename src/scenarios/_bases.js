// Shared bases for vehicle and character scenarios (HUD wiring, cameras, engine audio, interaction).
import * as THREE from 'three';
import { ScenarioBase } from '../scenarioBase.js';
import { VehicleController } from '../engine/vehicleController.js';
import { CharacterController } from '../engine/characterController.js';
import { InteractionSystem } from '../engine/interactionSystem.js';
import { makeHuman, makeLabel } from '../engine/worldKit.js';

export class VehicleScenarioBase extends ScenarioBase {
  setupVehicle(mesh, params = {}) {
    this.scene.add(mesh);
    this.vehicle = new VehicleController({ mesh, input: this.ctx.input, audio: this.ctx.audio, settings: this.ctx.settings, params });
    this.engineKind = params.engineKind || 'truck';
    return this.vehicle;
  }
  get player() { return this.vehicle; }
  start() {
    super.start();
    this.ctx.audio.startEngine(this.engineKind);
    this.ctx.hud.showSpeed(true);
  }
  /** Common per-frame handling: camera key, horn hook, HUD speed. Returns the vehicle update result. */
  stepVehicle(dt, { autoBrake = false } = {}) {
    const input = this.ctx.input;
    if (input.pressed('KeyC')) { const m = this.vehicle.cycleCamera(); this.notify(`Camera: ${{ chase: 'Chase', far: 'Far chase', hood: 'Bonnet', top: 'Top-down' }[m]}`, 'info'); }
    if (input.pressed('KeyH') && this.vehicle.inputEnabled) this.onHorn?.();
    const res = this.vehicle.update(dt, this.colliders, { autoBrake });
    this.vehicle.updateCamera(this.camera, dt);
    const v = this.vehicle; this.ctx.hud.setSpeed(v.kmh, v.disabled ? 'OFF' : v.reversing ? 'R' : v.braking ? 'B' : v.throttle > 0 ? 'D' : 'N');
    if (res.collisions.length) {
      for (const c of res.collisions) if (!c.trigger) { this.ctx.engine.addShake(Math.min(1, c.impactSpeed / 15)); this.ctx.audio.sfx(c.impactSpeed > 6 ? 'crash' : 'bump', { intensity: Math.min(1, c.impactSpeed / 18) }); this.ctx.hud.flash(c.impactSpeed > 8, Math.min(0.6, c.impactSpeed / 25)); }
    }
    return res;
  }
  updateIdle(dt) { this.idleTime = (this.idleTime || 0) + dt; for (const fn of this.updatables) fn(dt, this.idleTime); this.vehicle?.updateCamera(this.camera, dt); }
}

export class CharacterScenarioBase extends ScenarioBase {
  setupPlayer({ shirt = 0x2f5aa8, pants = 0x2b2b3a, skin = 0xc68642, x = 0, z = 0, yaw = 0, bounds = null, occluders = [], camDist = 5.5 } = {}) {
    const mesh = makeHuman({ shirt, pants, skin }); this.scene.add(mesh);
    this.player = new CharacterController({ mesh, input: this.ctx.input, audio: this.ctx.audio, settings: this.ctx.settings, params: { bounds, occluders, camDist } });
    this.player.reset(x, z, yaw);
    this.interact = new InteractionSystem({ input: this.ctx.input, hud: this.ctx.hud, audio: this.ctx.audio, scene: this.scene });
    this.npcs = this.npcs || []; this.locked = false;
    return this.player;
  }
  start() { super.start(); this.player.activate(); }
  /** Common per-frame handling for character scenarios. */
  stepPlayer(dt) {
    const busy = this.ctx.dialogue.open || this.locked || this.finished;
    this.player.inputEnabled = !busy; this.interact.enabled = !busy;
    this.player.update(dt, this.colliders);
    for (const n of this.npcs) n.update(dt);
    this.interact.update(dt, this.player.pos.x, this.player.pos.z);
    this.player.updateCamera(this.camera, dt);
  }
  addNPC(npc, label = null) { (this.npcs ||= []).push(npc); this.scene.add(npc.mesh); this.addCollider(npc.collider); if (label) this.setLabel(npc.mesh, label); return npc; }
  setLabel(mesh, text) { if (mesh.userData.label) { mesh.remove(mesh.userData.label); mesh.userData.label.material.map.dispose(); mesh.userData.label.material.dispose(); } const l = makeLabel(text, { scale: 0.8 }); l.position.y = 2.35; mesh.add(l); mesh.userData.label = l; }
  /** Guarded async dialogue runner: prevents re-entrancy while a conversation is in progress. */
  async converse(fn) { if (this.busy) return; this.busy = true; try { await fn(); } finally { this.busy = false; } }
  say(speaker, text, options = null) { return this.ctx.dialogue.say({ speaker, text, options }); }
  updateIdle(dt) { this.idleTime = (this.idleTime || 0) + dt; for (const fn of this.updatables) fn(dt, this.idleTime); for (const n of this.npcs || []) n.update(dt); if (this.player) { this.player.syncMesh(); this.player.updateCamera(this.camera, dt); } }
  dispose() { this.player?.dispose(); this.interact?.clear(); super.dispose(); }
}

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
