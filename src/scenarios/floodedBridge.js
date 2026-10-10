// GAME 6 — THE FLOODED BRIDGE: rain, a flooded causeway, a long diversion, and the option to wait.
import * as THREE from 'three';
import { VehicleScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle, colliderFromObject } from '../engine/collision.js';

const JUNCTION_Z = 180, WATER_Z0 = 215, WATER_Z1 = 260, POST_Z = 360, DIV_X = 120, DIV_Z = 340;
const RAIN_STOP = 45, DRAIN_END = 105;

export class FloodedBridge extends VehicleScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0x8f99a4, 50, 240);
    K.makeSky(s, { top: 0x55606e, bottom: 0xb3bcc6, horizon: 0x8f99a4 });
    this.sun = K.makeSun(s, { position: [-40, 80, 60], intensity: 1.3, color: 0xe6ecf2, shadowArea: 50 }); K.makeHemi(s, 0xb9c6d6, 0x4a5546, 1.1);
    s.add(K.makeGround(1400, 0x3f5a35));
    const main = K.makeRoad(380, 7, { wet: true }); main.position.z = 180; s.add(main);
    s.add(K.makeRoadBetween(0, JUNCTION_Z, DIV_X, JUNCTION_Z, 6, { gravel: true })); s.add(K.makeRoadBetween(DIV_X, JUNCTION_Z, DIV_X, DIV_Z, 6, { gravel: true })); s.add(K.makeRoadBetween(DIV_X, DIV_Z, 0, DIV_Z, 6, { gravel: true }));
    s.add(K.makeIntersection(0, JUNCTION_Z, 7.2)); s.add(K.makeIntersection(DIV_X, JUNCTION_Z, 6.2)); s.add(K.makeIntersection(DIV_X, DIV_Z, 6.2)); s.add(K.makeIntersection(0, DIV_Z, 7.2));
    // scenery
    let seed = 5; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 90; i++) { const x = (rnd() < 0.5 ? -1 : 1) * (8 + rnd() * 60), z = -20 + rnd() * 400; if (z > WATER_Z0 - 12 && z < WATER_Z1 + 12 && x < 108) continue; if (Math.abs(z - JUNCTION_Z) < 6 && x > 0) continue; if (Math.abs(x - DIV_X) < 6 || (Math.abs(z - DIV_Z) < 6 && x > -6)) continue; const t = K.makeTree(rnd() < 0.5 ? 0 : 1, 0.9 + rnd() * 0.8); t.position.set(x, 0, z); s.add(t); this.addCollider(circle(x, z, 0.45, 'tree')); }
    for (let i = 0; i < 4; i++) { const b = K.makeShop(6, 3.2, 5, 0xd9c9a8, [0xc8452c, 0x3a6fd8, 0xd8a24a, 0x6a8a3a][i], ['TEA', 'CYCLE REPAIR', 'GENERAL STORE', 'PHARMACY'][i]); const x = i % 2 ? 9 : -9; b.position.set(x, 0, 90 + i * 14); b.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2; s.add(b); this.addCollider(colliderFromObject(b, 'building')); }
    // river + causeway
    // The river flows in from the west and is fed by a tank (lake) east of the causeway; the Upper Road passes east of the tank on higher ground.
    const riverBed = K.box(280, 0.1, WATER_Z1 - WATER_Z0 + 20, 0x4b4a3e); riverBed.position.set(-60, -0.6, (WATER_Z0 + WATER_Z1) / 2); riverBed.receiveShadow = true; s.add(riverBed);
    const lakeBed = K.box(44, 0.1, 76, 0x4b4a3e); lakeBed.position.set(80, -0.6, (WATER_Z0 + WATER_Z1) / 2); s.add(lakeBed);
    this.water = K.makeWater(280, WATER_Z1 - WATER_Z0 + 8, { color: 0x6b5a3a, opacity: 0.9, y: 0 }); this.water.position.set(-60, 0, (WATER_Z0 + WATER_Z1) / 2); s.add(this.water); this.onUpdate((dt, t) => this.water.userData.update?.(t));
    this.lake = K.makeWater(40, WATER_Z1 - WATER_Z0 + 22, { color: 0x6b5a3a, opacity: 0.9, y: 0 }); this.lake.position.set(80, 0, (WATER_Z0 + WATER_Z1) / 2); s.add(this.lake); this.onUpdate((dt, t) => this.lake.userData.update?.(t));
    const bund = K.box(6, 1.4, WATER_Z1 - WATER_Z0 + 30, 0x6b6a5a); bund.position.set(104, 0.7, (WATER_Z0 + WATER_Z1) / 2); s.add(bund); this.addCollider(aabb(101, WATER_Z0 - 15, 107, WATER_Z1 + 15, 'bund'));
    const bundSign = K.makeTextBoard('TANK BUND — UPPER ROAD', { w: 5, h: 0.7, bg: '#13224a', fg: '#ffffff', fontSize: 70 }); bundSign.position.set(110, 2.6, WATER_Z0 - 18); bundSign.rotation.y = Math.PI; s.add(bundSign);
    for (const z of [WATER_Z0 + 3, WATER_Z0 + 12, WATER_Z0 + 21, WATER_Z0 + 30, WATER_Z0 + 39]) for (const sx of [-1, 1]) { const p = K.box(0.2, 1.3, 0.2, 0xcfcfcf); p.position.set(sx * 3.7, 0.65, z); s.add(p); }
    this.gauge = new THREE.Group(); const gp = K.box(0.25, 2.2, 0.25, 0xffffff); gp.position.y = 1.1; this.gauge.add(gp); for (let i = 0; i < 4; i++) { const band = K.box(0.27, 0.5, 0.27, [0x4caf50, 0xffc107, 0xff7043, 0xd32f2f][i]); band.position.y = 0.25 + i * 0.5; this.gauge.add(band); } this.gauge.position.set(4.6, 0, WATER_Z0 - 2); s.add(this.gauge);
    const gl = K.makeTextBoard('DEPTH GAUGE', { w: 1.2, h: 0.3, bg: '#ffffff', fg: '#111', fontSize: 60 }); gl.position.set(4.6, 2.4, WATER_Z0 - 2); gl.rotation.y = Math.PI; s.add(gl);
    // signs & barrier
    const sign = (text, lines, x, z, color = '#ffd21f') => { const g = K.makeSign(text, { color, lines, w: 2.2, h: 1.2, fontSize: 64 }); g.position.set(x, 0, z); g.rotation.y = Math.PI; s.add(g); this.addCollider(circle(x, z, 0.15, 'sign')); };
    sign('FLOOD', ['FLOOD AHEAD', 'CAUSEWAY UNDER WATER', 'USE DIVERSION →'], 5.2, 150);
    sign('DIVERSION', ['DIVERSION', '→ HEALTH POST', 'via Upper Road'], 5.4, JUNCTION_Z - 14, '#ff9e3d');
    sign('CLOSED', ['ROAD CLOSED', 'DO NOT ENTER', 'FLOOD WATER'], 5.2, WATER_Z0 - 10, '#ff5a5a');
    const bar = K.makeBarrier(3); bar.position.set(-1.9, 0, WATER_Z0 - 8); s.add(bar); this.addCollider(aabb(-3.4, WATER_Z0 - 8.3, -0.4, WATER_Z0 - 7.7, 'barrier'));
    const hp = K.makeBuilding(12, 5, 8, 0xf4f1e8, { floors: 1 }); hp.position.set(-11, 0, POST_Z + 2); s.add(hp); this.addCollider(colliderFromObject(hp, 'building'));
    const hs = K.makeTextBoard('PRIMARY HEALTH POST', { w: 7, h: 0.9, bg: '#13224a', fg: '#ffffff', fontSize: 70 }); hs.position.set(-11, 5.6, POST_Z + 2); s.add(hs);
    const marker = K.makeMarker(0x9ad0ff, 4); marker.position.set(-1.5, 0, POST_Z); s.add(marker); this.onUpdate((dt, t) => marker.userData.update(t));
    for (const [x, z] of [[-5, 60], [5, 120], [-5, 300], [DIV_X + 4, 250]]) { const l = K.makeLamp(5, true); l.position.set(x, 0, z); s.add(l); this.addCollider(circle(x, z, 0.2, 'lamp')); }
    // villager with umbrella near the barrier
    this.villager = new NPC({ mesh: K.makeHuman({ shirt: 0x3a6a4a, pants: 0x333, hat: 0x222 }), x: 5.6, z: WATER_Z0 - 13, yaw: Math.PI }); s.add(this.villager.mesh); this.addCollider(this.villager.collider);
    const umb = K.cyl(0.9, 0.9, 0.06, 0xc8452c, 10); umb.position.set(5.6, 2.1, WATER_Z0 - 13); s.add(umb);
    // rain
    this.rain = K.makeRain({ count: this.ctx.settings.get('particles') ? 1600 : 400, area: [120, 40, 160] }); s.add(this.rain);
    this.onUpdate((dt) => { this.rain.userData.update?.(dt, this.vehicle?.pos); });
    // jeep
    const jeep = K.makeJeep(0x7d9460); this.setupVehicle(jeep, { maxSpeed: 20, accel: 6, brakeDecel: 7.5, eBrakeDecel: 10, engineKind: 'jeep', offRoad: (x, z) => !this.onRoad(x, z) });
    this.vehicle.reset(1.8, 0, 0); this.sun.target.position.set(0, 0, 180);
    this.addCollider(aabb(-300, -40, 300, -20, 'bounds')); this.addCollider(aabb(-300, 380, 300, 400, 'bounds')); this.addCollider(aabb(-300, -40, -200, 400, 'bounds')); this.addCollider(aabb(200, -40, 300, 400, 'bounds'));
    this.timeLimit = this.diff(240, 180, 150); this.waitedNearWater = 0; this.route = 'main'; this.inWater = false; this.maxWaterSpeed = 0;
    this.camera.position.set(6, 4, -12); this.camera.lookAt(0, 1, 40);
  }

  onRoad(x, z) {
    if (Math.abs(x) <= 3.6 && z >= -10 && z <= 372) return true;
    if (Math.abs(z - JUNCTION_Z) <= 3.2 && x >= 0 && x <= DIV_X + 3.2) return true;
    if (Math.abs(x - DIV_X) <= 3.2 && z >= JUNCTION_Z - 3 && z <= DIV_Z + 3) return true;
    if (Math.abs(z - DIV_Z) <= 3.2 && x >= -3.6 && x <= DIV_X + 3) return true;
    return false;
  }
  depthAt(t) { if (t < RAIN_STOP) return 0.9; if (t > DRAIN_END) return 0.25; return 0.9 - 0.65 * ((t - RAIN_STOP) / (DRAIN_END - RAIN_STOP)); }
  getIntro() { return { ...super.getIntro(), tips: [...this.meta.tips, `The health post closes in ${this.timeLimit} seconds.`] }; }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('Deliver the medicine box to the <b>Primary Health Post</b> before the doctor leaves. The road ahead crosses the river.');
    this.hud().showTimer(true); this.hud().centerMessage('The Flooded Bridge', 2200);
    this.ctx.audio.startLoop('rain', { vol: 0.35 });
  }

  update(dt) {
    this.tick(dt); const v = this.vehicle; const hud = this.hud();
    const res = this.stepVehicle(dt);
    const depth = this.depthAt(this.time); this.water.position.y = depth - 0.02; if (this.lake) this.lake.position.y = depth - 0.02;
    const remaining = this.timeLimit - this.time; hud.setTimer(remaining, 30, 'Clinic closes');
    // rain easing
    const rainK = this.time < RAIN_STOP ? 1 : Math.max(0, 1 - (this.time - RAIN_STOP) / 25); this.rain.visible = rainK > 0.02; if (this.rain.material) this.rain.material.opacity = 0.6 * rainK; this.ctx.audio.setLoopVolume?.('rain', 0.35 * Math.max(0.15, rainK));
    if (this.time > RAIN_STOP && !this.flags.rainStop) { this.flags.rainStop = true; this.notify('The rain is easing off.', 'info'); this.record('rain_eased', { t: Math.round(this.time) }); }
    // route tracking
    if (this.route === 'main' && v.pos.x > 8 && Math.abs(v.pos.z - JUNCTION_Z) < 4) { this.route = 'diversion'; this.record('took_diversion', { t: Math.round(this.time) }); this.notify('You are on the diversion (Upper Road).', 'info'); hud.setObjective('Follow the Upper Road: east, then north, then back west to the Health Post.'); }
    if (this.route === 'diversion' && v.pos.x < 4 && Math.abs(v.pos.z - DIV_Z) < 4 && !this.flags.rejoined) { this.flags.rejoined = true; this.record('rejoined_main_road', { t: Math.round(this.time) }); hud.setObjective('The Health Post is just ahead on the left.'); }
    if (this.route === 'main' && v.pos.z > 150 && !this.flags.sign1) { this.flags.sign1 = true; this.record('passed_flood_sign', { speed: Math.round(v.kmh) }); hud.setWarning('FLOOD AHEAD — causeway under water. Diversion at the junction.'); this.after(3.5, () => hud.setWarning('')); }
    // approach to the water
    const distWater = WATER_Z0 - v.pos.z; const nearWater = Math.abs(v.pos.x) < 12 && distWater > 0 && distWater < 60;
    if (nearWater) { hud.setProgress(0, { text: `Depth gauge at the causeway: <b>${depth.toFixed(2)} m</b> ${depth > 0.6 ? '(DANGER — can float a vehicle)' : depth > 0.4 ? '(too deep — engine will stall)' : '(shallow — cross slowly)'}`, value: depth / 1.0, kind: depth > 0.6 ? 'danger' : depth > 0.4 ? 'warn' : 'ok' }); if (v.speed < 0.5) { this.waitedNearWater += dt; if (!this.flags.stoppedAtWater) { this.flags.stoppedAtWater = true; this.record('stopped_at_water', { t: Math.round(this.time), depth: +depth.toFixed(2) }); } } }
    else hud.setProgress(0, null);
    // villager
    const dv = Math.hypot(v.pos.x - this.villager.x, v.pos.z - this.villager.z); this.villager.update(dt);
    const canTalk = dv < 7 && v.speed < 0.5 && !this.ctx.dialogue.open && !this.flags.talking;
    if (canTalk) { hud.setPrompt('<span class="kbd">E</span> Talk to the villager'); this.flags.promptOn = true; if (this.ctx.input.pressed('KeyE')) this.talkVillager(); }
    else if (this.flags.promptOn) { hud.setPrompt(''); this.flags.promptOn = false; }
    // barrier gap at speed
    if (!this.flags.barrier && v.pos.z > WATER_Z0 - 8 && v.pos.z < WATER_Z0 - 6 && Math.abs(v.pos.x) < 4) { this.flags.barrier = true; this.record('passed_barrier', { speed: Math.round(v.kmh) }); }
    // water zone
    const inZone = v.pos.z > WATER_Z0 && v.pos.z < WATER_Z1 && v.pos.x < 101; const onCauseway = Math.abs(v.pos.x) <= 4.2; const localDepth = inZone ? (onCauseway ? depth : depth + 0.8) : 0;
    if (inZone && !this.inWater) { this.inWater = true; this.waterEntrySpeed = v.speed; this.record('entered_water', { depth: +localDepth.toFixed(2), speed: Math.round(v.speed * 3.6), t: Math.round(this.time), onCauseway }); this.ctx.audio.sfx('splash'); this.ctx.engine.addShake(0.3); }
    if (inZone) {
      this.maxWaterSpeed = Math.max(this.maxWaterSpeed, v.speed); v.mesh.position.y = Math.sin(this.time * 4) * 0.03 * Math.min(1, localDepth);
      if (localDepth > 0.6) { this.record('swept', { depth: +localDepth.toFixed(2), t: Math.round(this.time) }); this.sweep(); return; }
      if (localDepth > 0.4 || (v.speed > 10 && v.pos.z > WATER_Z0 + 8)) { if (!this.flags.stall) { this.flags.stall = true; this.record('stalled', { depth: +localDepth.toFixed(2), speed: Math.round(v.speed * 3.6), t: Math.round(this.time) }); v.disabled = true; this.ctx.audio.sfx('stall'); this.ctx.audio.stopEngine(); hud.setWarning('The engine has stalled in the water!'); this.after(5, () => this.endWith('stranded')); } }
      else if (v.speed > 8 && !this.flags.fastWater) { this.flags.fastWater = true; hud.setWarning('Too fast — the bow wave is climbing the bonnet!'); this.after(2, () => hud.setWarning('')); }
    } else if (this.inWater && v.pos.z >= WATER_Z1) { this.inWater = false; this.record('crossed_water', { depth: +depth.toFixed(2), maxSpeed: Math.round(this.maxWaterSpeed * 3.6), t: Math.round(this.time), waited: Math.round(this.waitedNearWater) }); this.notify('You are across the causeway.', 'good'); hud.setObjective('The Health Post is ahead on the left.'); }
    // collisions
    for (const c of res.collisions) { if (c.collider.tag === 'bounds') continue; this.record('collision', { with: c.collider.tag, speed: Math.round(c.impactSpeed * 3.6) }); if (c.collider.tag === 'barrier') this.notify('You hit the road-closed barrier.', 'bad'); }
    // arrival
    if (Math.hypot(v.pos.x + 1.5, v.pos.z - POST_Z) < 8 && v.speed < 2) { this.record('arrived', { t: Math.round(this.time), route: this.route, crossed: this.has('crossed_water') }); this.endWith(this.route === 'diversion' ? 'diversion_arrived' : (this.maxWaterSpeed > 8 ? 'crossed_recklessly' : 'waited_then_crossed_safely')); return; }
    if (remaining <= 0) { this.record('time_up'); this.endWith('timeout'); }
  }

  async talkVillager() {
    if (this.flags.talking) return; this.flags.talking = true; this.vehicle.inputEnabled = false; this.record('talked_villager', { t: Math.round(this.time), depth: +this.depthAt(this.time).toFixed(2) });
    const d = this.depthAt(this.time);
    await this.say('Villager', d > 0.6 ? 'Don’t even think about it, saab. The water took a tempo off this causeway last monsoon. It was over the railing an hour ago. Now the rain is easing it will drop fast— maybe twenty minutes and it will be knee-deep. The Upper Road is long but it is dry.' : d > 0.4 ? 'It is going down, but it is still above the exhaust. Wait a little more, or take the Upper Road.' : 'Knee-deep now. Go slow, first gear, keep the engine revving, and don’t stop in the middle.');
    this.flags.talking = false; this.vehicle.inputEnabled = true;
  }
  say(speaker, text) { return this.ctx.dialogue.say({ speaker, text }); }

  sweep() { const v = this.vehicle; v.inputEnabled = false; v.disabled = true; this.ctx.audio.stopEngine(); this.ctx.audio.sfx('splash'); this.hud().setWarning('The current is lifting the jeep!'); this.ctx.engine.addShake(1); this.locked = true;
    let t = 0; this.onUpdate((dt) => { t += dt; v.mesh.position.x -= dt * 2.5; v.mesh.rotation.z = Math.sin(t * 2) * 0.15; v.mesh.rotation.y += dt * 0.3; });
    this.after(3, () => this.endWith('swept_away')); }

  endWith(outcome) { if (this.finished) return; this.vehicle.inputEnabled = false; this.ctx.audio.stopLoop('rain'); if (outcome === 'diversion_arrived' || outcome === 'waited_then_crossed_safely') this.ctx.audio.sfx('success'); else if (outcome !== 'crossed_recklessly') this.ctx.audio.sfx('fail'); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = [];
    const ent = this.first('entered_water'); const arr = this.first('arrived');
    if (this.has('talked_villager')) { sh.adjustMany({ practicalWisdom: 8, consequenceAwareness: 6 }, 'Asked a local about the water before deciding'); pos.push('Gathered local knowledge before acting.'); actions.push('Talked to the villager at the barrier.'); }
    if (this.has('stopped_at_water') && (!ent || ent.t > this.first('stopped_at_water').t)) { sh.adjust('safetyAwareness', 8, 'Stopped to assess the water before any crossing'); pos.push('Stopped and read the depth gauge.'); actions.push(`Stopped near the water at ${this.first('stopped_at_water').t}s (gauge ${this.first('stopped_at_water').depth} m).`); }
    const pb = this.first('passed_barrier'); if (pb && pb.speed > 18) { sh.adjust('safetyAwareness', -6, `Drove through the ROAD CLOSED barrier gap at ${pb.speed} km/h`); neg.push('Ignored the road-closed barrier at speed.'); }
    if (this.has('took_diversion')) actions.push(`Took the diversion at ${this.first('took_diversion').t}s.`);
    if (ent) { actions.push(`Entered the water at ${ent.t}s — depth ${ent.depth} m, speed ${ent.speed} km/h.`); if (ent.depth > 0.6) { sh.adjust('dutyDiscernment', -10, 'Risked the medicine, the jeep and yourself in water deep enough to float a vehicle'); } }
    const waited = this.first('crossed_water')?.waited || Math.round(this.waitedNearWater); if (waited > 20) { actions.push(`Waited ${waited}s for the water to drop.`); }
    const T = {
      diversion_arrived: ['Arrived via the diversion', 'You read the signs, took the long dry road and delivered the medicine on time.', true, () => { sh.adjustMany({ safetyAwareness: 25, practicalWisdom: 20, responsibility: 15, dutyDiscernment: 10, consequenceAwareness: 12, selfControl: 10 }, 'Chose the safe route and completed the delivery'); pos.push('Chose the safe, certain route over the short, uncertain one.'); cons.push('The medicine arrived dry and the doctor dispensed it the same evening.'); }],
      waited_then_crossed_safely: ['Waited, then crossed carefully', 'You waited for the water to drop to a verified safe depth and crossed slowly.', true, () => { sh.adjustMany({ safetyAwareness: 15, selfControl: 20, practicalWisdom: 10, responsibility: 12, consequenceAwareness: 8 }, 'Waited for a safe depth, then crossed slowly'); pos.push('Showed patience and crossed only when the gauge said it was safe.'); cons.push('The medicine arrived on time; the jeep needed nothing but a wash.'); }],
      crossed_recklessly: ['Crossed too fast', 'You got across, but the bow wave nearly drowned the engine.', false, () => { sh.adjustMany({ safetyAwareness: -10, selfControl: -10, consequenceAwareness: -8, responsibility: 5 }, 'Crossed shallow water at an unsafe speed'); neg.push('Crossed at a speed that could have stalled the jeep mid-river.'); cons.push('The medicine arrived; the jeep’s air filter was soaked and it coughed for a week.'); }],
      stranded: ['Stranded in the river', 'The engine stalled in the water and the jeep had to be hauled out.', false, () => { sh.adjustMany({ safetyAwareness: -20, consequenceAwareness: -15, selfControl: -10, responsibility: -10 }, 'Stalled in flood water'); neg.push('Drove into water deep enough to stall the engine.'); cons.push('Villagers pulled you out with a tractor and a rope. The medicine box was soaked; the clinic closed without it.'); }],
      swept_away: ['Swept off the causeway', 'The current lifted the jeep and pushed it off the causeway.', false, () => { sh.adjustMany({ safetyAwareness: -35, consequenceAwareness: -25, selfControl: -15, responsibility: -20 }, 'Drove into water deep enough to float the jeep'); neg.push('Entered water the signs, the gauge and a local all warned against.'); cons.push('You were rescued downstream by fishermen. The jeep and the medicine were lost.'); }],
      timeout: ['Clinic closed', 'The doctor left before the medicine arrived.', false, () => { sh.adjustMany({ responsibility: -15, practicalWisdom: -10 }, 'Neither route was completed in time'); neg.push('Ran out of time without committing to a plan.'); cons.push('The medicine waits until morning. Sometimes delay is the safe choice; here the diversion was both safe and quick.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    if (arr) actions.push(`Arrived at ${arr.t}s via the ${arr.route === 'diversion' ? 'diversion' : 'causeway'}.`);
    const mentor = {
      summary: `A deadline, a short road under water, a long road that was dry. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Safety over speed', 'Consequence awareness: water hides its depth', 'Self-control: the patience to wait or detour', 'Discernment: the duty was to deliver medicine, not to cross a river'],
      tradeoffs: 'Urgency was real: a doctor leaving, a patient waiting. But the signs, the gauge and the villager all offered the same free information. Taking the diversion cost a few minutes; waiting cost patience; forcing the crossing risked the jeep, the medicine and you.',
      didWell: pos, risks: neg,
      improve: outcome === 'swept_away' || outcome === 'stranded' ? 'Treat moving water as a wall. If you cannot see the road surface, you do not cross—there is always a diversion, and there is always tomorrow.' : outcome === 'crossed_recklessly' ? 'Shallow is only safe when slow: walking pace, steady throttle, no stopping.' : outcome === 'timeout' ? 'Decide early. The flood sign was at 150 m; by the junction you already had enough information to commit.' : 'Nothing essential to change. You turned information into a decision and kept the mission intact.',
      theme: outcome === 'waited_then_crossed_safely' ? 'krishnaRestraint' : success ? 'sanjayaSight' : outcome === 'timeout' ? 'arjunaVishada' : 'abhimanyu',
      reflection: 'When the short road is dangerous and the long road is sure, what is it in us that still argues for the short one?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
