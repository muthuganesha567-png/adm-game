// Arcade vehicle controller: acceleration, braking, reversing, steering, collisions and chase cameras.
import * as THREE from 'three';
import { obbCorners, obbVsAabb, obbVsCircle, clamp, damp, angleLerp } from './collision.js';

export class VehicleController {
  constructor({ mesh, input, audio, settings, params = {} }) {
    this.mesh = mesh; this.input = input; this.audio = audio; this.settings = settings;
    this.p = {
      maxSpeed: 22, reverseMax: 5, accel: 6.5, brakeDecel: 9, eBrakeDecel: 12, drag: 0.012, rolling: 0.6,
      maxSteer: 0.55, steerSpeed: 3.5, wheelbase: 4.5, length: mesh.userData.length || 7, width: mesh.userData.width || 2.6,
      wheelRadius: 0.5, engineKind: 'truck', offRoad: null, ...params,
    };
    this.pos = new THREE.Vector3(); this.yaw = 0; this.speed = 0; this.steer = 0;
    this.throttle = 0; this.braking = false; this.eBrake = false; this.reversing = false; this.disabled = false;
    this.offRoad = false; this.wheelSpin = 0; this.lastHits = new Map();
    this.camPos = new THREE.Vector3(); this.camLook = new THREE.Vector3(); this.camInit = false;
    this.camModes = ['chase', 'far', 'hood', 'top'];
    this.camMode = this.camModes.includes(settings.get('cameraMode')) ? settings.get('cameraMode') : 'chase';
    this.inputEnabled = true;
    this._tmp = new THREE.Vector3();
  }

  reset(x, z, yaw = 0) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.speed = 0; this.steer = 0; this.throttle = 0; this.braking = false; this.eBrake = false;
    this.disabled = false; this.camInit = false; this.lastHits.clear(); this.syncMesh();
  }

  get forward() { return this._tmp.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  get kmh() { return Math.abs(this.speed) * 3.6; }
  get halfLength() { return this.p.length / 2; }
  get halfWidth() { return this.p.width / 2; }

  cycleCamera() { const i = this.camModes.indexOf(this.camMode); this.camMode = this.camModes[(i + 1) % this.camModes.length]; this.settings.set('cameraMode', this.camMode, { silent: true }); return this.camMode; }

  /** Returns { collisions: [{collider, impactSpeed, frontal}], offRoad, braking, eBrake } */
  update(dt, colliders, { autoBrake = false } = {}) {
    const p = this.p;
    let fwd = 0, turn = 0, eb = false;
    if (this.inputEnabled && !this.disabled) { const a = this.input.axis(); fwd = a.forward; turn = a.turn; eb = this.input.held('Space') || this.input.touch.brake; }
    if (autoBrake) { fwd = 0; eb = true; }

    // throttle / brake logic depends on the current motion state
    let throttle = 0, brake = 0;
    if (fwd > 0) { if (this.speed < -0.3) brake = 1; else throttle = fwd; }
    else if (fwd < 0) { if (this.speed > 0.3) brake = -fwd; else throttle = fwd; } // reverse
    this.throttle = Math.abs(throttle); this.braking = brake > 0 || eb; this.eBrake = eb; this.reversing = this.speed < -0.3;

    const sign = Math.sign(this.speed) || 1;
    let acc = throttle * (throttle < 0 ? p.accel * 0.6 : p.accel);
    acc -= p.drag * this.speed * Math.abs(this.speed);
    if (this.throttle === 0) acc -= sign * Math.min(Math.abs(this.speed) / Math.max(dt, 0.001), p.rolling);
    if (brake > 0) acc -= sign * Math.min(Math.abs(this.speed) / Math.max(dt, 0.001), p.brakeDecel * brake);
    if (eb) acc -= sign * Math.min(Math.abs(this.speed) / Math.max(dt, 0.001), p.eBrakeDecel);
    if (this.offRoad) acc -= sign * Math.min(Math.abs(this.speed) / Math.max(dt, 0.001), 2.5);
    this.speed = clamp(this.speed + acc * dt, -p.reverseMax, p.maxSpeed);
    if (Math.abs(this.speed) < 0.05 && this.throttle === 0) this.speed = 0;

    // steering (reduced lock at speed for stability)
    const maxSteer = p.maxSteer / (1 + Math.abs(this.speed) / 12);
    const steerTarget = clamp(turn, -1, 1) * maxSteer;
    this.steer = damp(this.steer, steerTarget, p.steerSpeed, dt);
    const grip = eb && Math.abs(this.speed) > 8 ? 0.55 : 1; // skidding under emergency brake
    const yawRate = (this.speed / p.wheelbase) * Math.tan(this.steer) * grip;
    this.yaw -= yawRate * dt; // camera looks down +z, so screen-right is -x

    // integrate
    this.pos.x += Math.sin(this.yaw) * this.speed * dt;
    this.pos.z += Math.cos(this.yaw) * this.speed * dt;

    // collisions
    const collisions = [];
    const corners = obbCorners(this.pos.x, this.pos.z, this.yaw, this.halfLength, this.halfWidth);
    for (const c of colliders) {
      if (c.disabled) continue;
      let mtv = null;
      if (c.type === 'aabb') mtv = obbVsAabb(corners, c);
      else if (c.type === 'circle') mtv = obbVsCircle(this.pos.x, this.pos.z, this.yaw, this.halfLength, this.halfWidth, c);
      if (!mtv) continue;
      const impactSpeed = Math.abs(this.speed);
      if (c.trigger) { collisions.push({ collider: c, impactSpeed, trigger: true }); continue; }
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
      const frontal = Math.abs(mtv.x * fx + mtv.z * fz) > 0.6;
      this.pos.x += mtv.x * mtv.depth; this.pos.z += mtv.z * mtv.depth;
      if (c.soft) { this.speed *= 0.85; } else if (frontal) { this.speed *= -0.2; } else { this.speed *= 0.5; }
      const now = performance.now();
      const last = this.lastHits.get(c) || 0;
      if (now - last > 600) { this.lastHits.set(c, now); collisions.push({ collider: c, impactSpeed, frontal }); }
      // refresh corners after displacement
      const cc = obbCorners(this.pos.x, this.pos.z, this.yaw, this.halfLength, this.halfWidth); for (let i = 0; i < 4; i++) corners[i] = cc[i];
    }

    this.offRoad = p.offRoad ? !!p.offRoad(this.pos.x, this.pos.z) : false;

    // visuals
    this.wheelSpin += (this.speed / p.wheelRadius) * dt;
    this.syncMesh();
    // audio
    if (this.audio) {
      this.audio.setEngine(Math.abs(this.speed) / p.maxSpeed, this.throttle);
      const hardBrake = (eb || brake > 0.5) && Math.abs(this.speed) > 4;
      this.audio.setBrake(hardBrake, eb ? 1 : 0.6);
    }
    return { collisions, offRoad: this.offRoad, braking: this.braking, eBrake: eb, throttle: this.throttle };
  }

  syncMesh() {
    this.mesh.position.copy(this.pos); this.mesh.rotation.set(0, this.yaw, 0);
    const u = this.mesh.userData;
    if (u.wheels) for (const w of u.wheels) { w.rotation.x = this.wheelSpin; }
    if (u.frontWheels) for (const w of u.frontWheels) { w.rotation.y = -this.steer; }
    // subtle body roll/pitch
    const body = this.mesh; body.rotation.z = this.steer * Math.min(1, Math.abs(this.speed) / 10) * 0.08; body.rotation.x = this.braking ? -0.015 : (this.throttle > 0 ? 0.01 : 0);
  }

  /** Update a camera for the active mode. */
  updateCamera(camera, dt) {
    const f = this.forward.clone(); const fx = f.x, fz = f.z;
    const L = this.p.length;
    let target, look;
    switch (this.camMode) {
      case 'far': target = new THREE.Vector3(this.pos.x - fx * (L + 9), 7.5, this.pos.z - fz * (L + 9)); look = new THREE.Vector3(this.pos.x + fx * 8, 1.5, this.pos.z + fz * 8); break;
      case 'hood': target = new THREE.Vector3(this.pos.x + fx * (L * 0.35), 2.6, this.pos.z + fz * (L * 0.35)); look = new THREE.Vector3(this.pos.x + fx * 40, 1.6, this.pos.z + fz * 40); break;
      case 'top': target = new THREE.Vector3(this.pos.x - fx * 6, 30, this.pos.z - fz * 6); look = new THREE.Vector3(this.pos.x + fx * 6, 0, this.pos.z + fz * 6); break;
      default: target = new THREE.Vector3(this.pos.x - fx * (L * 0.5 + 6), 4.2, this.pos.z - fz * (L * 0.5 + 6)); look = new THREE.Vector3(this.pos.x + fx * 10, 1.6, this.pos.z + fz * 10);
    }
    if (!this.camInit || this.camMode === 'hood') { this.camPos.copy(target); this.camLook.copy(look); this.camInit = true; }
    else { const k = this.camMode === 'top' ? 6 : 5; this.camPos.x = damp(this.camPos.x, target.x, k, dt); this.camPos.y = damp(this.camPos.y, target.y, k, dt); this.camPos.z = damp(this.camPos.z, target.z, k, dt); this.camLook.lerp(look, 1 - Math.exp(-8 * dt)); }
    camera.position.copy(this.camPos);
    if (this.camMode === 'top') { camera.up.set(fx, 0, fz); camera.lookAt(this.camLook); camera.up.set(0, 1, 0); }
    else camera.lookAt(this.camLook);
  }

  /** Position/yaw snapshot (for restart & debugging). */
  snapshot() { return { x: this.pos.x, z: this.pos.z, yaw: this.yaw, speed: this.speed }; }
}

/** Simple scripted AI vehicle that follows a straight lane. */
export class LaneCar {
  constructor(mesh, { x, z, dirX = 0, dirZ = 1, speed = 8, length = 4.3, width = 1.95, loopFrom = null, loopTo = null }) {
    this.mesh = mesh; this.x = x; this.z = z; this.dirX = dirX; this.dirZ = dirZ; this.speed = speed; this.baseSpeed = speed; this.length = length; this.width = width;
    this.loopFrom = loopFrom; this.loopTo = loopTo; this.yaw = Math.atan2(dirX, dirZ); this.stopped = false; this.wheelSpin = 0; this.yielding = false;
    this.collider = { type: 'aabb', minX: 0, minZ: 0, maxX: 0, maxZ: 0, tag: 'car', object: mesh, car: this };
    this.sync();
  }
  sync() {
    this.mesh.position.set(this.x, 0, this.z); this.mesh.rotation.y = this.yaw;
    const hx = Math.abs(this.dirX) > 0.5 ? this.length / 2 : this.width / 2; const hz = Math.abs(this.dirZ) > 0.5 ? this.length / 2 : this.width / 2;
    this.collider.minX = this.x - hx; this.collider.maxX = this.x + hx; this.collider.minZ = this.z - hz; this.collider.maxZ = this.z + hz;
    if (this.mesh.userData.wheels) for (const w of this.mesh.userData.wheels) w.rotation.x = this.wheelSpin;
  }
  /** obstacles: [{x, z, r, car?}] — the car brakes instead of driving into anything directly ahead in its lane. */
  update(dt, obstacles = null) {
    let blocked = false;
    if (obstacles) {
      for (const o of obstacles) {
        if (o.car === this) continue;
        const rx = o.x - this.x, rz = o.z - this.z; const along = rx * this.dirX + rz * this.dirZ; const cross = Math.abs(rx * this.dirZ - rz * this.dirX);
        const r = o.r ?? 1.5;
        if (along > 0 && along < this.length / 2 + r + 5.5 && cross < this.width / 2 + r - 0.35) { blocked = true; break; }
      }
    }
    this.blocked = blocked;
    const target = this.stopped || this.yielding || blocked ? 0 : this.baseSpeed;
    this.speed = damp(this.speed, target, blocked ? 9 : 3, dt);
    this.x += this.dirX * this.speed * dt; this.z += this.dirZ * this.speed * dt; this.wheelSpin += this.speed * dt / 0.4;
    if (this.loopFrom !== null && this.loopTo !== null) {
      const axis = Math.abs(this.dirX) > 0.5 ? 'x' : 'z'; const dir = axis === 'x' ? this.dirX : this.dirZ;
      if (dir > 0 && this[axis] > this.loopTo) this[axis] = this.loopFrom; if (dir < 0 && this[axis] < this.loopFrom) this[axis] = this.loopTo;
    }
    this.sync();
  }
  angleLerpTo(yaw, t) { this.yaw = angleLerp(this.yaw, yaw, t); }
}
