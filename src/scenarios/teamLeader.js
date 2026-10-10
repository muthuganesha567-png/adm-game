// GAME 4 — THE TEAM LEADER: fairness in credit, accountability to a professor, responding to a complaint.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle } from '../engine/collision.js';
import { openGamePanel } from '../ui/gamePanel.js';

const MEMBERS = [
  { id: 'priya', name: 'Priya', actual: 38, note: 'Built the forecasting model, wrote most of the report' },
  { id: 'rahul', name: 'Rahul', actual: 27, note: 'Data pipeline, two chapters, slides' },
  { id: 'sana', name: 'Sana', actual: 20, note: 'Testing module (delivered late), figures' },
  { id: 'you', name: 'You (lead)', actual: 10, note: 'Planning, coordination, one chapter' },
  { id: 'dev', name: 'Dev', actual: 5, note: 'Data cleaning started; hospitalised two weeks (informed the group)' },
];
const POINTS = 20;

export class TeamLeader extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = null; s.background = new THREE.Color(0x1a1f2b);
    K.makeHemi(s, 0xfff4e0, 0x6b6b70, 0.9);
    this.sun = K.makeSun(s, { position: [6, 9, -4], intensity: 1.1, shadowArea: 16 });
    const W = 16, D = 11, H = 3.8;
    const room = K.makeRoom(W, D, H, { wall: 0xe4e8ee, floor: 0x8e8578 }); s.add(room);
    const walls = [aabb(-W / 2 - 1, -D / 2 - 1, W / 2 + 1, -D / 2, 'wall'), aabb(-W / 2 - 1, D / 2, W / 2 + 1, D / 2 + 1, 'wall'), aabb(-W / 2 - 1, -D / 2, -W / 2, D / 2, 'wall'), aabb(W / 2, -D / 2, W / 2 + 1, D / 2, 'wall')];
    walls.forEach((c) => this.addCollider(c));
    const occl = [room];
    // windows on the +x wall
    for (let i = 0; i < 3; i++) { const w = K.makeWindowPane(2, 1.3); w.position.set(W / 2 - 0.12, 1.9, -3 + i * 3); w.rotation.y = Math.PI / 2; s.add(w); }
    // big screen on the -z wall, whiteboard on +z wall
    this.screen = K.makeBigScreen(4, 2.2, ['FINAL PROJECT REVIEW', 'Team 7 — Demand Forecasting', '', 'Credits: not prepared']); this.screen.position.set(0, 1.8, -D / 2 + 0.16); s.add(this.screen);
    const wb = K.makeWhiteboard(3.6, 1.4, ['SPRINT BOARD', 'Model ✔  Pipeline ✔  Report ✔', 'Testing ✔ (2 weeks late)', 'Review with Dr. Menon: TODAY']); wb.position.set(-3, 1.7, D / 2 - 0.16); wb.rotation.y = Math.PI; s.add(wb);
    // desks: Priya, Rahul, Sana, Dev (empty), your desk near the screen
    const deskAt = (x, z, ry, label) => { const d = K.makeDesk(); d.position.set(x, 0, z); d.rotation.y = ry; s.add(d); this.addCollider(aabb(x - 0.85, z - 0.45, x + 0.85, z + 0.45, 'desk')); const c = K.makeChair(); c.position.set(x + Math.sin(ry) * 0.7, 0, z + Math.cos(ry) * 0.7); c.rotation.y = ry + Math.PI; s.add(c); const t = K.makeTextBoard(label, { w: 0.9, h: 0.22, bg: '#2b3a5a', fg: '#ffffff', fontSize: 60 }); t.position.set(x, 0.95, z - Math.cos(ry) * 0.42 - 0.02); t.rotation.y = ry; s.add(t); return d; };
    deskAt(-5, -1.5, 0, 'PRIYA'); deskAt(-1.5, -1.5, 0, 'RAHUL'); deskAt(2, -1.5, 0, 'SANA'); deskAt(5.5, -1.5, 0, 'DEV');
    const mine = deskAt(0, -4, Math.PI, 'TEAM LEAD'); void mine;
    const cab = K.makeCabinet(); cab.position.set(-7.4, 0, 3.5); cab.rotation.y = Math.PI / 2; s.add(cab); this.addCollider(aabb(-7.7, 3.0, -7.1, 4.0, 'cabinet'));
    for (const [x, z] of [[7.3, 4.8], [-7.3, -4.8]]) { const p = K.makePlant(); p.position.set(x, 0, z); s.add(p); }
    const door = K.makeDoor(); door.position.set(6, 0, D / 2 - 0.1); door.rotation.y = Math.PI; s.add(door);
    const note = K.makeTextBoard('ON SICK LEAVE — DEV', { w: 0.6, h: 0.16, bg: '#fff3b0', fg: '#333', fontSize: 50 }); note.position.set(5.5, 0.78, -1.5); note.rotation.x = -Math.PI / 2; s.add(note);
    // NPCs
    this.priya = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xb8485f, pants: 0x2b2b3a }), x: -5, z: -0.7, yaw: Math.PI }), 'Priya');
    this.rahul = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x2f6fb0, pants: 0x1f1f2a }), x: -1.5, z: -0.7, yaw: Math.PI }), 'Rahul');
    this.sana = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x3f9a6a, pants: 0x3a3a4a }), x: 2, z: -0.7, yaw: Math.PI }), 'Sana');
    this.prof = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x5a4a3a, pants: 0x222 }), x: 6, z: D / 2 + 1.5, yaw: Math.PI })); this.prof.mesh.visible = false; this.prof.collider.disabled = true;
    this.setupPlayer({ x: 0, z: 1.2, yaw: Math.PI, bounds: { minX: -W / 2 + 0.5, maxX: W / 2 - 0.5, minZ: -D / 2 + 0.5, maxZ: D / 2 - 0.5 }, occluders: occl, camDist: 3.6, shirt: 0xd4a63a });
    this.player.p.camHeight = 1.45; this.player.camPitch = 0.1; this.player.p.minDist = 2.2;
    this.state = { alloc: null, lead: null, initialAlloc: null, revised: false, complaintPhase: null, submitted: false, professorAsked: false, responsibility: null };
    this.timeLimit = this.diff(480, 420, 360);
    this.setupInteractions();
    this.camera.position.set(4, 2.4, 4); this.camera.lookAt(0, 1, -2);
  }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'cabinet', x: -7, z: 3.5, y: 1.8, radius: 1.8, prompt: 'Read the project log (contribution records)', onInteract: () => this.converse(() => this.readLog()) });
    I.add({ id: 'priya', object: this.priya.mesh, x: 0, z: 0, radius: 2, prompt: 'Talk to Priya', onInteract: () => this.converse(() => this.talkPriya()) });
    I.add({ id: 'rahul', object: this.rahul.mesh, x: 0, z: 0, radius: 2, prompt: 'Talk to Rahul', onInteract: () => this.converse(() => this.talkRahul()) });
    I.add({ id: 'sana', object: this.sana.mesh, x: 0, z: 0, radius: 2, prompt: 'Talk to Sana', onInteract: () => this.converse(() => this.talkSana()) });
    I.add({ id: 'devdesk', x: 5.5, z: -0.6, y: 1.6, radius: 1.6, prompt: 'Read the note on Dev’s desk', onInteract: () => this.converse(async () => { this.record('read_dev_note'); await this.say('Note from Dev', '“Team — sorry. I was hospitalised with dengue for two weeks and told everyone on day one. I’ve finished what I could of the data cleaning (about 5%). I understand if the credits reflect that. — Dev”'); }) });
    I.add({ id: 'laptop', x: 0, z: -3.2, y: 1.6, radius: 1.8, prompt: 'Prepare the presentation credits (your laptop)', onInteract: () => this.converse(() => this.openAllocation(false)) });
    I.add({ id: 'screen', x: 0, z: -4.6, y: 2.6, radius: 2.2, prompt: 'Submit the presentation', enabled: false, onInteract: () => this.converse(() => this.submit()) });
    I.add({ id: 'prof', object: this.prof.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to Dr. Menon', enabled: false, onInteract: () => this.converse(() => this.talkProfessor()) });
  }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('The final review is today. Review your team’s work, then prepare the presentation credits at your laptop.');
    this.hud().showTimer(true); this.hud().centerMessage('The Team Leader', 2200);
    this.hud().controlsHint('<span class="kbd">W A S D</span> move · <span class="kbd">Mouse</span> look · <span class="kbd">E</span> interact');
    this.after(10, () => this.hud().controlsHint(''));
  }

  async readLog() {
    this.record('reviewed_log');
    await openGamePanel(this.ctx.uiRoot, { title: 'Project log — Team 7', sub: 'Repository commits, report pages and sprint records, compiled by the course tool.', render: (body, close, { el }) => {
      const rows = MEMBERS.map((m) => `<tr><td>${m.name}</td><td class="num">${m.actual}%</td><td>${m.note}</td></tr>`).join('');
      body.innerHTML = `<table><thead><tr><th>Member</th><th>Share of work</th><th>What</th></tr></thead><tbody>${rows}</tbody></table><p class="note">Sprint note: the testing module slipped two weeks because the cleaned data it depended on arrived late while Dev was in hospital. Nobody re-planned the dependency.</p>`;
      body.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', onClick: () => close(true) }, ['Close'])]));
    } });
  }

  async talkPriya() {
    this.priya.faceTowards(this.player.pos.x, this.player.pos.z);
    if (!this.has('talked_priya')) { this.record('talked_priya'); await this.say('Priya', 'The model is done and the report is in. I’d like one thing from you as lead: that the credits match the work. In the last meeting Rahul presented my charts as “our pipeline results” and nobody corrected him.'); return this.say('Priya', 'I’m not asking for a medal. Just don’t let the loudest voice decide.'); }
    if (this.state.complaintPhase === 'priya_complaint') return this.handlePriyaComplaint();
    await this.say('Priya', this.state.alloc ? 'You’ve done the sheet? Okay. Let’s get this review done.' : 'Let me know when the credit sheet is ready.');
  }

  async talkRahul() {
    this.rahul.faceTowards(this.player.pos.x, this.player.pos.z);
    if (!this.has('talked_rahul')) {
      this.record('talked_rahul');
      const r = await this.say('Rahul', 'Boss! So, credits. Honestly I carried this — the pipeline, slides, two chapters, I’d say fifty percent easy. Put me as lead presenter and give me the biggest share; we’ll both look great in front of Menon. My uncle runs that internship programme, by the way. I remember my friends.', [
        { label: 'The log says 27%, Rahul. The sheet will follow the log.', value: 'confront' }, { label: 'Sounds good. I’ll take care of you.', value: 'accept', danger: true }, { label: 'Noted. I’ll decide at the laptop.', value: 'noted' },
      ]);
      if (r === 'confront') { this.record('confronted_rahul'); await this.say('Rahul', 'Twenty-seven… Logs don’t measure impact. Fine. Do what you want.'); }
      else if (r === 'accept') { this.record('accepted_rahul_offer'); await this.say('Rahul', 'That’s what I like to hear. Internship forms close Friday — I’ll mention your name.'); }
      else { this.record('noted_rahul'); await this.say('Rahul', 'Sure, sure. Just remember who did the heavy lifting.'); }
      return;
    }
    if (this.state.complaintPhase === 'rahul_complaint') return this.handleRahulComplaint();
    await this.say('Rahul', 'Let’s wrap it up before Menon gets here.');
  }

  async talkSana() {
    this.sana.faceTowards(this.player.pos.x, this.player.pos.z);
    if (!this.has('talked_sana')) { this.record('talked_sana'); await this.say('Sana', 'Testing is finally green. I know it was late — I couldn’t test on data that didn’t exist yet, and when Dev went to hospital nobody re-assigned the cleaning, so I did half of it myself in week six.'); return this.say('Sana', 'If Dr. Menon asks why testing slipped… I just don’t want to be the one hung out to dry.'); }
    await this.say('Sana', 'Ready when you are.');
  }

  async openAllocation(revision) {
    const st = this.state; const start = st.alloc ? { ...st.alloc } : Object.fromEntries(MEMBERS.map((m) => [m.id, 4]));
    let lead = st.lead || null; const alloc = start;
    const total = () => Object.values(alloc).reduce((a, b) => a + b, 0);
    const result = await openGamePanel(this.ctx.uiRoot, { title: revision ? 'Revise the credit sheet' : 'Presentation credit sheet', sub: `Distribute <b>${POINTS} credit points</b> across the team (the department uses them for individual grades) and choose the lead presenter.${this.has('reviewed_log') ? '' : ' <span class="warn">You have not read the project log yet.</span>'}`, render: (body, close, { el, rerender }) => {
      const rows = MEMBERS.map((m) => el('tr', {}, [el('td', { text: m.name }), el('td', { text: this.has('reviewed_log') ? `${m.actual}%` : '—', class: 'num' }), el('td', {}, [el('div', { class: 'stepper' }, [el('button', { 'aria-label': `less for ${m.name}`, disabled: alloc[m.id] <= 0, onClick: () => { alloc[m.id]--; rerender(); } }, ['−']), el('span', { class: 'val', text: String(alloc[m.id]) }), el('button', { 'aria-label': `more for ${m.name}`, disabled: total() >= POINTS, onClick: () => { alloc[m.id]++; rerender(); } }, ['+'])])]), el('td', {}, [el('button', { class: `btn small ${lead === m.id ? 'primary' : ''}`, onClick: () => { lead = m.id; rerender(); } }, [lead === m.id ? 'Lead presenter ✔' : 'Make lead'])])]));
      const t = total(); const ok = t === POINTS && lead;
      body.append(el('table', {}, [el('thead', {}, [el('tr', {}, [el('th', { text: 'Member' }), el('th', { text: 'Logged share' }), el('th', { text: 'Credit points' }), el('th', { text: 'Presenter' })])]), el('tbody', {}, rows)]));
      body.append(el('div', { class: `total ${t === POINTS ? 'ok' : 'bad'}`, html: `Allocated: <b>${t} / ${POINTS}</b>${lead ? '' : ' · choose a lead presenter'}` }));
      body.append(el('div', { class: 'radio-list' }, [el('button', { onClick: () => { for (const m of MEMBERS) alloc[m.id] = 4; rerender(); } }, ['Preset: equal split']), el('button', { onClick: () => { const raw = MEMBERS.map((m) => m.actual / 5); const base = raw.map(Math.floor); let rem = POINTS - base.reduce((a, b) => a + b, 0); const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]); for (const [, i] of order) { if (rem <= 0) break; base[i]++; rem--; } MEMBERS.forEach((m, i) => { alloc[m.id] = base[i]; }); rerender(); } }, ['Preset: match the log'])]));
      body.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', disabled: !ok, onClick: () => close({ alloc: { ...alloc }, lead }) }, [revision ? 'Save revised sheet' : 'Save credit sheet']), el('button', { class: 'btn', onClick: () => close(null) }, ['Cancel'])]));
    } });
    if (!result) { this.record('allocation_cancelled'); return; }
    if (!st.initialAlloc) st.initialAlloc = { ...result.alloc, lead: result.lead };
    if (revision) st.revised = true;
    st.alloc = result.alloc; st.lead = result.lead;
    this.record(revision ? 'revised_allocation' : 'allocation_saved', { ...result.alloc, lead: result.lead, deviation: this.deviation(result.alloc) });
    this.ctx.audio.sfx('type');
    this.screen.userData.board.material.map = K.makeTextBoard('', { w: 4, h: 2.2, bg: '#13224a', fg: '#f1c75b', lines: ['FINAL PROJECT REVIEW', 'Team 7 — Demand Forecasting', `Lead presenter: ${MEMBERS.find((m) => m.id === result.lead).name}`, 'Credits: ' + MEMBERS.map((m) => `${m.name.split(' ')[0]} ${result.alloc[m.id]}`).join(' · ')], fontSize: 56 }).material.map;
    if (!revision && !st.professorAsked) { this.hud().setObjective('Credit sheet saved. Dr. Menon is on her way to the room.'); this.after(2.5, () => this.professorArrives()); }
    else { this.interact.setEnabled('screen', true); this.hud().setObjective('Submit the presentation at the big screen when you are ready.'); }
  }

  deviation(alloc) { let d = 0; for (const m of MEMBERS) { const exp = m.actual / 5; let a = alloc[m.id]; if (m.id === 'dev' && a > exp && a <= 3) a = exp; d += Math.abs(a - exp); } return Math.round(d * 10) / 10; }

  professorArrives() {
    const p = this.prof; p.mesh.visible = true; p.collider.disabled = false; p.teleport(6, 5.2); p.setWaypoints([[4, 2.5], [1.5, 1.5]], false); this.ctx.audio.sfx('notify');
    this.notify('Dr. Menon has entered the room.', 'info'); this.setLabel(p.mesh, 'Dr. Menon');
    this.interact.setEnabled('prof', true); this.hud().setObjective('Talk to Dr. Menon.');
  }

  async talkProfessor() {
    const st = this.state; this.prof.faceTowards(this.player.pos.x, this.player.pos.z);
    if (!st.professorAsked) {
      st.professorAsked = true;
      await this.say('Dr. Menon', 'Good. Before the review: the testing module was two weeks late and it cost the team the early-submission bonus. I need one sentence for my records. Who is responsible for that delay?');
      const r = await this.say('Dr. Menon', 'Well?', [
        { label: 'I am. When Dev fell ill I should have re-planned the dependency. I didn’t.', value: 'self' },
        { label: 'Dev. His data cleaning was the blocker.', value: 'dev', danger: true },
        { label: 'Sana. Testing is her module.', value: 'sana', danger: true },
        { label: 'Circumstances. Nobody in particular — the team adapted.', value: 'nobody' },
      ]);
      st.responsibility = r; this.record('responsibility_answer', { answer: r });
      if (r === 'self') await this.say('Dr. Menon', 'Noted. That is what a lead is for. Thank you for not making me drag it out of you.');
      else if (r === 'dev') await this.say('Dr. Menon', 'The student who was in hospital and informed the group on day one? …I will write that down exactly as you said it.');
      else if (r === 'sana') { await this.say('Dr. Menon', 'I see. Sana, did you hear that?'); this.sana.faceTowards(this.player.pos.x, this.player.pos.z); }
      else await this.say('Dr. Menon', '“Circumstances.” Projects have leads so that circumstances have an owner. Noted.');
      await this.say('Dr. Menon', 'Now send me the credit sheet. I will be back for the presentation in a few minutes.');
      this.prof.setWaypoints([[4, 3.5], [6, 5.4]], false); this.interact.setEnabled('prof', false);
      this.after(3, () => { this.prof.mesh.visible = false; this.prof.collider.disabled = true; this.after(2, () => this.startComplaintPhase()); });
      return;
    }
    await this.say('Dr. Menon', 'Submit when ready.');
  }

  startComplaintPhase() {
    const st = this.state; const a = st.alloc; if (!a) return;
    const unfairToPriya = a.priya < a.rahul || a.priya < 6 || (st.lead === 'rahul');
    const selfServing = a.you >= 5;
    if (unfairToPriya || selfServing) { st.complaintPhase = 'priya_complaint'; this.priya.setWaypoints([[this.player.pos.x + 1, this.player.pos.z + 1]], false); this.notify('Priya has seen the credit sheet and is coming over.', 'info'); this.hud().setObjective('Priya wants to talk about the credit sheet.'); this.interact.setPrompt('priya', 'Talk to Priya (she looks upset)'); }
    else { st.complaintPhase = 'rahul_complaint'; this.rahul.setWaypoints([[this.player.pos.x - 1, this.player.pos.z + 1]], false); this.notify('Rahul has seen the credit sheet and is coming over.', 'info'); this.hud().setObjective('Rahul wants to talk about the credit sheet.'); this.interact.setPrompt('rahul', 'Talk to Rahul (he looks annoyed)'); }
  }

  async handlePriyaComplaint() {
    const st = this.state; const a = st.alloc; st.complaintPhase = 'done';
    const r = await this.say('Priya', `I saw the sheet. I did the model and most of the report. ${a.you >= 5 ? `You gave yourself ${a.you} points for coordination,` : `Rahul gets ${a.rahul}, I get ${a.priya},`} ${st.lead === 'rahul' ? 'and Rahul presents my work. ' : ''}Is this what “fair” looks like to you?`, [
      { label: 'You’re right. Let me revise it now.', value: 'revise' }, { label: 'The sheet is final. Rahul has more experience presenting.', value: 'dismiss', danger: true }, { label: 'Leadership carries weight too. I stand by it.', value: 'justify', danger: true },
    ]);
    if (r === 'revise') { this.record('accepted_complaint'); await this.say('Priya', 'Thank you. That’s all I wanted.'); await this.openAllocation(true); if (!st.revised) { this.record('revision_abandoned'); } }
    else { this.record('dismissed_complaint', { reason: r }); await this.say('Priya', 'Right. I’ll remember that when the department asks for peer feedback.'); }
    this.priya.setWaypoints([[-5, -0.7]], false); this.interact.setPrompt('priya', 'Talk to Priya');
    this.interact.setEnabled('screen', true); this.hud().setObjective('Submit the presentation at the big screen.');
  }

  async handleRahulComplaint() {
    const st = this.state; st.complaintPhase = 'done';
    const r = await this.say('Rahul', `${st.alloc.rahul} points? Priya gets more than me? Come on. Bump me up — nobody checks these sheets against the log anyway.`, [
      { label: 'The sheet reflects the log. It stands.', value: 'hold' }, { label: 'Fine. I’ll move a couple of points to you.', value: 'cave', danger: true },
    ]);
    if (r === 'hold') { this.record('held_fair_allocation'); await this.say('Rahul', 'Unbelievable. Fine.'); }
    else { this.record('caved_to_rahul'); await this.say('Rahul', 'Knew you’d see sense.'); await this.openAllocation(true); }
    this.rahul.setWaypoints([[-1.5, -0.7]], false); this.interact.setPrompt('rahul', 'Talk to Rahul');
    this.interact.setEnabled('screen', true); this.hud().setObjective('Submit the presentation at the big screen.');
  }

  async submit() {
    const st = this.state; if (!st.alloc) { this.notify('Prepare the credit sheet first.', 'info'); return; }
    const r = await this.say('You', 'Submit the presentation with the current credit sheet? This is final.', [{ label: 'Submit', value: 'yes' }, { label: 'Not yet', value: 'no' }]);
    if (r !== 'yes') return;
    st.submitted = true; this.record('submitted', { ...st.alloc, lead: st.lead, deviation: this.deviation(st.alloc) }); this.ctx.audio.sfx('success');
    this.endWith(this.outcomeId());
  }

  outcomeId() {
    const st = this.state; if (!st.alloc) return 'no_allocation'; const d = this.deviation(st.alloc); const fair = d <= 4 && st.lead !== 'rahul' && st.alloc.you < 5;
    if (st.alloc.you >= 6 || (this.has('accepted_rahul_offer') && !fair)) return 'self_serving';
    if (fair && st.revised) return 'corrected_after_complaint';
    if (fair && st.responsibility === 'self') return 'fair_and_accountable';
    if (fair) return 'fair_allocation';
    return 'unfair_allocation';
  }

  update(dt) {
    this.tick(dt); this.stepPlayer(dt);
    const remaining = this.timeLimit - this.time; this.hud().setTimer(remaining, 30, 'Review in');
    if (remaining <= 60 && !this.flags.hurry) { this.flags.hurry = true; this.notify('Dr. Menon will be back in one minute.', 'info'); }
    if (remaining <= 0 && !this.finished) { this.record('time_up', { hadAllocation: !!this.state.alloc }); this.endWith(this.outcomeId()); }
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const st = this.state; const a = st.alloc;
    const name = (id) => MEMBERS.find((m) => m.id === id)?.name || id;
    if (this.has('reviewed_log')) { sh.adjustMany({ practicalWisdom: 12, dutyDiscernment: 6 }, 'Checked the contribution records before deciding'); pos.push('Based the decision on the project log, not on who talked loudest.'); actions.push('Read the project log.'); }
    else { sh.adjust('practicalWisdom', -10, 'Never checked the contribution records'); neg.push('Decided credits without looking at the record.'); }
    const talked = ['talked_priya', 'talked_rahul', 'talked_sana'].filter((e) => this.has(e)).length; if (talked === 3) { sh.adjust('practicalWisdom', 6, 'Heard every present team member'); pos.push('Listened to each team member.'); }
    if (this.has('read_dev_note')) { sh.adjust('dutyDiscernment', 5, 'Took Dev’s circumstances into account'); }
    if (this.has('confronted_rahul')) { sh.adjust('honesty', 8, 'Corrected Rahul’s inflated claim to his face'); pos.push('Pushed back on an exaggerated claim.'); }
    if (this.has('accepted_rahul_offer')) { sh.adjustMany({ honesty: -15, fairness: -10 }, 'Accepted a quid-pro-quo for credit'); neg.push('Traded credit for a personal favour.'); actions.push('Accepted Rahul’s offer.'); }
    if (a) {
      actions.push(`Credit sheet: ${MEMBERS.map((m) => `${m.name.split(' ')[0]} ${a[m.id]}`).join(', ')}; lead presenter ${name(st.lead)}.`);
      const d = this.deviation(a); const fairPts = Math.max(-30, Math.min(30, Math.round(30 - 4 * d)));
      sh.adjust('fairness', fairPts, `Final allocation deviates ${d} points from the recorded shares`);
      if (d <= 2.5) pos.push('Credits closely matched the recorded work.'); else if (d > 6) neg.push('Credits were far from the recorded contributions.');
      if (a.you >= 5) { sh.adjustMany({ honesty: -15, fairness: -10 }, `Gave yourself ${a.you} of 20 points for a 10% share`); neg.push('Inflated your own credit.'); }
      if (st.lead === 'priya') { sh.adjust('fairness', 8, 'Gave the lead presenter slot to the main contributor'); } else if (st.lead === 'rahul') { sh.adjust('fairness', -8, 'Rahul presents work that was mostly Priya’s'); } else if (st.lead === 'you') { sh.adjust('honesty', -4, 'Took the presenter slot yourself'); }
      if (a.dev >= 1 && a.dev <= 3) { sh.adjust('dutyDiscernment', 4, 'Kept Dev in the credits despite his absence'); } else if (a.dev === 0) { sh.adjust('dutyDiscernment', -4, 'Erased Dev from the credits entirely'); }
      if (st.initialAlloc && this.deviation(st.initialAlloc) > 4) cons.push('The first sheet was unfair enough that a teammate had to confront you.');
    } else { sh.adjustMany({ responsibility: -20, fairness: -10 }, 'Never prepared the credit sheet'); neg.push('The review arrived with no credit sheet.'); cons.push('The department assigned equal grades by default—Priya’s work went unrecognised.'); }
    const R = { self: ['Took responsibility for the late module as lead', { responsibility: 20, accountability: 20 }], dev: ['Blamed Dev, who was in hospital and had informed the team', { accountability: -15, fairness: -15, dutyDiscernment: -10 }], sana: ['Blamed Sana for a delay caused by a missing dependency', { accountability: -15, fairness: -10 }], nobody: ['Attributed the delay to “circumstances”', { accountability: -8, honesty: -4 }] };
    if (st.responsibility) { const [why, adj] = R[st.responsibility]; sh.adjustMany(adj, why); actions.push(`Told Dr. Menon: ${{ self: 'the delay was your responsibility', dev: 'Dev was responsible', sana: 'Sana was responsible', nobody: 'nobody in particular was responsible' }[st.responsibility]}.`); if (st.responsibility === 'self') pos.push('Owned the planning failure in front of the professor.'); else neg.push(st.responsibility === 'nobody' ? 'Avoided naming an owner for the delay—including yourself.' : `Shifted blame to ${name(st.responsibility)}.`); if (st.responsibility === 'dev') cons.push('Dev returns from hospital to find his name on the professor’s record for the delay.'); if (st.responsibility === 'sana') cons.push('Sana was marked down for a delay she worked overtime to contain.'); }
    else if (a) { sh.adjust('accountability', -6, 'Never spoke to Dr. Menon about the delay'); }
    if (this.has('accepted_complaint') && st.revised) { sh.adjustMany({ fairness: 10, accountability: 10 }, 'Revised an unfair sheet when challenged'); pos.push('Corrected the sheet after Priya’s complaint.'); actions.push('Revised the credit sheet after the complaint.'); }
    if (this.has('revision_abandoned')) { sh.adjust('honesty', -6, 'Promised to revise and then did not'); neg.push('Said you would revise the sheet, then kept it.'); }
    if (this.has('dismissed_complaint')) { sh.adjustMany({ fairness: -10, accountability: -10 }, 'Dismissed a legitimate complaint'); neg.push('Dismissed Priya’s complaint.'); cons.push('Priya raised it with the department in peer feedback.'); }
    if (this.has('held_fair_allocation')) { sh.adjustMany({ responsibility: 8, dutyDiscernment: 8 }, 'Held a fair allocation under pressure'); pos.push('Held the line when Rahul pushed for more.'); }
    if (this.has('caved_to_rahul')) { sh.adjustMany({ fairness: -12, responsibility: -6 }, 'Caved to pressure and moved points to Rahul'); neg.push('Gave in to Rahul’s pressure.'); }
    if (this.has('submitted')) { sh.adjust('responsibility', 6, 'Delivered the presentation on time'); } else { sh.adjust('responsibility', -8, 'The review began before you submitted'); }
    const titles = { fair_and_accountable: 'Fair credits, owned the delay', fair_allocation: 'Fair credits', corrected_after_complaint: 'Corrected after a complaint', unfair_allocation: 'Unfair credit sheet', self_serving: 'Self-serving credit sheet', no_allocation: 'No credit sheet prepared' };
    const summary = { fair_and_accountable: 'You matched credit to work, gave the floor to the person who earned it, and took responsibility for the planning failure.', fair_allocation: 'The credit sheet was fair, though you did not fully own the delay in front of the professor.', corrected_after_complaint: 'Your first sheet was unfair; when challenged you fixed it. The final sheet was fair.', unfair_allocation: 'The final credit sheet did not reflect the recorded work.', self_serving: 'You used the lead’s position to benefit yourself or a favoured teammate.', no_allocation: 'The review began with no credit sheet, so the department applied defaults.' }[outcome];
    const mentor = {
      summary: `Leadership was tested not by the work but by the division of its rewards. ${summary}`,
      consequences: cons.join(' ') || 'Grades followed your sheet; trust in the team followed how you handled the delay and the complaint.',
      principles: ['Fairness in attribution', 'Accountability for the plan', 'Honesty under flattery and pressure', 'Discernment: illness is not negligence'],
      tradeoffs: 'A fair sheet costs you Rahul’s goodwill and his uncle’s internship; an unfair one costs Priya her grade and the team its trust. Taking the blame costs a line in the professor’s record; passing it costs someone else far more.',
      didWell: pos, risks: neg,
      improve: !this.has('reviewed_log') ? 'Start with the record. Fairness without data is just a mood.' : st.responsibility !== 'self' ? 'When a dependency breaks on your watch, say so first. A lead who owns the plan can also be trusted to own the credit.' : st.revised ? 'Next time get the sheet right before someone has to ask—people remember having to ask.' : 'Keep doing this: check the record, hear everyone, decide, and stand behind it.',
      theme: st.responsibility === 'dev' || st.responsibility === 'sana' ? 'ashwatthama' : outcome === 'self_serving' ? 'duryodhanaEnvy' : outcome === 'fair_and_accountable' ? 'yudhishthiraTruth' : this.has('accepted_rahul_offer') ? 'karnaLoyalty' : 'bhishmaVow',
      reflection: 'Whose name did you protect today—and whose did you spend? Would you make the same trade if the roles were reversed?',
    };
    return { outcome: { title: titles[outcome] || outcome, summary, success: ['fair_and_accountable', 'fair_allocation', 'corrected_after_complaint'].includes(outcome) }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
