// GAME 7 — THE HONEST EMPLOYEE: a wrong figure in a safety-critical report, a deadline, and a colleague who asks for silence.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle } from '../engine/collision.js';
import { openGamePanel } from '../ui/gamePanel.js';

export class HonestEmployee extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = null; s.background = new THREE.Color(0x151a24);
    K.makeHemi(s, 0xfff6e8, 0x5a5a60, 0.95); this.sun = K.makeSun(s, { position: [-5, 9, 5], intensity: 1.0, shadowArea: 18 });
    const W = 20, D = 12, H = 3.8;
    const room = K.makeRoom(W, D, H, { wall: 0xe6e9ee, floor: 0x6f7c8a }); s.add(room);
    [aabb(-W / 2 - 1, -D / 2 - 1, W / 2 + 1, -D / 2, 'wall'), aabb(-W / 2 - 1, D / 2, W / 2 + 1, D / 2 + 1, 'wall'), aabb(-W / 2 - 1, -D / 2, -W / 2, D / 2, 'wall'), aabb(W / 2, -D / 2, W / 2 + 1, D / 2, 'wall')].forEach((c) => this.addCollider(c));
    for (let i = 0; i < 4; i++) { const w = K.makeWindowPane(2.4, 1.3); w.position.set(-7 + i * 4.6, 1.9, -D / 2 + 0.12); s.add(w); }
    // manager cabin (glass) at +x end
    const glass = K.makeWindowPane(D - 4, 2.6); glass.position.set(5.5, 1.3, -1); glass.rotation.y = Math.PI / 2; glass.material = glass.material.clone(); glass.material.opacity = 0.25; s.add(glass); this.addCollider(aabb(5.4, -D / 2, 5.6, 3, 'glass'));
    const cabinDoor = K.makeDoor(0x6b4a2b, 1.0, 2.1); cabinDoor.position.set(5.5, 0, 4.9); cabinDoor.rotation.y = Math.PI / 2; s.add(cabinDoor); this.addCollider(aabb(5.4, 4.4, 5.6, D / 2, 'glass'));
    const cabinSign = K.makeTextBoard('R. IYER — QA MANAGER', { w: 2.2, h: 0.3, bg: '#2b3a5a', fg: '#fff', fontSize: 60 }); cabinSign.position.set(5.45, 2.75, 1); cabinSign.rotation.y = -Math.PI / 2; s.add(cabinSign);
    const deskAt = (x, z, ry, label) => { const d = K.makeDesk(); d.position.set(x, 0, z); d.rotation.y = ry; s.add(d); this.addCollider(aabb(x - 0.85, z - 0.45, x + 0.85, z + 0.45, 'desk')); const c = K.makeChair(); c.position.set(x + Math.sin(ry) * 0.7, 0, z + Math.cos(ry) * 0.7); c.rotation.y = ry + Math.PI; s.add(c); if (label) { const t = K.makeTextBoard(label, { w: 0.9, h: 0.22, bg: '#2b3a5a', fg: '#ffffff', fontSize: 60 }); t.position.set(x, 0.95, z - Math.cos(ry) * 0.42); t.rotation.y = ry; s.add(t); } return d; };
    deskAt(-6, -2, 0, 'YOU — QA ENGINEER'); deskAt(-2, -2, 0, 'MEERA — QA'); deskAt(-6, 2.5, Math.PI, null); deskAt(-2, 2.5, Math.PI, null); deskAt(8, 0, -Math.PI / 2, 'MANAGER');
    const cab = K.makeCabinet(0x7d8389, 5); cab.position.set(-9.4, 0, -4.5); cab.rotation.y = Math.PI / 2; s.add(cab); this.addCollider(aabb(-9.7, -5, -9.1, -4, 'cabinet'));
    const cabLabel = K.makeTextBoard('INSPECTION LOGS', { w: 0.8, h: 0.18, bg: '#fff', fg: '#111', fontSize: 50 }); cabLabel.position.set(-9.1, 1.5, -4.5); cabLabel.rotation.y = Math.PI / 2; s.add(cabLabel);
    const shredder = K.box(0.5, 0.8, 0.4, 0x2a2d33); shredder.position.set(-9.4, 0.4, 4.5); s.add(shredder); this.addCollider(aabb(-9.7, 4.3, -9.1, 4.7, 'shredder'));
    const shredLabel = K.makeTextBoard('SHREDDER', { w: 0.5, h: 0.14, bg: '#222', fg: '#fff', fontSize: 50 }); shredLabel.position.set(-9.1, 0.95, 4.5); shredLabel.rotation.y = Math.PI / 2; s.add(shredLabel);
    const nb = K.makeNoticeBoard(['SPEAK UP — COMPLIANCE', 'Concerns about reports,', 'safety or conduct can be', 'filed confidentially in the', 'box below. No retaliation.']); nb.position.set(2, 0, D / 2 - 0.2); nb.rotation.y = Math.PI; s.add(nb); this.addCollider(aabb(0.8, D / 2 - 0.5, 3.2, D / 2, 'board'));
    const box = K.box(0.4, 0.3, 0.25, 0xb03a2e); box.position.set(2, 1.0, D / 2 - 0.45); s.add(box); const boxPost = K.box(0.1, 0.85, 0.1, 0x555); boxPost.position.set(2, 0.42, D / 2 - 0.45); s.add(boxPost);
    const screen = K.makeBigScreen(3, 1.6, ['Q3 QUALITY AUDIT', 'Client: Metro Rail Corp.', 'Submission: 17:00 today']); screen.position.set(0, 1.9, -D / 2 + 0.16); s.add(screen);
    for (const [x, z] of [[9.2, -5], [-9.2, 0], [4.5, 5]]) { const p = K.makePlant(); p.position.set(x, 0, z); s.add(p); }
    const door = K.makeDoor(); door.position.set(-4, 0, D / 2 - 0.1); door.rotation.y = Math.PI; s.add(door);
    // NPCs
    this.meera = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x7a4ab0, pants: 0x222 }), x: -2, z: -1.2, yaw: Math.PI }), 'Meera');
    this.iyer = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xeeeeee, pants: 0x1f2430 }), x: 7.2, z: 0, yaw: -Math.PI / 2 }), 'Mr. Iyer');
    this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x3a8a6a }), x: -6, z: 3.2, yaw: 0 }), 'Colleague');
    this.setupPlayer({ x: -4, z: 2, yaw: Math.PI, bounds: { minX: -W / 2 + 0.5, maxX: W / 2 - 0.5, minZ: -D / 2 + 0.5, maxZ: D / 2 - 0.5 }, occluders: [room], camDist: 3.6, shirt: 0xd4a63a });
    this.player.p.camHeight = 1.45; this.player.camPitch = 0.1; this.player.p.minDist = 2.2;
    this.state = { readReport: false, verified: false, corrected: false, changeLog: null, sent: false, logsTaken: false, shredded: false, informedManager: false, managerStance: null, meeraStance: null, compliance: null, lied: false };
    this.timeLimit = this.diff(420, 360, 300);
    this.setupInteractions();
    this.camera.position.set(-2, 2.5, 5); this.camera.lookAt(-4, 1, -2);
  }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'pc', x: -6, z: -1.3, y: 1.6, radius: 1.7, prompt: 'Use your computer (Q3 audit report)', onInteract: () => this.converse(() => this.computer()) });
    I.add({ id: 'cabinet', x: -9, z: -4.5, y: 1.9, radius: 1.8, prompt: 'Open the inspection log cabinet', onInteract: () => this.converse(() => this.cabinet()) });
    I.add({ id: 'shredder', x: -9, z: 4.5, y: 1.4, radius: 1.6, prompt: 'Shredder', marker: false, onInteract: () => this.converse(() => this.shred()) });
    I.add({ id: 'meera', object: this.meera.mesh, x: 0, z: 0, radius: 2, prompt: 'Talk to Meera', onInteract: () => this.converse(() => this.talkMeera()) });
    I.add({ id: 'iyer', object: this.iyer.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to Mr. Iyer', onInteract: () => this.converse(() => this.talkIyer()) });
    I.add({ id: 'compliance', x: 2, z: 5.1, y: 1.9, radius: 1.8, prompt: 'Compliance box', onInteract: () => this.converse(() => this.complianceBox()) });
  }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('The Q3 quality audit goes to Metro Rail at 17:00. You are the co-signing QA engineer. Review it at your computer.');
    this.hud().showTimer(true); this.hud().centerMessage('The Honest Employee', 2200);
    this.ctx.audio.startLoop('hum', { vol: 0.12 });
  }

  reportHTML() {
    const st = this.state; const row = st.corrected ? '<span class="wrong">0</span> <span class="fixed">3 (2 reworked and re-tested, 1 pending re-inspection)</span>' : '<span class="hl">0</span>';
    return `<div class="doc"><h4>Q3 QUALITY AUDIT — Structural Weld Components</h4><p><b>Client:</b> Metro Rail Corporation &nbsp; <b>Prepared by:</b> Meera N. (QA) &nbsp; <b>Co-signed:</b> You (QA Engineer)</p><p><b>Section 4 — Batch results</b></p><table><tr><th>Batch</th><th>Units</th><th>Weld failures</th><th>Disposition</th></tr><tr><td>15</td><td>120</td><td>1</td><td>Reworked, re-tested OK</td></tr><tr><td>16</td><td>140</td><td>0</td><td>—</td></tr><tr><td>17</td><td>160</td><td>${row}</td><td>${st.corrected ? 'See change log' : '—'}</td></tr></table><p><b>Section 7 — Declaration:</b> “All non-conformances for the period are disclosed above.”</p>${st.changeLog ? `<p><b>Change log:</b> ${st.changeLog}</p>` : ''}</div>`;
  }

  async computer() {
    const st = this.state; if (!st.readReport) { st.readReport = true; this.record('read_report'); }
    const choice = await openGamePanel(this.ctx.uiRoot, { title: 'Q3 audit report — draft for submission', sub: st.verified ? 'You have checked the batch-17 inspection logs: they record <b>3 weld failures</b>, not 0.' : 'Batch 17 is the one you tested last month. Does that figure look right?', render: (body, close, { el }) => {
      body.innerHTML = this.reportHTML();
      const row = el('div', { class: 'btn-row' });
      if (st.verified && !st.corrected && !st.shredded) row.append(el('button', { class: 'btn primary', onClick: () => close('correct') }, ['Correct the batch-17 figures']));
      row.append(el('button', { class: `btn ${st.corrected ? 'primary' : 'danger'}`, onClick: () => close('send') }, [st.corrected ? 'Send the corrected report to Metro Rail' : 'Send the report as it is']));
      row.append(el('button', { class: 'btn', onClick: () => close(null) }, ['Close']));
      body.append(row);
    } });
    if (choice === 'correct') return this.correctReport();
    if (choice === 'send') return this.sendReport();
  }

  async correctReport() {
    const st = this.state;
    const how = await this.say('You', 'You update Section 4: batch 17 — 3 weld failures, 2 reworked and re-tested, 1 pending re-inspection. How do you record the change?', [
      { label: 'Add a change-log entry: “Template error found in review; corrected by [you] with Meera.”', value: 'log' },
      { label: 'Just overwrite the number. No note.', value: 'quiet' },
    ]);
    st.corrected = true; st.changeLog = how === 'log' ? 'Section 4 corrected after review of inspection logs; template carried over from Q2. Corrected by QA Engineer with Meera N.' : null;
    this.record('corrected_report', { changeLog: how === 'log' }); this.ctx.audio.sfx('type');
    this.notify(how === 'log' ? 'Report corrected with a transparent change log.' : 'Figures corrected silently.', how === 'log' ? 'good' : 'info');
    this.hud().setObjective('The figures are corrected. Send the report from your computer — or talk to Meera / Mr. Iyer first.');
  }

  async sendReport() {
    const st = this.state;
    const r = await this.say('You', st.corrected ? 'Send the corrected report to Metro Rail now?' : st.verified ? 'Send the report with “0 weld failures” for batch 17, knowing the logs show 3?' : 'Send the report as it is?', [{ label: 'Send', value: 'yes', danger: !st.corrected && st.verified }, { label: 'Not yet', value: 'no' }]);
    if (r !== 'yes') return;
    st.sent = true; this.record('sent_report', { corrected: st.corrected, knewError: st.verified, changeLog: !!st.changeLog }); this.ctx.audio.sfx(st.corrected ? 'success' : 'paper');
    this.endWith(this.outcomeId());
  }

  async cabinet() {
    const st = this.state; if (st.shredded) { await this.say('You', 'The batch-17 folder is empty now.'); return; }
    if (!st.verified) { st.verified = true; this.record('verified_logs', { t: Math.round(this.time) }); }
    const r = await openGamePanel(this.ctx.uiRoot, { title: 'Weld inspection log — Batch 17', sub: 'Original signed inspection sheets (your signature is on two of them).', render: (body, close, { el }) => {
      body.innerHTML = `<div class="doc"><h4>BATCH 17 — ULTRASONIC WELD INSPECTION</h4><table><tr><th>Unit</th><th>Date</th><th>Result</th><th>Inspector</th><th>Action</th></tr><tr><td>17-041</td><td>12 Aug</td><td><span class="hl">FAIL — lack of fusion</span></td><td>You</td><td>Reworked, re-tested OK 14 Aug</td></tr><tr><td>17-088</td><td>19 Aug</td><td><span class="hl">FAIL — porosity</span></td><td>Meera</td><td>Reworked, re-tested OK 21 Aug</td></tr><tr><td>17-133</td><td>27 Aug</td><td><span class="hl">FAIL — crack indication</span></td><td>You</td><td><b>Pending re-inspection</b></td></tr><tr><td>others</td><td>—</td><td>PASS (157)</td><td>—</td><td>—</td></tr></table><p>Three failures. The audit report says zero.</p></div>`;
      body.append(el('div', { class: 'btn-row' }, [el('button', { class: 'btn primary', onClick: () => close('close') }, ['Put the log back']), el('button', { class: 'btn danger', onClick: () => close('take') }, ['Take the batch-17 pages with you'])]));
    } });
    if (r === 'take') { st.logsTaken = true; this.record('took_log_pages'); this.hud().setInventory(['Batch-17 inspection pages (originals)'], 'Carrying'); this.notify('You are carrying the original inspection pages.', 'info'); }
    this.hud().setObjective(st.corrected ? 'Send the corrected report from your computer.' : 'The logs show 3 failures; the report says 0. Decide what to do before 17:00.');
  }

  async shred() {
    const st = this.state; if (!st.logsTaken || st.shredded) { await this.say('You', 'Nothing to shred that is yours to destroy.'); return; }
    const r = await this.say('You', 'Shred the original batch-17 inspection pages? Without them, nobody can prove the report is wrong.', [{ label: 'Shred them', value: 'yes', danger: true }, { label: 'Keep them', value: 'no' }]);
    if (r !== 'yes') return; st.shredded = true; st.logsTaken = false; this.record('shredded_logs'); this.ctx.audio.sfx('shred'); this.hud().setInventory(null); this.notify('The originals are gone.', 'bad');
  }

  async talkMeera() {
    const st = this.state; this.meera.faceTowards(this.player.pos.x, this.player.pos.z);
    if (!st.verified && !st.readReport) { await this.say('Meera', 'Report’s on your desk for co-signature. Iyer wants it out by five. Please just sign it— I’ve checked it twice.'); return; }
    if (st.meeraStance) { await this.say('Meera', st.corrected ? 'Thanks for fixing it properly. I owe you.' : 'Please… five o’clock.'); return; }
    await this.say('Meera', st.verified ? 'You saw the logs. …Yes. I built the report on the Q2 template and the batch table didn’t refresh. I only noticed an hour ago. If this goes out wrong and comes back, it’s my name on it. If we correct it now, Iyer will explode and the client triggers a re-inspection clause.' : 'Something wrong with the report?');
    if (!st.verified) return;
    const r = await this.say('Meera', 'Can we send it as it is and fix it in the Q4 addendum? Nobody reads Section 4. Please.', [
      { label: 'No — we fix it now, together, and I’ll stand next to you when we tell Iyer.', value: 'fix' },
      { label: 'Fine. We send it and fix it in Q4.', value: 'conceal', danger: true },
      { label: 'This is your mess. I’m telling Iyer it was you.', value: 'blame', danger: true },
    ]);
    st.meeraStance = r; this.record('meera_response', { choice: r });
    if (r === 'fix') await this.say('Meera', '…Okay. Okay. Thank you. Let’s do it properly.');
    else if (r === 'conceal') await this.say('Meera', 'Thank you. I’ll never use an old template again.');
    else await this.say('Meera', 'Your signature is on two of those inspection sheets too. But go ahead.');
  }

  async talkIyer() {
    const st = this.state; this.iyer.faceTowards(this.player.pos.x, this.player.pos.z);
    if (st.managerStance) { await this.say('Mr. Iyer', st.managerStance === 'authorized' ? 'Send the corrected version and copy me. I’ll handle the client call.' : 'Five o’clock. Go.'); return; }
    const opts = [{ label: 'There’s an error. Batch 17 had three weld failures; the report says zero. It must be corrected before it goes.', value: 'inform' }];
    if (st.verified) opts.push({ label: 'Meera got the numbers wrong in batch 17. It’s her error.', value: 'blame', danger: true });
    opts.push({ label: 'Everything is fine. It’ll go out on time.', value: st.verified ? 'lie' : 'fine' });
    const r = await this.say('Mr. Iyer', 'Is the Q3 report ready? Metro Rail is on the call at five and they are already twitchy about the schedule.', opts);
    if (r === 'fine') { this.record('told_manager_fine', { knew: st.verified }); await this.say('Mr. Iyer', 'Good.'); return; }
    if (r === 'lie') { st.lied = true; this.record('lied_to_manager'); await this.say('Mr. Iyer', 'Good. Send it.'); return; }
    st.informedManager = true; this.record(r === 'blame' ? 'blamed_colleague' : 'informed_manager', { t: Math.round(this.time) });
    if (r === 'blame') await this.say('Mr. Iyer', 'Her error? You co-sign it. You inspected two of those units yourself. Don’t bring me names, bring me the fix.');
    const r2 = await this.say('Mr. Iyer', 'Three failures means Metro Rail invokes the re-inspection clause and we lose three weeks. One of them is still pending, you say? …Can this wait for the Q4 addendum? Nobody is going to die over a table.', [
      { label: 'No. They are structural welds and a crack is still pending. The client gets the real numbers today.', value: 'insist' },
      { label: 'All right. We send it as it is and correct it in Q4.', value: 'comply', danger: true },
    ]);
    if (r2 === 'insist') { st.managerStance = 'authorized'; this.record('insisted_correction'); await this.say('Mr. Iyer', '…Fine. Correct it. Put a change log in, copy me, and I will call Metro Rail myself before they read it. I would rather eat three weeks than a collapsed gantry.'); this.hud().setObjective('Correction authorised. Correct the report at your computer and send it.'); }
    else { st.managerStance = 'overrode'; this.record('agreed_conceal_manager'); await this.say('Mr. Iyer', 'Good. Five o’clock.'); }
  }

  async complianceBox() {
    const st = this.state; if (st.compliance) { await this.say('You', 'You have already filed a report.'); return; }
    if (!st.verified) { await this.say('You', 'You have nothing concrete to report yet.'); return; }
    const r = await this.say('Compliance box', 'File a confidential concern about the Q3 report?', [
      { label: 'File a factual report: batch-17 figures wrong; logs show 3 failures; correction requested.', value: 'factual' },
      { label: 'File a report accusing Meera of falsifying the audit.', value: 'blame', danger: true },
      { label: 'Don’t file anything', value: 'no' },
    ]);
    if (r === 'no') return; st.compliance = r; this.record('filed_compliance', { kind: r }); this.ctx.audio.sfx('paper'); this.notify('Compliance report filed.', 'info');
  }

  outcomeId() {
    const st = this.state;
    if (st.shredded) return 'destroyed_evidence';
    const blamed = this.has('blamed_colleague') || st.compliance === 'blame' || st.meeraStance === 'blame';
    if (st.corrected) { if (blamed) return 'corrected_but_blamed'; if (st.informedManager || st.changeLog || st.compliance === 'factual') return 'corrected_and_reported'; return 'corrected_quietly'; }
    if (blamed) return 'blamed_colleague';
    if (st.verified && (st.informedManager || st.compliance === 'factual')) return 'reported_but_uncorrected';
    if (st.verified) return 'concealed';
    if (st.readReport) return 'ignored';
    return 'not_discovered';
  }

  update(dt) {
    this.tick(dt); this.stepPlayer(dt);
    const remaining = this.timeLimit - this.time; this.hud().setTimer(remaining, 45, 'Client call');
    if (remaining <= 90 && !this.flags.r90) { this.flags.r90 = true; this.notify('Mr. Iyer: “Ninety seconds, people.”', 'info'); }
    if (remaining <= 0 && !this.finished) { this.record('time_up', { corrected: this.state.corrected }); this.notify('Mr. Iyer sent the report himself at 17:00.', 'info'); this.endWith(this.outcomeId()); }
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.ctx.audio.stopLoop('hum'); this.hud().setInventory(null); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const st = this.state;
    if (this.has('read_report')) { sh.adjust('responsibility', 4, 'Reviewed the report before signing'); actions.push('Opened and read the draft report.'); }
    if (this.has('verified_logs')) { sh.adjustMany({ responsibility: 12, consequenceAwareness: 8 }, 'Verified the figures against the original inspection logs'); pos.push('Checked the primary records instead of trusting the summary.'); actions.push('Checked the batch-17 inspection logs.'); }
    else { sh.adjustMany({ responsibility: -12, consequenceAwareness: -8 }, 'Never verified the figures you were co-signing'); neg.push('Co-signed without checking the records.'); }
    if (this.has('corrected_report')) { const cl = this.first('corrected_report').changeLog; sh.adjustMany({ honesty: 25, responsibility: 15, dutyDiscernment: 10 }, 'Corrected the false figure'); pos.push('Corrected the report before it reached the client.'); actions.push(`Corrected batch 17 to 3 failures${cl ? ' with a change-log entry' : ' without a note'}.`); if (cl) { sh.adjust('accountability', 15, 'Recorded the correction transparently'); pos.push('Left an honest audit trail.'); } else { sh.adjust('accountability', -5, 'Changed the record with no note of who or why'); } }
    if (this.has('informed_manager')) { sh.adjustMany({ accountability: 15, honesty: 10 }, 'Raised the error with the manager directly'); pos.push('Told the manager the truth.'); actions.push('Informed Mr. Iyer of the error.'); }
    if (this.has('insisted_correction')) { sh.adjustMany({ dutyDiscernment: 15, honesty: 8 }, 'Held firm when the manager asked to delay the truth'); pos.push('Did not back down under pressure from above.'); }
    if (this.has('agreed_conceal_manager')) { sh.adjustMany({ honesty: -20, dutyDiscernment: -15 }, 'Agreed with the manager to send a false safety figure'); neg.push('Let the manager talk you into concealment.'); actions.push('Agreed to send the report uncorrected.'); }
    if (st.meeraStance === 'fix') { sh.adjustMany({ fairness: 10, responsibility: 5 }, 'Helped the colleague fix it rather than hang her out'); pos.push('Stood beside the colleague who made the error.'); }
    if (st.meeraStance === 'conceal') { sh.adjust('honesty', -15, 'Agreed with Meera to hide the error'); neg.push('Agreed with a colleague to hide a safety-relevant error.'); }
    if (this.has('blamed_colleague') || st.meeraStance === 'blame' || st.compliance === 'blame') { sh.adjustMany({ fairness: -20, accountability: -15 }, 'Blamed a colleague for an honest template error on a report you co-sign'); neg.push('Shifted blame onto Meera.'); cons.push('Meera received a written warning for “falsification”; the word will follow her.'); }
    if (st.compliance === 'factual') { sh.adjust('accountability', 10, 'Filed a factual compliance report'); actions.push('Filed a factual compliance report.'); }
    if (this.has('lied_to_manager')) { sh.adjust('honesty', -15, 'Told the manager everything was fine, knowing it was not'); neg.push('Lied to the manager.'); }
    if (this.has('took_log_pages') && !st.shredded) { sh.adjust('responsibility', -4, 'Removed original records from the file'); }
    const T = {
      corrected_and_reported: ['Corrected and reported', 'You fixed the figure, left a trail, and told the people who needed to know.', true, () => { cons.push('Metro Rail invoked the re-inspection clause; the pending crack was re-inspected and reworked. Three weeks lost, nothing else.'); }],
      corrected_quietly: ['Corrected quietly', 'The client got true numbers, but nobody inside the company knows how or why they changed.', true, () => { sh.adjust('accountability', -8, 'Nobody learned how the error happened, so the template will do it again'); cons.push('The client got the truth. The Q2 template is still in use.'); }],
      corrected_but_blamed: ['Corrected, but at a colleague’s expense', 'You fixed the report and made sure Meera carried the whole blame.', false, () => { cons.push('The numbers were right; the office trust was not.'); }],
      reported_but_uncorrected: ['Raised it, then sent it wrong', 'You told someone the truth, and the false report went out anyway.', false, () => { sh.adjustMany({ honesty: -15, consequenceAwareness: -12 }, 'A known-false safety figure was sent'); neg.push('Knew the figure was wrong and let it go out.'); cons.push('Metro Rail found the pending crack in their own spot check. Your concern is on record; so is your signature.'); }],
      concealed: ['Concealed', 'You knew the figure was false and sent it without telling anyone.', false, () => { sh.adjustMany({ honesty: -30, consequenceAwareness: -20, dutyDiscernment: -15, accountability: -10 }, 'Sent a report you knew to be false on structural welds'); neg.push('Sent a false safety declaration.'); cons.push('The pending crack went into service. The spot check that found it also found your signature.'); }],
      blamed_colleague: ['Blamed a colleague', 'You pushed the error onto Meera instead of fixing it.', false, () => { sh.adjust('honesty', -10, 'Chose blame over correction'); cons.push('The report went out wrong and Meera was disciplined. Both facts will surface.'); }],
      destroyed_evidence: ['Destroyed the evidence', 'You shredded the original inspection records.', false, () => { sh.adjustMany({ honesty: -35, accountability: -30, consequenceAwareness: -20, dutyDiscernment: -20 }, 'Destroyed signed safety records'); neg.push('Destroyed primary safety records.'); cons.push('The ultrasonic machine keeps its own log. The shredded pages proved intent, not innocence.'); }],
      ignored: ['Looked, did not check', 'You opened the report but never verified it; it went out wrong.', false, () => { cons.push('Nobody inside caught the error. The client did.'); }],
      not_discovered: ['Never reviewed', 'The deadline passed and the report went out without your review.', false, () => { sh.adjust('responsibility', -8, 'Did not review a report bearing your signature'); cons.push('Your co-signature went out on a report you never read.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    if (this.has('time_up')) actions.push('The deadline passed; Mr. Iyer sent the report in its current state.');
    const mentor = {
      summary: `A single wrong number in a safety report, a colleague who asked for silence, a manager who wanted it gone by five. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Honesty in records others rely on', 'Responsibility of a co-signer', 'Accountability: an audit trail, not a cover-up', 'Fairness to a colleague who made an honest mistake', 'Duty & discernment: structural welds are not “a table”'],
      tradeoffs: 'Correcting the report cost three weeks, a manager’s temper and a friend’s embarrassment. Concealing it cost nothing today and risked everything later—and the people who would pay are the ones who ride the trains.',
      didWell: pos, risks: neg,
      improve: outcome === 'corrected_and_reported' ? 'Keep this standard. One addition: retire the Q2 template so the next person does not inherit the same trap.' : outcome === 'corrected_quietly' ? 'Right number, missing trail. Record corrections openly; a silent fix teaches no one and protects you less than you think.' : st.shredded ? 'There is no version of destroying records that ends well. The way out of a mistake is forward, through the truth.' : 'When your name is on a document, verification is not optional. Check the source, correct what is wrong, say so plainly—first to the person who can fix it, then upward if they will not.',
      theme: st.shredded || outcome === 'concealed' ? 'ashwatthama' : outcome === 'corrected_and_reported' ? 'viduraNiti' : (this.has('blamed_colleague') || st.meeraStance === 'blame') ? 'ekalavya' : this.has('agreed_conceal_manager') ? 'bhishmaVow' : 'yudhishthiraTruth',
      reflection: 'Whom was the report actually for—the manager, the client, or the people who will stand on those welds? Which of them did your choice serve?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
