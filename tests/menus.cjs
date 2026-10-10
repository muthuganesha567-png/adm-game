// Menu / state-machine / persistence checks (run: node tests/menus.cjs)
const { launch, sleep, shot, startScenario, untilTime, waitResults, sc, state, walkTo, interact, choose, untilFn } = require('./harness.cjs');
const assert = (cond, msg) => { if (!cond) throw new Error('ASSERT: ' + msg); console.log('  ok -', msg); };
const visibleButtons = (page, scope = '.screen.visible') => page.$$eval(`${scope} button`, (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.textContent.trim()));
async function clickBtn(page, text, scope = '.screen.visible, #modal.visible') {
  const handles = await page.$$(`${scope} button`);
  for (const h of handles) { const t = (await h.textContent()).trim(); const vis = await h.isVisible(); if (vis && (text instanceof RegExp ? text.test(t) : t === text || t.startsWith(text))) { await h.click(); await sleep(350); return t; } }
  throw new Error(`button not found: ${text} in [${(await visibleButtons(page, scope)).join(' | ')}]`);
}
const ui = (page) => page.evaluate(() => ({ state: window.__dharma.state, active: window.__dharma.ui.active, modal: document.querySelector('#modal.visible') ? document.querySelector('#modal.visible').textContent.trim().slice(0, 80) : null, toast: [...document.querySelectorAll('#toasts .toast')].map((t) => t.textContent.trim()) }));

(async () => {
  const { browser, page, errors } = await launch({ simSteps: 2 });
  try {
    // 1. main menu
    let u = await ui(page); assert(u.state === 'MENU' && u.active === 'main-menu', `boots to MENU (state=${u.state}, active=${u.active})`);
    const btns = await visibleButtons(page, '#main-menu.visible');
    console.log('  menu buttons:', btns.join(' | '));
    for (const need of ['Play — Random Scenario', 'Continue', 'How to Play', 'Dharma Journey', 'Decision History', 'Scoreboard', 'Choose Scenario', 'Settings', 'About the Project', 'Return to Title']) assert(btns.some((b) => b.startsWith(need)), `menu has "${need}"`);
    await shot(page, 'menu-main');
    assert(await page.evaluate(() => window.__dharma.registry.all().length === 10 && window.__dharma.registry.playable().length === 10), 'registry lists 10 playable scenarios');

    // 2. CONTINUE with nothing saved -> explanatory modal
    await clickBtn(page, 'Continue', '#main-menu.visible'); u = await ui(page); assert(u.modal && /Nothing to continue/.test(u.modal), 'Continue with no saved game explains there is nothing to continue');
    await clickBtn(page, 'Back', '#modal.visible');

    // 3. info screens + empty states
    for (const [label, id, emptyRe] of [['How to Play', 'how-to-play', null], ['Dharma Journey', 'journey', /journey has not begun/i], ['Decision History', 'history', /No decisions recorded yet/], ['Scoreboard', 'scoreboard', /No scores yet/], ['Choose Scenario', 'scenario-select', null], ['About the Project', 'about', null]]) {
      await clickBtn(page, label, '#main-menu.visible'); u = await ui(page); assert(u.active === id, `"${label}" opens ${id}`);
      if (emptyRe) { const txt = await page.$eval(`#${id}`, (e) => e.textContent); assert(emptyRe.test(txt), `${id} shows empty state`); }
      await shot(page, `menu-${id}`);
      await clickBtn(page, /^Back/, `#${id}.visible`); u = await ui(page); assert(u.active === 'main-menu', `Back returns to main menu from ${id}`);
    }
    assert((await page.$$eval('#scenario-select .scenario-card, #scenario-select button', (els) => els.length)) >= 10, 'scenario select lists the scenarios');

    // 4. settings persistence
    await clickBtn(page, 'Settings', '#main-menu.visible');
    await page.click('#settings button[aria-label="reducedMotion"]'); await sleep(150);
    await page.click('#settings .seg button:nth-child(3)'); await sleep(150); // quality: high
    await shot(page, 'menu-settings');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dharmaDecision.settings.v1')));
    assert(saved.reducedMotion === true && saved.quality === 'high', `settings saved to localStorage (${JSON.stringify({ rm: saved.reducedMotion, q: saved.quality })})`);
    // a second tab in the same browser profile (the harness init script that wipes storage is page-scoped, so this one loads real persisted data)
    const page2 = await page.context().newPage(); await page2.goto(process.env.BASE_URL || 'http://localhost:8000/', { waitUntil: 'load' }); await page2.waitForFunction(() => window.__dharma && window.__dharma.state === 'MENU', null, { timeout: 30000 });
    const after = await page2.evaluate(() => ({ rm: window.__dharma.settings.get('reducedMotion'), q: window.__dharma.settings.get('quality') })); await page2.close();
    assert(after.rm === true && after.q === 'high', `settings survive a reload (${JSON.stringify(after)})`);
    await page.evaluate(() => { window.__dharma.settings.set('quality', 'low'); window.__dharma.settings.set('reducedMotion', false); window.__dharma.simSteps = 2; });
    await clickBtn(page, /^Back/, '#settings.visible');

    // 5. randomizer: no immediate repeats, covers all scenarios
    const picks = await page.evaluate(() => { const r = window.__dharma.randomizer; const saved = r.sessionRecent; r.sessionRecent = []; const out = []; for (let i = 0; i < 60; i++) out.push(r.pick().id); r.sessionRecent = saved; return out; });
    assert(picks.every((p, i) => i === 0 || p !== picks[i - 1]), 'randomizer never repeats the same scenario twice in a row (60 draws)');
    assert(new Set(picks).size === 10, `randomizer reached all 10 scenarios (${new Set(picks).size})`);

    // 6. pause / resume / suspend / continue / restart
    await startScenario(page, 'road-of-dharma'); await untilTime(page, 2);
    await page.keyboard.press('Escape'); await sleep(300); u = await ui(page); assert(u.state === 'PAUSED' && u.active === 'pause-menu', 'Esc pauses and shows the pause menu');
    const pbtns = await visibleButtons(page, '#pause-menu.visible'); for (const need of ['Resume', 'Restart', 'Settings', 'Main Menu']) assert(pbtns.some((b) => new RegExp(need, 'i').test(b)), `pause menu has ${need}`);
    const t1 = await sc(page, 's.time'); await sleep(1500); const t2 = await sc(page, 's.time'); assert(Math.abs(t1 - t2) < 0.001, `scenario clock frozen while paused (${t1.toFixed(2)} == ${t2.toFixed(2)})`);
    await shot(page, 'menu-pause');
    await clickBtn(page, /Resume/i, '#pause-menu.visible'); await sleep(600); u = await ui(page); const t3 = await sc(page, 's.time'); assert(u.state === 'PLAYING' && t3 > t2, 'Resume continues the scenario clock');
    await page.keyboard.press('Escape'); await sleep(300); await clickBtn(page, /Main Menu/i, '#pause-menu.visible'); u = await ui(page); assert(u.modal && /Return to main menu/.test(u.modal), 'leaving mid-scenario asks for confirmation');
    await clickBtn(page, 'Main menu', '#modal.visible'); await sleep(800); u = await ui(page); assert(u.state === 'MENU', 'back at the main menu');
    const contLabel = await page.$eval('#main-menu', (e) => [...e.querySelectorAll('button')].map((b) => b.textContent).find((t) => t.startsWith('Continue')));
    assert(/resume paused/.test(contLabel), `Continue button offers to resume (${contLabel})`);
    await clickBtn(page, /^Continue/, '#main-menu.visible'); await page.waitForFunction(() => window.__dharma.state === 'PLAYING', null, { timeout: 10000 }); const t4 = await sc(page, 's.time');
    assert(t4 >= t3 - 0.01, `resumed scenario keeps its clock (${t4.toFixed(1)}s)`);
    await page.keyboard.press('KeyR'); await sleep(300); u = await ui(page); assert(u.modal && /Restart scenario/.test(u.modal), 'R asks to confirm a restart');
    await clickBtn(page, 'Restart', '#modal.visible'); await page.waitForFunction(() => window.__dharma.state === 'PLAYING' && window.__dharma.scenario.time < 1.5, null, { timeout: 15000 }); assert(true, 'restart resets the scenario clock');

    // 7. play a short scenario to completion through the real UI, then check results/history/journey/scoreboard
    await page.evaluate(() => window.__dharma.returnToMenu({ confirm: false })); await sleep(800);
    await startScenario(page, 'lost-wallet');
    await walkTo(page, 0, -28.3, { tol: 0.7 }); await interact(page); await choose(page, 'Leave');
    const r = await waitResults(page); console.log('  result', r.outcome.id, r.overall);
    const rbtns = await visibleButtons(page, '#results.visible'); for (const need of ['Play Another Random Scenario', 'Play Again', 'View Detailed Analysis', 'Decision History', 'Main Menu']) assert(rbtns.includes(need), `results has "${need}"`);
    const rtxt = await page.$eval('#results', (e) => e.textContent);
    for (const need of ['Objective', 'Outcome', 'Dharma Score', 'Mentor', 'Reflection']) assert(new RegExp(need, 'i').test(rtxt), `results mentions ${need}`);
    assert(/rule-based/i.test(rtxt), 'results label the mentor feedback as rule-based');
    await shot(page, 'menu-results');
    await clickBtn(page, 'View Detailed Analysis', '#results.visible'); u = await ui(page); assert(u.active === 'analysis', 'analysis screen opens'); await shot(page, 'menu-analysis');
    await clickBtn(page, /Back to Results/, '#analysis.visible'); u = await ui(page); assert(u.active === 'results', 'back to results');
    await clickBtn(page, 'Decision History', '#results.visible'); u = await ui(page); assert(u.active === 'history', 'history opens from results');
    const hist = await page.evaluate(() => window.__dharma.save.getHistory()); assert(hist.length === 1 && hist[0].scenarioId === 'lost-wallet' && typeof hist[0].overall === 'number' && hist[0].date && hist[0].id, `history has 1 record with scores (${hist[0] && hist[0].overall})`);
    await shot(page, 'menu-history');
    await clickBtn(page, /^Back/, '#history.visible'); await clickBtn(page, 'Main Menu', '#results.visible'); await sleep(800); u = await ui(page); assert(u.state === 'MENU', 'main menu after results');
    await clickBtn(page, 'Dharma Journey', '#main-menu.visible'); const jtxt = await page.$eval('#journey', (e) => e.textContent); assert(/1/.test(jtxt) && !/journey has not begun/i.test(jtxt), 'journey shows statistics after one completion'); await shot(page, 'menu-journey'); await clickBtn(page, /^Back/, '#journey.visible');
    await clickBtn(page, 'Scoreboard', '#main-menu.visible'); const stxt = await page.$eval('#scoreboard', (e) => e.textContent); assert(/Lost Wallet/.test(stxt), 'scoreboard lists the played scenario'); await shot(page, 'menu-scoreboard'); await clickBtn(page, /^Back/, '#scoreboard.visible');

    // 8. reset progress requires confirmation
    await clickBtn(page, 'Decision History', '#main-menu.visible'); await clickBtn(page, 'Reset All Progress', '#history.visible'); u = await ui(page); assert(u.modal && /Reset all progress/.test(u.modal), 'reset asks for confirmation');
    await clickBtn(page, 'Cancel', '#modal.visible'); assert((await page.evaluate(() => window.__dharma.save.getHistory().length)) === 1, 'cancel keeps the history');
    await clickBtn(page, 'Reset All Progress', '#history.visible'); await clickBtn(page, 'Delete everything', '#modal.visible'); assert((await page.evaluate(() => window.__dharma.save.getHistory().length)) === 0, 'confirmed reset clears the history');
    await clickBtn(page, /^Back/, '#history.visible');

    // 9. return to title and back
    await clickBtn(page, 'Return to Title', '#main-menu.visible'); await sleep(2500); u = await ui(page); assert(u.state === 'MENU' && u.active === 'main-menu', 'Return to Title shows the title splash and returns to the menu');
    console.log('MENU TESTS PASSED');
  } catch (e) { console.log('MENU TEST FAILED:', e.message); await shot(page, 'fail-menus'); console.log(await ui(page)); }
  console.log('ERRORS', errors);
  await browser.close();
})();
