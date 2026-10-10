// GAME 5 — AN ACT OF COURAGE: a person in trouble at the canal; safe help vs. reckless heroics vs. walking away.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle } from '../engine/collision.js';

const RAVI = { x: 10, z: 7.2 };
const STEPS = { x0: 8.2, x1: 11.8 };

export class ActOfCourage extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0xd8c7b0, 60, 170);
    K.makeSky(s, { top: 0x5b6fa8, bottom: 0xf2c89a, horizon: 0xe8b07a });
    this.sun = K.makeSun(s, { position: [-60, 30, -40], intensity: 1.4, color: 0xffd9a8, shadowArea: 50 }); K.makeHemi(s, 0xcfd6ff, 0x5a5040, 0.7);
    s.add(K.makeGround(400, 0x6f6a5a));
    // canal: water from z=4 to z=18, banks concrete
    const water = K.makeWater(140, 14, { color: 0x2f5f6e, opacity: 0.9, y: -0.9 }); water.position.set(0, 0, 11); s.add(water); this.water = water; this.onUpdate((dt, t) => water.userData.update?.(t));
    for (const [z, w] of [[2, 4], [20, 4]]) { const bank = K.box(140, 1.2, w, 0x9a968c, { roughness: 1 }); bank.position.set(0, -0.6, z); bank.receiveShadow = true; s.add(bank); }
    const wallS = K.box(140, 1.6, 0.3, 0x87837a); wallS.position.set(0, -0.8, 4); s.add(wallS); const wallN = K.box(140, 1.6, 0.3, 0x87837a); wallN.position.set(0, -0.8, 18); s.add(wallN);
    // steps down to the water at x 8.2..11.8 (slippery)
    for (let i = 0; i < 4; i++) { const st = K.box(3.6, 0.25, 0.6, 0x6f8a84); st.position.set(10, -0.125 - i * 0.25, 4.3 + i * 0.6); st.receiveShadow = true; s.add(st); }
    // railing along the south bank with an opening at the steps
    const r1 = K.makeRailing(68); r1.position.set((-60 + STEPS.x0) / 2, 0, 3.7); s.add(r1); const r2 = K.makeRailing(56); r2.position.set((STEPS.x1 + 68) / 2, 0, 3.7); s.add(r2);
    this.addCollider(aabb(-70, 3.4, STEPS.x0, 4.2, 'railing')); this.addCollider(aabb(STEPS.x1, 3.4, 70, 4.2, 'railing'));
    this.addCollider(aabb(-70, 6.4, 70, 7, 'waterline')); // cannot walk past the bottom step
    this.addCollider(aabb(STEPS.x0 - 0.6, 4.2, STEPS.x0, 7, 'stepwall')); this.addCollider(aabb(STEPS.x1, 4.2, STEPS.x1 + 0.6, 7, 'stepwall'));
    const path = K.makePath(-70, 0, 70, 0, 4, 0xaaa394); s.add(path); s.add(K.makeRoadBetween(-70, -8, 70, -8, 7));
    // bridge at x=-32
    const bridge = K.box(6, 0.5, 20, 0x8a8580); bridge.position.set(-32, 1.0, 11); s.add(bridge); for (const sx of [-1, 1]) { const rail = K.makeRailing(20); rail.position.set(-32 + sx * 2.9, 1.25, 11); rail.rotation.y = Math.PI / 2; s.add(rail); } this.addCollider(aabb(-35.5, 2, -28.5, 20, 'bridge'));
    // far bank trees and buildings
    let seed = 11; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 18; i++) { const t = K.makeTree(1 + rnd() * 0.6, 1); t.position.set(-65 + i * 7.5, 0, 24 + rnd() * 6); s.add(t); }
    for (let i = 0; i < 6; i++) { const b = K.makeBuilding(10 + rnd() * 6, 7 + rnd() * 8, 8, [0xd9c9a8, 0xc9b9a0, 0xb0a090][i % 3]); b.position.set(-50 + i * 20, 0, 44); s.add(b); }
    for (let i = 0; i < 5; i++) { const b = K.makeBuilding(9, 6 + rnd() * 4, 8, 0xd5c5a5); b.position.set(-45 + i * 20, 0, -22); s.add(b); this.addCollider(aabb(-49.5 + i * 20, -26, -40.5 + i * 20, -18, 'building')); }
    for (const x of [-45, -15, 15, 45]) { const l = K.makeLamp(4.5); l.position.set(x, 0, 2.6); s.add(l); this.addCollider(circle(x, 2.6, 0.2, 'lamp')); }
    // lifebuoy stand near the bridge, tea stall with a bamboo pole
    const post = K.box(0.15, 1.8, 0.15, 0xc8452c); post.position.set(-25, 0.9, 2.2); s.add(post); this.buoy = K.makeLifebuoy(); this.buoy.position.set(-25, 1.4, 2.3); s.add(this.buoy);
    const bsign = K.makeSign('LIFEBUOY', { color: '#ffffff', fg: '#b00020', w: 1.2, h: 0.4, height: 2.1, fontSize: 60, post: false }); bsign.position.set(-25, 0, 2.2); bsign.rotation.y = Math.PI; s.add(bsign);
    const stall = K.makeStall('CHAI'); stall.position.set(22, 0, -3.5); stall.rotation.y = Math.PI; s.add(stall); this.addCollider(aabb(20.5, -4.3, 23.5, -2.7, 'stall'));
    this.pole = K.makePole(4); this.pole.position.set(24.2, 0.1, -3.2); this.pole.rotation.z = Math.PI / 2 - 0.25; s.add(this.pole);
    const danger = K.makeSign('DANGER', { color: '#ffd21f', lines: ['DANGER', 'SLIPPERY STEPS', 'STRONG CURRENT'], w: 1.6, h: 1.0, fontSize: 60 }); danger.position.set(12.6, 0, 2.6); danger.rotation.y = Math.PI; s.add(danger);
    // Ravi in the water, clinging to a post
    const rpost = K.cyl(0.12, 0.12, 1.6, 0x4a3a2a, 8); rpost.position.set(RAVI.x + 0.5, -0.4, RAVI.z); s.add(rpost);
    this.ravi = K.makeHuman({ shirt: 0xe0e0e0, pants: 0x334 }); this.ravi.position.set(RAVI.x, -1.2, RAVI.z); this.ravi.rotation.y = Math.PI; s.add(this.ravi); this.setLabel(this.ravi, 'Person in the water');
    // NPCs: tea stall owner, child near the edge, a passer-by on the bridge
    this.owner = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xd8a24a, pants: 0x4a3a2a }), x: 22, z: -1.6, yaw: 0 }), 'Tea-stall owner');
    this.child = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xff6a3a, pants: 0x3a3a6a, scale: 0.65 }), x: 15, z: 3.1, yaw: 0 }), 'Child');
    this.team = []; this.jeep = null;
    this.setupPlayer({ x: -6, z: -1, yaw: 0.6, bounds: { minX: -68, maxX: 68, minZ: -14, maxZ: 6.6 }, shirt: 0x2f5aa8 });
    this.state = { grip: this.diff(120, 95, 75), secured: null, carrying: null, called: false, calledAt: null, teamETA: null, teamArrived: false, ownerHelping: false, inWater: false, stepsTime: 0, pulling: 0, pullNeeded: 0, reassured: false, childWarned: false, raviState: 'clinging', ended: false };
    this.setupInteractions();
    this.camera.position.set(-2, 3, -6); this.camera.lookAt(10, 0, 7);
  }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'edge', x: 10, z: 3.0, y: 1.8, radius: 2.6, priority: 2, prompt: 'The edge — he is 3 metres out', onInteract: () => this.converse(() => this.atEdge()) });
    I.add({ id: 'buoy', x: -25, z: 1.6, y: 2.2, radius: 2, prompt: 'Take the lifebuoy', onInteract: () => this.converse(() => this.takeItem('buoy')) });
    I.add({ id: 'pole', x: 24.2, z: -2.4, y: 1.6, radius: 1.8, prompt: 'Take the bamboo pole', onInteract: () => this.converse(() => this.takeItem('pole')) });
    I.add({ id: 'owner', object: this.owner.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to the tea-stall owner', onInteract: () => this.converse(() => this.talkOwner()) });
    I.add({ id: 'child', object: this.child.mesh, x: 0, z: 0, radius: 2.2, priority: 1, prompt: 'Speak to the child at the edge', onInteract: () => this.converse(() => this.warnChild()) });
    I.add({ id: 'leave', x: -45, z: -1, y: 1.6, radius: 2.4, prompt: 'Walk away towards the market', markerColor: 0x9ad0ff, onInteract: () => this.converse(() => this.leave()) });
  }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('Someone is in the canal, holding on to a post. Decide what to do. <span class="kbd">P</span> phone · <span class="kbd">E</span> interact');
    this.hud().showTimer(true); this.hud().centerMessage('An Act of Courage', 2200);
    this.ctx.audio.startLoop('water-rush', { vol: 0.25 });
    this.after(1.5, () => this.hud().subtitle('Ravi', 'Help! I can’t— the current— please!', 5000));
    this.after(2, () => this.ctx.audio.sfx('warning'));
  }

  onSteps() { const p = this.player.pos; return p.z > 4.2 && p.x > STEPS.x0 && p.x < STEPS.x1; }

  async atEdge() {
    const st = this.state; if (st.raviState !== 'clinging' && st.raviState !== 'secured') return;
    const opts = [];
    if (!st.reassured) opts.push({ label: 'Call out: “Hold on! Help is coming — keep your head up!”', value: 'reassure' });
    if (st.carrying === 'buoy' && !st.secured) opts.push({ label: 'Throw the lifebuoy to him', value: 'throwBuoy' });
    if (st.carrying === 'pole' && !st.secured) opts.push({ label: 'Lie flat and extend the bamboo pole to him', value: 'pole' });
    if (st.secured) opts.push({ label: `Pull him to the steps with the ${st.secured === 'buoy' ? 'rope' : 'pole'}${st.ownerHelping ? ' (the stall owner anchors you)' : ' (alone, on slippery steps)'}`, value: 'pull' });
    opts.push({ label: 'Reach for his hand from the bottom step', value: 'reach', danger: true });
    opts.push({ label: 'Jump in and swim to him', value: 'jump', danger: true });
    opts.push({ label: 'Step back', value: 'back' });
    const r = await this.say('You', st.secured ? 'He is holding the ' + st.secured + ' now. His lips are blue — he needs to get out.' : 'The water is fast and brown. He is three metres out, clinging to a post, slipping.', opts);
    if (r === 'reassure') { st.reassured = true; st.grip += 15; this.record('reassured_victim'); this.hud().subtitle('Ravi', 'O-okay… okay. Please hurry.', 4000); }
    else if (r === 'throwBuoy') { st.secured = 'buoy'; st.carrying = null; this.refreshInv(); this.buoy.position.set(RAVI.x - 0.5, -0.7, RAVI.z - 0.3); this.buoy.rotation.x = Math.PI / 2; this.buoy.visible = true; this.record('threw_lifebuoy', { t: Math.round(this.time) }); this.ctx.audio.sfx('splash'); this.hud().subtitle('Ravi', 'Got it— got it!', 3000); this.hud().setObjective('He is holding the lifebuoy. Get him to the steps — ideally with someone anchoring you.'); }
    else if (r === 'pole') { st.secured = 'pole'; st.carrying = null; this.refreshInv(); this.pole.position.set(RAVI.x - 1.5, 0.1, 5.5); this.pole.rotation.set(0, Math.PI / 2, 0); this.pole.visible = true; this.record('extended_pole', { t: Math.round(this.time), fromSteps: this.onSteps() }); this.hud().subtitle('Ravi', 'I have it— don’t let go!', 3000); this.hud().setObjective('He is holding the pole. Pull him to the steps — ideally with someone anchoring you.'); }
    else if (r === 'pull') { if (!this.onSteps()) { this.notify('You need to be on the steps to pull him out.', 'info'); return; } st.pulling = 0.01; st.pullNeeded = st.ownerHelping ? 5 : 9; this.record('pulling', { withHelp: st.ownerHelping }); this.locked = true; this.hud().setProgress(1, { text: 'Pulling him in…', value: 0, kind: 'blue' }); }
    else if (r === 'reach') { this.record('reached_by_hand', { fromSteps: this.onSteps() }); if (!this.onSteps()) { await this.say('You', 'You lean over the railing. He is far beyond your reach; the wall is sheer. It is useless from here.'); return; } await this.say('You', 'You crouch on the lowest step and stretch. Your fingers brush his sleeve— and your foot slides on the moss.'); this.fallIn('reach'); }
    else if (r === 'jump') { this.record('jumped_in', { t: Math.round(this.time), secured: !!st.secured, called: st.called }); this.ctx.audio.sfx('splash'); await this.say('You', 'You jump. The cold punches the air out of you and the current is far stronger than it looked from the bank.'); this.fallIn('jump'); }
  }

  fallIn(how) {
    const st = this.state; st.inWater = true; this.locked = true; this.player.mesh.position.y = -1; this.hud().flash(false, 0.5); this.ctx.engine.addShake(0.6);
    this.record('player_in_water', { how, called: st.called, teamComing: !!st.teamETA });
    this.hud().setObjective('You are in the water with him.');
    const rescueBy = st.teamETA ? 'team' : 'owner';
    this.after(4, () => { if (rescueBy === 'owner' && !st.ownerHelping) { this.owner.setWaypoints([[10, 3]], false); this.notify('The tea-stall owner runs over with the pole and his son holds his belt.', 'info'); this.after(6, () => this.endWith('both_in_danger')); } else this.after(Math.max(2, (st.teamETA || this.time) - this.time), () => this.endWith('both_in_danger')); });
  }

  async takeItem(which) {
    const st = this.state; if (st.carrying) { this.notify(`You are already carrying the ${st.carrying === 'buoy' ? 'lifebuoy' : 'pole'}.`, 'info'); return; }
    st.carrying = which; this.record(which === 'buoy' ? 'took_lifebuoy' : 'took_pole', { t: Math.round(this.time) }); this.ctx.audio.sfx('pickup');
    (which === 'buoy' ? this.buoy : this.pole).visible = false; this.interact.setEnabled(which, false); this.refreshInv(); this.hud().setObjective(`You have the ${which === 'buoy' ? 'lifebuoy (with rope)' : 'bamboo pole'}. Get to the edge near him.`);
  }
  refreshInv() { const st = this.state; this.hud().setInventory(st.carrying ? [st.carrying === 'buoy' ? 'Lifebuoy with rope' : 'Bamboo pole (4 m)'] : null, 'Carrying'); }

  async talkOwner() {
    const st = this.state; this.owner.faceTowards(this.player.pos.x, this.player.pos.z);
    const opts = [];
    if (!st.called) opts.push({ label: 'Please call 112 — a man is in the canal!', value: 'call' });
    if (!st.ownerHelping) opts.push({ label: 'Come with me and anchor me at the steps.', value: 'help' });
    opts.push({ label: 'What can I use?', value: 'ask' }); opts.push({ label: 'Never mind', value: 'no' });
    const r = await this.say('Tea-stall owner', st.ownerHelping ? 'I’m with you. Tell me what to do.' : 'Bhaiya, I saw him go in near the bridge— I can’t swim and my knee is bad. What do you need?', opts);
    if (r === 'call') { this.record('asked_owner_to_call', { t: Math.round(this.time) }); this.placeCall(true); await this.say('Tea-stall owner', 'Calling… yes, canal road, by the chai stall, a man in the water— they say ten minutes. Hurry.'); }
    else if (r === 'help') { st.ownerHelping = true; this.record('asked_owner_help', { t: Math.round(this.time) }); this.owner.follow = true; this.interact.setRadius('owner', 1.3); await this.say('Tea-stall owner', 'Okay. I’ll hold your belt from the top step. Don’t go lower than the second step.'); }
    else if (r === 'ask') { this.record('asked_owner_resources'); await this.say('Tea-stall owner', 'There’s a lifebuoy with a rope by the bridge post, that way. My bamboo pole is behind the stall. And don’t go on those steps alone— the moss is like oil.'); }
  }

  async warnChild() {
    const st = this.state; if (st.childWarned) { await this.say('Child', 'I’m staying here, like you said.'); return; }
    const r = await this.say('Child', 'Is that uncle going to drown? Can I see?', [{ label: 'Step back from the edge, right now. Stand by the lamp post.', value: 'warn' }, { label: 'Not now.', value: 'no' }]);
    if (r === 'warn') { st.childWarned = true; this.record('warned_child'); this.child.setWaypoints([[15, -1.5]], false); await this.say('Child', 'Okay…'); }
  }

  placeCall(byOwner = false) {
    const st = this.state; if (st.called) return; st.called = true; st.calledAt = this.time; st.teamETA = this.time + this.diff(55, 65, 75); this.record('called_emergency', { t: Math.round(this.time), byOwner });
    this.ctx.audio.sfx('ring'); this.hud().setProgress(0, { text: 'Rescue team called — on the way', value: 0, kind: 'blue' });
  }

  async phone() {
    const st = this.state; if (st.called) { this.notify('112 has already been called. The team is on the way.', 'info'); return; }
    const r = await this.say('Phone', 'Dial 112?', [{ label: 'Call 112 — “A man is in the canal near the chai stall on Canal Road.”', value: 'call' }, { label: 'Put the phone away', value: 'no' }]);
    if (r === 'call') { this.placeCall(false); await this.say('112 operator', 'Understood: canal road, near the tea stall, one adult in the water. A rescue team is dispatched. Do not enter the water. If you can, throw something that floats and keep talking to him.'); }
  }

  async leave() {
    const st = this.state; const r = await this.say('You', 'Walk away from the canal?', [{ label: 'Walk away', value: 'yes', danger: !st.called }, { label: 'Stay', value: 'no' }]);
    if (r !== 'yes') return; this.record('left_scene', { called: st.called, secured: !!st.secured }); this.endWith(st.called ? 'left_after_calling' : 'left_without_helping');
  }

  spawnTeam() {
    const st = this.state; st.teamArrived = true; this.record('team_arrived', { t: Math.round(this.time) });
    const jeep = K.makeJeep(0xd84a2a); jeep.position.set(50, 0, -8); jeep.rotation.y = -Math.PI / 2; this.scene.add(jeep); this.jeep = jeep; this.ctx.audio.startLoop('siren', { vol: 0.08 });
    this.notify('A rescue team arrives.', 'good'); this.hud().setProgress(0, null);
    for (let i = 0; i < 2; i++) { const n = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xff7a1a, pants: 0x222 }), x: 50 - i, z: -6, speed: 3.2 })); n.collider.disabled = true; this.team.push(n); }
  }

  update(dt) {
    this.tick(dt); this.stepPlayer(dt); const st = this.state; const hud = this.hud();
    if (this.ctx.input.pressed('KeyP') && !this.ctx.dialogue.open && !this.locked) this.converse(() => this.phone());
    // Ravi
    if (st.raviState === 'clinging') { st.grip -= dt; hud.setTimer(st.grip, 20, 'His grip'); this.ravi.position.y = -1.2 + Math.sin(this.time * 2) * 0.08; this.ravi.rotation.z = Math.sin(this.time * 1.3) * 0.1; if (st.grip < 30 && !this.flags.weak) { this.flags.weak = true; hud.subtitle('Ravi', 'I can’t… hold… much longer…', 4000); } if (st.grip <= 0) { st.raviState = 'swept'; this.record('victim_lost_grip', { t: Math.round(this.time) }); this.ravi.visible = false; this.hud().flash(true, 0.5); this.ctx.audio.sfx('fail'); this.endWith(st.called ? 'lost_grip_help_coming' : 'lost_grip_no_help'); return; } }
    else if (st.raviState === 'secured') { hud.setTimerText(st.pulling > 0 ? 'Pulling him in' : 'Holding the float'); this.ravi.position.y = -1.0 + Math.sin(this.time * 2) * 0.06; st.securedTime = (st.securedTime || 0) + dt; if (st.securedTime > 150 && !st.called) { this.placeCall(true); this.notify('The stall owner has called 112 himself.', 'info'); } }
    if (st.secured && st.raviState === 'clinging') { st.raviState = 'secured'; }
    // steps slipperiness
    const onSteps = this.onSteps(); const ownerNear = st.ownerHelping && Math.hypot(this.owner.x - this.player.pos.x, this.owner.z - this.player.pos.z) < 4.5;
    if (onSteps && !ownerNear && !st.inWater) { st.stepsTime += dt; if (st.stepsTime > 2 && !this.flags.slipWarn) { this.flags.slipWarn = true; hud.setWarning('The steps are slick with moss — you are alone here'); this.after(2.5, () => hud.setWarning('')); } if (st.stepsTime > 7) { st.stepsTime = -99; this.record('slipped_on_steps', { pulling: st.pulling > 0 }); if (st.pulling > 0 && st.pulling >= st.pullNeeded * 0.6) { this.finishPull(true); } else { this.ctx.audio.sfx('splash'); this.notify('Your feet go out from under you.', 'bad'); this.fallIn('slip'); } } }
    else if (!onSteps) st.stepsTime = Math.max(0, st.stepsTime - dt);
    if (onSteps && !this.flags.stepsNote) { this.flags.stepsNote = true; this.record('went_down_steps', { withHelp: ownerNear }); }
    // pulling
    if (st.pulling > 0) { st.pulling += dt; hud.setProgress(1, { text: st.ownerHelping ? 'Pulling him in — the owner anchors you' : 'Pulling him in alone…', value: st.pulling / st.pullNeeded, kind: 'blue' }); this.ravi.position.x += (10 - this.ravi.position.x) * dt; this.ravi.position.z += (5.6 - this.ravi.position.z) * dt * 0.6; if (st.pulling >= st.pullNeeded) this.finishPull(false); }
    // owner following
    if (this.owner.follow) { const px = this.player.pos.x, pz = Math.min(3.7, this.player.pos.z); if (Math.hypot(this.owner.x - px, this.owner.z - pz) > 1.5) this.owner.setWaypoints([[px - 0.8, pz]], false); this.owner.speed = 2.2; }
    // emergency team
    if (st.teamETA) { if (!st.teamArrived) { hud.setProgress(0, { text: `Rescue team on the way — ${Math.max(0, Math.ceil(st.teamETA - this.time))} s`, value: 1 - (st.teamETA - this.time) / 65, kind: 'blue' }); if (this.time >= st.teamETA) this.spawnTeam(); }
      else { this.jeep.position.x = Math.max(16, this.jeep.position.x - 12 * dt); if (this.jeep.position.x <= 16.5) { if (!this.flags.teamRun) { this.flags.teamRun = true; this.team.forEach((n, i) => { n.teleport(16 - i, -5); n.setWaypoints([[10 + i * 0.8, 2.6]], false); }); this.after(7, () => { if (!this.finished) { this.record('team_rescued', { t: Math.round(this.time), playerInWater: st.inWater }); this.ravi.visible = false; this.ctx.audio.stopLoop('siren'); this.endWith(st.inWater ? 'both_in_danger' : 'rescued_by_emergency_team'); } }); } } } }
    if (this.time > 400 && !this.finished) { this.record('time_up'); this.endWith(st.called ? 'left_after_calling' : 'lost_grip_no_help'); }
  }

  finishPull(injured) {
    const st = this.state; st.pulling = 0; this.hud().setProgress(1, null); st.raviState = 'rescued'; this.ravi.position.set(10, 0.05, 3.2); this.ravi.rotation.set(0, 0, Math.PI / 2); this.locked = true;
    this.record('pulled_out', { withHelp: st.ownerHelping, injured, t: Math.round(this.time) }); this.ctx.audio.sfx('rescue');
    this.hud().subtitle('Ravi', injured ? 'You’re bleeding… thank you. Thank you.' : 'Thank you… thank you…', 5000);
    this.after(3, () => this.endWith(injured ? 'rescued_with_injury' : (st.ownerHelping ? 'rescued_safely' : 'rescued_alone')));
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.ctx.audio.stopLoop('water-rush'); this.ctx.audio.stopLoop('siren'); this.hud().setInventory(null); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const st = this.state;
    const call = this.first('called_emergency');
    if (call) { const early = call.t <= 40; sh.adjustMany({ responsibility: 15, practicalWisdom: early ? 15 : 10 }, `Emergency services called at ${call.t}s${call.byOwner ? ' (through the stall owner)' : ''}`); pos.push(early ? 'Called for professional help early.' : 'Called for professional help.'); actions.push(`Called 112 at ${call.t}s${call.byOwner ? ' via the stall owner' : ''}.`); }
    else { sh.adjustMany({ practicalWisdom: -12, responsibility: -8 }, 'Never called emergency services'); neg.push('Did not call 112.'); }
    if (this.has('reassured_victim')) { sh.adjust('compassion', 10, 'Kept the person calm and talking'); pos.push('Reassured him so he could hold on longer.'); actions.push('Called out to keep him calm.'); }
    if (this.has('warned_child')) { sh.adjustMany({ consequenceAwareness: 10, compassion: 5 }, 'Moved a child away from the edge'); pos.push('Noticed the child at the edge and moved her back.'); actions.push('Warned the child away from the edge.'); }
    else if (!['left_without_helping'].includes(outcome)) { sh.adjust('consequenceAwareness', -6, 'A child stayed at the water’s edge the whole time'); neg.push('The child stayed at the edge unnoticed.'); }
    if (this.has('threw_lifebuoy') || this.has('extended_pole')) { sh.adjustMany({ practicalWisdom: 15, safetyAwareness: 10 }, 'Used a reach-or-throw aid instead of entering the water'); pos.push('Used a safe rescue aid (reach or throw).'); actions.push(this.has('threw_lifebuoy') ? 'Threw the lifebuoy to him.' : 'Extended the bamboo pole to him.'); }
    if (this.has('asked_owner_help')) { sh.adjustMany({ practicalWisdom: 10, safetyAwareness: 6 }, 'Recruited a bystander to anchor the rescue'); pos.push('Got help instead of acting alone.'); actions.push('Asked the stall owner to anchor you.'); }
    if (this.has('went_down_steps') && !this.first('went_down_steps').withHelp) { sh.adjust('safetyAwareness', -10, 'Went down the slippery steps alone'); neg.push('Went down the slippery steps without anyone anchoring you.'); }
    if (this.has('jumped_in')) { const j = this.first('jumped_in'); sh.adjustMany({ safetyAwareness: -25, selfControl: -15, consequenceAwareness: -15, compassion: 8 }, `Jumped into fast water${j.secured ? ' even though he was already holding a float' : ''}`); neg.push('Entered fast-moving water yourself.'); actions.push('Jumped into the canal.'); cons.push('Two people needed rescuing instead of one.'); }
    if (this.has('reached_by_hand')) { sh.adjustMany({ safetyAwareness: -8, practicalWisdom: -5 }, 'Tried to reach by hand from a slippery step'); actions.push('Tried to reach him by hand.'); }
    if (this.has('slipped_on_steps')) { sh.adjust('consequenceAwareness', -6, 'Slipped on the steps you were warned about'); }
    const T = {
      rescued_safely: ['Rescued safely', 'You got him out with a float, an anchor and no new casualties.', true, () => { sh.adjustMany({ compassion: 25, responsibility: 15, safetyAwareness: 10 }, 'Completed a safe, assisted rescue'); cons.push('Ravi is cold and shaken but unharmed. Nobody else was endangered.'); }],
      rescued_alone: ['Rescued him alone', 'You pulled him out single-handed from the steps — it worked, and it could easily not have.', true, () => { sh.adjustMany({ compassion: 22, responsibility: 12, safetyAwareness: -4 }, 'Pulled him out alone from slippery steps'); cons.push('Ravi is safe. You were one slip away from joining him.'); }],
      rescued_with_injury: ['Rescued — you were hurt', 'You slipped during the pull but held on; he reached the steps, you wrenched your shoulder badly on the stone.', true, () => { sh.adjustMany({ compassion: 20, responsibility: 10, safetyAwareness: -8 }, st.ownerHelping ? 'Rescue succeeded but you were injured — your anchor was too far away to hold you' : 'Rescue succeeded but you were injured doing it alone'); cons.push(st.ownerHelping ? 'Ravi is safe. Your shoulder needs weeks of physiotherapy; an anchor within arm’s reach would have prevented it.' : 'Ravi is safe. Your shoulder needs weeks of physiotherapy; with an anchor you would have walked away.'); }],
      rescued_by_emergency_team: ['Rescued by the team', 'You kept him alive until professionals arrived and pulled him out.', true, () => { sh.adjustMany({ compassion: 15, responsibility: 10, practicalWisdom: 5, safetyAwareness: 8 }, 'Kept him alive and let trained rescuers finish the job'); cons.push('Ravi was pulled out by a trained team and taken for observation.'); if (!st.secured && !this.has('reassured_victim')) { sh.adjust('compassion', -8, 'Waited for the team without doing anything for him in the meantime'); neg.push('Did nothing to help him hold on while waiting.'); } }],
      both_in_danger: ['Both of you needed rescuing', 'You ended up in the water too and had to be pulled out along with him.', false, () => { sh.adjustMany({ responsibility: -10, safetyAwareness: -10 }, 'Became a second casualty'); cons.push(st.teamETA ? 'The rescue team pulled out two people instead of one.' : 'The stall owner and his son hauled you both out with the pole, barely.'); }],
      lost_grip_no_help: ['He was swept away', 'He lost his grip while nothing effective was done.', false, () => { sh.adjustMany({ compassion: -30, responsibility: -25, consequenceAwareness: -10 }, 'Watched without effective action until he was swept away'); cons.push('Ravi was found far downstream by a search team, in critical condition.'); }],
      lost_grip_help_coming: ['He was swept away before help arrived', 'You called for help, but nothing bridged the minutes until it came.', false, () => { sh.adjustMany({ compassion: -15, responsibility: -10 }, 'Called help but did nothing to help him hold on'); cons.push('The team arrived to an empty post. He was found downstream, critical.'); }],
      left_without_helping: ['Walked away', 'You left a drowning man without calling anyone.', false, () => { sh.adjustMany({ compassion: -35, responsibility: -30, consequenceAwareness: -10 }, 'Left the scene without helping or calling'); cons.push('Nobody else came in time.'); }],
      left_after_calling: ['Called, then left', 'You called 112 and walked away before anyone arrived.', false, () => { sh.adjustMany({ compassion: -8, responsibility: -10 }, 'Left before help arrived'); cons.push('The team arrived with no one to tell them where he was.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    const theme = this.has('jumped_in') ? 'abhimanyu' : outcome === 'left_without_helping' || outcome === 'lost_grip_no_help' ? 'draupadiQuestion' : success ? 'arjunaVishada' : 'dharmaSankata';
    const mentor = {
      summary: `Courage was never the question here—what kind of courage was. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Compassion that acts', 'Safety: do not create a second victim', 'Practical wisdom: reach, throw, call—before you go', 'Responsibility to see it through'],
      tradeoffs: 'Every second you spend fetching a float or calling for help is a second he is weaker—and every second you spend in the water is a second two people are drowning. The brave choice and the useful choice are not always the same, and the useful one is the duty.',
      didWell: pos, risks: neg,
      improve: this.has('jumped_in') ? 'Rescue professionals teach “reach, throw, row, go”—and “go” is for trained swimmers with equipment. Next time, your first two moves are the phone and the float.' : !call ? 'Call first. It costs ten seconds and it is the one action that works even if everything else you try fails.' : !this.has('asked_owner_help') && success ? 'You did well. One refinement: a second pair of hands on the bank turns a risky pull into a safe one.' : 'Keep this order: call, calm him, float, anchor, pull.',
      theme,
      reflection: 'If you had been the one in the water, which would you have wanted from the stranger on the bank—bravery, or a plan?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
