// Vehicle scenarios driven end-to-end through real key events (autopilot in tests/harness.cjs `drive`).
const { launch, sleep, shot, startScenario, untilFn, waitResults, sc, drive, choose } = require('./harness.cjs');
const which = (process.argv[2] || 'all').split(',');
const show = (tag, r) => { console.log(tag, JSON.stringify({ outcome: r.outcome.id, title: r.outcome.title, overall: r.overall, dims: r.dims, theme: r.theme, src: r.mentorSrc })); console.log('  ' + r.ledger.join('\n  ')); };

const EMERGENCY_PROBE = "({ green: s.avenueGreen(), slow: s.cars.filter(c => c.slow && c.z > v.pos.z - 2 && c.z - v.pos.z < 30).map(c => [Math.round(c.x*10)/10, Math.round(c.z)]), peds: s.peds.filter(p => p.state === 'crossing' && p.z - v.pos.z > -2 && p.z - v.pos.z < 45).map(p => [Math.round(p.x*10)/10, Math.round(p.z)]), siren: s.siren })";

async function emergencyCareful(page) {
  await startScenario(page, 'emergency-run');
  await page.keyboard.press('KeyH'); await sleep(200);
  console.log('  siren', await sc(page, 's.siren'));
  const path = [[2.6, 0], [2.6, 400]];
  let shotDone = false;
  const last = await drive(page, { path, probe: EMERGENCY_PROBE, policy: (st) => {
    const { scn } = st; let kmh = 62; let brake = false; let target = null;
    // red light ahead: ease through slowly (the scenario treats <= 32 km/h as cautious)
    for (const cz of [100, 200, 300]) { const d = cz - st.z; if (d > -6 && d < 40 && !scn.green) kmh = Math.min(kmh, 27); }
    // slow car ahead: pass on the kerb side of the lane, slower if it has not pulled over yet
    const car = scn.slow.find((c) => c[1] > st.z - 4 && c[1] - st.z < 34);
    if (car) { kmh = Math.min(kmh, 45); target = [0.6, st.z + 16]; if (car[0] < 3.6 && car[1] - st.z < 12) kmh = Math.min(kmh, car[0] < 3.2 ? 20 : 30); }
    // pedestrian on the carriageway ahead: stop; approaching one: slow down
    const ped = scn.peds.find((p) => p[1] - st.z > 0 && p[1] - st.z < 24 && Math.abs(p[0]) < 5.6);
    if (ped) brake = true; else if (scn.peds.length) kmh = Math.min(kmh, 30);
    // emergency bay
    if (st.z > 350) kmh = 20; if (st.z > 368) brake = true;
    if (!shotDone && st.z > 180 && st.z < 200) { shotDone = true; shot(page, 'emergency-run'); }
    return { kmh, brake, target };
  } });
  console.log('  end', last && [last.x.toFixed(1), last.z.toFixed(1), last.kmh.toFixed(0), last.time.toFixed(0) + 's']);
  console.log('  collisions', JSON.stringify(await sc(page, "s.events.filter(e => e.type === 'collision' || e.type === 'near_miss_pedestrian' || e.type === 'intersection_pass').map(e => [e.type, e.with || e.light, e.speed, e.z, e.crossTraffic])")));
  show('EMERGENCY careful', await waitResults(page));
}

async function emergencyReckless(page) {
  await startScenario(page, 'emergency-run');
  const path = [[2.6, 0], [2.6, 400]];
  const last = await drive(page, { path, probe: EMERGENCY_PROBE, policy: (st) => { let brake = false; if (st.z > 362) brake = true; return { kmh: 92, brake }; } });
  console.log('  end', last && [last.x.toFixed(1), last.z.toFixed(1), last.kmh.toFixed(0), last.time.toFixed(0) + 's']);
  show('EMERGENCY reckless', await waitResults(page));
}

const DIVERSION = [[1.8, 0], [1.8, 165], [4, 178], [12, 180], [108, 180], [118, 184], [120, 194], [120, 328], [116, 338], [108, 340], [10, 340], [1, 343], [-0.5, 352], [-1, 362]];
async function floodDiversion(page) {
  await startScenario(page, 'flooded-bridge');
  let shotDone = false; let lastT = -5;
  const last = await drive(page, { path: DIVERSION, policy: (st) => {
    let kmh = 55; let brake = false;
    const corners = [[2, 180], [120, 180], [120, 340], [0, 340]];
    for (const [cx, cz] of corners) { const d = Math.hypot(cx - st.x, cz - st.z); if (d < 30) kmh = Math.min(kmh, 22); }
    if (st.z > 338 && st.x < 20) kmh = 20; if (st.z > 350 && st.x < 5) brake = true;
    if (!shotDone && st.x > 50 && st.x < 70 && Math.abs(st.z - 180) < 5) { shotDone = true; shot(page, 'flood-diversion'); }
    if (process.env.DBG && st.time - lastT >= 5) { lastT = st.time; console.log('   ', st.time.toFixed(0) + 's', st.x.toFixed(1), st.z.toFixed(1), 'kmh', st.kmh.toFixed(0), 'want', kmh, brake ? 'BRAKE' : '', 'seg', st.seg, 'tgt', st.target && st.target.map((v) => v.toFixed(0)).join(',')); }
    return { kmh, brake };
  } });
  console.log('  end', last && [last.x.toFixed(1), last.z.toFixed(1), last.kmh.toFixed(0), last.time.toFixed(0) + 's']);
  show('FLOOD diversion', await waitResults(page));
}

async function floodWait(page) {
  await startScenario(page, 'flooded-bridge');
  // drive to the barrier and stop
  await drive(page, { path: [[1.8, 0], [1.8, 230]], policy: (st) => { let kmh = 50; let brake = false; if (st.z > 170) kmh = 25; if (st.z > 196) brake = true; if (st.z > 196 && st.kmh < 1) return { done: true }; return { kmh, brake }; } });
  await sleep(500); await shot(page, 'flood-wait');
  console.log('  stopped at', await sc(page, "[s.vehicle.pos.x.toFixed(1), s.vehicle.pos.z.toFixed(1), s.time.toFixed(0), s.depthAt(s.time).toFixed(2)]"), 'prompt', await sc(page, "document.querySelector('.hud-prompt')?.textContent"));
  await page.keyboard.press('KeyE'); await sleep(300); await choose(page, /Continue/).catch(() => {});
  await untilFn(page, '() => window.__dharma.scenario.time >= 100', 240000);
  console.log('  depth now', await sc(page, 's.depthAt(s.time).toFixed(2)'));
  const last = await drive(page, { path: [[1.8, 196], [1.8, 300], [0, 345], [-1, 362]], policy: (st) => { let kmh = 18; let brake = false; if (st.z > 262) kmh = 45; if (st.z > 340) kmh = 18; if (st.z > 351) brake = true; return { kmh, brake }; } });
  console.log('  end', last && [last.x.toFixed(1), last.z.toFixed(1), last.kmh.toFixed(0), last.time.toFixed(0) + 's']);
  show('FLOOD waited', await waitResults(page));
}

async function floodReckless(page) {
  await startScenario(page, 'flooded-bridge');
  const last = await drive(page, { path: [[1.8, 0], [1.8, 300]], policy: () => ({ kmh: 55 }) });
  console.log('  end', last && [last.x.toFixed(1), last.z.toFixed(1), last.kmh.toFixed(0), last.time.toFixed(0) + 's']);
  show('FLOOD reckless', await waitResults(page));
}

(async () => {
  const { browser, page, errors } = await launch({ simSteps: 2 });
  const all = { emergencyCareful, emergencyReckless, floodDiversion, floodWait, floodReckless };
  for (const [name, fn] of Object.entries(all)) {
    if (!which.includes('all') && !which.includes(name)) continue;
    const t0 = Date.now(); const before = errors.length;
    try { await fn(page); console.log(`${name} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
    catch (e) { console.log(`${name} FAILED: ${e.message.split('\n')[0]}`); await shot(page, `fail-${name}`); console.log(await sc(page, "({state: window.__dharma.state, v: s && s.vehicle ? [s.vehicle.pos.x.toFixed(1), s.vehicle.pos.z.toFixed(1), s.vehicle.kmh.toFixed(0)] : null, t: s && s.time, dlg: document.querySelector('#dialogue.visible .text')?.textContent?.slice(0,80)})").catch(() => 'n/a')); }
    if (errors.length > before) console.log('NEW ERRORS', errors.slice(before));
  }
  console.log('ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
