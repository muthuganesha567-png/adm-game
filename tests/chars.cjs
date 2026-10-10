const { launch, sleep, shot, startScenario, untilFn, waitResults, sc, walkTo, interact, choose, panelClick, panelStep, dialogueText } = require('./harness.cjs');
const which = (process.argv[2] || 'all').split(',');
const show = (tag, r) => { console.log(tag, JSON.stringify({ outcome: r.outcome.id, title: r.outcome.title, overall: r.overall, dims: r.dims, theme: r.theme, src: r.mentorSrc })); console.log('  ' + r.ledger.join('\n  ')); };
const cont = async (page, n = 1) => { for (let i = 0; i < n; i++) await choose(page, 'Continue'); };
const dbg = (...a) => { if (process.env.DBG) console.log('  ', ...a); };
async function talk(page, x, z, tol = 1.2) {
  let d = await walkTo(page, x, z, { tol });
  for (let i = 0; i < 3; i++) {
    const prompt = await sc(page, "document.querySelector('.hud-prompt')?.textContent || ''");
    if (prompt) break;
    tol = Math.max(0.4, tol - 0.35); d = await walkTo(page, x, z, { tol });
  }
  dbg('walked to', x, z, 'dist', d.toFixed(2), await sc(page, "document.querySelector('.hud-prompt')?.textContent"));
  await interact(page); return d;
}

async function teamLeader(page) {
  await startScenario(page, 'team-leader');
  await talk(page, -7.2, 3.5, 0.8); await panelClick(page, 'Close');
  await talk(page, -5, -0.7); await cont(page, 2);
  await talk(page, -1.5, -0.7); await choose(page, 'The log says 27%'); await cont(page);
  await talk(page, 2, -0.7); await cont(page, 2);
  await talk(page, 5.5, 0.4); await cont(page);
  await talk(page, 0, -2.2); await panelClick(page, 'Preset: match the log');
  await page.evaluate(() => { const rows = [...document.querySelectorAll('.game-panel.visible tr')]; const r = rows.find((x) => x.textContent.includes('Priya')); r.querySelector('td:last-child button').click(); }); await sleep(150);
  await shot(page, 'team-allocation'); await panelClick(page, 'Save credit sheet');
  dbg('saved; panels', await sc(page, "document.querySelectorAll('.game-panel.visible').length"));
  await untilFn(page, "() => window.__dharma.scenario.prof.done", 30000);
  const p = await sc(page, "({x: s.prof.x, z: s.prof.z, dlg: window.__dharma.dialogue.open})"); dbg('prof at', p);
  await talk(page, p.x, p.z + 1.4); dbg('dlg', await dialogueText(page)); await cont(page); await choose(page, 'I am.'); await cont(page, 2);
  await untilFn(page, "() => window.__dharma.scenario.state.complaintPhase === 'rahul_complaint'", 30000); await sleep(1500);
  const r = await sc(page, "({x: s.rahul.x, z: s.rahul.z})"); await talk(page, r.x, r.z + 1.3); await choose(page, 'The sheet reflects the log'); await cont(page);
  await walkTo(page, -3, -4.1, { tol: 0.7 }); await talk(page, -0.3, -4.3, 0.6); await choose(page, 'Submit');
  show('TEAM LEADER', await waitResults(page));
}

async function courage(page) {
  await startScenario(page, 'act-of-courage');
  await page.keyboard.press('KeyP'); await choose(page, 'Call 112'); await cont(page);
  await talk(page, 21.2, -0.4); await choose(page, 'Come with me'); await cont(page);
  await talk(page, -25, 0.6); // lifebuoy
  await talk(page, 15, 1.6); await choose(page, 'Step back'); await cont(page);
  await talk(page, 10, 1.6); await choose(page, 'Call out'); await sleep(300);
  await interact(page); await choose(page, 'Throw the lifebuoy');
  await sleep(500); const d = await walkTo(page, 10, 5.2, { tol: 0.6, sprint: false }); console.log('steps dist', d.toFixed(2), await sc(page, "({p: [s.player.pos.x.toFixed(1), s.player.pos.z.toFixed(1)], owner: [s.owner.x.toFixed(1), s.owner.z.toFixed(1)], onSteps: s.onSteps()})"));
  await interact(page); await choose(page, /Pull him/);
  await shot(page, 'courage-pull');
  show('COURAGE', await waitResults(page));
}

async function honest(page) {
  await startScenario(page, 'honest-employee');
  await talk(page, -7.6, -4.5, 0.6); await panelClick(page, 'Put the log back');
  await talk(page, -6, 0.1); await panelClick(page, 'Correct the batch-17'); await choose(page, 'Add a change-log entry');
  await talk(page, -2, 0.4); await cont(page); await choose(page, /we fix it now/); await cont(page);
  await walkTo(page, 4.3, 3.8, { tol: 0.6 }); await walkTo(page, 6.4, 3.8, { tol: 0.6 }); await talk(page, 7, 1.8); await choose(page, /There’s an error/); await choose(page, /structural welds/); await cont(page);
  await walkTo(page, 6.4, 3.8, { tol: 0.6 }); await walkTo(page, 4.3, 3.8, { tol: 0.6 }); await talk(page, -6, 0.1); await shot(page, 'honest-report'); await panelClick(page, 'Send the corrected report'); await choose(page, 'Send');
  show('HONEST', await waitResults(page));
}

async function resource(page) {
  await startScenario(page, 'last-resource');
  const pick = async (items) => { await talk(page, 0, -8.2, 0.7); await choose(page, 'Pick up items'); for (const [k, n] of Object.entries(items)) await panelStep(page, k, '+', n); await panelClick(page, 'Pick up'); };
  const give = async (x, z, name, items, inspect = true) => { await talk(page, x, z); if (inspect) { await choose(page, 'Look closer'); await cont(page); } await choose(page, 'Give items'); for (const [k, n] of Object.entries(items)) await panelStep(page, k, '+', n); await panelClick(page, 'Give'); };
  await pick({ 'Medical kit': 2, 'Water': 2 });
  await give(-13, -0.8, 'Lakshmi', { 'Medical kit': 1, 'Water': 2 });
  await give(2, 10.4, 'Suresh', { 'Medical kit': 1 });
  await pick({ 'Water': 3, 'Blanket': 1 });
  await give(-9.2, 8.5, 'Khan', { 'Water': 2, 'Blanket': 1 });
  await give(11, 4.6, 'Meena', { 'Water': 1 });
  await pick({ 'Food packet': 4 });
  await give(-9.2, 8.5, 'Khan', { 'Food packet': 3 }, false);
  await give(11, 4.6, 'Meena', { 'Food packet': 1 }, false);
  await pick({ 'Water': 1, 'Blanket': 2 });
  await give(11, 4.6, 'Meena', { 'Blanket': 1 }, false);
  await give(2, 10.4, 'Suresh', { 'Blanket': 1, 'Water': 1 }, false);
  await shot(page, 'resource-camp');
  await talk(page, -4.5, -8.0); await choose(page, 'Yes — close');
  show('RESOURCE', await waitResults(page));
}

async function friend(page) {
  await startScenario(page, 'friend-in-trouble');
  await talk(page, -2, 3.9); await cont(page); await choose(page, /find out whether/); await cont(page);
  await talk(page, 7.4, -2.9); await choose(page, 'May I use the admin'); await cont(page);
  await talk(page, -6.5, -2.7, 0.7); await panelClick(page, 'Read the access log'); await panelClick(page, 'Inspect the 02:00'); await panelClick(page, 'Restore the dataset'); await shot(page, 'friend-terminal'); await panelClick(page, 'Log out');
  await talk(page, -2, 3.9); await choose(page, /snapshot is intact/); await cont(page);
  await talk(page, 7.5, 3.8); await choose(page, /here together/); await cont(page);
  show('FRIEND', await waitResults(page));
}

async function arjuna(page) {
  await startScenario(page, 'arjuna-challenge');
  await interact(page); await choose(page, /own teachers/); await cont(page);
  await interact(page); await choose(page, /still lose/); await cont(page);
  await interact(page); await choose(page, /angry/); await cont(page); await choose(page, 'Help me set it down'); await cont(page);
  await talk(page, -26, 2.2, 1.2); await untilFn(page, "() => window.__dharma.scenario.state.surveyed && !window.__dharma.scenario.cine.active", 60000); await shot(page, 'arjuna-survey');
  await talk(page, 0, 15.5, 1.2); await cont(page);
  await talk(page, 3.1, 2.4, 0.9); // water pot
  await talk(page, 20, -8.2); await choose(page, 'Give him the water'); await cont(page);
  await talk(page, -2.5, -3.2, 1.2); await choose(page, 'I will fight'); await cont(page);
  show('ARJUNA', await waitResults(page));
}

(async () => {
  const { browser, page, errors } = await launch({ simSteps: 2 });
  const all = { teamLeader, courage, honest, resource, friend, arjuna };
  for (const [name, fn] of Object.entries(all)) {
    if (!which.includes('all') && !which.includes(name)) continue;
    const t0 = Date.now(); const before = errors.length;
    try { await fn(page); console.log(`${name} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
    catch (e) { console.log(`${name} FAILED: ${e.message.split('\n')[0]}`); await shot(page, `fail-${name}`); console.log(await sc(page, "({state: window.__dharma.state, p: s && s.player ? [s.player.pos.x.toFixed(1), s.player.pos.z.toFixed(1)] : null, prompt: document.querySelector('.hud-prompt')?.textContent, dlg: document.querySelector('#dialogue.visible .text')?.textContent?.slice(0,80), opts: [...document.querySelectorAll('#dialogue.visible .opt')].map(o=>o.textContent.slice(0,40)), panel: [...document.querySelectorAll('.game-panel.visible button')].map(b=>b.textContent.trim())})").catch(() => 'n/a')); }
    if (errors.length > before) console.log('NEW ERRORS', errors.slice(before));
  }
  console.log('ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
