// GAME 2 — THE EMERGENCY RUN: ambulance through city traffic.
import * as THREE from 'three';
import { VehicleScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import { LaneCar } from '../engine/vehicleController.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle, colliderFromObject, obbDistanceToPoint } from '../engine/collision.js';

const CROSS = [100, 200, 300];
const HOSPITAL_Z = 372;
const LANE_L = 2.6;   // player's lane (left side of the road = +x)

export class EmergencyRun extends VehicleScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0xcfd8e3, 90, 380);
    K.makeSky(s, { top: 0x4a7fc1, bottom: 0xe8edf2, horizon: 0xc9d6e2 });
    this.sun = K.makeSun(s, { position: [-50, 90, 30], intensity: 1.9, shadowArea: 60 }); K.makeHemi(s, 0xcfd8ff, 0x55524a, 0.75);
    s.add(K.makeGround(1200, 0x6d6a62));
    const avenue = K.makeRoad(460, 10); avenue.position.z = 200; s.add(avenue);
    for (const sx of [-1, 1]) s.add(K.makeSidewalk(460, 3, sx * 6.5, 200));
    for (const z of CROSS) { s.add(K.makeRoadBetween(-130, z, 130, z, 10)); s.add(K.makeIntersection(0, z, 10.2)); for (const sx of [-1, 1]) { s.add(K.makeSidewalk(3, 240, sx * 68, z - 6.5)); s.add(K.makeSidewalk(3, 240, sx * 68, z + 6.5)); } }
    // zebra crossings
    for (const z of [150, 250]) s.add(K.makeZebra(0, z, 10, 'x'));
    // city blocks
    const palette = [0xd9cfc1, 0xb9b1a6, 0xcfd6dc, 0xe3d8c2, 0xa9b4bf, 0xd5c7b0];
    let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let z = -10; z < 420; z += 22) {
      if (CROSS.some((c) => Math.abs(c - z) < 14)) continue;
      for (const sx of [-1, 1]) {
        const w = 12 + rnd() * 8, h = 7 + rnd() * 18, d = 14 + rnd() * 6; const x = sx * (16 + w / 2 + rnd() * 4);
        if (sx > 0 && z > 350) continue; // hospital block
        const b = K.makeBuilding(w, h, d, palette[Math.floor(rnd() * palette.length)], { lit: rnd() < 0.3 }); b.position.set(x, 0, z + 6); s.add(b); this.addCollider(colliderFromObject(b, 'building'));
        if (rnd() < 0.5) { const t = K.makeTree(1, 0.9); t.position.set(sx * 9.5, 0, z + rnd() * 10); s.add(t); this.addCollider(circle(t.position.x, t.position.z, 0.45, 'tree')); }
        if (rnd() < 0.6) { const l = K.makeLamp(5); l.position.set(sx * 7.2, 0, z + 2); s.add(l); this.addCollider(circle(l.position.x, l.position.z, 0.2, 'lamp')); }
      }
    }
    // hospital
    const hosp = K.makeBuilding(30, 16, 24, 0xf2f2ee, { floors: 4 }); hosp.position.set(31, 0, HOSPITAL_Z); s.add(hosp); this.addCollider(colliderFromObject(hosp, 'building'));
    const cross = new THREE.Group(); const cv = K.box(1.2, 5, 0.3, K.mat(0xd32f2f, { emissive: 0x880000, emissiveIntensity: 0.5 })); const ch = K.box(5, 1.2, 0.3, K.mat(0xd32f2f, { emissive: 0x880000, emissiveIntensity: 0.5 })); cross.add(cv, ch); cross.position.set(16.2, 11, HOSPITAL_Z); cross.rotation.y = -Math.PI / 2; s.add(cross);
    const hs = K.makeTextBoard('CITY HOSPITAL — EMERGENCY', { w: 14, h: 1.4, bg: '#13224a', fg: '#ffffff', fontSize: 80 }); hs.position.set(15.9, 6, HOSPITAL_Z); hs.rotation.y = -Math.PI / 2; s.add(hs);
    const bay = K.makeMarker(0xff5a5a, 4); bay.position.set(LANE_L + 1.5, 0, HOSPITAL_Z); s.add(bay); this.onUpdate((dt, t) => bay.userData.update(t));
    const baySign = K.makeSign('EMERGENCY BAY', { color: '#ffffff', fg: '#b00020', lines: ['EMERGENCY', 'BAY — STOP'], w: 2.4, h: 1.0, fontSize: 70 }); baySign.position.set(7.5, 0, HOSPITAL_Z - 6); baySign.rotation.y = Math.PI; s.add(baySign);
    // traffic lights (visual) at each intersection
    this.lights = CROSS.map((z) => { const g = new THREE.Group(); const pole = K.cyl(0.08, 0.08, 5, 0x333333, 6); pole.position.set(7, 2.5, z - 7); g.add(pole); const head = K.box(0.5, 1.2, 0.4, 0x222222); head.position.set(7, 5, z - 7); g.add(head); const red = K.sphere(0.16, K.mat(0xff2a2a, { emissive: 0xff0000, emissiveIntensity: 1, noCache: true }), 8); red.position.set(7, 5.35, z - 6.8); g.add(red); const green = K.sphere(0.16, K.mat(0x2aff5a, { emissive: 0x00ff40, emissiveIntensity: 1, noCache: true }), 8); green.position.set(7, 4.65, z - 6.8); g.add(green); s.add(g); return { z, red, green }; });
    // bounds
    this.addCollider(aabb(-200, -80, -140, 500, 'bounds')); this.addCollider(aabb(140, -80, 200, 500, 'bounds')); this.addCollider(aabb(-200, 420, 200, 440, 'bounds')); this.addCollider(aabb(-200, -80, 200, -40, 'bounds'));
    // vehicles
    this.cars = [];
    const addCar = (color, opts) => { const m = K.makeCar(color); s.add(m); const c = new LaneCar(m, opts); this.cars.push(c); this.addCollider(c.collider); return c; };
    const dens = this.diff(0.7, 1, 1.3);
    for (const z of CROSS) {
      for (let i = 0; i < Math.round(2 * dens); i++) { addCar(0x5a7fd8, { x: -110 + i * 70 + (z % 50), z: z - 2.6, dirX: 1, dirZ: 0, speed: 8.5, loopFrom: -120, loopTo: 120 }).cross = z; addCar(0xd8a05a, { x: 110 - i * 75 - (z % 40), z: z + 2.6, dirX: -1, dirZ: 0, speed: 8.5, loopFrom: -120, loopTo: 120 }).cross = z; }
    }
    this.slowCars = [];
    for (const z of [55, 165, 262]) { const c = addCar(0xcccccc, { x: LANE_L, z, dirX: 0, dirZ: 1, speed: 6.5, loopFrom: -30, loopTo: 420 }); c.slow = true; this.slowCars.push(c); }
    this.oncoming = [];
    for (let i = 0; i < 3; i++) { const c = addCar([0x8a2f2f, 0x2f8a4a, 0x3a3a3a][i], { x: -LANE_L, z: 120 + i * 130, dirX: 0, dirZ: -1, speed: 10, loopFrom: -30, loopTo: 420 }); this.oncoming.push(c); }
    // pedestrians at the zebra crossings
    this.peds = [150, 250].map((z, i) => { const m = K.makeHuman({ shirt: i ? 0xd84a7a : 0x3aa06a }); s.add(m); const n = new NPC({ mesh: m, x: 7.3, z, yaw: -Math.PI / 2, speed: 1.4 }); n.state = 'waiting'; n.collider = circle(7.3, z, 0.45, 'pedestrian'); n.collider.disabled = true; this.addCollider(n.collider); n.faceTowards(0, z); return n; });
    // ambient walkers on the sidewalks
    this.walkers = []; for (let i = 0; i < 8; i++) { const m = K.makeHuman({}); s.add(m); const sx = i % 2 ? 7.5 : -7.5; const z0 = 20 + i * 45; this.walkers.push(new NPC({ mesh: m, x: sx, z: z0, waypoints: [[sx, z0], [sx, z0 + 30, 1]], speed: 1.1 })); }
    // ambulance
    const amb = K.makeAmbulance(); this.setupVehicle(amb, { maxSpeed: 26, accel: 7.5, brakeDecel: 10, eBrakeDecel: 13, engineKind: 'ambulance', offRoad: (x) => Math.abs(x) > 5.4 });
    this.vehicle.reset(LANE_L, 0, 0);
    this.sun.target.position.set(0, 0, 200);
    this.siren = false; this.sirenTime = 0; this.driveTime = 0; this.lightTimer = 0; this.passed = new Set(); this.sidewalkTime = 0; this.oncomingIncidents = 0; this.oncomingCooldown = 0; this.maxSpeed = 0; this.collisions = 0;
    this.timeLimit = this.diff(100, 80, 65); this.grace = 30;
    this.camera.position.set(8, 5, -16); this.camera.lookAt(0, 2, 30);
  }

  getIntro() { return { ...super.getIntro(), tips: [...this.meta.tips, `You have ${this.timeLimit} seconds before the patient’s condition becomes critical.`] }; }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('Get the patient to <b>City Hospital</b> (straight ahead, left side). Stop in the emergency bay.');
    this.hud().showTimer(true); this.hud().centerMessage('The Emergency Run', 2200);
    this.notify('Press H to switch the siren on. Traffic that hears it will try to yield.', 'info');
  }

  onHorn() { this.toggleSiren(); }
  toggleSiren() {
    this.siren = !this.siren; this.record(this.siren ? 'siren_on' : 'siren_off', { z: Math.round(this.vehicle.pos.z) });
    if (this.siren) this.ctx.audio.startLoop('siren', { vol: 0.16 }); else this.ctx.audio.stopLoop('siren');
    this.notify(this.siren ? 'Siren ON' : 'Siren OFF', 'info');
  }
  avenueGreen() { return (this.lightTimer % 14) < 7; }

  update(dt) {
    this.tick(dt); this.lightTimer += dt;
    const v = this.vehicle; const hud = this.hud();
    const res = this.stepVehicle(dt);
    this.driveTime += dt; if (this.siren) this.sirenTime += dt;
    this.maxSpeed = Math.max(this.maxSpeed, v.speed);
    const remaining = this.timeLimit - this.time;
    hud.setTimer(remaining > 0 ? remaining : this.timeLimit + this.grace - this.time, 15, remaining > 0 ? 'Patient' : 'CRITICAL');
    hud.setProgress(0, { text: `Distance to hospital: ${Math.max(0, Math.round(HOSPITAL_Z - v.pos.z))} m`, value: v.pos.z / HOSPITAL_Z, kind: 'blue' });
    hud.setProgress(1, { text: `Siren: <b>${this.siren ? 'ON' : 'OFF'}</b> (H)`, value: this.siren ? 1 : 0, kind: this.siren ? 'danger' : '' });
    if (remaining <= 0 && !this.flags.critical) { this.flags.critical = true; this.record('patient_critical'); this.notify('The patient’s condition is now critical!', 'bad'); }
    // flashing lights
    const flash = Math.floor(this.time * 6) % 2 === 0; const [lr, lb] = v.mesh.userData.lights; lr.material.emissiveIntensity = flash ? 1.6 : 0.2; lb.material.emissiveIntensity = flash ? 0.2 : 1.6;
    // traffic lights
    const green = this.avenueGreen(); for (const l of this.lights) { l.green.material.emissiveIntensity = green ? 1.2 : 0.05; l.red.material.emissiveIntensity = green ? 0.05 : 1.2; }
    // cross traffic behaviour: red light stop, siren yield, never drive into the ambulance or a queue
    const fwd = v.forward; const obstacles = [{ x: v.pos.x, z: v.pos.z, r: 1.5 }, { x: v.pos.x + fwd.x * 2.6, z: v.pos.z + fwd.z * 2.6, r: 1.4 }, { x: v.pos.x - fwd.x * 2.6, z: v.pos.z - fwd.z * 2.6, r: 1.4 }];
    for (const c of this.cars) obstacles.push({ x: c.x, z: c.z, r: 1.1, car: c });
    for (const p of this.peds) if (p.state === 'crossing') obstacles.push({ x: p.x, z: p.z, r: 1.3 });
    for (const c of this.cars) {
      if (c.cross !== undefined) {
        const toCenter = (0 - c.x) * c.dirX; // distance until intersection center along travel
        const approaching = toCenter > 5 && toCenter < 16;
        const crossRed = green; // cross street is red when the avenue is green
        const dist = Math.hypot(c.x - v.pos.x, c.z - v.pos.z);
        const hears = this.siren && dist < 40 && toCenter > -2;
        c.yielding = hears && toCenter > 4; c.stopped = approaching && crossRed;
      } else if (c.slow) {
        const behind = v.pos.z < c.z && c.z - v.pos.z < 32 && Math.abs(v.pos.x - c.x) < 4;
        const yieldNow = this.siren && behind; c.yielding = false; c.baseSpeed = yieldNow ? 3.5 : 6.5;
        const targetX = yieldNow ? 4.6 : LANE_L; c.x += (targetX - c.x) * Math.min(1, dt * 1.5);
        if (yieldNow && !c.noted) { c.noted = true; this.record('traffic_yielded', { z: Math.round(c.z) }); }
      }
      c.update(dt, obstacles);
    }
    for (const w of this.walkers) w.update(dt);
    // pedestrians at crossings
    for (const p of this.peds) {
      const dz = p.z - v.pos.z;
      if (p.state === 'waiting' && dz > 0 && dz < 48) {
        if (this.siren && dz < 42) { p.state = 'yielded'; this.record('pedestrian_yielded', { z: p.z }); this.notify('A pedestrian waits at the crossing because of your siren.', 'good'); this.after(6, () => { if (p.state === 'yielded') { p.state = 'crossing'; p.setWaypoints([[-7.3, p.z]], false); } }); }
        else { p.state = 'crossing'; p.setWaypoints([[-7.3, p.z]], false); hud.setWarning('Pedestrian crossing ahead!'); this.ctx.audio.sfx('warning'); this.after(3, () => hud.setWarning('')); this.record('pedestrian_crossing', { z: p.z, speed: Math.round(v.speed * 3.6) }); }
      }
      if (p.state === 'crossing') {
        p.update(dt); p.collider.x = p.x; p.collider.z = p.z; p.collider.disabled = !(Math.abs(p.x) < 6.2);
        const d = obbDistanceToPoint(v.pos.x, v.pos.z, v.yaw, v.halfLength, v.halfWidth, p.x, p.z);
        if (Math.abs(p.x) < 5.2 && d < 1.3 && v.speed > 4 && !p.nearMissed) { p.nearMissed = true; this.record('near_miss_pedestrian', { distance: Math.round(d * 10) / 10, speed: Math.round(v.speed * 3.6) }); this.notify('You nearly hit a pedestrian!', 'bad'); }
        if (p.done) { p.state = 'crossed'; p.collider.disabled = true; }
      }
    }
    // intersections
    for (const z of CROSS) {
      if (!this.passed.has(z) && v.pos.z >= z - 5) {
        this.passed.add(z);
        const near = this.cars.some((c) => c.cross === z && Math.abs(c.x) < 28 && ((c.dirX > 0 && c.x < 0) || (c.dirX < 0 && c.x > 0)) && !c.yielding && c.speed > 2);
        const e = this.record('intersection_pass', { z, speed: Math.round(v.speed * 3.6), light: green ? 'green' : 'red', crossTraffic: near, siren: this.siren });
        if (!green && v.speed > 12 && near) this.notify('You ran a red light at speed with cross traffic close by.', 'bad');
        else if (!green && v.speed <= 9) this.notify('You eased through the red light with caution.', 'good');
        void e;
      }
      if (!green && v.pos.z > z - 45 && v.pos.z < z - 8 && v.speed > 10 && !this.flags['warn' + z]) { this.flags['warn' + z] = true; hud.setWarning('Red light ahead — cross traffic!'); this.after(2.5, () => hud.setWarning('')); }
    }
    // sidewalk & oncoming lane
    if (Math.abs(v.pos.x) > 5.4 && v.pos.z < HOSPITAL_Z - 10) { this.sidewalkTime += dt; if (this.sidewalkTime > 1.5 && !this.flags.sidewalk) { this.flags.sidewalk = true; this.record('sidewalk_driving'); this.notify('You are driving on the pavement among pedestrians!', 'bad'); } }
    if (this.oncomingCooldown > 0) this.oncomingCooldown -= dt;
    if (v.pos.x < -0.5 && this.oncomingCooldown <= 0) { const oc = this.oncoming.find((c) => c.z > v.pos.z && c.z - v.pos.z < 28); if (oc) { this.oncomingCooldown = 4; this.oncomingIncidents++; this.record('oncoming_lane_risk', { gap: Math.round(oc.z - v.pos.z), speed: Math.round(v.speed * 3.6) }); hud.setWarning('Oncoming traffic!'); this.after(1.5, () => hud.setWarning('')); } }
    // collisions
    for (const c of res.collisions) {
      const tag = c.collider.tag; if (tag === 'bounds') continue;
      if (tag === 'pedestrian') { this.record('collision', { with: 'pedestrian', speed: Math.round(c.impactSpeed * 3.6) }); this.endWith('hit_pedestrian'); return; }
      this.collisions++; this.record('collision', { with: tag, speed: Math.round(c.impactSpeed * 3.6), z: Math.round(v.pos.z) });
      if (c.impactSpeed > 13 && (tag === 'car' || tag === 'building')) { v.disabled = true; this.notify('The ambulance is disabled by the crash.', 'bad'); this.endWith('crash'); return; }
      if (tag === 'car') this.notify('Collision with another vehicle.', 'bad');
    }
    // arrival
    const dBay = Math.hypot(v.pos.x - (LANE_L + 1.5), v.pos.z - HOSPITAL_Z);
    if (dBay < 6 && Math.abs(v.speed) < 3) { this.record('arrived', { time: Math.round(this.time), late: this.time > this.timeLimit }); this.endWith(this.time > this.timeLimit ? 'arrived_late' : (this.isReckless() ? 'arrived_reckless' : 'arrived_safe_timely')); return; }
    if (v.pos.z > HOSPITAL_Z + 8 && !this.flags.overshoot) { this.flags.overshoot = true; this.notify('You passed the emergency bay—reverse and stop in it.', 'bad'); }
    if (dBay < 20 && v.speed > 6 && !this.flags.bayPrompt) { this.flags.bayPrompt = true; hud.setPrompt('<span class="kbd">Space</span> Stop in the emergency bay'); this.after(2, () => hud.setPrompt('')); }
    if (this.time > this.timeLimit + this.grace) { this.endWith('failed'); }
  }

  isReckless() {
    const fastRed = this.events.filter((e) => e.type === 'intersection_pass' && e.light === 'red' && e.speed > 43 && e.crossTraffic).length;
    return this.collisions > 0 || this.has('near_miss_pedestrian') || fastRed >= 2 || this.has('sidewalk_driving');
  }

  endWith(outcome) {
    if (this.finished) return; this.vehicle.inputEnabled = false; this.ctx.audio.stopLoop('siren');
    this.record('summary', { sirenFraction: Math.round((this.sirenTime / Math.max(1, this.driveTime)) * 100), maxSpeedKmh: Math.round(this.maxSpeed * 3.6), collisions: this.collisions, sidewalkSec: Math.round(this.sidewalkTime), oncomingIncidents: this.oncomingIncidents });
    if (outcome === 'arrived_safe_timely') this.ctx.audio.sfx('success'); else if (outcome === 'hit_pedestrian' || outcome === 'crash' || outcome === 'failed') { this.ctx.audio.sfx('fail'); if (outcome === 'hit_pedestrian') this.hud().flash(true, 0.7); }
    this.finish(outcome);
  }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const sum = this.last('summary') || {}; const arr = this.first('arrived');
    const passes = this.events.filter((e) => e.type === 'intersection_pass'); const fastRed = passes.filter((e) => e.light === 'red' && e.speed > 43 && e.crossTraffic); const careful = passes.filter((e) => e.light === 'red' && e.speed <= 32);
    if (arr) actions.push(`Reached the emergency bay after ${arr.time}s (limit ${this.timeLimit}s).`);
    if (outcome === 'arrived_safe_timely' || outcome === 'arrived_reckless') { sh.adjustMany({ responsibility: 15, compassion: 15 }, 'Delivered the patient within the time window'); pos.push('The patient reached the hospital in time.'); cons.push('The patient received treatment in time.'); }
    else if (outcome === 'arrived_late') { sh.adjustMany({ responsibility: -5, compassion: -5 }, 'Arrived after the patient became critical'); neg.push('Arrived after the patient’s condition became critical.'); cons.push('The patient arrived alive but in a far worse condition because of the delay.'); }
    else if (outcome === 'failed') { sh.adjustMany({ responsibility: -20, compassion: -15 }, 'Never reached the hospital in time'); neg.push('The ambulance did not reach the hospital.'); cons.push('The patient did not receive hospital care in time.'); }
    else if (outcome === 'crash') { sh.adjustMany({ responsibility: -20, safetyAwareness: -20, consequenceAwareness: -15 }, 'Crashed the ambulance'); neg.push('A high-speed crash disabled the ambulance.'); cons.push('The ambulance never arrived; the patient, the crew and other road users were all put at risk.'); }
    else if (outcome === 'hit_pedestrian') { sh.adjustMany({ compassion: -35, safetyAwareness: -30, responsibility: -25, consequenceAwareness: -20 }, 'Struck a pedestrian'); neg.push('The ambulance struck a pedestrian.'); cons.push('One emergency became two.'); }
    const sf = sum.sirenFraction || 0; actions.push(`Siren on for ${sf}% of the drive.`);
    if (sf >= 60) { sh.adjustMany({ practicalWisdom: 12, responsibility: 5 }, `Used the siren for ${sf}% of the drive so others could yield`); pos.push('Used the siren so traffic and pedestrians could make way.'); }
    else if (sf >= 25) sh.adjust('practicalWisdom', 3, `Siren used part of the time (${sf}%)`);
    else { sh.adjust('practicalWisdom', -10, `Siren barely used (${sf}%)—others could not anticipate you`); neg.push('Drove largely without the siren, giving others no warning.'); }
    const yielded = this.count('pedestrian_yielded') + this.count('traffic_yielded'); if (yielded) { sh.adjust('compassion', Math.min(9, yielded * 3), `${yielded} road user(s) yielded safely because of the siren`); }
    if (fastRed.length) { sh.adjustMany({ safetyAwareness: -Math.min(30, fastRed.length * 10), selfControl: -Math.min(18, fastRed.length * 6) }, `Ran ${fastRed.length} red light(s) at speed with cross traffic close`); neg.push(`Crossed ${fastRed.length} busy intersection(s) at speed against the light.`); actions.push(...fastRed.map((e) => `Crossed the intersection at z=${e.z} m at ${e.speed} km/h against a red light with cross traffic.`)); }
    if (careful.length) { sh.adjustMany({ safetyAwareness: Math.min(18, careful.length * 6), consequenceAwareness: Math.min(12, careful.length * 4) }, `Eased through ${careful.length} red light(s) with caution`); pos.push('Slowed down through intersections against the light.'); }
    const nm = this.first('near_miss_pedestrian'); if (nm) { sh.adjustMany({ compassion: -15, safetyAwareness: -15, consequenceAwareness: -8 }, `Passed ${nm.distance} m from a pedestrian at ${nm.speed} km/h`); neg.push('Nearly struck a pedestrian at a crossing.'); actions.push(`Near miss with a pedestrian (${nm.distance} m at ${nm.speed} km/h).`); }
    if (sum.collisions) { sh.adjustMany({ safetyAwareness: -Math.min(36, sum.collisions * 12), responsibility: -Math.min(18, sum.collisions * 6), consequenceAwareness: -8 }, `${sum.collisions} collision(s) on the way`); neg.push(`${sum.collisions} collision(s) with vehicles or roadside objects.`); cons.push('Other vehicles were damaged and their occupants shaken.'); }
    if (this.has('sidewalk_driving')) { sh.adjustMany({ safetyAwareness: -12, selfControl: -8 }, 'Drove on the pavement'); neg.push('Drove along the pavement where people walk.'); }
    if (sum.oncomingIncidents) { sh.adjustMany({ selfControl: -Math.min(16, sum.oncomingIncidents * 8), safetyAwareness: -Math.min(16, sum.oncomingIncidents * 8) }, `${sum.oncomingIncidents} head-on risk(s) in the oncoming lane`); neg.push('Overtook into oncoming traffic.'); }
    if ((sum.maxSpeedKmh || 0) > 85) { sh.adjust('selfControl', -8, `Reached ${sum.maxSpeedKmh} km/h in the city`); }
    else if (arr) { sh.adjust('selfControl', 8, `Top speed kept to ${sum.maxSpeedKmh} km/h`); pos.push('Kept the speed within a controllable range.'); }
    if (arr && !arr.late && !this.isReckless() && arr.time < this.timeLimit * 0.6) { sh.adjust('practicalWisdom', 10, 'Fast and clean—urgency and safety reconciled'); pos.push('Arrived quickly without a single dangerous incident.'); }
    if (arr && !arr.late && !this.isReckless()) { sh.adjustMany({ consequenceAwareness: 8, safetyAwareness: 12, selfControl: 6 }, 'No one else was put at risk on the way'); }
    const titles = { arrived_safe_timely: 'Arrived safely and in time', arrived_reckless: 'Arrived in time, but dangerously', arrived_late: 'Arrived too late', failed: 'Did not reach the hospital', crash: 'Ambulance crashed', hit_pedestrian: 'Struck a pedestrian' };
    const summary = { arrived_safe_timely: 'You reached the hospital inside the time window without endangering anyone.', arrived_reckless: 'You reached the hospital in time, but your driving created avoidable danger for other people.', arrived_late: 'You reached the hospital after the patient’s condition had become critical.', failed: 'Time ran out before the ambulance reached the hospital.', crash: 'A high-speed collision disabled the ambulance before it arrived.', hit_pedestrian: 'The ambulance struck a pedestrian at a crossing.' }[outcome];
    const mentor = {
      summary: `You were responsible for a critical patient and for every person on the streets between you and the hospital. ${summary}`,
      consequences: cons.join(' ') || 'The consequences followed from your speed, your siren use and your choices at the intersections.',
      principles: ['Compassion for the patient', 'Safety of the public', 'Self-control under pressure', 'Practical wisdom (the siren, the route, the speed)'],
      tradeoffs: 'The patient’s need is urgent and real. But an ambulance that crashes, or injures a pedestrian, saves nobody—it multiplies the emergency. The craft lies in moving fast where it is safe and slowing where others cannot see you coming.',
      didWell: pos, risks: neg,
      improve: sf < 60 ? 'Switch the siren on early and leave it on: most of the danger in this run came from people who had no way of knowing you were coming.' : fastRed.length ? 'Treat every red light as a blind corner. Dropping to 30 km/h costs two seconds; a side impact costs the patient everything.' : 'Keep doing what you did: announce yourself, slow at the crossings, and spend your speed on the open stretches.',
      theme: outcome === 'arrived_reckless' || outcome === 'hit_pedestrian' || outcome === 'crash' ? 'abhimanyu' : outcome === 'arrived_safe_timely' ? 'nishkamaKarma' : 'dharmaSankata',
      reflection: 'If the patient in the back could see the road, which of your decisions would they have asked you to make differently?',
    };
    return { outcome: { title: titles[outcome] || outcome, summary, success: outcome === 'arrived_safe_timely' }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
