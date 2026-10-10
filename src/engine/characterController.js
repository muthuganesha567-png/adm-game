// Third-person character controller: WASD movement relative to camera, mouse-look (drag or pointer lock),
// circle collisions, footsteps, walk animation and a soft follow camera with wall occlusion.
import * as THREE from 'three';
import { resolveCircle, damp, angleLerp, clamp } from './collision.js';

export class CharacterController {
  constructor({ mesh, input, audio, settings, params = {} }) {
    this.mesh = mesh; this.input = input; this.audio = audio; this.settings = settings;
    this.p = { speed: 4.2, sprint: 6.5, radius: 0.4, camDist: 5.5, camHeight: 2.2, minDist: 2.5, maxDist: 10, bounds: null, occluders: [], footstepVol: 1, ...params };
    this.pos = new THREE.Vector3(); this.yaw = 0; this.camYaw = 0; this.camPitch = 0.28; this.camDist = this.p.camDist;
    this.moving = false; this.sprinting = false; this.inputEnabled = true; this.velocity = new THREE.Vector3();
    this.stepTimer = 0; this.time = 0; this.camPos = new THREE.Vector3(); this.camInit = false;
    this._ray = new THREE.Raycaster(); this._tmp = new THREE.Vector3(); this.lastHits = [];
    this._lockHandler = () => { if (this.settings.get('mouseLook') === 'lock' && this.inputEnabled && this.active) this.input.requestPointerLock(); };
    this.active = false;
    input.addEventListener('canvasclick', this._lockHandler);
  }

  activate() { this.active = true; }
  deactivate() { this.active = false; this.input.exitPointerLock(); }
  dispose() { this.deactivate(); this.input.removeEventListener('canvasclick', this._lockHandler); }

  reset(x, z, yaw = 0, camYaw = null) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.camYaw = camYaw ?? yaw; this.camPitch = 0.28; this.camDist = this.p.camDist; this.camInit = false; this.moving = false; this.syncMesh();
  }

  get forward() { return this._tmp.set(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)); }

  update(dt, colliders) {
    this.time += dt;
    // mouse look
    const md = this.input.consumeMouseDelta();
    const sens = 0.0032 * (this.settings.get('mouseSensitivity') || 1);
    const lookAllowed = this.inputEnabled && (this.input.pointerLocked || this.input.mouse.dragging);
    if (lookAllowed && (md.dx || md.dy)) {
      this.camYaw -= md.dx * sens;
      this.camPitch = clamp(this.camPitch + md.dy * sens * (this.settings.get('invertY') ? -1 : 1), -0.2, 1.1);
    }
    if (md.wheel && this.inputEnabled) this.camDist = clamp(this.camDist + md.wheel * 0.6, this.p.minDist, this.p.maxDist);

    // movement
    let fwd = 0, turn = 0, sprint = false;
    if (this.inputEnabled) { const a = this.input.axis(); fwd = a.forward; turn = a.turn; sprint = this.input.held('ShiftLeft', 'ShiftRight'); }
    const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw); const rx = -fz, rz = fx; // screen-right is -x when facing +z
    let mx = fx * fwd + rx * turn, mz = fz * fwd + rz * turn;
    const len = Math.hypot(mx, mz);
    this.moving = len > 0.01; this.sprinting = sprint && this.moving;
    const speed = this.sprinting ? this.p.sprint : this.p.speed;
    if (this.moving) {
      mx /= len; mz /= len;
      const targetYaw = Math.atan2(mx, mz);
      this.yaw = angleLerp(this.yaw, targetYaw, 1 - Math.exp(-12 * dt));
      this.pos.x += mx * speed * dt; this.pos.z += mz * speed * dt;
      // soft camera follow when walking forward without mouse input
      if (fwd > 0 && !lookAllowed) this.camYaw = angleLerp(this.camYaw, this.yaw, 1 - Math.exp(-0.9 * dt));
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) { this.stepTimer = this.sprinting ? 0.3 : 0.45; this.audio?.sfx('footstep', { vol: this.p.footstepVol }); }
    } else this.stepTimer = 0.1;

    // collisions & bounds
    const r = resolveCircle(this.pos.x, this.pos.z, this.p.radius, colliders);
    this.pos.x = r.x; this.pos.z = r.z; this.lastHits = r.hits;
    if (this.p.bounds) { const b = this.p.bounds; this.pos.x = clamp(this.pos.x, b.minX, b.maxX); this.pos.z = clamp(this.pos.z, b.minZ, b.maxZ); }
    this.syncMesh();
    return { hits: r.hits, moving: this.moving };
  }

  syncMesh() {
    this.mesh.position.x = this.pos.x; this.mesh.position.z = this.pos.z; this.mesh.rotation.y = this.yaw;
    this.mesh.userData.animate?.(this.time, this.moving, this.sprinting ? 1.4 : 1);
  }

  updateCamera(camera, dt) {
    const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
    const head = new THREE.Vector3(this.pos.x, 1.6, this.pos.z);
    let dist = this.camDist;
    const dir = new THREE.Vector3(-Math.sin(this.camYaw) * cp, sp, -Math.cos(this.camYaw) * cp).normalize();
    if (this.p.occluders && this.p.occluders.length) {
      this._ray.set(head, dir); this._ray.far = dist;
      const hits = this._ray.intersectObjects(this.p.occluders, true);
      if (hits.length) dist = Math.max(this.p.minDist * 0.5, hits[0].distance - 0.35);
    }
    const target = head.clone().addScaledVector(dir, dist);
    target.y = Math.max(0.6, target.y);
    if (!this.camInit) { this.camPos.copy(target); this.camInit = true; }
    else { this.camPos.x = damp(this.camPos.x, target.x, 10, dt); this.camPos.y = damp(this.camPos.y, target.y, 10, dt); this.camPos.z = damp(this.camPos.z, target.z, 10, dt); }
    camera.position.copy(this.camPos);
    camera.lookAt(this.pos.x, 1.4, this.pos.z);
  }

  distanceTo(x, z) { return Math.hypot(this.pos.x - x, this.pos.z - z); }
}
