// GAME 9 — A FRIEND IN TROUBLE: a friend's mistake, an innocent classmate blamed, logs, a backup and a professor waiting.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle } from '../engine/collision.js';
import { openGamePanel } from '../ui/gamePanel.js';

export class FriendInTrouble extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = null; s.background = new THREE.Color(0x121826);
    K.makeHemi(s, 0xe8f0ff, 0x4a4a55, 0.9); this.sun = K.makeSun(s, { position: [4, 9, -6], intensity: 0.9, shadowArea: 18 });
    const W = 18, D = 12, H = 3.8;
    const room = K.makeRoom(W, D, H, { wall: 0xdfe6ee, floor: 0x5b6470 }); s.add(room);
    [aabb(-W / 2 - 1, -D / 2 - 1, W / 2 + 1, -D / 2, 'wall'), aabb(-W / 2 - 1, D / 2, W / 2 + 1, D / 2 + 1, 'wall'), aabb(-W / 2 - 1, -D / 2, -W / 2, D / 2, 'wall'), aabb(W / 2, -D / 2, W / 2 + 1, D / 2, 'wall')].forEach((c) => this.addCollider(c));
    // rows of workstations
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const x = -6 + c * 4, z = -2.5 + r * 4; const d = K.makeDesk(0xcfd3d8); d.position.set(x, 0, z); s.add(d); this.addCollider(aabb(x - 0.85, z - 0.45, x + 0.85, z + 0.45, 'desk')); const ch = K.makeChair(0x334); ch.position.set(x, 0, z + 0.7); ch.rotation.y = Math.PI; s.add(ch); }
    // server rack & terminal
    const rack = K.box(1.0, 2.2, 0.8, 0x1e2228); rack.position.set(-8.3, 1.1, -4.8); s.add(rack); this.addCollider(aabb(-8.8, -5.2, -7.8, -4.4, 'rack'));
    for (let i = 0; i < 6; i++) { const led = K.box(0.06, 0.06, 0.02, K.mat(i % 2 ? 0x44ff66 : 0x44aaff, { emissive: i % 2 ? 0x22ff44 : 0x2288ff, emissiveIntensity: 1 })); led.position.set(-8.6 + (i % 3) * 0.3, 1.9 - Math.floor(i / 3) * 0.3, -4.39); s.add(led); }
    const term = K.makeDesk(0x44484f); term.position.set(-6.5, 0, -4.8); s.add(term); this.addCollider(aabb(-7.35, -5.25, -5.65, -4.35, 'desk'));
    const sticky = K.makeTextBoard('admin / lab@2024', { w: 0.3, h: 0.16, bg: '#fff59a', fg: '#333', fontSize: 40 }); sticky.position.set(-7.0, 1.25, -5.0); s.add(sticky);
    const rackLabel = K.makeTextBoard('SHARED RESEARCH DRIVE — DO NOT MODIFY', { w: 1.8, h: 0.22, bg: '#b03a2e', fg: '#fff', fontSize: 50 }); rackLabel.position.set(-8.3, 2.4, -4.4); s.add(rackLabel);
    const wb = K.makeWhiteboard(3.4, 1.3, ['LAB RULES', '1. No scripts on /shared without approval', '2. Nightly snapshot 02:00', '3. Admin access: ask the lab in-charge']); wb.position.set(2, 1.7, -D / 2 + 0.16); s.add(wb);
    const frontDesk = K.makeDesk(); frontDesk.position.set(6.5, 0, -4.5); frontDesk.rotation.y = Math.PI / 2; s.add(frontDesk); this.addCollider(aabb(6.05, -5.35, 6.95, -3.65, 'desk'));
    const sign = K.makeTextBoard('LAB IN-CHARGE', { w: 0.9, h: 0.2, bg: '#2b3a5a', fg: '#fff', fontSize: 56 }); sign.position.set(6.05, 0.95, -4.5); sign.rotation.y = -Math.PI / 2; s.add(sign);
    const door = K.makeDoor(); door.position.set(7.5, 0, D / 2 - 0.1); door.rotation.y = Math.PI; s.add(door); const ds = K.makeTextBoard('DR. BHATT — HEAD OF LAB', { w: 1.4, h: 0.22, bg: '#2b3a5a', fg: '#fff', fontSize: 56 }); ds.position.set(7.5, 2.3, D / 2 - 0.16); ds.rotation.y = Math.PI; s.add(ds);
    for (const [x, z] of [[-8.5, 5], [8.5, 0]]) { const p = K.makePlant(); p.position.set(x, 0, z); s.add(p); }
    for (let i = 0; i < 3; i++) { const w = K.makeWindowPane(2.2, 1.2); w.position.set(-W / 2 + 0.12, 1.9, -3 + i * 3); w.rotation.y = Math.PI / 2; s.add(w); }
    // NPCs
    this.karan = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x2f6fb0, pants: 0x222 }), x: -2, z: 2.3, yaw: Math.PI }), 'Karan (your friend)');
    this.sameer = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x6a9a4a, pants: 0x333 }), x: 6, z: 2.3, yaw: Math.PI }), 'Sameer');
    this.rao = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x9a4a6a, pants: 0x222, dress: true }), x: 7.4, z: -4.5, yaw: -Math.PI / 2 }), 'Mrs. Rao (lab in-charge)');
    this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x888 }), x: -6, z: -1.8, yaw: Math.PI }), 'Student');
    this.setupPlayer({ x: 0, z: 2, yaw: Math.PI, bounds: { minX: -W / 2 + 0.5, maxX: W / 2 - 0.5, minZ: -D / 2 + 0.5, maxZ: D / 2 - 0.5 }, occluders: [room], camDist: 3.6, shirt: 0xd4a63a });
    this.player.p.camHeight = 1.45; this.player.camPitch = 0.1; this.player.p.minDist = 2.2;
    this.state = { confessed: false, karanStance: null, checkedLogs: false, foundBackup: false, restored: false, tampered: false, admin: null, raoTold: null, decided: null, sameerTalked: false, karanAgreed: false };
    this.timeLimit = this.diff(420, 330, 270);
    this.setupInteractions();
    this.camera.position.set(3, 2.6, 5); this.camera.lookAt(-2, 1, -2);
  }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'karan', object: this.karan.mesh, x: 0, z: 0, radius: 2, prompt: 'Talk to Karan', onInteract: () => this.converse(() => this.talkKaran()) });
    I.add({ id: 'sameer', object: this.sameer.mesh, x: 0, z: 0, radius: 2, prompt: 'Talk to Sameer', onInteract: () => this.converse(() => this.talkSameer()) });
    I.add({ id: 'rao', object: this.rao.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to Mrs. Rao', onInteract: () => this.converse(() => this.talkRao()) });
    I.add({ id: 'terminal', x: -6.5, z: -4, y: 1.7, radius: 1.8, prompt: 'Use the admin terminal', onInteract: () => this.converse(() => this.terminal()) });
    I.add({ id: 'bhatt', x: 7.5, z: 5.2, y: 2.0, radius: 2, prompt: 'Knock on Dr. Bhatt’s door', markerColor: 0x9ad0ff, onInteract: () => this.converse(() => this.talkBhatt()) });
  }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('The shared research dataset was destroyed yesterday. Mrs. Rao blames Sameer; Dr. Bhatt will decide on a misconduct report today. Your friend Karan looks sick with worry.');
    this.hud().showTimer(true); this.hud().centerMessage('A Friend in Trouble', 2200); this.ctx.audio.startLoop('hum', { vol: 0.1 });
    this.after(3, () => this.hud().subtitle('Mrs. Rao', 'Three weeks of a PhD student’s work, Sameer. Three weeks!', 4500));
  }

  async talkKaran() {
    const st = this.state; this.karan.faceTowards(this.player.pos.x, this.player.pos.z);
    if (!st.confessed) { st.confessed = true; this.record('friend_confided'); await this.say('Karan', '…It was me. My cleanup script had the wrong path. I ran it at half past two and it wiped the shared dataset. I only realised this morning when Rao started shouting at Sameer.'); 
      const r = await this.say('Karan', 'If Bhatt finds out, I lose the scholarship — my father cannot pay the fees. Sameer will get a warning at most, he is a topper. Please. Please don’t say anything.', [
        { label: 'You have to tell Dr. Bhatt yourself. I’ll come with you.', value: 'confess' }, { label: 'First let’s find out whether the data can be recovered.', value: 'investigate' }, { label: 'Okay. I won’t say anything.', value: 'silence', danger: true }, { label: 'Let Sameer take it. He’ll be fine.', value: 'blame', danger: true },
      ]);
      st.karanStance = r; this.record('karan_response', { choice: r });
      if (r === 'confess') { this.record('encouraged_confession'); await this.say('Karan', 'I can’t… not like this. If there were at least a way to fix the data— maybe. Let me think.'); }
      else if (r === 'investigate') { this.record('investigate_first'); await this.say('Karan', 'There’s a nightly snapshot, I think. I was too scared to check.'); }
      else if (r === 'silence') { this.record('promised_silence'); await this.say('Karan', 'Thank you. I owe you my life.'); }
      else { this.record('agreed_blame'); await this.say('Karan', '…Yeah. Yeah, he’ll be fine.'); }
      return;
    }
    const opts = [];
    if (!st.karanAgreed && st.foundBackup) opts.push({ label: `The 02:00 snapshot is intact — it can be restored${st.restored ? ' (I already restored it)' : ''}. Come to Bhatt with me; it was a mistake, and it’s fixable.`, value: 'agree' });
    if (!st.karanAgreed && !this.has('encouraged_confession')) opts.push({ label: 'You need to tell Dr. Bhatt yourself. I’ll stand next to you.', value: 'confess' });
    if (!st.karanAgreed) opts.push({ label: 'If you won’t tell him, I will. I won’t let Sameer carry this.', value: 'warn' });
    opts.push({ label: 'Nothing for now', value: 'no' });
    const r = await this.say('Karan', st.karanAgreed ? 'I’m ready. Let’s go to Bhatt together.' : 'Any news?', opts);
    if (r === 'agree') { st.karanAgreed = true; this.record('friend_agreed_confess'); await this.say('Karan', 'The snapshot… it’s really there? Then— okay. Okay. I’ll tell him. Will you come?'); this.hud().setObjective('Karan will confess. Go to Dr. Bhatt’s door together.'); }
    else if (r === 'confess') { this.record('encouraged_confession'); await this.say('Karan', 'I know. I know. Give me a minute.'); }
    else if (r === 'warn') { this.record('warned_friend_will_report'); await this.say('Karan', '…I understand. I would hate you for it, but I would understand.'); }
  }

  async talkSameer() {
    const st = this.state; this.sameer.faceTowards(this.player.pos.x, this.player.pos.z); st.sameerTalked = true;
    const r = await this.say('Sameer', 'I opened my notebook at three. I didn’t touch the dataset, I swear on my mother. Nobody believes me. If Bhatt files a report it goes on my transcript.', [
      { label: 'I believe you. I’ll find out what happened.', value: 'reassure' }, ...(st.confessed ? [{ label: 'The logs say you were the last one in.', value: 'mislead', danger: true }] : []), { label: 'Not my problem.', value: 'ignore' },
    ]);
    if (r === 'reassure') { this.record('reassured_sameer'); await this.say('Sameer', 'Thank you. You’re the first person today who has said that.'); }
    else if (r === 'mislead') { this.record('misled_sameer'); await this.say('Sameer', 'I know what the logs say. I know what I did. Those are different things.'); }
    else this.record('ignored_sameer');
  }

  async talkRao() {
    const st = this.state; this.rao.faceTowards(this.player.pos.x, this.player.pos.z);
    const opts = [];
    if (!st.admin) opts.push({ label: 'May I use the admin account to check the logs and the backup snapshot?', value: 'admin' });
    if (st.foundBackup && st.raoTold !== 'backup') opts.push({ label: 'The 02:00 snapshot is intact. The dataset can be restored.', value: 'backup' });
    if (st.confessed || st.checkedLogs) opts.push({ label: 'Sameer didn’t do it. The logs show karan_m ran a script at 14:32.', value: 'truth' });
    opts.push({ label: 'Sameer was in the lab at three. It must have been him.', value: 'blame', danger: true });
    opts.push({ label: 'Nothing, sorry.', value: 'no' });
    const r = await this.say('Mrs. Rao', 'What? Unless you know something about the dataset, I am busy writing up Sameer.', opts);
    if (r === 'admin') { st.admin = 'granted'; this.record('asked_admin_access'); await this.say('Mrs. Rao', 'Fine — read-only is on the terminal, and the admin password is on the rack, as everyone knows. Don’t touch anything you don’t understand.'); }
    else if (r === 'backup') { st.raoTold = 'backup'; this.record('told_rao_backup'); await this.say('Mrs. Rao', 'It… is? Then restore it, now, before Bhatt files anything. That changes the damage. It does not change that someone broke rule one.'); }
    else if (r === 'truth') { st.raoTold = 'truth'; this.record('told_rao_truth'); await this.say('Mrs. Rao', 'karan_m? Your friend Karan? …I should have read the whole log instead of the last line. Tell Dr. Bhatt before I do; it will go better coming from you two.'); }
    else if (r === 'blame') { this.record('blamed_sameer_to_rao'); await this.say('Mrs. Rao', 'That’s what I thought. Thank you.'); }
  }

  async terminal() {
    const st = this.state;
    if (!st.admin) { const r = await this.say('Terminal', 'ADMIN LOGIN REQUIRED. A sticky note on the rack reads “admin / lab@2024”.', [{ label: 'Use the password from the sticky note', value: 'sticky' }, { label: 'Go and ask Mrs. Rao first', value: 'no' }]); if (r !== 'sticky') return; st.admin = 'sticky'; this.record('used_sticky_password'); }
    const choice = await openGamePanel(this.ctx.uiRoot, { title: 'lab-srv01 — /shared/dataset', sub: `Logged in as admin (${st.admin === 'granted' ? 'with permission' : 'sticky-note password'}).`, render: (body, close, { el }) => {
      body.innerHTML = `<div class="doc" style="font-family:ui-monospace,Consolas,monospace;font-size:0.85rem"><h4>$ tail /var/log/shared-access.log</h4>${st.tampered ? '' : '<div>2025-10-09 <span class="hl">14:32:10  karan_m   bash cleanup.sh --target /shared/dataset  (rm -rf 3,112 files)</span></div>'}<div>2025-10-09 15:04:51  sameer_k  jupyter open /home/sameer_k/assignment3.ipynb</div><div>2025-10-09 15:41:02  sameer_k  logout</div><div>2025-10-10 08:12:30  rao_p     ls /shared/dataset  (0 files)</div><h4>$ ls /backup/snapshots/</h4><div>2025-10-08_0200 &nbsp; 2025-10-09_0200 <span class="${st.foundBackup ? 'fixed' : 'hl'}">(3,112 files, 4.1 GB — intact)</span> &nbsp; 2025-10-10_0200 (0 files)</div>${st.restored ? '<div class="fixed">$ restore 2025-10-09_0200 → /shared/dataset … OK (3,112 files)</div>' : ''}</div>`;
      const row = el('div', { class: 'btn-row' });
      if (!st.checkedLogs) row.append(el('button', { class: 'btn primary', onClick: () => close('logs') }, ['Read the access log carefully']));
      if (!st.foundBackup) row.append(el('button', { class: 'btn primary', onClick: () => close('backup') }, ['Inspect the 02:00 snapshot']));
      if (st.foundBackup && !st.restored) row.append(el('button', { class: 'btn primary', onClick: () => close('restore') }, ['Restore the dataset from the snapshot']));
      if (!st.tampered) row.append(el('button', { class: 'btn danger', onClick: () => close('tamper') }, ['Delete the 14:32 line from the log']));
      row.append(el('button', { class: 'btn', onClick: () => close(null) }, ['Log out']));
      body.append(row);
    } });
    if (choice === 'logs') { st.checkedLogs = true; this.record('checked_logs'); this.notify('The log shows karan_m ran cleanup.sh at 14:32; Sameer only opened his notebook at 15:04.', 'info'); return this.terminal(); }
    if (choice === 'backup') { st.foundBackup = true; this.record('found_backup'); this.notify('The 02:00 snapshot from yesterday is intact. The dataset can be restored.', 'good'); this.hud().setObjective('The data can be restored. Who restores it, and who tells the truth, is up to you.'); return this.terminal(); }
    if (choice === 'restore') { st.restored = true; this.record('restored_dataset', { t: Math.round(this.time) }); this.ctx.audio.sfx('success'); this.notify('Dataset restored: 3,112 files.', 'good'); return this.terminal(); }
    if (choice === 'tamper') { const ok = await this.say('You', 'Delete the line that shows Karan ran the script? The log is the only record that clears Sameer.', [{ label: 'Delete it', value: 'yes', danger: true }, { label: 'Leave it', value: 'no' }]); if (ok === 'yes') { st.tampered = true; this.record('tampered_logs'); this.ctx.audio.sfx('shred'); this.notify('Log line deleted.', 'bad'); } return; }
  }

  async talkBhatt() {
    const st = this.state;
    const knows = st.confessed || st.checkedLogs;
    const opts = [];
    if (st.karanAgreed) opts.push({ label: 'Karan and I are here together: his script overwrote the dataset by mistake. The snapshot is intact' + (st.restored ? ' and already restored.' : ' and can be restored.'), value: 'together' });
    if (knows && !st.karanAgreed) opts.push({ label: 'Sameer didn’t do it. The log shows Karan’s script at 14:32. It was a mistake' + (st.foundBackup ? ', and the data is recoverable.' : '.'), value: 'truth' });
    if (st.restored || st.foundBackup) opts.push({ label: 'The dataset ' + (st.restored ? 'has been restored' : 'can be restored') + '. Perhaps nobody needs to be reported.', value: 'silent' });
    opts.push({ label: 'From what I’ve heard, it was Sameer.', value: 'blame', danger: true });
    if (knows) opts.push({ label: 'I don’t know anything about it.', value: 'lie', danger: true });
    opts.push({ label: 'I’ll come back later.', value: 'later' });
    const r = await this.say('Dr. Bhatt', 'Come in. I am about to file a misconduct report on Sameer for the dataset. Mrs. Rao tells me you were in the lab yesterday. Do you know anything I should know before I sign this?', opts);
    if (r === 'later') { this.record('postponed_bhatt'); return; }
    st.decided = r; this.record('told_bhatt', { choice: r, restored: st.restored, tampered: st.tampered });
    if (r === 'together') { await this.say('Dr. Bhatt', 'Karan. …Thank you for coming yourself; that matters. A wrong path in a script is carelessness, not malice. There will be a penalty, and there will not be a misconduct report — not on you, and certainly not on Sameer.'); this.endWith('truth_with_friend_amends'); }
    else if (r === 'truth') { await this.say('Dr. Bhatt', 'Karan. I see. I will speak to him. I wish he had come himself — but I am glad someone did before I signed this.'); this.endWith('truth_reported_without_friend'); }
    else if (r === 'silent') { await this.say('Dr. Bhatt', 'Restored or not, someone ran a destructive script on a shared drive and let a classmate take the blame for a day. Unless somebody tells me otherwise, the report on Sameer stands.'); this.endWith('restored_but_silent'); }
    else if (r === 'blame') { await this.say('Dr. Bhatt', 'Then I will sign it.'); this.endWith('blamed_sameer'); }
    else { await this.say('Dr. Bhatt', 'Very well.'); this.endWith(st.tampered ? 'tampered_logs' : 'concealed'); }
  }

  update(dt) {
    this.tick(dt); this.stepPlayer(dt);
    const remaining = this.timeLimit - this.time; this.hud().setTimer(remaining, 45, 'Report filed in');
    if (remaining <= 0 && !this.finished) { this.record('time_up'); this.notify('Dr. Bhatt has signed the report on Sameer.', 'bad'); const st = this.state; this.endWith(st.tampered ? 'tampered_logs' : (st.confessed || st.checkedLogs) ? 'concealed' : 'ignored'); }
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.ctx.audio.stopLoop('hum'); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const st = this.state;
    if (st.checkedLogs) { sh.adjustMany({ practicalWisdom: 10, responsibility: 5 }, 'Read the access log instead of relying on hearsay'); pos.push('Verified what happened from the logs.'); actions.push('Read the server access log.'); }
    if (st.foundBackup) { sh.adjust('practicalWisdom', 10, 'Found that the data was recoverable'); actions.push('Found the intact 02:00 snapshot.'); }
    if (st.restored) { sh.adjustMany({ responsibility: 15, practicalWisdom: 8, compassion: 5 }, 'Restored three weeks of someone’s research'); pos.push('Repaired the actual harm: the dataset is back.'); actions.push('Restored the dataset.'); cons.push('The PhD student got her three weeks back.'); }
    if (st.admin === 'granted') { sh.adjust('honesty', 5, 'Asked permission before using the admin account'); } else if (st.admin === 'sticky') { sh.adjust('honesty', -3, 'Used the admin password without asking'); }
    if (this.has('encouraged_confession')) { sh.adjustMany({ compassion: 10, honesty: 10, fairness: 8 }, 'Urged your friend to own his mistake rather than hide it'); pos.push('Treated friendship as helping him do right, not helping him hide.'); actions.push('Encouraged Karan to confess.'); }
    if (this.has('reassured_sameer')) { sh.adjust('compassion', 6, 'Stood by the classmate everyone else had written off'); pos.push('Gave Sameer the benefit of the doubt.'); }
    if (this.has('misled_sameer')) { sh.adjustMany({ honesty: -10, compassion: -8 }, 'Misled Sameer while knowing the truth'); neg.push('Let Sameer believe the evidence was against him.'); }
    if (this.has('promised_silence')) { sh.adjust('honesty', -10, 'Promised to stay silent about who did it'); neg.push('Promised silence at an innocent person’s expense.'); }
    if (this.has('agreed_blame')) { sh.adjustMany({ fairness: -20, honesty: -15 }, 'Agreed to let Sameer take the blame'); neg.push('Agreed to let an innocent classmate carry the blame.'); }
    if (this.has('blamed_sameer_to_rao')) { sh.adjustMany({ fairness: -15, honesty: -15 }, 'Pointed Mrs. Rao at Sameer'); }
    if (this.has('told_rao_truth')) { sh.adjustMany({ honesty: 8, fairness: 8 }, 'Corrected Mrs. Rao’s accusation'); }
    if (this.has('warned_friend_will_report')) { sh.adjust('honesty', 6, 'Told your friend plainly that you would not let an innocent person be blamed'); }
    if (st.tampered) { sh.adjustMany({ honesty: -35, accountability: -25, fairness: -15 }, 'Deleted the log line that cleared Sameer'); neg.push('Tampered with the evidence.'); cons.push('The nightly log mirror still has the line. The deletion is now its own offence.'); }
    const T = {
      truth_with_friend_amends: ['Truth, together, with amends', 'Karan confessed with you beside him; the data was recoverable; Sameer was cleared.', true, () => { sh.adjustMany({ accountability: 20, honesty: 20, fairness: 20, compassion: 10 }, 'Brought the truth to the professor together with your friend'); cons.push('Karan received a penalty, kept his scholarship, and kept his friend. Sameer’s record is clean.'); }],
      truth_reported_without_friend: ['Told the truth yourself', 'You cleared Sameer by telling Dr. Bhatt what the logs showed.', true, () => { sh.adjustMany({ honesty: 20, fairness: 20, accountability: 8, compassion: this.has('encouraged_confession') ? 0 : -5 }, this.has('encouraged_confession') ? 'Reported the truth after giving your friend the chance to do it himself' : 'Reported the truth without first giving your friend the chance to confess'); cons.push('Sameer was cleared. Karan was penalised and the friendship is bruised—more so because he did not get to say it himself.'); }],
      restored_but_silent: ['Repaired the data, hid the truth', 'You fixed the harm but let the blame stay where it had fallen.', false, () => { sh.adjustMany({ honesty: -10, fairness: -12 }, 'Let an innocent classmate stay under suspicion to protect a friend'); neg.push('Sameer remained under a misconduct report.'); cons.push('The report on Sameer was filed. The dataset is fine; his transcript is not.'); }],
      concealed: ['Concealed', 'You knew the truth and kept it from the one person who needed it.', false, () => { sh.adjustMany({ honesty: -25, fairness: -20, accountability: -15 }, 'Concealed the truth while an innocent person was reported'); neg.push('Let Sameer be reported for something you knew he did not do.'); cons.push('Sameer carries a misconduct record. Karan carries the knowledge of it. So do you.'); }],
      blamed_sameer: ['Blamed Sameer', 'You pointed the professor at the innocent classmate.', false, () => { sh.adjustMany({ fairness: -30, honesty: -30, compassion: -15 }, 'Actively blamed an innocent person'); neg.push('Accused Sameer to protect Karan.'); cons.push('Sameer lost his placement interview the following week; the report was on his transcript.'); }],
      tampered_logs: ['Tampered with the evidence', 'You destroyed the record that proved Sameer innocent.', false, () => { cons.push('Sameer was reported; the log mirror later exposed the deletion—and who was logged in.'); }],
      ignored: ['Stayed out of it', 'You never looked into it, and the report on Sameer was filed.', false, () => { sh.adjustMany({ responsibility: -15, compassion: -10 }, 'Did nothing while a classmate was wrongly reported'); neg.push('Did not engage.'); cons.push('Three weeks of research stayed lost; the wrong student paid for it.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    const mentor = {
      summary: `A friend’s mistake, an innocent classmate, and a professor with a pen. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Honesty when it costs a friend', 'Fairness to the person with no advocate', 'Compassion that helps a friend face the truth', 'Responsibility: repair the harm, not just the story'],
      tradeoffs: 'Loyalty to Karan was a real value—his fear was real, his scholarship was real. But loyalty that requires an innocent person to pay is not loyalty; it is a transfer of pain to whoever has the least power to refuse it. The best outcome needed both: the truth, and a friend beside him when he told it.',
      didWell: pos, risks: neg,
      improve: outcome === 'truth_with_friend_amends' ? 'This is the model: find the facts, repair what can be repaired, and walk in together. Nothing to add.' : outcome === 'truth_reported_without_friend' && !this.has('encouraged_confession') ? 'Right result, missing step: give your friend the chance to say it himself first. It changes how he carries it.' : st.tampered ? 'There is no technical fix for a moral problem. Every log has a mirror; every cover-up has a witness—at minimum, you.' : 'Start with the log and the backup: facts turn an impossible loyalty conflict into a solvable one, because “it was a fixable mistake” is a far easier truth for a friend to tell.',
      theme: outcome === 'truth_with_friend_amends' ? 'nalaDamayanti' : (this.has('promised_silence') || this.has('agreed_blame') || outcome === 'concealed' || outcome === 'restored_but_silent') ? 'karnaLoyalty' : outcome === 'blamed_sameer' || st.tampered ? 'ashwatthama' : outcome === 'ignored' ? 'draupadiQuestion' : 'viduraNiti',
      reflection: 'If Sameer had been your friend and Karan the stranger, what would you have done—and what does the difference tell you?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
