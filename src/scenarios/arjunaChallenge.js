// GAME 10 — THE ARJUNA CHALLENGE: a cinematic battlefield, a mentor, and the choice between hasty action, paralysis and informed resolve.
// NOTE: All dialogue here is original, written for this game. It is inspired by the themes of the Bhagavad Gita and
// the Mahabharata but is NOT a quotation or translation of scripture.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC, CinematicCamera } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle } from '../engine/collision.js';

const TOPICS = [
  { id: 'duty', label: 'Krishna — why must I raise my bow against my own teachers?', text: 'You did not make this war, Arjuna. You sat through the dice, the exile, the insult to Draupadi; you sent me to ask for five villages and were refused a needle’s point of land. What stands before you now is not a desire but a duty you accepted long ago: to protect the people who trusted your bow. Do not ask whether it is pleasant. Ask whether it is yours.' },
  { id: 'results', label: 'What if I fight and still lose everything?', text: 'Then you will have done what was yours to do, as well as it could be done. The outcome belongs to a thousand hands besides yours. A man who acts only when victory is promised is not acting from duty but from bargaining. Loosen your grip on the fruit; tighten it on the work.' },
  { id: 'uncertainty', label: 'I cannot see clearly what is right.', text: 'Clarity rarely arrives before action; it is usually its reward. Look at the field. Speak to those who will bear the cost. Notice whether your hesitation is wisdom or fear wearing wisdom’s clothes. Then act from steadiness, not from the storm.' },
  { id: 'anger', label: 'I am angry — at Duryodhana, at all of them.', text: 'Anger is a poor charioteer; it drives straight and sees nothing. A duty done in hatred wounds the one who does it, whatever it does to the enemy. If you go, go without hatred. If you stay, stay without fear. Either way, set the anger down first.', choice: true },
  { id: 'peace', label: 'Should I try once more for peace?', text: 'I went to Hastinapura myself and asked for five villages. Duryodhana said he would not give land enough to hold a needle. You may send one final message; it is not wrong to try the least harmful means again. But know that the answer has already been given, and the sun is climbing.', peace: true },
];

export class ArjunaChallenge extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0xe4b47a, 60, 260);
    K.makeSky(s, { top: 0x6a4a8a, bottom: 0xf4b870, horizon: 0xe59a55 });
    this.sun = K.makeSun(s, { position: [80, 25, 120], intensity: 1.6, color: 0xffc17a, shadowArea: 50 }); K.makeHemi(s, 0xd6b8ff, 0x6b4a2a, 0.75);
    const sunDisc = K.sphere(9, K.mat(0xffd27a, { emissive: 0xffb050, emissiveIntensity: 1.4 }), 24); sunDisc.position.set(120, 22, 200); s.add(sunDisc); this.sunDisc = sunDisc;
    s.add(K.makeGround(1600, 0x9a7a4c));
    const trampled = K.makePath(-120, 0, 120, 0, 60, 0x8c6d42); trampled.position.y = 0.015; s.add(trampled);
    // armies
    const foe = K.makeArmy({ rows: 7, cols: 46, spacing: 2.4, color: 0x8a2e2e, banner: 0xd4a63a, facing: 1 }); foe.position.set(0, 0, 62); s.add(foe);
    const own = K.makeArmy({ rows: 7, cols: 46, spacing: 2.4, color: 0x2e4a8a, banner: 0xf1c75b, facing: -1 }); own.position.set(0, 0, -58); s.add(own);
    this.addCollider(aabb(-80, 56, 80, 90, 'army')); this.addCollider(aabb(-80, -90, 80, -54, 'army'));
    this.addCollider(aabb(-200, -100, -60, 100, 'bounds')); this.addCollider(aabb(60, -100, 200, 100, 'bounds'));
    for (let i = 0; i < 12; i++) { const f = K.makeFlag(i % 2 ? 0xd4a63a : 0xb0372a, 7); f.position.set(-50 + i * 9, 0, 60); s.add(f); const f2 = K.makeFlag(i % 2 ? 0xf1c75b : 0x2f5aa8, 7); f2.position.set(-50 + i * 9, 0, -56); s.add(f2); }
    // elders' banners in the opposing front rank
    this.banners = [['BHISHMA', -18, 0xffffff], ['DRONA', 0, 0xd8c8a0], ['KRIPA', 18, 0xc0a0ff]].map(([name, x, col]) => { const f = K.makeFlag(col, 9); f.position.set(x, 0, 58); s.add(f); const lbl = K.makeTextBoard(name, { w: 4, h: 0.8, bg: '#1a1208', fg: '#f1c75b', fontSize: 70 }); lbl.position.set(x, 9.6, 58); lbl.rotation.y = Math.PI; s.add(lbl); return f; });
    // chariot with Krishna
    this.chariot = K.makeChariot(); this.chariot.position.set(0, 0, 0); s.add(this.chariot); this.addCollider(aabb(-1.3, -1.6, 1.3, 4.4, 'chariot'));
    this.krishna = K.makeKrishnaFigure(); this.krishna.position.set(0, 1.05, 0.6); this.chariot.add(this.krishna); this.setLabel(this.krishna, 'Krishna');
    this.bow = new THREE.Group(); const bowArc = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.035, 6, 24, Math.PI), K.mat(0xd4a63a, { metalness: 0.6, roughness: 0.4 })); bowArc.rotation.z = -Math.PI / 2; this.bow.add(bowArc); const string = K.box(0.01, 1.6, 0.01, 0xeeeeee); this.bow.add(string); this.bow.position.set(-1.9, 0.85, -0.6); this.bow.rotation.set(0, 0, 0.25); s.add(this.bow);
    const conch = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), K.mat(0xf7f1e2, { roughness: 0.3 })); conch.rotation.z = Math.PI / 2; conch.position.set(1.9, 0.25, -0.8); s.add(conch);
    const pot = K.cyl(0.2, 0.15, 0.4, 0xa0522d, 10); pot.position.set(1.6, 0.2, 2.4); s.add(pot); this.pot = pot;
    // mound, wounded soldier, midline markers
    const mound = new THREE.Mesh(new THREE.SphereGeometry(9, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), K.mat(0x8c6d42, { roughness: 1 })); mound.scale.set(1, 0.3, 1); mound.position.set(-28, 0, 8); mound.receiveShadow = true; s.add(mound);
    this.soldier = this.addNPC(new NPC({ mesh: K.makeWarriorFigure({ color: 0x2e4a8a }), x: 20, z: -10, yaw: -1 }), 'Wounded soldier'); this.soldier.mesh.rotation.z = 0.3; this.soldier.mesh.position.y = -0.1; this.soldier.frozen = true;
    for (let i = -5; i <= 5; i++) { const m = K.makeMarker(0xff6a3a, 1.2); m.position.set(i * 8, 0, 22); s.add(m); this.onUpdate((dt, t) => m.userData.update(t)); }
    const dust = K.makeParticles({ count: this.ctx.settings.get('particles') ? 400 : 100, color: 0xf1d2a0, size: 0.35, area: [140, 10, 120], center: [0, 4, 0], speed: 0.5, opacity: 0.35 }); s.add(dust); this.onUpdate((dt, t) => dust.userData.update?.(dt, t));
    this.cine = new CinematicCamera();
    this.setupPlayer({ x: -2.5, z: -3, yaw: 0, bounds: { minX: -55, maxX: 55, minZ: -50, maxZ: 54 }, shirt: 0xf1c75b, pants: 0xb0372a, camDist: 6 });
    this.state = { topics: new Set(), bow: false, water: false, helped: false, surveyed: false, elders: false, anger: null, peaceSent: false, peaceAnswered: false, decided: null, conch: false };
    this.timeLimit = this.diff(420, 360, 300);
    this.setupInteractions();
    this.camera.position.set(-10, 6, -18); this.camera.lookAt(0, 2, 30);
  }

  getIntro() { return { ...super.getIntro(), note: 'The dialogue in this scenario is original writing inspired by the themes of the Mahabharata and the Bhagavad Gita. It is not a quotation or translation of scripture.' }; }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'krishna', x: 0, z: -1.2, y: 2.8, radius: 3.2, prompt: 'Speak with Krishna', onInteract: () => this.converse(() => this.talkKrishna()) });
    I.add({ id: 'bow', x: -1.9, z: -0.6, y: 1.6, radius: 1.8, prompt: 'Take up the Gandiva bow', onInteract: () => this.converse(() => this.toggleBow()) });
    I.add({ id: 'conch', x: 1.9, z: -0.8, y: 1.4, radius: 1.8, prompt: 'Lift the conch (sound your resolve)', onInteract: () => this.converse(() => this.blowConch()) });
    I.add({ id: 'pot', x: 1.6, z: 2.4, y: 1.4, radius: 1.8, prompt: 'Take the water pot', onInteract: () => this.converse(() => this.takeWater()) });
    I.add({ id: 'mound', x: -28, z: 2, y: 1.8, radius: 3, prompt: 'Climb the mound and survey the field', onInteract: () => this.converse(() => this.survey()) });
    I.add({ id: 'soldier', object: this.soldier.mesh, x: 0, z: 0, radius: 2.4, prompt: 'Kneel by the wounded soldier', onInteract: () => this.converse(() => this.wounded()) });
    I.add({ id: 'elders', x: 0, z: 18, y: 2, radius: 4, prompt: 'Look closely at the opposing lines', onInteract: () => this.converse(() => this.lookAtElders()) });
  }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('Dawn at Kurukshetra. The conches will sound when the sun clears the horizon. Speak with Krishna, look at the field, and decide: proceed, delay, or lay down the bow.');
    this.hud().showTimer(true); this.hud().centerMessage('The Arjuna Challenge', 2600);
    this.ctx.audio.startLoop('wind', { vol: 0.2 });
    this.after(2.5, () => this.ctx.audio.sfx('drum'));
    this.after(4, () => this.hud().subtitle('Krishna', 'Take your time, Arjuna — but not all of it. The sun does not wait for certainty.', 5000));
  }

  reflection() { const st = this.state; return st.topics.size + (st.surveyed ? 1 : 0) + (st.elders ? 1 : 0) + (st.helped ? 1 : 0); }

  async talkKrishna() {
    const st = this.state; const remaining = TOPICS.filter((t) => !st.topics.has(t.id) && !(t.peace && st.peaceSent));
    const opts = remaining.map((t) => ({ label: t.label, value: t.id }));
    opts.push({ label: 'I have decided: I will fight.', value: 'fight' }); opts.push({ label: 'I have decided: I will not fight. I lay down the bow.', value: 'withdraw', danger: true }); opts.push({ label: 'Let me think.', value: 'no' });
    const r = await this.say('Krishna', remaining.length ? 'Ask what you need to ask.' : 'You have asked everything. What remains is yours.', opts);
    if (r === 'no') return;
    if (r === 'fight') return this.resolve('fight');
    if (r === 'withdraw') return this.resolve('withdraw');
    const t = TOPICS.find((x) => x.id === r); st.topics.add(t.id); this.record('dialogue', { topic: t.id, t: Math.round(this.time) });
    await this.say('Krishna', t.text);
    if (t.choice) { const a = await this.say('Krishna', 'So—what will you do with the anger?', [{ label: 'Help me set it down. I want to act clearly, whatever I choose.', value: 'down' }, { label: 'I will keep it. They will pay for every insult.', value: 'keep', danger: true }]); st.anger = a; this.record(a === 'down' ? 'set_down_anger' : 'embraced_anger'); await this.say('Krishna', a === 'down' ? 'Then breathe. Look at the field as it is, not as your wound paints it.' : 'Then it will drive you, and you will not like where it stops.'); }
    if (t.peace) { const p = await this.say('Krishna', 'Shall I send a rider with a final message?', [{ label: 'Yes. Send it.', value: 'yes' }, { label: 'No. The answer was given.', value: 'no' }]); if (p === 'yes') { st.peaceSent = true; this.record('sought_peace', { t: Math.round(this.time) }); this.notify('A rider gallops toward the Kaurava lines.', 'info'); this.hud().setProgress(0, { text: 'Awaiting the reply…', value: 0, kind: 'blue' }); this.peaceAt = this.time + 40; } }
    this.hud().setProgress(1, { text: `Reflection: ${this.reflection()} / 8`, value: this.reflection() / 8, kind: 'ok' });
  }

  async toggleBow() { const st = this.state; st.bow = !st.bow; this.bow.visible = !st.bow; this.record(st.bow ? 'took_bow' : 'set_down_bow', { t: Math.round(this.time) }); this.interact.setPrompt('bow', st.bow ? 'Set down the Gandiva bow' : 'Take up the Gandiva bow'); this.hud().setInventory(st.bow ? ['Gandiva (bow)', ...(st.water ? ['Water pot'] : [])] : st.water ? ['Water pot'] : null, 'Carrying'); this.notify(st.bow ? 'The bow is in your hand. Crossing the orange line with it means the charge has begun.' : 'You set the bow down against the chariot.', 'info'); }
  async takeWater() { const st = this.state; if (st.water) return; st.water = true; this.pot.visible = false; this.record('took_water'); this.hud().setInventory([...(st.bow ? ['Gandiva (bow)'] : []), 'Water pot'], 'Carrying'); }
  async wounded() {
    const st = this.state; if (st.helped) { await this.say('Wounded soldier', 'Go, my prince. I will watch.'); return; }
    const r = await this.say('Wounded soldier', 'My lord Arjuna… an arrow in the skirmish last night. Water, if there is any. I only want to see the sun come up.', st.water ? [{ label: 'Give him the water and bind the wound', value: 'help' }, { label: 'There is no time.', value: 'no' }] : [{ label: 'I will bring water.', value: 'fetch' }, { label: 'There is no time.', value: 'no' }]);
    if (r === 'help') { st.helped = true; st.water = false; this.record('helped_wounded', { t: Math.round(this.time) }); this.hud().setInventory(st.bow ? ['Gandiva (bow)'] : null, 'Carrying'); await this.say('Wounded soldier', 'Whatever you decide today… this was also a prince’s duty. Thank you.'); }
    else if (r === 'fetch') this.record('promised_water'); else this.record('ignored_wounded');
    this.hud().setProgress(1, { text: `Reflection: ${this.reflection()} / 8`, value: this.reflection() / 8, kind: 'ok' });
  }
  async lookAtElders() { const st = this.state; if (!st.elders) { st.elders = true; this.record('inspected_elders'); } await this.say('You', 'Under the white banner: Bhishma, who held you on his knee. Under the next: Drona, who put the first bow in your hands. Behind them, cousins you played with. The spears are real and so are the faces.'); this.hud().setProgress(1, { text: `Reflection: ${this.reflection()} / 8`, value: this.reflection() / 8, kind: 'ok' }); }

  async survey() {
    const st = this.state; if (st.surveyed) { this.notify('You have already surveyed the field.', 'info'); return; }
    st.surveyed = true; this.record('surveyed_field', { t: Math.round(this.time) }); this.locked = true; this.player.deactivate(); this.ctx.audio.sfx('whoosh');
    this.cine.play([
      { pos: [-28, 8, 6], look: [0, 2, 60], duration: 3 }, { pos: [-20, 14, 10], look: [40, 1, 65], duration: 3.5 }, { pos: [0, 18, 20], look: [-20, 1, 62], duration: 3.5 }, { pos: [10, 12, -10], look: [0, 1, -60], duration: 3 }, { pos: [-6, 5, -12], look: [0, 2, 2], duration: 2.5 },
    ], () => { this.locked = false; this.player.activate(); this.hud().subtitle('You', 'Two oceans of men, and a hundred faces you know in each.', 4500); this.hud().setProgress(1, { text: `Reflection: ${this.reflection()} / 8`, value: this.reflection() / 8, kind: 'ok' }); });
    this.hud().subtitle('Krishna', 'Look. All of it. Do not look away from any part of it.', 5000);
  }

  async blowConch() {
    const st = this.state; if (st.conch) return;
    const r = await this.say('You', 'Sounding the conch tells both armies that Arjuna is ready. It cannot be unsounded.', [{ label: 'Sound the conch', value: 'yes' }, { label: 'Not yet', value: 'no' }]);
    if (r !== 'yes') return; st.conch = true; this.record('sounded_conch', { t: Math.round(this.time), reflection: this.reflection() }); this.ctx.audio.sfx('conch'); this.ctx.engine.addShake(0.25);
    await this.say('Krishna', 'They heard you. Now say it to me, plainly.', [{ label: 'I will fight — steadily, without hatred, because it is mine to do.', value: 'fight' }, { label: '…I cannot. I lay down the bow.', value: 'withdraw' }]);
    return this.resolve(r === 'fight' ? 'fight' : 'withdraw');
  }

  async resolve(kind) {
    const st = this.state; const refl = this.reflection();
    if (kind === 'fight') { if (refl < 3) { const c = await this.say('Krishna', 'You have barely looked at the field or asked a single question. Is this resolve, or is it a wish to be done with deciding?', [{ label: 'It is resolve. I go now.', value: 'go', danger: true }, { label: 'You are right. Let me look first.', value: 'wait' }]); if (c === 'wait') { this.record('reconsidered_haste'); return; } this.record('resolved', { kind: 'hasty', reflection: refl }); return this.endWith('hasty_resolve'); } this.record('resolved', { kind: 'informed', reflection: refl, anger: st.anger }); await this.say('Krishna', st.anger === 'keep' ? 'Then go — but I will remind you of the anger every time it takes the reins.' : 'Then take up the bow, Arjuna. Not for victory, not for vengeance: because it is yours.'); return this.endWith(st.peaceAnswered ? 'sought_peace_then_resolved' : 'informed_resolve'); }
    if (refl < 3) { const c = await this.say('Krishna', 'You lay it down before you have looked. Grief is real; so are the people behind you who have no choice. Will you at least look first?', [{ label: 'No. I am leaving the field.', value: 'go', danger: true }, { label: 'Yes. Let me look.', value: 'wait' }]); if (c === 'wait') { this.record('reconsidered_withdrawal'); return; } this.record('resolved', { kind: 'withdrew_impulsively', reflection: refl }); return this.endWith('withdrew_impulsively'); }
    this.record('resolved', { kind: 'withdrew_after_reflection', reflection: refl }); await this.say('Krishna', 'You have looked, and you still choose this. I do not agree, and I will not pretend to. But a choice made with open eyes is at least a choice. Carry it honestly.'); return this.endWith('withdrew_after_reflection');
  }

  update(dt) {
    this.tick(dt);
    if (this.cine.active) { this.cine.update(dt, this.camera); for (const n of this.npcs) n.update(dt); } else this.stepPlayer(dt);
    const st = this.state; const remaining = this.timeLimit - this.time; this.hud().setTimer(remaining, 45, 'Sunrise');
    this.sunDisc.position.y = 22 + (this.time / this.timeLimit) * 30; this.sun.position.y = 25 + (this.time / this.timeLimit) * 30;
    if (st.peaceSent && !st.peaceAnswered && this.time >= this.peaceAt) { st.peaceAnswered = true; this.record('peace_refused', { t: Math.round(this.time) }); this.hud().setProgress(0, null); this.converse(async () => { await this.say('Rider', 'My lord— Duryodhana laughed. “Not a needle’s point.” Bhishma said nothing, but he did not look at me.'); }); }
    if (st.bow && this.player.pos.z > 22 && !this.finished) { this.record('crossed_line_with_bow', { t: Math.round(this.time), reflection: this.reflection() }); this.locked = true; this.ctx.audio.sfx('drum'); this.converse(async () => { await this.say('Krishna', 'Arjuna! Not like this— not alone, not in rage, before a word is spoken!'); this.endWith('charged_in_anger'); }); }
    if (remaining <= 60 && !this.flags.r60) { this.flags.r60 = true; this.hud().subtitle('Krishna', 'The sun is almost clear of the horizon.', 4000); }
    if (remaining <= 0 && !this.finished) { this.record('time_up', { reflection: this.reflection() }); this.ctx.audio.sfx('conch'); this.after(0.5, () => this.ctx.audio.sfx('drum')); this.converse(async () => { await this.say('Krishna', 'The conches of both sides. The field moves now, with you or without you.'); this.endWith('paralysis'); }); }
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.ctx.audio.stopLoop('wind'); this.hud().setInventory(null); if (outcome === 'informed_resolve' || outcome === 'sought_peace_then_resolved') this.ctx.audio.sfx('conch'); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const st = this.state; const refl = this.reflection();
    const topics = [...st.topics]; if (topics.length) { sh.adjust('practicalWisdom', Math.min(20, topics.length * 4), `Explored ${topics.length} question(s) with Krishna`); actions.push(`Asked Krishna about: ${topics.join(', ')}.`); if (topics.length >= 3) pos.push('Sought counsel before deciding.'); }
    else { sh.adjust('practicalWisdom', -8, 'Never asked the mentor beside you a single question'); neg.push('Did not consult Krishna.'); }
    if (st.surveyed) { sh.adjust('consequenceAwareness', 10, 'Surveyed the whole field before deciding'); pos.push('Looked at the full consequences of the choice.'); actions.push('Surveyed the field from the mound.'); }
    if (st.elders) { sh.adjustMany({ consequenceAwareness: 6, compassion: 4 }, 'Looked at the faces across the line'); actions.push('Looked closely at the opposing lines.'); }
    if (st.helped) { sh.adjust('compassion', 15, 'Gave water to a wounded soldier while the armies waited'); pos.push('Did a small duty of compassion in the middle of a large decision.'); actions.push('Gave water to the wounded soldier.'); }
    else if (this.has('ignored_wounded')) { sh.adjust('compassion', -8, 'Told a wounded man there was no time'); neg.push('Ignored the wounded soldier.'); }
    if (st.anger === 'keep') { sh.adjust('selfControl', -12, 'Chose to keep the anger'); neg.push('Kept hold of the anger.'); } else if (st.anger === 'down') { sh.adjust('selfControl', 10, 'Chose to set the anger down before acting'); pos.push('Set the anger down first.'); }
    if (st.peaceSent) { sh.adjustMany({ compassion: 8, practicalWisdom: 6, responsibility: 4 }, 'Tried the least harmful means one last time'); pos.push('Sent a final message of peace.'); actions.push('Sent a final peace message (refused).'); }
    if (this.has('reconsidered_haste') || this.has('reconsidered_withdrawal')) { sh.adjust('selfControl', 6, 'Paused when Krishna questioned a hasty decision'); pos.push('Accepted a challenge to a hasty choice.'); }
    const T = {
      informed_resolve: ['Informed resolve', 'You looked, asked, set the anger aside, and chose your duty with open eyes.', true, () => { sh.adjustMany({ dutyDiscernment: 25, responsibility: 15, selfControl: 8 }, 'Chose duty after genuine reflection'); cons.push('The conches sounded and you were steady behind them. Whatever the day brought, it did not find you unprepared.'); }],
      sought_peace_then_resolved: ['Peace sought, then resolve', 'You tried the least harmful path once more, were refused, and then chose with clear eyes.', true, () => { sh.adjustMany({ dutyDiscernment: 25, responsibility: 15, selfControl: 8, compassion: 4 }, 'Exhausted peaceful means before accepting the duty'); cons.push('No one could say afterwards that the war was for want of asking.'); }],
      hasty_resolve: ['Hasty resolve', 'You declared yourself ready before you had looked or asked.', false, () => { sh.adjustMany({ dutyDiscernment: -5, selfControl: -10, practicalWisdom: -8, responsibility: 5 }, 'Decided without reflection'); neg.push('Chose quickly, mainly to be done with choosing.'); cons.push('You went in with the facts you did not gather still waiting for you on the field.'); }],
      withdrew_after_reflection: ['Withdrew after reflection', 'You looked and asked, and still laid down the bow. Krishna disagreed—and respected that you had looked.', false, () => { sh.adjustMany({ dutyDiscernment: 5, compassion: 5, selfControl: 5, responsibility: -10 }, 'A considered choice that still left those depending on you without their protector'); cons.push('The people behind you had no such choice. The epic’s answer differs from yours; the game only asks that you reached yours honestly.'); }],
      withdrew_impulsively: ['Withdrew impulsively', 'You laid down the bow before looking at the field or asking a question.', false, () => { sh.adjustMany({ dutyDiscernment: -15, responsibility: -15, selfControl: -5 }, 'Abandoned the field on first grief'); neg.push('Walked away before understanding what you were walking away from.'); cons.push('Grief decided for you.'); }],
      charged_in_anger: ['Charged in anger', 'You crossed the line with the bow before any word was spoken.', false, () => { sh.adjustMany({ selfControl: -25, dutyDiscernment: -15, consequenceAwareness: -15, responsibility: -5 }, 'Charged alone, in rage, before the conches'); neg.push('Let anger drive the chariot.'); cons.push('A lone warrior ahead of his army is a target, not a vanguard.'); }],
      paralysis: ['Paralysis', 'The conches sounded and you had decided nothing.', false, () => { sh.adjustMany({ responsibility: -15, dutyDiscernment: -10, practicalWisdom: -5 }, 'Let the moment decide for you'); neg.push('Did not decide.'); cons.push('Not choosing is also a choice—one made without your consent.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    actions.push(`Reflection score at the decision: ${refl} / 8.`);
    const mentor = {
      summary: `Not a question of whether to be brave, but of what to be brave with: clarity or impulse. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Duty & discernment: what is mine to do?', 'Self-control: acting without anger or panic', 'Consequence awareness: look at the whole field', 'Practical wisdom: ask, listen, then act', 'Compassion even in the middle of a hard choice'],
      tradeoffs: 'Fighting meant raising a bow against teachers and kin; withdrawing meant abandoning the people who had no choice and had trusted yours. There was no painless path—only the difference between a choice made with open eyes and one made by fear, anger or the clock.',
      didWell: pos, risks: neg,
      improve: outcome === 'informed_resolve' || outcome === 'sought_peace_then_resolved' ? 'Carry this habit off the field: before any hard decision, survey, ask, set the anger down, then act.' : outcome === 'paralysis' ? 'Hesitation is wise only while it is gathering information. Give yourself a deadline inside the deadline.' : outcome === 'charged_in_anger' ? 'Anger wants speed. Deny it: ask one question, look once at the field, and see whether the charge still looks wise.' : outcome === 'hasty_resolve' ? 'Resolve made in a hurry is usually relief in disguise. Use the mentor beside you.' : 'Whatever you choose, let it be after you have looked at everyone your choice will touch.',
      theme: outcome === 'charged_in_anger' ? 'yudhishthiraDice' : outcome === 'paralysis' || outcome === 'withdrew_impulsively' ? 'arjunaVishada' : st.peaceSent ? 'krishnaEnvoy' : 'nishkamaKarma',
      reflection: 'Which of your own decisions this year was a Kurukshetra—and did you look at the whole field before you chose?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
