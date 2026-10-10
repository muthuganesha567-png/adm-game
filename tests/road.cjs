const { launch, sleep, shot, state, startScenario, untilTime, untilFn, waitResults, sc } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await launch();
  await sleep(500);
  // --- menu flow (first-time tutorial -> intro -> begin)
  await page.click('text=Play — Random Scenario');
  await page.waitForSelector('#how-to-play.visible', { timeout: 10000 });
  await page.click('text=Continue to the scenario');
  await page.waitForSelector('#intro.visible', { timeout: 10000 }); await shot(page, 'intro');
  await page.click('#intro button.primary');
  await page.waitForFunction(() => window.__dharma.state === 'PLAYING');
  console.log('after begin', await state(page));
  // --- Run A: careful driver: accelerate, then brake when pedestrian appears, wait, continue
  await page.keyboard.down('KeyW');
  await untilTime(page, 4); console.log('t=4', await sc(page, '({kmh: s.vehicle.kmh, z: s.vehicle.pos.z})'));
  await shot(page, 'road-driving');
  await untilFn(page, "() => window.__dharma.scenario.pedState === 'crossing' || window.__dharma.state !== 'PLAYING'");
  await page.keyboard.up('KeyW'); await page.keyboard.down('Space');
  console.log('ped appeared', await sc(page, '({kmh: s.vehicle.kmh, z: s.vehicle.pos.z, ped: s.pedState})'));
  await sleep(300); await shot(page, 'road-pedestrian');
  await untilFn(page, "() => window.__dharma.scenario.pedState === 'crossed' || window.__dharma.state !== 'PLAYING'");
  await page.keyboard.up('Space');
  console.log('after cross', await sc(page, '({kmh: s.vehicle.kmh, z: s.vehicle.pos.z, ped: s.pedState, events: s.events.map(e=>e.type)})'));
  await page.keyboard.press('KeyC'); await sleep(100); console.log('cam', await sc(page, 's.vehicle.camMode'));
  await page.keyboard.press('KeyC'); await sleep(100); await page.keyboard.press('KeyC'); await sleep(100); await page.keyboard.press('KeyC');
  await page.keyboard.down('KeyW');
  await untilFn(page, "() => window.__dharma.state !== 'PLAYING'", 180000);
  await page.keyboard.up('KeyW');
  const resA = await waitResults(page); console.log('RUN A', JSON.stringify(resA, null, 1));
  await shot(page, 'road-results');
  await page.click('text=View Detailed Analysis'); await sleep(500); await shot(page, 'road-analysis');
  // --- Run B: reckless: full speed, no braking
  await startScenario(page, 'road-of-dharma');
  await page.keyboard.down('KeyW');
  await untilFn(page, "() => window.__dharma.state !== 'PLAYING'", 180000);
  await page.keyboard.up('KeyW');
  const resB = await waitResults(page); console.log('RUN B', JSON.stringify({ outcome: resB.outcome, overall: resB.overall, dims: resB.dims, ledger: resB.ledger }, null, 1));
  console.log('history', await page.evaluate(() => window.__dharma.save.getHistory().map(r => `${r.scenarioName}:${r.outcome.id}:${r.overall}`)));
  console.log('ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
