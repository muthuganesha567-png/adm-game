// GAME 1 — THE ROAD OF DHARMA: truck, pedestrian, roadside well.
import * as THREE from 'three';
import { VehicleScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle, colliderFromObject, obbDistanceToPoint } from '../engine/collision.js';

const CROSS_Z = 255;      // where the pedestrian crosses
const FINISH_Z = 335;

export class RoadOfDharma extends VehicleScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0xdfe8f0, 120, 420);
    K.makeSky(s, { top: 0x2f6fd6, bottom: 0xeaf0f6, horizon: 0xbcd4ea });
    this.sun = K.makeSun(s, { position: [40, 80, 60], intensity: 2.0, shadowArea: 70 }); K.makeHemi(s, 0xbfd4ff, 0x5a7a3a, 0.7);
    s.add(K.makeGround(1400, 0x587f3c));
    const road = K.makeRoad(480, 8); road.position.z = 220; s.add(road);
    // shoulders
    for (const sx of [-1, 1]) { const sh = K.makeSidewalk(480, 2.4, sx * 5.2, 220, 0xb9a67a); sh.position.y = 0.0; sh.scale.y = 0.2; s.add(sh); }
    // trees & vegetation
    for (let z = -20; z < 440; z += 9) {
      for (const sx of [-1, 1]) {
        if (z > 225 && z < 290) continue; // keep the village stretch open
        const x = sx * (11 + Math.random() * 6); const t = K.makeTree(Math.floor(Math.random() * 4), 0.9 + Math.random() * 0.5); t.position.set(x, 0, z + Math.random() * 4); s.add(t);
        this.addCollider(circle(t.position.x, t.position.z, 0.5, 'tree'));
        if (Math.random() < 0.4) { const b = K.makeBush(0.8 + Math.random() * 0.6); b.position.set(sx * (7.5 + Math.random() * 2), 0, z + 4); s.add(b); }
      }
    }
    // distant hills
    for (let i = 0; i < 9; i++) { const h = K.makeMound(60 + Math.random() * 60, 18 + Math.random() * 14, 0x4f7a3a); h.position.set(-200 + i * 60 + (Math.random() - 0.5) * 40, 0, 520 + Math.random() * 80); s.add(h); }
    // village buildings
    const houses = [[-24, 200, 0xe8d7b0], [24, 215, 0xd9c9a3], [-26, 235, 0xf0e2c2], [26, 245, 0xe0cfa8], [-25, 275, 0xead9b5], [26, 285, 0xd8c6a0], [-28, 310, 0xe8d7b0], [28, 320, 0xf0e2c2]];
    for (const [x, z, c] of houses) { const b = K.makeBuilding(9 + Math.random() * 4, 4 + Math.random() * 3, 8, c, { floors: 1 }); b.position.set(x, 0, z); b.rotation.y = x < 0 ? 0.1 : -0.1; s.add(b); this.addCollider(colliderFromObject(b, 'building')); }
    const shop = K.makeShop(7, 3.6, 5, 0xf5e6c4, 0xc8452c, 'CHAI & SNACKS'); shop.position.set(15, 0, 300); shop.rotation.y = -0.5 + Math.PI; s.add(shop); this.addCollider(colliderFromObject(shop, 'building'));
    // signs
    const signs = [[7.2, 40, '60', '#ffffff', ['60'], '#d32f2f', 220], [7.2, 185, 'SLOW', '#ffd21f', ['VILLAGE', 'AHEAD', 'SLOW'], '#111', 80], [7.2, 222, '40', '#ffffff', ['40'], '#d32f2f', 220], [7.2, 236, 'WELL', '#ffd21f', ['WELL', 'AHEAD'], '#111', 90]];
    for (const [x, z, t, col, lines, border, fs] of signs) { const sg = K.makeSign(t, { color: col, lines, border, w: 1.4, h: 1.1, fontSize: fs }); sg.position.set(x, 0, z); sg.rotation.y = Math.PI; s.add(sg); }
    // bus stop (pedestrian origin) and barriers on the left shoulder
    const bus = K.makeBusStop(); bus.position.set(9.5, 0, CROSS_Z - 3); bus.rotation.y = -Math.PI / 2; s.add(bus); this.addCollider(aabb(8.2, CROSS_Z - 5, 11.2, CROSS_Z - 1, 'busstop'));
    // barriers: left shoulder before the crossing, right shoulder along the whole stretch
    for (let z = CROSS_Z - 24; z < CROSS_Z - 6; z += 2.2) { const b = K.makeBarrier(2); b.position.set(6.3, 0, z); s.add(b); this.addCollider(aabb(5.3, z - 1, 7.3, z + 1, 'barrier')); }
    for (let z = CROSS_Z - 24; z < CROSS_Z + 24; z += 2.2) { const b = K.makeBarrier(2); b.position.set(-6.3, 0, z); s.add(b); this.addCollider(aabb(-7.3, z - 1, -5.3, z + 1, 'barrier')); }
    // the well on the left (truck-side) shoulder, just past the crossing point
    const well = K.makeWell(); well.position.set(7.0, 0, CROSS_Z + 3); s.add(well); this.addCollider(circle(7.0, CROSS_Z + 3, 1.35, 'well'));
    this.well = well;
    // finish gate
    const gate = new THREE.Group(); for (const sx of [-5.5, 5.5]) { const p = K.cyl(0.15, 0.15, 5, 0xd4a63a, 8); p.position.set(sx, 2.5, 0); gate.add(p); }
    const banner = K.makeTextBoard('DELIVERY POINT', { w: 11, h: 1, bg: '#13224a', fg: '#f1c75b', fontSize: 70 }); banner.position.y = 4.6; gate.add(banner); gate.position.z = FINISH_Z; s.add(gate);
    const marker = K.makeMarker(0xf1c75b, 3); marker.position.set(0, 0, FINISH_Z + 4); s.add(marker); this.onUpdate((dt, t) => marker.userData.update(t));
    // world bounds
    this.addCollider(aabb(-60, -60, -40, 600, 'bounds')); this.addCollider(aabb(40, -60, 60, 600, 'bounds')); this.addCollider(aabb(-60, 480, 60, 500, 'bounds'));
    // pedestrian
    const pedMesh = K.makeHuman({ shirt: 0xf1c75b, pants: 0x3a3a4a, skin: 0xa9714b });
    this.ped = new NPC({ mesh: pedMesh, name: 'Pedestrian', x: 7.2, z: CROSS_Z, yaw: -Math.PI / 2, speed: 1.5 }); s.add(pedMesh); this.ped.faceTowards(0, CROSS_Z);
    this.pedCollider = circle(7.2, CROSS_Z, 0.45, 'pedestrian'); this.pedCollider.disabled = true; this.addCollider(this.pedCollider);
    // ambient pedestrians far from the road
    const amb = [[-14, 300, [[-14, 300], [-14, 330, 2]]], [15, 210, [[15, 210], [15, 190, 1.5]]]];
    this.ambient = amb.map(([x, z, wp]) => { const m = K.makeHuman({}); s.add(m); return new NPC({ mesh: m, x, z, waypoints: wp, speed: 1.0 }); });
    // oncoming car (ambience, passes before the event)
    this.car = K.makeCar(0x8a2f2f); this.car.position.set(-2.2, 0, 330); this.car.rotation.y = Math.PI; s.add(this.car); this.carActive = false; this.carCollider = aabb(-3.2, 328, -1.2, 332, 'car'); this.addCollider(this.carCollider);
    // truck
    const truck = K.makeTruck(); this.setupVehicle(truck, { maxSpeed: 23, accel: 6.5, brakeDecel: 9, eBrakeDecel: 12, offRoad: (x) => Math.abs(x) > 5.6 });
    this.vehicle.reset(2, 0, 0);
    this.sun.target.position.set(0, 0, CROSS_Z);
    this.resetState();
    this.camera.position.set(-14, 6, -20); this.camera.lookAt(0, 2, 40);
  }

  resetState() {
    this.pedState = 'waiting'; this.pedAppearedAt = null; this.minPedDist = Infinity; this.brakedAfter = false; this.stoppedForPed = false; this.collided = new Set();
    this.overLimitTime = 0; this.maxSpeed = 0; this.offRoadTime = 0; this.swerveNoted = false; this.lastPromptAt = -10; this.timeLimit = this.diff(200, 150, 120); this.hornCount = 0;
  }

  getIntro() { return { ...super.getIntro(), tips: [...this.meta.tips, `Village speed limit: 40 km/h. Highway limit: 60 km/h. Time allowed: ${Math.round(this.timeLimit)} s.`] }; }

  start() {
    super.start();
    this.record('start');
    this.hud().setObjective('Deliver the goods: drive to the <b>Delivery Point</b> ahead. Watch for people and roadside hazards.');
    this.hud().showTimer(true);
    this.hud().centerMessage('The Road of Dharma', 2200);
    this.notify('Highway limit 60 km/h — a village lies ahead.', 'info');
  }

  onHorn() {
    this.ctx.audio.sfx('horn'); this.hornCount++;
    const d = CROSS_Z - this.vehicle.pos.z;
    this.record('horn', { distance: Math.round(d), pedState: this.pedState });
    if (this.pedState === 'crossing') {
      // a pedestrian still near the kerb steps back; one already on the road hurries
      if (this.ped.x > 4.2) { this.ped.setWaypoints([[7.2, CROSS_Z]], false); this.pedState = 'retreated'; this.notify('The pedestrian steps back onto the kerb.', 'good'); this.after(5, () => { if (!this.finished && this.pedState === 'retreated') { this.pedState = 'crossing'; this.ped.setWaypoints([[-9.6, CROSS_Z]], false); } }); }
      else { this.ped.frozen = true; this.after(0.9, () => { this.ped.frozen = false; this.ped.speed = 2.4; }); }
    }
  }

  update(dt) {
    this.tick(dt);
    const v = this.vehicle; const hud = this.hud();
    const res = this.stepVehicle(dt);
    const remaining = this.timeLimit - this.time; hud.setTimer(remaining, 20);
    this.maxSpeed = Math.max(this.maxSpeed, Math.abs(v.speed));
    const limit = v.pos.z > 200 ? 11.1 : 16.7; if (v.speed > limit + 0.5) this.overLimitTime += dt;
    if (res.offRoad) { this.offRoadTime += dt; if (!this.flags.offRoadWarned && this.offRoadTime > 0.8) { this.flags.offRoadWarned = true; this.record('off_road', { z: Math.round(v.pos.z) }); this.notify('You are driving on the shoulder.', 'bad'); } }
    if (!res.offRoad) this.flags.offRoadWarned = false;
    hud.setProgress(0, { text: `Journey progress — ${Math.round(Math.max(0, v.pos.z) / FINISH_Z * 100)}%`, value: v.pos.z / FINISH_Z });

    // ambience
    for (const a of this.ambient) a.update(dt);
    if (!this.carActive && v.pos.z > 40) this.carActive = true;
    if (this.carActive && this.car.position.z > -60) { this.car.position.z -= 12 * dt; this.carCollider.minZ = this.car.position.z - 2.2; this.carCollider.maxZ = this.car.position.z + 2.2; for (const w of this.car.userData.wheels) w.rotation.x -= 30 * dt; }

    // contextual prompts
    if (v.pos.z > 170 && !this.flags.villagePrompt) { this.flags.villagePrompt = true; this.notify('Village ahead — speed limit 40 km/h.', 'info'); }
    if (v.pos.z > 222 && !this.flags.wellPrompt) { this.flags.wellPrompt = true; hud.setWarning('A well stands close to the road ahead'); this.after(3, () => { if (this.pedState !== 'crossing') hud.setWarning(''); }); }

    // pedestrian trigger: distance scaled to speed so the situation is always solvable but demanding
    const distToCross = CROSS_Z - v.pos.z;
    if (this.pedState === 'waiting') {
      // time-to-arrival of roughly 3 s: a driver who never brakes meets the pedestrian in the lane
      const trig = Math.max(16, v.speed * this.diff(3.6, 3.0, 2.4));
      if (distToCross < trig && distToCross > 5) this.triggerPedestrian();
    }
    if (this.pedState === 'crossing' || this.pedState === 'retreated') {
      this.ped.update(dt); this.pedCollider.x = this.ped.x; this.pedCollider.z = this.ped.z;
      const onRoad = Math.abs(this.ped.x) < 4.6;
      this.pedCollider.disabled = !(this.ped.x < 8);
      const d = obbDistanceToPoint(v.pos.x, v.pos.z, v.yaw, v.halfLength, v.halfWidth, this.ped.x, this.ped.z);
      if (onRoad && distToCross > -2) this.minPedDist = Math.min(this.minPedDist, d);
      if (onRoad && Math.abs(v.speed) < 0.4 && distToCross > 2 && distToCross < 30 && !this.stoppedForPed) { this.stoppedForPed = true; this.record('stopped_for_pedestrian', { distance: Math.round(distToCross) }); this.notify('You stopped and let the pedestrian cross.', 'good'); }
      if (!this.brakedAfter && (res.braking) && this.pedAppearedAt !== null) { this.brakedAfter = true; const reaction = Math.round((this.time - this.pedAppearedAt) * 10) / 10; this.record(res.eBrake ? 'ebrake' : 'brake', { reaction, speed: Math.round(v.speed * 3.6) }); }
      if (!this.swerveNoted && Math.abs(v.steer) > 0.18 && Math.abs(v.speed) > 12 && distToCross < 40 && distToCross > -5) { this.swerveNoted = true; this.record('swerve', { dir: v.steer > 0 ? 'right' : 'left', speed: Math.round(v.speed * 3.6) }); }
      if (onRoad && d < 1.5 && Math.abs(v.speed) > 3 && !this.flags.nearMiss) { this.flags.nearMiss = true; this.record('near_miss', { distance: Math.round(d * 10) / 10, speed: Math.round(v.speed * 3.6) }); this.notify('That was far too close.', 'bad'); }
      if (v.speed > 8 && distToCross < 35 && distToCross > 0 && !res.braking && this.time - this.lastPromptAt > 2.5) { this.lastPromptAt = this.time; hud.setPrompt('<span class="kbd">Space</span> Brake!'); this.after(1.2, () => hud.setPrompt('')); }
      if (this.ped.done && this.ped.x < -9) { this.pedState = 'crossed'; hud.setWarning(''); this.pedCollider.disabled = true; this.record('pedestrian_crossed'); }
    }

    // collisions
    for (const c of res.collisions) {
      const tag = c.collider.tag;
      if (tag === 'pedestrian') { this.record('collision', { with: 'pedestrian', speed: Math.round(c.impactSpeed * 3.6) }); this.endWith('hit_pedestrian'); return; }
      if (tag === 'bounds') continue;
      this.record('collision', { with: tag, speed: Math.round(c.impactSpeed * 3.6) }); this.collided.add(tag);
      if (tag === 'well') { this.notify('You crashed into the village well.', 'bad'); if (c.impactSpeed > 9) { v.disabled = true; this.endWith('crash'); return; } }
      else if ((tag === 'building' || tag === 'tree' || tag === 'busstop' || tag === 'car') && c.impactSpeed > 10) { v.disabled = true; this.notify('The truck is wrecked.', 'bad'); this.endWith('crash'); return; }
      else if (tag === 'barrier') this.notify('You hit the roadside barrier.', 'bad');
    }
    // finish / timeout
    if (v.pos.z >= FINISH_Z) { this.endWith(this.flags.nearMiss ? 'pedestrian_endangered' : (this.collided.has('well') || this.collided.has('barrier')) ? 'hit_hazard' : (this.collided.size ? 'arrived_with_damage' : 'safe_pass')); return; }
    if (remaining <= 0) { this.endWith('timeout'); return; }
  }

  triggerPedestrian() {
    this.pedState = 'crossing'; this.pedAppearedAt = this.time; this.ped.setWaypoints([[-9.6, CROSS_Z]], false);
    this.record('pedestrian_appeared', { speed: Math.round(this.vehicle.speed * 3.6), distance: Math.round(CROSS_Z - this.vehicle.pos.z) });
    this.hud().setWarning('A pedestrian is stepping onto the road!'); this.ctx.audio.sfx('warning');
  }

  endWith(outcome) {
    if (this.finished) return;
    this.vehicle.inputEnabled = false;
    this.record('summary', { maxSpeedKmh: Math.round(this.maxSpeed * 3.6), overLimitSec: Math.round(this.overLimitTime), minPedestrianDistance: this.minPedDist === Infinity ? null : Math.round(this.minPedDist * 10) / 10, offRoadSec: Math.round(this.offRoadTime) });
    if (outcome === 'hit_pedestrian') { this.hud().flash(true, 0.7); this.ctx.audio.sfx('fail'); }
    else if (outcome === 'safe_pass') this.ctx.audio.sfx('success');
    this.finish(outcome, {});
  }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = [];
    const app = this.first('pedestrian_appeared'); const brake = this.first('brake') || this.first('ebrake'); const sum = this.last('summary') || {};
    const hitPed = outcome === 'hit_pedestrian'; const nearMiss = this.has('near_miss'); const stopped = this.has('stopped_for_pedestrian');
    const hitWell = this.events.some((e) => e.type === 'collision' && e.with === 'well'); const hitBarrier = this.events.some((e) => e.type === 'collision' && e.with === 'barrier');
    const otherHits = this.events.filter((e) => e.type === 'collision' && !['well', 'barrier', 'pedestrian'].includes(e.with));
    if (app) {
      actions.push(`Approached the crossing at ${app.speed} km/h with ${app.distance} m to react.`);
      if (app.speed <= 42) { sh.adjustMany({ safetyAwareness: 15, selfControl: 15 }, `Entered the village at ${app.speed} km/h, within the 40 km/h limit`); pos.push('Slowed down for the village before anything went wrong.'); }
      else if (app.speed <= 62) { sh.adjustMany({ safetyAwareness: 4, selfControl: 2 }, `Approached at ${app.speed} km/h—moderate, above the village limit`); neg.push('Entered the village zone above the 40 km/h limit.'); }
      else { sh.adjustMany({ safetyAwareness: -15, selfControl: -20 }, `Approached at ${app.speed} km/h, far above the village limit`); neg.push(`Approached the village at ${app.speed} km/h, leaving very little margin.`); }
    } else { actions.push('The scenario ended before the pedestrian situation occurred.'); }
    if (app && brake) {
      actions.push(`${brake.type === 'ebrake' ? 'Emergency-braked' : 'Braked'} ${brake.reaction}s after the pedestrian appeared.`);
      if (brake.reaction <= 0.8) { sh.adjustMany({ safetyAwareness: 15, consequenceAwareness: 10 }, `Fast braking reaction (${brake.reaction}s)`); pos.push('Reacted quickly by braking.'); }
      else if (brake.reaction <= 1.6) { sh.adjustMany({ safetyAwareness: 8, consequenceAwareness: 4 }, `Braked within ${brake.reaction}s`); }
      else { sh.adjust('safetyAwareness', -4, `Slow braking reaction (${brake.reaction}s)`); neg.push('Braking came late.'); }
    } else if (app && !hitPed) { sh.adjustMany({ safetyAwareness: -15, responsibility: -10 }, 'Did not brake for the pedestrian'); neg.push('Never braked for the pedestrian.'); }
    else if (app && hitPed) { sh.adjustMany({ safetyAwareness: -20, responsibility: -15 }, 'Did not brake before the collision'); }
    if (stopped) { sh.adjustMany({ compassion: 25, responsibility: 15 }, 'Stopped and let the pedestrian cross'); pos.push('Stopped completely and gave the pedestrian the road.'); actions.push('Stopped the truck and waited for the pedestrian to cross.'); }
    const horns = this.events.filter((e) => e.type === 'horn');
    if (horns.some((h) => h.distance > 18 && h.pedState === 'crossing')) { sh.adjustMany({ consequenceAwareness: 5, compassion: 4 }, 'Warned the pedestrian with the horn in good time'); pos.push('Used the horn early as a warning.'); actions.push('Sounded the horn to warn the pedestrian.'); }
    else if (horns.some((h) => h.distance <= 8 && h.pedState === 'crossing')) { sh.adjust('consequenceAwareness', -4, 'Horn used only at the last moment, startling the pedestrian'); }
    if (nearMiss) { const nm = this.first('near_miss'); sh.adjustMany({ compassion: -15, safetyAwareness: -20, consequenceAwareness: -10 }, `Passed within ${nm.distance} m of the pedestrian at ${nm.speed} km/h`); neg.push(`Passed dangerously close (${nm.distance} m) to the pedestrian.`); actions.push(`Near miss: ${nm.distance} m from the pedestrian at ${nm.speed} km/h.`); cons.push('The pedestrian was badly frightened and could easily have been struck.'); }
    if (hitPed) { const c = this.events.find((e) => e.type === 'collision' && e.with === 'pedestrian'); sh.adjustMany({ compassion: -35, responsibility: -30, safetyAwareness: -30, consequenceAwareness: -20 }, `Struck the pedestrian at ${c.speed} km/h`); neg.push('The truck struck the pedestrian.'); actions.push(`Collided with the pedestrian at ${c.speed} km/h.`); cons.push('A person was seriously hurt. The delivery no longer matters.'); }
    if (hitWell || hitBarrier) {
      sh.adjustMany({ safetyAwareness: -12, consequenceAwareness: -18 }, `Collided with the roadside ${hitWell ? 'well' : 'barrier'}`);
      neg.push(`Hit the roadside ${hitWell ? 'well' : 'barrier'} while manoeuvring.`); actions.push(`Collided with the ${hitWell ? 'village well' : 'barrier'}.`);
      cons.push(hitWell ? 'The village well—its water source—was damaged and the truck took serious damage.' : 'The barrier was damaged and the truck took damage.');
      if (!hitPed && !nearMiss && app) { sh.adjust('compassion', 10, 'Accepted damage to the vehicle rather than endangering the person'); pos.push('Chose the obstacle over the person.'); }
    }
    if (otherHits.length) { sh.adjustMany({ safetyAwareness: -8, consequenceAwareness: -8 }, `Collided with ${otherHits.map((h) => h.with).join(', ')}`); neg.push('Collided with roadside objects.'); }
    const sw = this.first('swerve'); if (sw) { sh.adjustMany({ selfControl: -10, safetyAwareness: -8 }, `Swerved ${sw.dir} at ${sw.speed} km/h`); neg.push(`Swerved sharply at ${sw.speed} km/h instead of shedding speed first.`); actions.push(`Swerved ${sw.dir} at ${sw.speed} km/h.`); }
    if ((sum.overLimitSec || 0) > 5) { sh.adjustMany({ selfControl: -10, responsibility: -5 }, `Drove above the speed limit for ${sum.overLimitSec}s`); neg.push(`Exceeded the posted limits for ${sum.overLimitSec} seconds.`); }
    else if (app) { sh.adjust('selfControl', 6, 'Kept to the posted limits almost throughout'); }
    if ((sum.maxSpeedKmh || 0) > 85) sh.adjust('selfControl', -5, `Top speed ${sum.maxSpeedKmh} km/h`);
    if ((sum.offRoadSec || 0) > 2) { sh.adjust('responsibility', -5, `Drove on the shoulder for ${sum.offRoadSec}s`); }
    if (outcome === 'safe_pass') { sh.adjust('responsibility', 12, 'Completed the delivery without harming anyone'); pos.push('Completed the journey with everyone safe.'); cons.push('The pedestrian reached the other side; the goods were delivered; the village well is intact.'); }
    else if (outcome === 'pedestrian_endangered') cons.push('The goods arrived, but only luck separated this run from a tragedy.');
    else if (outcome === 'hit_hazard' || outcome === 'arrived_with_damage') cons.push('The goods arrived late and damaged; the roadside damage must be paid for.');
    else if (outcome === 'crash') { sh.adjustMany({ responsibility: -10, consequenceAwareness: -8 }, 'The truck was wrecked'); cons.push('The truck is wrecked; the delivery failed and the company bears the cost.'); }
    else if (outcome === 'timeout') { sh.adjust('responsibility', -8, 'Did not complete the delivery in time'); cons.push('The delivery never arrived.'); }
    const titles = { safe_pass: 'Safe passage', pedestrian_endangered: 'Arrived, but endangered the pedestrian', hit_hazard: 'Avoided the pedestrian, hit the roadside hazard', arrived_with_damage: 'Arrived after collisions', hit_pedestrian: 'Collision with the pedestrian', crash: 'Truck wrecked', timeout: 'Delivery not completed' };
    const success = outcome === 'safe_pass';
    const summary = { safe_pass: 'You reached the delivery point without harming the pedestrian or damaging the roadside.', pedestrian_endangered: 'You reached the delivery point, but you passed the pedestrian far too closely at speed.', hit_hazard: 'You avoided the pedestrian, but the truck struck the roadside hazard.', arrived_with_damage: 'You arrived, but collided with roadside objects on the way.', hit_pedestrian: 'The truck struck the pedestrian. The scenario ended there.', crash: 'A high-speed collision wrecked the truck.', timeout: 'Time ran out before you reached the delivery point.' }[outcome];
    const mentor = {
      summary: `A pedestrian stepped into the road near a village while a well and barriers limited your room to manoeuvre. ${summary}`,
      consequences: cons.join(' ') || 'The outcome followed directly from your speed, your braking and your steering.',
      principles: ['Ahimsa (non-harm)', 'Safety Awareness', 'Self-control', 'Responsibility for those outside the vehicle'],
      tradeoffs: 'Braking hard risks the cargo and a late delivery; swerving away from the person risks the well, the barrier or oncoming traffic; keeping speed protects the schedule but gambles with a life. The schedule is real, but it is the lightest of these duties.',
      didWell: pos, risks: neg,
      improve: app && app.speed > 42 ? 'Enter populated stretches at the posted limit. Almost every option you lacked at the crossing was lost earlier, when you chose your speed.' : stopped ? 'Your approach was sound. Keep scanning the kerb as well as the road—you will often see a pedestrian a second before they step out.' : 'Shed speed first, then steer. A slower truck has room to stop; a fast one only has room to choose what it hits.',
      theme: hitPed || nearMiss ? 'abhimanyu' : stopped ? 'yudhishthiraDog' : 'nishkamaKarma',
      reflection: 'If you had been the person stepping onto that road, how much speed would you have wanted the truck to carry?',
    };
    return { outcome: { title: titles[outcome] || outcome, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
