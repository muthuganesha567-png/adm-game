// GAME 3 — THE LOST WALLET: exploration, inventory and honesty under temptation.
import * as THREE from 'three';
import { CharacterScenarioBase } from './_bases.js';
import { NPC } from '../engine/interactionSystem.js';
import * as K from '../engine/worldKit.js';
import { aabb, circle, colliderFromObject } from '../engine/collision.js';

const WALLET_POS = [12, -7];
export class LostWallet extends CharacterScenarioBase {
  build() {
    const s = this.scene; s.fog = new THREE.Fog(0xdfe8ef, 70, 170);
    K.makeSky(s, { top: 0x3f7fd0, bottom: 0xeef3f6, horizon: 0xd3e0ea });
    this.sun = K.makeSun(s, { position: [40, 70, -30], intensity: 1.7, shadowArea: 45 }); K.makeHemi(s, 0xcfe4ff, 0x4f6a3a, 0.8);
    s.add(K.makeGround(400, 0x5f8f48));
    // paths (cross + diagonals to corners)
    s.add(K.makePath(-30, 0, 30, 0, 3)); s.add(K.makePath(0, -30, 0, 30, 3)); s.add(K.makePath(0, 0, 22, 22, 2.4)); s.add(K.makePath(0, 0, -22, 20, 2.4)); s.add(K.makePath(0, 0, 14, -8, 2));
    const f = K.makeFountain(); s.add(f); this.addCollider(circle(0, 0, 2.6, 'fountain')); this.onUpdate((dt, t) => f.userData.update?.(t));
    // boundary hedges with the gate opening at (0,-30)
    const hedge = (x, z, w, d) => { const b = K.box(w, 1.2, d, 0x2f6b2a); b.position.set(x, 0.6, z); b.receiveShadow = true; s.add(b); this.addCollider(aabb(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 'hedge')); };
    hedge(-17, -31, 30, 1); hedge(17, -31, 30, 1); hedge(0, 31, 64, 1); hedge(-32, 0, 1, 62); hedge(32, 0, 1, 62);
    for (const sx of [-1, 1]) { const p = K.box(0.5, 2.8, 0.5, 0xc9b58a); p.position.set(sx * 2.2, 1.4, -31); s.add(p); }
    const gateSign = K.makeTextBoard('CAMPUS PARK', { w: 4.6, h: 0.7, bg: '#1b2a4a', fg: '#f1c75b', fontSize: 70 }); gateSign.position.set(0, 3.1, -31); s.add(gateSign);
    // benches, trees, lamps
    const benches = [[6, -3, 0], [-6, 3, Math.PI], [12, -8.5, 0.2], [-12, -6, 0], [8, 14, Math.PI / 2], [-14, 12, -Math.PI / 2]];
    for (const [x, z, r] of benches) { const b = K.makeBench(); b.position.set(x, 0, z); b.rotation.y = r; s.add(b); this.addCollider(aabb(x - 0.9, z - 0.5, x + 0.9, z + 0.5, 'bench')); }
    let seed = 3; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 34; i++) { const x = -28 + rnd() * 56, z = -26 + rnd() * 54; if (Math.abs(x) < 3 || Math.abs(z) < 3 || Math.hypot(x - 22, z - 22) < 7 || Math.hypot(x + 22, z - 20) < 8 || Math.hypot(x - 12, z + 7) < 3) continue; const t = K.makeTree(0.9 + rnd() * 0.6, 1); t.position.set(x, 0, z); s.add(t); this.addCollider(circle(x, z, 0.4, 'tree')); }
    for (const [x, z] of [[3, -20], [-3, 18], [18, 3], [-18, -3]]) { const l = K.makeLamp(4); l.position.set(x, 0, z); s.add(l); this.addCollider(circle(x, z, 0.2, 'lamp')); }
    for (let i = 0; i < 10; i++) { const b = K.makeBush(0.8 + rnd() * 0.6); b.position.set(-26 + rnd() * 52, 0, 24 + rnd() * 4); s.add(b); }
    // security cabin (NE), canteen (NW)
    const cabin = K.makeBuilding(5, 3.2, 4, 0xf0e6cf, { floors: 1 }); cabin.position.set(23, 0, 24); s.add(cabin); this.addCollider(colliderFromObject(cabin, 'cabin'));
    const cs = K.makeTextBoard('CAMPUS SECURITY · LOST & FOUND', { w: 4.6, h: 0.6, bg: '#13224a', fg: '#ffffff', fontSize: 56 }); cs.position.set(23, 3.5, 21.9); cs.rotation.y = Math.PI; s.add(cs);
    const canteen = K.makeShop(8, 3.6, 6, 0xf4e3c1, 0xc8452c, 'CANTEEN'); canteen.position.set(-23, 0, 23); s.add(canteen); this.addCollider(aabb(-27, 20, -19, 26, 'canteen'));
    const bin = K.cyl(0.3, 0.25, 0.8, 0x3b4a5a, 10); bin.position.set(-18.5, 0.4, 19.5); bin.castShadow = true; s.add(bin); this.addCollider(circle(-18.5, 19.5, 0.35, 'bin'));
    const nb = K.makeNoticeBoard(['LOST PROPERTY', 'Found something?', 'Hand it in at the Security', 'cabin (north-east corner).', 'Owners are contacted via ID.']); nb.position.set(3.2, 0, -27); s.add(nb); this.addCollider(aabb(2, -27.2, 4.4, -26.8, 'board'));
    // the wallet
    const wallet = new THREE.Group(); const wb = K.box(0.22, 0.05, 0.16, 0x6b3f1d); wb.position.y = 0.03; wallet.add(wb); const note = K.box(0.14, 0.01, 0.07, 0xd9c7a0); note.position.set(0.05, 0.06, 0); wallet.add(note); wallet.position.set(WALLET_POS[0], 0, WALLET_POS[1]); wallet.rotation.y = 0.6; s.add(wallet); this.walletMesh = wallet;
    // NPCs
    this.owner = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xc2446a, pants: 0x4a3a5a, hair: 0x1a1210 }), x: -8, z: -8, waypoints: [[-10, -6, 2.5], [-18, 0, 2], [-10, 10, 2.5], [5, 12, 2], [14, 4, 2.5], [6, -12, 2.5]], speed: 0.95 }), 'Student');
    this.friend = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x3a7fd0, pants: 0x333 }), x: -16, z: 17, yaw: 2.6 }), 'Vikram (your friend)');
    this.guard = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0x3b4a6b, pants: 0x202838 }), x: 22, z: 20.5, yaw: Math.PI + 0.4 }), 'Security guard');
    this.vendor = this.addNPC(new NPC({ mesh: K.makeHuman({ shirt: 0xeeeeee, pants: 0x444 }), x: -23, z: 19.2, yaw: Math.PI }), 'Canteen');
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1 : -1; this.addNPC(new NPC({ mesh: K.makeHuman({}), x: sx * 20, z: -20 + i * 10, waypoints: [[sx * 20, -20 + i * 10, 1], [sx * 4, -20 + i * 10, 1]], speed: 1.0 })); }
    // player
    this.setupPlayer({ x: 0, z: -24, yaw: 0, bounds: { minX: -31, maxX: 31, minZ: -30.5, maxZ: 30.5 } });
    this.state = { examined: false, carrying: false, money: 2000, pocket: 0, spent: 0, walletOnGround: true, walletAt: [...WALLET_POS], discarded: false, ownerMet: false, ownerLeft: false, directed: false };
    this.ownerLeaveAt = this.diff(320, 240, 180);
    this.setupInteractions();
    this.camera.position.set(6, 4, -30); this.camera.lookAt(0, 1, 0);
  }

  setupInteractions() {
    const I = this.interact;
    I.add({ id: 'wallet', x: WALLET_POS[0], z: WALLET_POS[1], y: 1.2, radius: 2, prompt: 'Examine the wallet', onInteract: () => this.converse(() => this.examineWallet()) });
    I.add({ id: 'notice', x: 3.2, z: -26.2, radius: 2.2, prompt: 'Read the notice board', onInteract: () => this.converse(async () => { this.record('read_notice'); await this.say('Notice board', 'LOST PROPERTY — Found something? Hand it in at the Campus Security cabin (north-east corner). Owners are contacted through their ID.'); }) });
    I.add({ id: 'owner', object: this.owner.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to the student', onInteract: () => this.converse(() => this.talkOwner()) });
    I.add({ id: 'friend', object: this.friend.mesh, x: 0, z: 0, radius: 2.2, prompt: 'Talk to Vikram', onInteract: () => this.converse(() => this.talkFriend()) });
    I.add({ id: 'guard', object: this.guard.mesh, x: 0, z: 0, radius: 2.4, prompt: 'Talk to the security guard', onInteract: () => this.converse(() => this.talkGuard()) });
    I.add({ id: 'canteen', object: this.vendor.mesh, x: 0, z: 0, radius: 3, prompt: 'Canteen counter', onInteract: () => this.converse(() => this.canteen()) });
    I.add({ id: 'bin', x: -18.5, z: 19.5, y: 1.4, radius: 1.8, prompt: 'Dustbin', enabled: false, marker: false, onInteract: () => this.converse(() => this.binWallet()) });
    I.add({ id: 'exit', x: 0, z: -29, y: 1.5, radius: 2.2, prompt: 'Leave the park', markerColor: 0x9ad0ff, onInteract: () => this.converse(() => this.leavePark()) });
  }

  start() {
    super.start(); this.record('start');
    this.hud().setObjective('You are crossing the campus park on your way to class. Explore. <span class="kbd">E</span> to interact, <span class="kbd">I</span> for your pockets.');
    this.hud().controlsHint('<span class="kbd">W A S D</span> move · <span class="kbd">Shift</span> run · <span class="kbd">Mouse</span> look · <span class="kbd">E</span> interact · <span class="kbd">I</span> pockets');
    this.hud().centerMessage('The Lost Wallet', 2200);
    this.after(2.5, () => this.notify('Something is lying on the ground near the bench by the fountain.', 'info'));
    this.after(12, () => this.hud().controlsHint(''));
  }

  invText() { const items = []; if (this.state.carrying) items.push(`Wallet (₹${this.state.money} inside, ID: Anjali Sharma)`); if (this.state.pocket > 0) items.push(`₹${this.state.pocket} cash (not yours)`); return items; }
  refreshInventory() { this.hud().setInventory(this.invText(), 'Pockets'); this.interact.setEnabled('bin', this.state.carrying); }

  async examineWallet() {
    const st = this.state;
    if (!st.examined) { st.examined = true; this.record('examined_wallet'); this.ctx.audio.sfx('paper'); }
    const inside = st.money > 0 ? `₹${st.money} in notes, ` : '';
    const r = await this.say('You', `A brown leather wallet. Inside: ${inside}a college ID card — "Anjali Sharma, Dept. of Physics" — and a photo of a family. Nobody is watching.`, [
      { label: 'Take the wallet with you (to return it)', value: 'take' },
      ...(st.money > 0 ? [{ label: 'Take only the money, leave the wallet', value: 'money', danger: true }] : []),
      { label: 'Leave it where it is', value: 'leave' },
    ]);
    if (r === 'take') { st.carrying = true; st.walletOnGround = false; this.walletMesh.visible = false; this.interact.remove('wallet'); this.record('picked_up_wallet'); this.ctx.audio.sfx('pickup'); this.notify('You picked up the wallet. Press I to open your pockets.', 'info'); this.hud().setObjective('You have Anjali Sharma’s wallet. Decide what to do with it — the student, the Security cabin, your friend, the canteen, the gate…'); }
    else if (r === 'money') { st.pocket += st.money; st.money = 0; this.record('took_money', { amount: st.pocket }); this.ctx.audio.sfx('pickup'); this.notify('You pocketed ₹2,000 and left the wallet with the ID.', 'bad'); }
    else { this.record('left_in_place'); }
    this.refreshInventory();
  }

  async pockets() {
    const st = this.state; if (!st.carrying && st.pocket === 0) { this.notify('Your pockets are empty.', 'info'); return; }
    const opts = [];
    if (st.carrying && st.money > 0) opts.push({ label: `Take the ₹${st.money} out of the wallet`, value: 'out', danger: true });
    if (st.carrying && st.pocket > 0) opts.push({ label: `Put ₹${st.pocket} back into the wallet`, value: 'back' });
    if (st.carrying) opts.push({ label: 'Drop the wallet here', value: 'drop' });
    opts.push({ label: 'Close', value: 'close' });
    const r = await this.say('Your pockets', this.invText().join(' · '), opts);
    if (r === 'out') { st.pocket += st.money; this.record('took_money', { amount: st.money }); st.money = 0; this.notify('You moved the money into your own pocket.', 'bad'); }
    else if (r === 'back') { st.money += st.pocket; this.record('returned_money_to_wallet', { amount: st.pocket }); st.pocket = 0; this.notify('You put the money back.', 'good'); }
    else if (r === 'drop') { st.carrying = false; st.walletOnGround = true; st.walletAt = [this.player.pos.x, this.player.pos.z]; this.walletMesh.position.set(st.walletAt[0], 0, st.walletAt[1]); this.walletMesh.visible = true; this.record('dropped_wallet', { x: Math.round(st.walletAt[0]), z: Math.round(st.walletAt[1]) }); this.ctx.audio.sfx('drop'); this.interact.add({ id: 'wallet', x: st.walletAt[0], z: st.walletAt[1], y: 1.2, radius: 2, prompt: 'Examine the wallet', onInteract: () => this.converse(() => this.examineWallet()) }); }
    this.refreshInventory();
  }

  async talkOwner() {
    const st = this.state; const o = this.owner; o.frozen = true; o.faceTowards(this.player.pos.x, this.player.pos.z);
    const unfreeze = () => { o.frozen = false; };
    if (!st.ownerMet) { st.ownerMet = true; this.record('met_owner'); this.setLabel(o.mesh, 'Anjali'); }
    if (st.carrying) {
      const r = await this.say('Anjali', 'Sorry— have you seen a brown wallet anywhere? I lost it near the benches. My ID is in it, and this month’s hostel fees. I’ve been going round and round…', [
        { label: 'Yes — I found it. Here you go.', value: 'return' }, { label: 'No, sorry. I haven’t seen it.', value: 'lie', danger: true }, { label: 'What does it look like?', value: 'stall' },
      ]);
      if (r === 'return') return this.returnWallet(unfreeze);
      if (r === 'lie') { this.record('lied_to_owner'); await this.say('Anjali', 'Oh… okay. Thanks anyway. If you see it, I’ll be around here for a while.'); unfreeze(); return; }
      this.record('stalled_owner'); await this.say('Anjali', 'Brown leather, a bit worn. There’s a photo of my parents in it. Please— if you find it, I’m right here.'); unfreeze(); return;
    }
    const seen = st.examined || this.has('took_money');
    const opts = [{ label: 'I haven’t seen it.', value: seen ? 'lie' : 'honest_no' }, { label: 'I’ll help you look.', value: 'help' }];
    if (seen && st.walletOnGround) opts.unshift({ label: 'I saw a wallet on the ground — I’ll show you.', value: 'direct' });
    const r = await this.say('Anjali', 'Excuse me— have you seen a brown wallet? I lost it somewhere near the benches. It has my ID and this month’s hostel fees in it.', opts);
    if (r === 'direct') { st.directed = true; this.record('directed_owner_to_wallet'); await this.say('Anjali', 'Really? Thank you! Show me— please.'); o.frozen = false; o.setWaypoints([[st.walletAt[0] + 0.6, st.walletAt[1] + 0.6]], false); o.goingToWallet = true; this.hud().setObjective('Anjali is going to the wallet. Follow her.'); return; }
    if (r === 'lie') { this.record('lied_to_owner'); await this.say('Anjali', 'Okay… thanks anyway. I’ll keep looking.'); }
    else if (r === 'honest_no') { this.record('honest_not_seen'); await this.say('Anjali', 'Okay. If you see it, I’ll be around the benches for a while.'); }
    else { this.record('offered_help'); await this.say('Anjali', 'Thank you. It’s brown leather with a family photo inside. I’ll check the other side of the fountain.'); }
    unfreeze();
  }

  async returnWallet(unfreeze) {
    const st = this.state; st.carrying = false; this.refreshInventory(); this.record('returned_wallet', { money: st.money, pocket: st.pocket, spent: st.spent });
    if (st.money >= 2000) { this.ctx.audio.sfx('success'); await this.say('Anjali', 'Oh thank god— everything is here! The fees, my ID, the photo… Thank you. Really. You have no idea what this means today.'); return this.endWith('returned_intact'); }
    const missing = 2000 - st.money;
    const r = await this.say('Anjali', `Thank you so much! …Wait. The money— ₹${missing} is missing. Was it like this when you found it?`, [
      { label: 'Yes, that’s how I found it.', value: 'deny', danger: true },
      ...(st.pocket > 0 ? [{ label: `No. I took it. Here is the ₹${st.pocket} back — I’m sorry.`, value: 'admit_return' }] : []),
      ...(st.spent > 0 ? [{ label: `No. I took it and spent ₹${st.spent}. I’ll repay you. I’m sorry.`, value: 'admit_spent' }] : []),
    ]);
    if (r === 'deny') { this.record('denied_taking_money'); await this.say('Anjali', 'I see… Thank you for bringing the rest back, I suppose. I’ll have to borrow for the fees.'); return this.endWith('returned_money_missing_denied'); }
    if (r === 'admit_return') { st.money += st.pocket; this.record('admitted_and_returned', { amount: st.pocket }); st.pocket = 0; this.refreshInventory(); await this.say('Anjali', 'You… took it, and then came back to return it. I don’t know what to say. Thank you for telling me the truth.'); return this.endWith('returned_after_admitting'); }
    if (r === 'admit_spent') { if (st.pocket > 0) { st.money += st.pocket; st.pocket = 0; } this.record('admitted_spent', { amount: st.spent }); this.refreshInventory(); await this.say('Anjali', 'That hurts. But you told me, and most people wouldn’t have. Repay me when you can— my number is on the notice board at the hostel.'); return this.endWith('returned_after_admitting_spent'); }
    unfreeze?.();
  }

  async talkFriend() {
    const st = this.state; const f = this.friend; f.faceTowards(this.player.pos.x, this.player.pos.z);
    if (st.carrying || st.pocket > 0 || st.examined) {
      if (!this.has('friend_tempted')) this.record('friend_tempted');
      const r = await this.say('Vikram', st.carrying ? 'Is that a wallet? Dude. Nobody saw you. Keep the cash, dump the wallet in the bin— finders keepers. Two thousand is two thousand.' : 'I saw that wallet by the bench too. Honestly? Nobody would know. Finders keepers, no?', [
        { label: 'You’re right. It’s just lying there.', value: 'agree', danger: true }, { label: 'No. It’s someone’s fees. I’m returning it.', value: 'refuse' }, { label: 'Let’s not talk about it.', value: 'neutral' },
      ]);
      if (r === 'agree') { this.record('agreed_with_friend'); await this.say('Vikram', 'That’s what I’m saying. Nobody owes anybody.'); }
      else if (r === 'refuse') { this.record('refused_friend'); await this.say('Vikram', 'Fine, fine, Yudhishthira. Don’t say I didn’t offer you a samosa.'); }
      else { this.record('deflected_friend'); await this.say('Vikram', 'Suit yourself.'); }
      return;
    }
    await this.say('Vikram', 'Hey! Skipping the lecture too? The canteen has fresh samosas, if you’ve got money. I’m broke.');
  }

  async talkGuard() {
    const st = this.state; this.guard.faceTowards(this.player.pos.x, this.player.pos.z);
    if (st.carrying) {
      const r = await this.say('Security guard', 'Yes? Lost and found is here. Do you want to hand something in?', [{ label: 'Yes — I found this wallet.', value: 'hand' }, { label: 'No, just asking.', value: 'no' }]);
      if (r !== 'hand') { this.record('asked_guard'); return; }
      st.carrying = false; this.refreshInventory(); this.record('handed_to_security', { money: st.money, pocket: st.pocket, spent: st.spent });
      if (st.money >= 2000) { this.ctx.audio.sfx('success'); await this.say('Security guard', 'Anjali Sharma, Physics. ₹2,000 and an ID. I’ll log it and call her department right now— she’ll have it within the hour. Well done.'); return this.endWith('handed_in_intact'); }
      const r2 = await this.say('Security guard', `Anjali Sharma, Physics… There’s an ID but only ₹${st.money} in it. I have to log the contents and who handed it in. Was there anything else inside when you found it?`, [
        { label: 'No, that’s all there was.', value: 'deny', danger: true }, ...(st.pocket > 0 ? [{ label: `Yes. I took ₹${st.pocket}. Here it is.`, value: 'admit' }] : []), ...(st.spent > 0 && st.pocket === 0 ? [{ label: `I took the money and spent ₹${st.spent}. Log it against my name.`, value: 'admit_spent' }] : []),
      ]);
      if (r2 === 'admit') { st.money += st.pocket; this.record('admitted_and_returned', { amount: st.pocket }); st.pocket = 0; this.refreshInventory(); await this.say('Security guard', 'Right. I’ll log the full amount as handed in. That took some nerve to say.'); return this.endWith('handed_in_after_admitting'); }
      if (r2 === 'admit_spent') { this.record('admitted_spent', { amount: st.spent }); await this.say('Security guard', 'I’ll have to note that. The owner will decide what to do. At least you came here.'); return this.endWith('handed_in_after_admitting_spent'); }
      this.record('denied_taking_money'); await this.say('Security guard', 'Noted. The owner will be told exactly what came in, and who brought it.'); return this.endWith('handed_in_money_missing');
    }
    if (st.pocket > 0) { const r = await this.say('Security guard', 'Yes? Lost and found is here.', [{ label: 'I found ₹2,000 lying near a bench. Here.', value: 'cash' }, { label: 'Nothing.', value: 'no' }]); if (r === 'cash') { this.record('handed_cash_only', { amount: st.pocket }); st.pocket = 0; this.refreshInventory(); await this.say('Security guard', 'Cash without a wallet… I’ll log it. If someone reports a loss that matches, it will reach them.'); return this.endWith('handed_cash_only'); } return; }
    this.record('asked_guard'); await this.say('Security guard', 'If you find anything— phones, wallets, ID cards— bring it here. We contact owners through their ID. Most things come back to people that way.');
  }

  async canteen() {
    const st = this.state;
    if (st.pocket > 0) { const r = await this.say('Canteen', 'Samosa and chai, ₹150. Paying?', [{ label: 'Yes — pay with the cash from the wallet (₹150)', value: 'spend', danger: true }, { label: 'No.', value: 'no' }]); if (r === 'spend') { st.pocket -= 150; st.spent += 150; this.record('spent_money', { amount: 150, remainingPocket: st.pocket }); this.ctx.audio.sfx('chime'); this.notify('You spent ₹150 of Anjali’s money. It cannot be fully returned now.', 'bad'); this.refreshInventory(); } return; }
    this.record('canteen_broke'); await this.say('Canteen', 'Samosa and chai, ₹150.', [{ label: 'I don’t have money on me today.', value: 'no' }]);
  }

  async binWallet() { const st = this.state; if (!st.carrying) return; const r = await this.say('You', 'Throw the wallet — with her ID and photo — into the dustbin?', [{ label: 'Throw it away', value: 'yes', danger: true }, { label: 'Keep it', value: 'no' }]); if (r !== 'yes') return; st.carrying = false; st.discarded = true; this.record('discarded_wallet', { money: st.money }); this.ctx.audio.sfx('drop'); this.refreshInventory(); this.notify('The wallet, ID and photo are gone.', 'bad'); }

  async leavePark() {
    const st = this.state;
    const r = await this.say('You', 'Leave the park and head to class?', [{ label: 'Leave', value: 'yes' }, { label: 'Stay a little longer', value: 'no' }]);
    if (r !== 'yes') return;
    this.record('left_park', { carrying: st.carrying, pocket: st.pocket, spent: st.spent });
    if (st.carrying) return this.endWith('kept_wallet');
    if (st.pocket > 0 || st.spent > 0) return this.endWith('took_money');
    if (st.discarded) return this.endWith('discarded_wallet');
    if (st.examined) return this.endWith('walked_away');
    return this.endWith('never_found');
  }

  update(dt) {
    this.tick(dt); this.stepPlayer(dt);
    if (this.ctx.input.pressed('KeyI') && !this.ctx.dialogue.open) this.converse(() => this.pockets());
    const st = this.state;
    if (this.owner.goingToWallet && this.owner.done) {
      this.owner.goingToWallet = false;
      if (st.walletOnGround) { st.walletOnGround = false; this.walletMesh.visible = false; this.interact.remove('wallet'); this.record('owner_recovered_wallet', { money: st.money }); this.ctx.audio.sfx('success'); this.converse(async () => { await this.say('Anjali', st.money >= 2000 ? 'This is it! Everything’s inside. Thank you for telling me— I would never have looked here.' : `This is mine! But… the money is gone. ₹${2000 - st.money} missing. Someone must have taken it before you saw it… Thank you, anyway.`); this.endWith(st.money >= 2000 ? 'owner_recovered_via_hint' : 'owner_recovered_money_missing'); }); }
      else { this.converse(async () => { await this.say('Anjali', 'It’s not here… Are you sure this is where you saw it?'); this.owner.setWaypoints([[-10, -6, 2.5], [-18, 0, 2], [-10, 10, 2.5], [5, 12, 2]], true); }); }
    }
    if (!st.ownerLeft && this.time > this.ownerLeaveAt - 30 && !this.flags.leaveWarn) { this.flags.leaveWarn = true; this.notify('The student searching the park looks like she is about to give up and leave.', 'info'); }
    if (!st.ownerLeft && this.time > this.ownerLeaveAt) { st.ownerLeft = true; this.record('owner_left'); this.owner.frozen = false; this.owner.setWaypoints([[0, -22], [0, -34]], false); this.interact.setEnabled('owner', false); this.notify('The student has given up searching and is leaving the park.', 'bad'); }
    if (st.ownerLeft && this.owner.done) { this.owner.mesh.visible = false; this.owner.collider.disabled = true; }
    if (this.time > this.ownerLeaveAt + 60 && !this.finished) { this.record('time_up'); this.endWith(st.carrying ? 'kept_wallet' : (st.pocket > 0 || st.spent > 0) ? 'took_money' : st.discarded ? 'discarded_wallet' : st.examined ? 'walked_away' : 'never_found'); }
  }

  endWith(outcome) { if (this.finished) return; this.locked = true; this.hud().setInventory(null); this.finish(outcome); }

  evaluate(outcome) {
    const sh = this.sheet(this.meta.dimensions); const pos = [], neg = [], actions = [], cons = []; const st = this.state;
    const took = this.has('took_money'); const spent = this.has('spent_money'); const lied = this.has('lied_to_owner') || this.has('denied_taking_money');
    if (this.has('read_notice')) { sh.adjust('practicalWisdom', 5, 'Read the Lost Property notice'); }
    if (this.has('examined_wallet')) actions.push('Examined the wallet (₹2,000, ID of Anjali Sharma, family photo).');
    if (this.has('picked_up_wallet')) actions.push('Picked up the wallet.');
    if (took) { const amt = this.events.filter((e) => e.type === 'took_money').reduce((a, e) => a + (e.amount || 0), 0); actions.push(`Took ₹${amt} out of the wallet.`); sh.adjustMany({ honesty: -35, fairness: -30, compassion: -20, responsibility: -15 }, 'Took money that belonged to someone else'); neg.push('Took money from the wallet.'); }
    if (spent) { actions.push(`Spent ₹${st.spent} of the money at the canteen.`); sh.adjustMany({ responsibility: -10, accountability: -5 }, 'Spent money that was not yours—an irreversible step'); cons.push('Part of the money can no longer be returned.'); }
    if (this.has('returned_money_to_wallet')) { sh.adjustMany({ honesty: 12, accountability: 10 }, 'Put the money back before anyone asked'); pos.push('Reconsidered and put the money back.'); actions.push('Put the money back into the wallet.'); }
    if (this.has('offered_help')) { sh.adjust('compassion', 6, 'Offered to help the owner search'); pos.push('Offered to help look.'); }
    if (lied) { sh.adjustMany({ honesty: -25, accountability: -20 }, 'Lied to the owner or the guard'); neg.push('Lied when asked directly.'); actions.push('Denied knowing about the wallet or the money.'); }
    if (this.has('agreed_with_friend')) { sh.adjustMany({ honesty: -5, fairness: -5 }, 'Agreed with Vikram that finders are keepers'); neg.push('Went along with a friend’s bad advice.'); }
    if (this.has('refused_friend')) { sh.adjustMany({ honesty: 10, practicalWisdom: 5 }, 'Refused a friend’s pressure to keep the money'); pos.push('Stood firm against peer pressure.'); }
    const T = {
      returned_intact: ['Returned intact to Anjali', 'You found the owner and returned the wallet with everything in it.', true, () => { sh.adjustMany({ honesty: 30, compassion: 25, responsibility: 20, fairness: 25, accountability: 10 }, 'Returned the wallet to its owner, intact'); pos.push('Returned the wallet with all the money and the ID.'); cons.push('Anjali paid her hostel fees on time and kept her ID and family photo.'); }],
      handed_in_intact: ['Handed in intact at Security', 'You handed the wallet, untouched, to the campus Lost & Found.', true, () => { sh.adjustMany({ honesty: 25, responsibility: 25, fairness: 20, compassion: 10, practicalWisdom: 15 }, 'Used the proper channel to return the wallet intact'); pos.push('Handed the wallet in through the official channel.'); cons.push('Security contacted Anjali through her ID; she had her wallet back within the hour.'); }],
      owner_recovered_via_hint: ['Owner found it with your help', 'You pointed Anjali to the wallet and she recovered it intact.', true, () => { sh.adjustMany({ honesty: 20, compassion: 18, responsibility: 10, practicalWisdom: 6 }, 'Told the owner where her wallet was'); pos.push('Guided the owner to her wallet.'); cons.push('Anjali recovered everything.'); }],
      owner_recovered_money_missing: ['Owner recovered the wallet without the money', 'Anjali got her ID back, but the money was gone.', false, () => { sh.adjustMany({ compassion: 6, honesty: -10 }, 'Pointed her to the wallet but let her believe a stranger took the money'); cons.push('Anjali has her ID, but will borrow to pay her fees.'); }],
      returned_after_admitting: ['Returned after admitting the truth', 'You took the money, then admitted it and returned everything.', true, () => { sh.adjustMany({ honesty: 20, accountability: 30, compassion: 10, fairness: 15 }, 'Admitted taking the money and returned it'); pos.push('Owned up and made it right.'); cons.push('Anjali has her money back and knows exactly what happened.'); }],
      returned_after_admitting_spent: ['Admitted the truth; money partly gone', 'You returned the wallet and confessed to spending some of the money.', false, () => { sh.adjustMany({ honesty: 15, accountability: 25, compassion: 5 }, 'Admitted spending the money and promised to repay'); pos.push('Told the truth even when it was costly.'); cons.push('Anjali is short for her fees until you repay her.'); }],
      returned_money_missing_denied: ['Returned the wallet, denied taking the money', 'You returned the wallet but lied about the missing money.', false, () => { sh.adjustMany({ honesty: -15, accountability: -15, compassion: 5 }, 'Returned the wallet but denied taking the money'); cons.push('Anjali has her ID and a lie she half-believes; her fees are short.'); }],
      handed_in_after_admitting: ['Handed in after admitting the truth', 'At the Security cabin you admitted taking the money and handed everything in.', true, () => { sh.adjustMany({ honesty: 18, accountability: 28, responsibility: 12, fairness: 12 }, 'Admitted and handed in the full amount'); pos.push('Corrected your own wrong before it became permanent.'); cons.push('The full amount reached Anjali through Security.'); }],
      handed_in_after_admitting_spent: ['Handed in; admitted spending some', 'You handed the wallet in and had the shortfall logged against your name.', false, () => { sh.adjustMany({ honesty: 12, accountability: 22 }, 'Had the shortfall recorded against your own name'); cons.push('Anjali will be repaid through the campus office.'); }],
      handed_in_money_missing: ['Handed in with money missing', 'You handed in the wallet but denied knowing where the money went.', false, () => { sh.adjustMany({ honesty: -15, accountability: -15, responsibility: 5 }, 'Handed in the wallet but lied about the money'); cons.push('Security logged a short wallet under your name; Anjali lost her fees.'); }],
      handed_cash_only: ['Handed in the cash', 'You left the wallet behind but later handed the cash to Security.', false, () => { sh.adjustMany({ honesty: 5, accountability: 15, responsibility: -5 }, 'Handed in the cash, but not the wallet and ID'); cons.push('The cash may reach Anjali; her ID and photo are still lying in the park.'); }],
      took_money: ['Took the money', 'You left the park with Anjali’s money.', false, () => { sh.adjustMany({ accountability: -10 }, 'Left with the money'); cons.push('Anjali cannot pay her hostel fees this month. She will remember the day for years; you will too.'); }],
      kept_wallet: ['Left with the wallet', 'You left the park carrying the wallet.', false, () => { sh.adjustMany({ honesty: -15, fairness: -15, responsibility: -10 }, 'Left the park with someone else’s wallet'); neg.push('Walked off with the wallet.'); cons.push('Anjali searched for an hour, then left to report her ID lost. Perhaps you meant to return it later—she cannot know that.'); }],
      discarded_wallet: ['Threw the wallet away', 'You threw the wallet, ID and photo into a bin.', false, () => { sh.adjustMany({ compassion: -20, responsibility: -15, fairness: -10 }, 'Discarded another person’s ID and photo'); neg.push('Discarded the wallet.'); cons.push('Anjali will spend weeks replacing her ID; the photo is gone for good.'); }],
      walked_away: ['Walked away', 'You looked, and left it there.', false, () => { sh.adjustMany({ responsibility: -10, compassion: -10 }, 'Saw the wallet and did nothing'); neg.push('Did nothing to help the owner.'); cons.push('Maybe the next person was honest. Maybe not. You decided it was not your problem.'); }],
      never_found: ['Never engaged', 'You left without examining the wallet.', false, () => { sh.adjust('responsibility', -5, 'Did not look into the situation'); cons.push('The wallet lay there until someone else decided its fate.'); }],
    };
    const [title, summary, success, apply] = T[outcome] || [outcome, '', false, () => {}]; apply();
    if (this.has('owner_left') && !['returned_intact', 'handed_in_intact'].includes(outcome)) cons.push('The owner gave up searching and left while you deliberated.');
    const successOutcome = ['returned_intact', 'handed_in_intact', 'owner_recovered_via_hint', 'returned_after_admitting', 'handed_in_after_admitting'].includes(outcome);
    const theme = took && !this.has('admitted_and_returned') ? 'yudhishthiraDice' : outcome === 'walked_away' ? 'draupadiQuestion' : lied ? 'ashwatthama' : successOutcome ? 'yudhishthiraDog' : this.has('refused_friend') || this.has('agreed_with_friend') ? 'viduraNiti' : 'dharmaSankata';
    const mentor = {
      summary: `A stranger’s wallet, a quiet park, and nobody watching. ${summary}`,
      consequences: cons.join(' '),
      principles: ['Honesty when unobserved', 'Fairness—what is not yours', 'Compassion for a person you have never met', 'Accountability when you have already erred'],
      tradeoffs: took ? 'The money was real and the temptation was real. But every rupee had an owner with a deadline and a family photo. What was gained was small and what was taken was large.' : 'Returning the wallet cost you a few minutes; keeping it would have cost someone her month. Most ethical choices are not close calls—they only feel that way when nobody is watching.',
      didWell: pos, risks: neg,
      improve: outcome === 'returned_intact' || outcome === 'handed_in_intact' ? 'Nothing essential. If you want to go further: tell the owner where you found it, so she can check whether anything else fell out.' : lied ? 'The moment you are asked a direct question is the last cheap exit from a wrong path. Take it.' : took ? 'If you have already taken something, the fastest way back is to return it before you are asked. Each step further (spending, lying) raises the price of honesty.' : 'Treat found property as a duty you have been handed, not a windfall: owner first, Lost & Found second, your pocket never.',
      theme,
      reflection: 'If the wallet had been yours, and someone found it today, what would you hope they did—and why should you expect of yourself less than you hope from them?',
    };
    return { outcome: { title, summary, success }, sheet: sh, positives: pos, negatives: neg, actions, consequences: cons.length ? cons : ['No significant consequences were recorded.'], mentor };
  }
}
