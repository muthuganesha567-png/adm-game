// Shared Playwright harness for automated checks (run with: node tests/<file>.cjs)
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW_PATH || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8000/';

async function launch({ width = 960, height = 540, fresh = true, simSteps = 4, settings = {} } = {}) {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const logs = []; const errors = [];
  page.on('console', (m) => { const t = m.text(); logs.push(`[${m.type()}] ${t}`); if (m.type() === 'error') errors.push(t); });
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
  await page.addInitScript(({ fresh, settings }) => {
    if (fresh) localStorage.clear();
    const base = { quality: 'low', shadows: false, particles: false, ...settings };
    const cur = JSON.parse(localStorage.getItem('dharmaDecision.settings.v1') || '{}');
    localStorage.setItem('dharmaDecision.settings.v1', JSON.stringify({ ...cur, ...base }));
  }, { fresh, settings });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dharma && window.__dharma.state && window.__dharma.state !== 'BOOT', null, { timeout: 30000 });
  await page.evaluate((n) => { window.__dharma.simSteps = n; }, simSteps);
  return { browser, page, logs, errors };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function shot(page, name) { const p = path.join(__dirname, 'shots', name + '.png'); fs.mkdirSync(path.dirname(p), { recursive: true }); await page.screenshot({ path: p }); return p; }
async function hold(page, code, ms) { await page.keyboard.down(code); await sleep(ms); await page.keyboard.up(code); }
async function state(page) { return page.evaluate(() => ({ state: window.__dharma.state, ui: window.__dharma.ui.active, scenario: window.__dharma.scenario?.meta.id, finished: window.__dharma.scenario?.finished, time: window.__dharma.scenario?.time, errors: window.__dharma.errors })); }
/** Start a specific scenario directly (manual mode), skipping tutorial/intro screens. */
async function startScenario(page, id) {
  await page.evaluate((id) => { window.__dharma.save.setTutorialSeen(true); window.__dharma.startScenario(id, { mode: 'manual', skipIntro: true }); }, id);
  await page.waitForFunction(() => window.__dharma.state === 'PLAYING', null, { timeout: 20000 });
  await sleep(200);
}
/** Wait until scenario time reaches t seconds (or state leaves PLAYING). */
async function untilTime(page, t, timeout = 120000) {
  await page.waitForFunction((t) => !window.__dharma.scenario || window.__dharma.state !== 'PLAYING' || window.__dharma.scenario.time >= t, t, { timeout, polling: 100 });
}
async function untilFn(page, fnBody, timeout = 120000) {
  await page.waitForFunction(new Function('return (' + fnBody + ')()'), null, { timeout, polling: 100 });
}
async function waitResults(page) { await page.waitForSelector('#results.visible', { timeout: 60000 }); await sleep(600); return page.evaluate(() => { const r = window.__dharma.lastResult; return { outcome: r.outcome, overall: r.overall, dims: r.dimensions, ledger: r.ledger.map((l) => `${l.dim} ${l.delta > 0 ? '+' : ''}${l.delta}: ${l.reason}`), actions: r.actions, mentorSrc: r.mentor.source, theme: r.mentor.theme.title }; }); }
/** Evaluate inside the scenario: fn receives scenario `s` */
async function sc(page, body) { return page.evaluate(new Function('const s = window.__dharma.scenario; return (' + body + ')')); }

/** Walk the character to (x,z) using real key input (camera yaw is pointed at the target). */
async function walkTo(page, x, z, { tol = 1.5, timeout = 60000, sprint = true } = {}) {
  const t0 = Date.now(); let last = Infinity, stuck = 0;
  if (sprint) await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('KeyW');
  try {
    while (Date.now() - t0 < timeout) {
      const d = await page.evaluate(([x, z]) => { const s = window.__dharma.scenario; if (!s || !s.player || window.__dharma.state !== 'PLAYING') return -1; const p = s.player.pos; const dx = x - p.x, dz = z - p.z; s.player.camYaw = Math.atan2(dx, dz); return Math.hypot(dx, dz); }, [x, z]);
      if (d < 0) break; if (d <= tol) break;
      if (Math.abs(last - d) < 0.02) stuck++; else stuck = 0; last = d;
      if (stuck > 25) { // nudge sideways when stuck on an obstacle
        await page.keyboard.up('KeyW'); await page.keyboard.down(stuck % 2 ? 'KeyA' : 'KeyD'); await sleep(350); await page.keyboard.up(stuck % 2 ? 'KeyA' : 'KeyD'); await page.keyboard.down('KeyW'); stuck = 0;
      }
      await sleep(60);
    }
  } finally { await page.keyboard.up('KeyW'); if (sprint) await page.keyboard.up('ShiftLeft'); }
  await sleep(150);
  return page.evaluate(([x, z]) => { const p = window.__dharma.scenario?.player?.pos; return p ? Math.hypot(x - p.x, z - p.z) : -1; }, [x, z]);
}
/** Press E (interact) and wait a moment for the dialogue/panel to open. */
async function interact(page) { await page.keyboard.down('KeyE'); await sleep(80); await page.keyboard.up('KeyE'); await sleep(350); }
/** Click a dialogue option whose text matches `match` (string or RegExp). Returns the clicked label. */
async function choose(page, match, timeout = 8000) {
  await page.waitForSelector('#dialogue.visible .opt', { timeout });
  await sleep(120);
  const labels = await page.$$eval('#dialogue.visible .opt', (els) => els.map((e) => e.textContent.replace(/^\d+/, '').trim()));
  const idx = labels.findIndex((l) => (match instanceof RegExp ? match.test(l) : l.includes(match)));
  if (idx < 0) throw new Error(`Dialogue option not found: ${match} in [${labels.join(' | ')}]`);
  const btns = await page.$$('#dialogue.visible .opt'); await btns[idx].click(); await sleep(250);
  return labels[idx];
}
/** Click a button inside an open in-game panel (.game-panel) by text. */
async function panelClick(page, match, timeout = 8000) {
  await page.waitForSelector('.game-panel.visible', { timeout }); await sleep(120);
  const labels = await page.$$eval('.game-panel.visible button', (els) => els.map((e) => e.textContent.trim()));
  const idx = labels.findIndex((l) => (match instanceof RegExp ? match.test(l) : l.includes(match)));
  if (idx < 0) throw new Error(`Panel button not found: ${match} in [${labels.join(' | ')}]`);
  const btns = await page.$$('.game-panel.visible button'); await btns[idx].click(); await sleep(200);
  return labels[idx];
}
/** Click the N-th stepper "+"/"−" for a row containing rowText inside the open panel. */
async function panelStep(page, rowText, sign = '+', times = 1) {
  for (let i = 0; i < times; i++) {
    const ok = await page.evaluate(([rowText, sign]) => { const rows = [...document.querySelectorAll('.game-panel.visible tr')]; const row = rows.find((r) => r.textContent.includes(rowText)); if (!row) return false; const b = [...row.querySelectorAll('.stepper button')].find((x) => x.textContent.trim() === sign); if (!b || b.disabled) return false; b.click(); return true; }, [rowText, sign]);
    if (!ok) return false; await sleep(80);
  }
  return true;
}
async function dialogueText(page) { return page.evaluate(() => { const d = document.querySelector('#dialogue.visible'); return d ? { name: d.querySelector('.name').textContent, text: d.querySelector('.text').textContent } : null; }); }
module.exports = { launch, sleep, shot, hold, state, startScenario, untilTime, untilFn, waitResults, sc, walkTo, interact, choose, panelClick, panelStep, dialogueText };


/**
 * Vehicle autopilot driven through REAL key events (W/S/A/D/Space/H).
 * path: [[x,z],...] followed with a look-ahead point; policy(st) => { kmh, brake, done, keys:{H:true} }.
 * st = { x, z, yaw, kmh, speed, time, state, dlg, scn (extra page data via `probe` expression) }.
 */
async function drive(page, { path, policy, probe = 'null', maxWall = 240000, tick = 70 }) {
  const t0 = Date.now(); const held = {}; let last = null;
  const set = async (key, on) => { if (!!held[key] === !!on) return; held[key] = on; if (on) await page.keyboard.down(key); else await page.keyboard.up(key); };
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let seg = 0; let pulse = 0; let stuck = 0; let reversing = 0;
  try {
    while (Date.now() - t0 < maxWall) {
      const st = await page.evaluate((probeExpr) => {
        const s = window.__dharma.scenario; const v = s && s.vehicle; if (!v) return null;
        // eslint-disable-next-line no-eval
        let extra = null; try { extra = eval(probeExpr); } catch (e) { extra = String(e); }
        return { x: v.pos.x, z: v.pos.z, yaw: v.yaw, kmh: v.kmh, speed: v.speed, time: s.time, state: window.__dharma.state, dlg: window.__dharma.dialogue.open, inputEnabled: v.inputEnabled, scn: extra };
      }, probe);
      if (!st || st.state !== 'PLAYING') { last = st; break; }
      // look-ahead target along the path
      let target = null;
      if (path && path.length) {
        // advance segment when close to its end
        while (seg < path.length - 1 && Math.hypot(path[seg + 1][0] - st.x, path[seg + 1][1] - st.z) < 7) seg++;
        const L = Math.min(26, Math.max(9, st.speed * 1.3));
        // walk along the path from the projection of the car onto the current segment
        let a = path[seg], b = path[Math.min(seg + 1, path.length - 1)];
        let ax = a[0], az = a[1], bx = b[0], bz = b[1];
        const vx = bx - ax, vz = bz - az, len = Math.hypot(vx, vz) || 1; let tproj = ((st.x - ax) * vx + (st.z - az) * vz) / (len * len); tproj = Math.max(0, Math.min(1, tproj));
        let rem = L; let px = ax + vx * tproj, pz = az + vz * tproj; let i = seg;
        while (rem > 0 && i < path.length - 1) { const ex = path[i + 1][0], ez = path[i + 1][1]; const d = Math.hypot(ex - px, ez - pz); if (d > rem) { px += (ex - px) * rem / d; pz += (ez - pz) * rem / d; rem = 0; } else { px = ex; pz = ez; rem -= d; i++; } }
        target = [px, pz];
      }
      const dec = policy({ ...st, seg, target }) || {};
      if (dec.done) { last = st; break; }
      if (dec.target) target = dec.target;
      if (dec.keys) for (const [k, on] of Object.entries(dec.keys)) { if (on === 'press') { await page.keyboard.press(k); dec.keys[k] = false; } }
      // steering
      if (target && !dec.brake) {
        const err = wrap(Math.atan2(target[0] - st.x, target[1] - st.z) - st.yaw);
        pulse = (pulse + 1) % 2; const strong = Math.abs(err) > 0.12; const on = strong || pulse === 0;
        await set('KeyA', err > 0.02 && on); await set('KeyD', err < -0.02 && on);
      } else { await set('KeyA', false); await set('KeyD', false); }
      // speed (with simple stuck recovery: reverse briefly if we cannot move forward)
      const want = dec.kmh ?? 40;
      if (!dec.brake && want > 5 && st.kmh < 1) stuck++; else stuck = 0;
      if (stuck > 25) { stuck = 0; reversing = 12; }
      if (reversing > 0) { reversing--; await set('Space', false); await set('KeyW', false); await set('KeyS', true); await set('KeyA', false); await set('KeyD', false); await sleep(tick); continue; }
      if (dec.brake) { await set('KeyW', false); await set('KeyS', false); await set('Space', true); }
      else { await set('Space', false); await set('KeyW', st.kmh < want - 1); await set('KeyS', st.kmh > want + 7); }
      await sleep(tick);
    }
  } finally { for (const k of Object.keys(held)) if (held[k]) await page.keyboard.up(k); }
  return last;
}
module.exports.drive = drive;
