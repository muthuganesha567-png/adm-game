// GAME 8 — THE LAST RESOURCE: scarce relief supplies, six claimants, a carrying limit, and the chance to reconsider.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle } from '../engine/collision.js';
import { openGamePanel } from '../ui/gamePanel.js';

const ITEMS = { water: { name: 'Water (5 L)', short: 'Water' }, food: { name: 'Food packet', short: 'Food' }, med: { name: 'Medical kit', short: 'Med kit' }, blanket: { name: 'Blanket', short: 'Blanket' } };
const STOCK = { water: 6, food: 4, med: 2, blanket: 3 };
const CAPACITY = 4;
const PEOPLE = [
  { id: 'lakshmi', name: 'Lakshmi (elderly)', pos: [-14, -2], shirt: 0xb07a9a, needs: { med: 1, water: 2, food: 1 }, weights: { med: 3, water: 2, food: 1.5 }, intro: 'I am fine, beta. Give to the children first.', inspect: 'Her left shin is bandaged with a torn sari; the cloth is soaked through and the skin around it is red and hot. She has not had water since morning.', give: 'God bless you. I did not want to ask.' },
  { id: 'khan', name: 'The Khan family (5)', pos: [-10, 10], shirt: 0x3a6fa0, needs: { food: 3, water: 3, blanket: 2 }, weights: { food: 2, water: 2, blanket: 1.5 }, intro: 'Five of us, two small children. We have had nothing since yesterday. Anything — food, water, something for the night.', inspect: 'Two children, maybe four and six, quiet in the way hungry children go quiet. The parents have given them the last of their water.', give: 'Thank you. The children will eat first.' },
  { id: 'suresh', name: 'Suresh (fever)', pos: [2, 12], shirt: 0x8a8a5a, needs: { med: 1, blanket: 1, water: 1 }, weights: { med: 3, blanket: 2, water: 2 }, intro: '…cold. So cold. Is there a doctor?', inspect: 'He is shivering under a plastic sheet, skin burning, lips cracked. The kit has paracetamol and oral rehydration salts — exactly what he needs until the medical team comes tomorrow.', give: '…thank you…' },
  { id: 'meena', name: 'Meena (with infant)', pos: [12, 6], shirt: 0xd86a4a, needs: { water: 2, blanket: 1, food: 1 }, weights: { water: 3, blanket: 2, food: 2 }, intro: 'She is three months old. I cannot feed her if I do not drink. Please — water, and something to wrap her in tonight.', inspect: 'The baby is listless. Meena’s voice is hoarse; she has been giving every drop to the child.', give: 'Thank you. Thank you.' },
  { id: 'gopal', name: 'Gopal', pos: [7, -5], shirt: 0x5a5a5a, needs: { water: 1, food: 1 }, weights: { water: 1, food: 1 }, intro: 'Finally! I have a splitting headache— I need one of those medical kits. Now. And water. I’ve been waiting the longest.', inspect: 'He is sweaty and irritable but walking, talking and steady. A headache from the sun and no water. He needs a drink, not the kit.', give: 'About time.' },
  { id: 'volunteer', name: 'Volunteer (Arif)', pos: [4, -9], shirt: 0xf1c75b, needs: { water: 1 }, weights: { water: 1 }, intro: 'Ten hours on the pump. If there’s a spare water, I’ll take one — only if it’s spare. The families first.', inspect: 'Tired but fine. He means it about the families.', give: 'Cheers. Back to it.' },
];

export class LastResource extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0xc9a37a, 50, 150);
    K.makeSky(s, { top: 0x4d4e86, bottom: 0xf0b074, horizon: 0xe2985e });
    this.sun = K.makeSun(s, { position: [-70, 25, 30], intensity: 1.3, color: 0xffcf9a, shadowArea: 45 }); K.makeHemi(s, 0xc9b8ff, 0x6b5a3a, 0.7);
    s.add(K.makeGround(400, 0x8c7a58));
    s.add(K.makePath(0, -16, 0, 16, 3, 0xa08a62)); s.add(K.makePath(-18, 0, 18, 0, 3, 0xa08a62));
    // depot
    const depot = K.makeTent(0xdfd8bf, 7, 6); depot.position.set(0, 0, -13); s.add(depot); this.addCollider(aabb(-3.5, -16.5, 3.5, -13.2, 'tent'));
    const ds = K.makeTextBoard('RELIEF SUPPLIES', { w: 4, h: 0.6, bg: '#b03a2e', fg: '#fff', fontSize: 70 }); ds.position.set(0, 3.2, -10); s.add(ds);
    this.crates = {}; let i = 0; for (const k of Object.keys(ITEMS)) { const c = K.makeCrate([0x3a7fd0, 0xc98a3a, 0xd8d8d8, 0x8a5a9a][i], ITEMS[k].short.toUpperCase()); c.position.set(-2.4 + i * 1.6, 0, -11.2); s.add(c); this.crates[k] = c; this.addCollider(aabb(c.position.x - 0.4, -11.6, c.position.x + 0.4, -10.8, 'crate')); i++; }
    // tents for people
    this.people = {}; this.given = {}; this.inspected = {};
    for (const p of PEOPLE) {
      if (p.id !== 'volunteer' && p.id !== 'gopal') { const t = K.makeTent([0xd9c7a0, 0xc8d1c0, 0xd0b8a8, 0xbfc9d8][Object.keys(this.people).length % 4], 4, 4); t.position.set(p.pos[0], 0, p.pos[1] + 3.2); t.rotation.y = Math.PI; s.add(t); this.addCollider(aabb(p.pos[0] - 2, p.pos[1] + 1.4, p.pos[0] + 2, p.pos[1] + 5.2, 'tent')); }
      const n = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: p.shirt, pants: 0x3a3330, scale: p.id === 'lakshmi' ? 0.92 : 1 }), x: p.pos[0], z: p.pos[1], yaw: Math.atan2(-p.pos[0], -p.pos[1]) }), p.name);
      this.people[p.id] = n; this.given[p.id] = {}; this.inspected[p.id] = false;
      if (p.id === 'khan') { for (let k = 0; k < 2; k++) { this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xe0a04a, pants: 0x444, scale: 0.6 }), x: p.pos[0] - 1.2 + k * 2.4, z: p.pos[1] + 0.8, yaw: Math.PI })); } }
    }
    this.coord = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xffffff, pants: 0x223 }), x: -4.5, z: -9.5, yaw: Math.PI / 2 }), 'Camp coordinator');
    let seed = 9; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let k = 0; k < 14; k++) { const t = K.makeTent(0xcfc3a8, 3.5, 3.5); const ang = rnd() * Math.PI * 2, r = 24 + rnd() * 14; t.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r); t.rotation.y = -ang; s.add(t); }
    for (let k = 0; k < 12; k++) { const t = K.makeTree(1, 0.7 + rnd() * 0.5); const ang = rnd() * Math.PI * 2, r = 42 + rnd() * 20; t.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r); s.add(t); }
    for (const [x, z] of [[-6, -6], [6, 6], [-6, 6], [6, -14]]) { const l = K.makeLamp(4, true); l.position.set(x, 0, z); s.add(l); this.addCollider(circle(x, z, 0.2, 'lamp')); }
    for (const [x, z] of [[-18, 14], [18, -14], [-20, -14]]) { const f = K.makeFlag(0xd4a63a, 5); f.position.set(x, 0, z); s.add(f); }
    const dust = K.makeParticles({ count: this.ctx.settings.get('particles') ? 220 : 60, color: 0xf1d2a0, size: 0.25, area: [60, 6, 60], center: [0, 2.5, 0], speed: 0.25, opacity: 0.35 }); s.add(dust); this.onUpdate((dt, t) => dust.userData.update?.(dt, t));
    this.setupPlayer({ x: 0, z: -5, yaw: Math.PI, bounds: { minX: -30, maxX: 30, minZ: -30, maxZ: 30 }, shirt: 0xf1c75b });
    this.stock = { ...STOCK }; this.carry = { water: 0, food: 0, med: 0, blanket: 0 }; this.finalized = false; this.timeLimit = this.diff(420, 330, 270);
    this.setupInteractions();
    this.camera.position.set(8, 4, -20); this.camera.lookAt(0, 1, 0);
  }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'depot', x: 0, z: -10, y: 1.8, radius: 2.6, prompt: 'Supply crates — pick up / return items', onInteract: () => this.converse(() => this.depot()) });
    for (const p of PEOPLE) I.add({ id: p.id, object: this.people[p.id].mesh, x: 0, z: 0, radius: 2.2, prompt: `Talk to ${p.name}`, onInteract: () => this.converse(() => this.talk(p)) });
    I.add({ id: 'coord', object: this.coord.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to the coordinator', onInteract: () => this.converse(() => this.coordinator()) });
  }

  start() {
    super.start(); this.record('start', { stock: { ...STOCK } });
    this.hud().setObjective('Tonight’s last supplies: 6 water, 4 food, 2 medical kits, 3 blankets. Six people are asking. You can carry 4 items at a time. Decide who gets what, then confirm with the coordinator.');
    this.hud().showTimer(true); this.hud().centerMessage('The Last Resource', 2200); this.refreshHUD();
    this.ctx.audio.startLoop('crowd', { vol: 0.12 }); this.ctx.audio.startLoop('wind', { vol: 0.1 });
    this.after(3, () => this.hud().subtitle('Gopal', 'Hey! You with the supplies! Over here — I was first!', 4000));
  }

  carried() { return Object.values(this.carry).reduce((a, b) => a + b, 0); }
  refreshHUD() {
    const inv = Object.entries(this.carry).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].short} ×${n}`); this.hud().setInventory(inv.length ? inv : ['(empty)'], `Carrying ${this.carried()}/${CAPACITY}`);
    this.hud().setProgress(0, { text: `Depot stock — ${Object.entries(this.stock).map(([k, n]) => `${ITEMS[k].short} ${n}`).join(' · ')}`, value: Object.values(this.stock).reduce((a, b) => a + b, 0) / 15, kind: 'blue' });
    for (const [k, c] of Object.entries(this.crates)) c.visible = this.stock[k] > 0;
  }

  async stepperPanel({ title, sub, max, limits, okText }) {
    const pick = Object.fromEntries(Object.keys(ITEMS).map((k) => [k, 0]));
    const total = () => Object.values(pick).reduce((a, b) => a + b, 0);
    return openGamePanel(this.ctx.uiRoot, { title, sub, render: (body, close, { el, rerender }) => {
      const rows = Object.keys(ITEMS).map((k) => el('tr', {}, [el('td', { text: ITEMS[k].name }), el('td', { class: 'num', text: String(limits[k]) }), el('td', {}, [el('div', { class: 'stepper' }, [el('button', { disabled: pick[k] <= 0, onClick: () => { pick[k]--; rerender(); } }, ['−']), el('span', { class: 'val', text: String(pick[k]) }), el('button', { disabled: pick[k] >= limits[k] || (max !== null && total() >= max), onClick: () => { pick[k]++; rerender(); } }, ['+'])])])]));
      body.append(el('table', {}, [el('thead', {}, [el('tr', {}, [el('th', { text: 'Item' }), el('th', { text: 'Available' }), el('th', { text: 'Select' })])]), el('tbody', {}, rows)]));
      body.append(el('div', { class: `total ${max !== null && total() >= max ? 'bad' : ''}`, html: max !== null ? `Selected: <b>${total()} / ${max}</b>` : `Selected: <b>${total()}</b>` }));
      body.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', disabled: total() === 0, onClick: () => close({ ...pick }) }, [okText]), el('button', { class: 'btn', onClick: () => close(null) }, ['Cancel'])]));
    } });
  }

  async depot() {
    const r = await this.say('Supply crates', `Stock: ${Object.entries(this.stock).map(([k, n]) => `${ITEMS[k].short} ${n}`).join(', ')}. You carry ${this.carried()}/${CAPACITY}.`, [
      { label: 'Pick up items', value: 'pick' }, ...(this.carried() > 0 ? [{ label: 'Put items back', value: 'return' }] : []), { label: 'Close', value: 'no' },
    ]);
    if (r === 'pick') { const room = CAPACITY - this.carried(); if (room <= 0) { this.notify('Your arms are full. Deliver something first.', 'info'); return; } const sel = await this.stepperPanel({ title: 'Pick up supplies', sub: `You can carry <b>${room}</b> more item(s).`, max: room, limits: { ...this.stock }, okText: 'Pick up' }); if (!sel) return; for (const k of Object.keys(sel)) { this.stock[k] -= sel[k]; this.carry[k] += sel[k]; } this.record('picked_up', sel); this.ctx.audio.sfx('pickup'); }
    else if (r === 'return') { const sel = await this.stepperPanel({ title: 'Return supplies to the depot', sub: '', max: null, limits: { ...this.carry }, okText: 'Put back' }); if (!sel) return; for (const k of Object.keys(sel)) { this.stock[k] += sel[k]; this.carry[k] -= sel[k]; } this.record('returned_to_depot', sel); this.ctx.audio.sfx('drop'); }
    this.refreshHUD();
  }

  async talk(p) {
    const npc = this.people[p.id]; npc.faceTowards(this.player.pos.x, this.player.pos.z);
    const givenTxt = Object.entries(this.given[p.id]).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].short} ×${n}`).join(', ');
    const opts = [];
    if (!this.inspected[p.id]) opts.push({ label: 'Look closer / ask about their condition', value: 'inspect' });
    if (this.carried() > 0) opts.push({ label: 'Give items', value: 'give' });
    if (givenTxt) opts.push({ label: `Take back items (given so far: ${givenTxt})`, value: 'takeback', danger: true });
    opts.push({ label: 'Leave', value: 'no' });
    const r = await this.say(p.name, this.inspected[p.id] ? p.inspect : p.intro, opts);
    if (r === 'inspect') { this.inspected[p.id] = true; this.record('inspected', { who: p.id, t: Math.round(this.time) }); await this.say('You', p.inspect); return this.talk(p); }
    if (r === 'give') { const sel = await this.stepperPanel({ title: `Give to ${p.name}`, sub: this.inspected[p.id] ? `<i>${p.inspect}</i>` : 'You have not looked closely at their condition.', max: null, limits: { ...this.carry }, okText: 'Give' }); if (!sel) return; for (const k of Object.keys(sel)) { this.carry[k] -= sel[k]; this.given[p.id][k] = (this.given[p.id][k] || 0) + sel[k]; } this.record('gave', { who: p.id, ...sel, inspected: this.inspected[p.id] }); this.ctx.audio.sfx('chime'); this.hud().subtitle(p.name.split(' ')[0], p.give, 3500); if (p.id === 'gopal' && sel.med > 0) this.record('med_to_gopal'); this.refreshHUD(); }
    if (r === 'takeback') { const sel = await this.stepperPanel({ title: `Take back from ${p.name}`, sub: 'Reconsidering is allowed — but it is not pleasant for them.', max: CAPACITY - this.carried(), limits: { ...this.given[p.id] }, okText: 'Take back' }); if (!sel) return; for (const k of Object.keys(sel)) { this.carry[k] += sel[k]; this.given[p.id][k] -= sel[k]; } this.record('took_back', { who: p.id, ...sel }); this.ctx.audio.sfx('drop'); this.hud().subtitle(p.name.split(' ')[0], p.id === 'gopal' ? 'Are you serious?!' : 'I… understand.', 3000); this.refreshHUD(); }
  }

  async coordinator() {
    this.coord.faceTowards(this.player.pos.x, this.player.pos.z);
    const left = Object.values(this.stock).reduce((a, b) => a + b, 0) + this.carried();
    const r = await this.say('Coordinator', `${left > 0 ? `${left} item(s) are still undistributed. ` : 'Everything has been handed out. '}Shall I close tonight’s distribution? Once I log it, that is it until the truck tomorrow.`, [{ label: 'Yes — close the distribution', value: 'yes' }, { label: 'Not yet, I want to reconsider', value: 'no' }]);
    if (r !== 'yes') { this.record('reconsidered_before_finalizing'); return; }
    this.record('finalized', { stockLeft: { ...this.stock }, carrying: { ...this.carry } }); this.endWith(this.outcomeId());
  }

  satisfaction() {
    let num = 0, den = 0; for (const p of PEOPLE) for (const [k, need] of Object.entries(p.needs)) { const w = p.weights[k]; den += w; num += w * Math.min(1, (this.given[p.id][k] || 0) / need); } return den ? num / den : 0;
  }
  outcomeId() {
    const S = this.satisfaction(); const gaveAny = PEOPLE.some((p) => Object.values(this.given[p.id]).some((n) => n > 0));
    if (!gaveAny) return 'nothing_distributed'; if (this.has('med_to_gopal') && (this.given.gopal.med || 0) > 0) return 'misallocated_medicine';
    if (S >= 0.75) return 'well_prioritized'; if (S >= 0.55) return 'reasonable_distribution'; return 'poor_distribution';
  }

  update(dt) {
    this.tick(dt); this.stepPlayer(dt);
    const remaining = this.timeLimit - this.time; this.hud().setTimer(remaining, 45, 'Nightfall');
    if (this.time > 25 && !this.flags.gopalNag) { this.flags.gopalNag = true; this.hud().subtitle('Gopal', 'I said I need the medical kit! My head is killing me!', 4000); }
    if (remaining <= 0 && !this.finished) { this.record('time_up'); this.notify('Night has fallen; the coordinator closes the distribution.', 'info'); this.endWith(this.outcomeId()); }
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.ctx.audio.stopLoop('crowd'); this.ctx.audio.stopLoop('wind'); this.hud().setInventory(null); this.hud().setProgress(0, null); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = [];
    const S = this.satisfaction(); const pct = Math.round(S * 100);
    actions.push(`Need-weighted coverage: ${pct}%.`);
    for (const p of PEOPLE) { const g = Object.entries(this.given[p.id]).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].short} ×${n}`).join(', '); actions.push(`${p.name}: ${g || 'nothing'}${this.inspected[p.id] ? ' (assessed)' : ''}.`); }
    sh.adjust('compassion', Math.round(45 * S - 12), `Covered ${pct}% of the most urgent needs`);
    const insp = Object.values(this.inspected).filter(Boolean).length; if (insp) { sh.adjust('practicalWisdom', Math.min(15, insp * 3), `Assessed ${insp} of 6 people before deciding`); if (insp >= 4) pos.push('Assessed people’s real condition instead of taking claims at face value.'); }
    else { sh.adjust('practicalWisdom', -10, 'Distributed without assessing anyone'); neg.push('Never looked closely at who needed what.'); }
    const gaveUninspected = this.events.filter((e) => e.type === 'gave' && !e.inspected).length; if (gaveUninspected >= 3) { sh.adjust('consequenceAwareness', -8, 'Handed out supplies to several people without checking their needs'); }
    for (const id of ['lakshmi', 'suresh']) { if ((this.given[id].med || 0) > 0) { sh.adjustMany({ practicalWisdom: 10, dutyDiscernment: 6 }, `A medical kit reached ${id === 'lakshmi' ? 'Lakshmi’s infected wound' : 'Suresh’s fever'}`); pos.push(`Medical kit went to ${id === 'lakshmi' ? 'Lakshmi' : 'Suresh'}, who needed it.`); } else if (outcome !== 'nothing_distributed') { neg.push(`${id === 'lakshmi' ? 'Lakshmi' : 'Suresh'} did not receive a medical kit.`); } }
    if ((this.given.gopal.med || 0) > 0) { sh.adjustMany({ practicalWisdom: -15, fairness: -10, consequenceAwareness: -8 }, 'Gave a scarce medical kit to the loudest, healthiest claimant'); neg.push('A medical kit went to Gopal’s headache instead of a fever or an infected wound.'); cons.push('Someone genuinely ill went without medicine tonight because someone healthy shouted.'); }
    if (this.has('med_to_gopal') && (this.given.gopal.med || 0) === 0) { sh.adjust('dutyDiscernment', 8, 'Gave Gopal the kit, then took it back and redirected it'); pos.push('Corrected a misallocation after reconsidering.'); }
    let waste = 0; for (const p of PEOPLE) for (const [k, n] of Object.entries(this.given[p.id])) waste += Math.max(0, n - (p.needs[k] || 0)); if (waste) { sh.adjust('fairness', -Math.min(20, waste * 5), `${waste} item(s) given beyond anyone’s need while others went short`); neg.push('Gave some people more than they needed while others had nothing.'); }
    const left = Object.values(this.stock).reduce((a, b) => a + b, 0) + this.carried(); if (left > 0 && S < 0.98) { sh.adjust('responsibility', -Math.min(15, left * 3), `${left} item(s) left undistributed while needs remained`); neg.push(`${left} item(s) were never handed out.`); cons.push('Supplies sat in the depot overnight while people did without.'); }
    const quiet = Object.values(this.given.lakshmi).reduce((a, b) => a + b, 0), loud = Object.values(this.given.gopal).reduce((a, b) => a + b, 0); if (loud > quiet && outcome !== 'nothing_distributed') { sh.adjust('fairness', -8, 'The loudest claimant received more than the quietest, who was worse off'); neg.push('Gopal received more than Lakshmi.'); } else if (quiet > 0 && insp >= 2) { sh.adjust('fairness', 8, 'Prioritised the person who would not ask for herself'); pos.push('Looked after the person who said “give to the children first”.'); }
    const khan = this.given.khan; if ((khan.food || 0) >= 2 && (khan.water || 0) >= 2) { sh.adjust('compassion', 5, 'The family with two small children was fed and watered'); }
    if (this.has('took_back') && !this.has('med_to_gopal')) { sh.adjust('dutyDiscernment', 4, 'Reconsidered an allocation to improve it'); }
    if (this.has('reconsidered_before_finalizing')) { sh.adjust('consequenceAwareness', 4, 'Paused before closing the distribution'); }
    const T = {
      well_prioritized: ['Well prioritised', 'The scarce items reached the people who needed them most.', true, () => { sh.adjust('responsibility', 12, 'Completed a thoughtful distribution'); cons.push('Suresh’s fever broke by morning; Lakshmi’s wound was cleaned; the Khan children slept.'); }],
      reasonable_distribution: ['Reasonable distribution', 'Most urgent needs were met; some priorities were missed.', true, () => { sh.adjust('responsibility', 6, 'Completed the distribution'); cons.push('Most people got through the night; a few did not get what they needed most.'); }],
      poor_distribution: ['Poorly targeted', 'Supplies went out, but not to where they were most needed.', false, () => { sh.adjust('responsibility', -4, 'Distribution left the most urgent needs unmet'); cons.push('By morning the medical team found an untreated fever and an infected wound that a kit could have handled.'); }],
      misallocated_medicine: ['Medicine misallocated', 'A scarce medical kit went to someone who did not need it.', false, () => { cons.push('The kits were the one item that could not be improvised.'); }],
      nothing_distributed: ['Nothing distributed', 'Night fell with the supplies still in the depot.', false, () => { sh.adjustMany({ responsibility: -25, compassion: -20 }, 'Distributed nothing'); cons.push('Six people waited for a decision that never came.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    const mentor = {
      summary: `Not enough for everyone, and six good reasons to be first in line. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Compassion measured by need, not by volume', 'Fairness under scarcity', 'Practical wisdom: assess before you allocate', 'Discernment: the kit that cannot be improvised goes where only a kit will do'],
      tradeoffs: 'Every item given to one person was taken from another. The headache was real and so was the fever; the difference was what each could survive without. Scarcity does not excuse us from choosing—it is exactly when choosing matters.',
      didWell: pos, risks: neg,
      improve: insp < 4 ? 'Walk the whole camp before you hand out the first item. Ten minutes of looking changes everything you give.' : (this.given.gopal.med || 0) > 0 ? 'Volume is not urgency. When a claim is loud, look twice; when a claim is silent, look three times.' : left > 0 ? 'Finish the job: supplies left in a depot overnight help nobody.' : 'This was well done. Keep assessing first, and keep the courage to take something back when you were wrong.',
      theme: outcome === 'well_prioritized' ? 'yudhishthiraDog' : (this.given.gopal.med || 0) > 0 ? 'karnaCharity' : outcome === 'nothing_distributed' ? 'draupadiQuestion' : 'dharmaSankata',
      reflection: 'Who in the camp would never have complained if you had forgotten them—and did you remember them anyway?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
