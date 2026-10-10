const { launch, sleep, shot, startScenario, untilTime, sc } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await launch({ simSteps: 2 });
  const ids = await page.evaluate(() => window.__dharma.registry.playable().map((s) => s.id));
  console.log('PLAYABLE', ids.length, ids.join(','));
  for (const id of ids) {
    const t0 = Date.now(); const before = errors.length;
    try {
      await startScenario(page, id);
      await untilTime(page, 2.5, 60000);
      await shot(page, `build-${id}`);
      const st = await sc(page, "({state: window.__dharma.state, t: +s.time.toFixed(1), ev: s.events.length, colliders: s.colliders.length, type: s.meta.type})");
      console.log(id, JSON.stringify(st), `${Date.now() - t0}ms`, errors.length > before ? 'ERRORS:' + errors.slice(before).join(' | ') : 'ok');
    } catch (e) { console.log(id, 'FAILED', e.message, errors.slice(before)); }
  }
  console.log('ALL ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
