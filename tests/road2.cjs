const { launch, sleep, shot, startScenario, untilFn, waitResults, sc } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await launch();
  // Run B: reckless full speed, never brakes -> should collide or near-miss
  await startScenario(page, 'road-of-dharma');
  await page.keyboard.down('KeyW');
  await untilFn(page, "() => window.__dharma.scenario.pedState === 'crossing' || window.__dharma.state !== 'PLAYING'");
  await sleep(400); await shot(page, 'road-reckless');
  await untilFn(page, "() => window.__dharma.state !== 'PLAYING'", 180000);
  await page.keyboard.up('KeyW');
  const resB = await waitResults(page); console.log('RECKLESS', JSON.stringify({ outcome: resB.outcome.id, overall: resB.overall, dims: resB.dims, ledger: resB.ledger }, null, 1));
  // Run C: moderate speed (~40 km/h), brake normally with S when pedestrian appears, swerve nothing
  await startScenario(page, 'road-of-dharma');
  // pulse W to hold about 40-45 km/h
  let crossing = false;
  while (!crossing) {
    const st = await sc(page, "({kmh: s.vehicle.kmh, ped: s.pedState, state: window.__dharma.state})");
    if (st.state !== 'PLAYING') break; crossing = st.ped === 'crossing';
    if (st.kmh < 42) await page.keyboard.down('KeyW'); else await page.keyboard.up('KeyW');
    await sleep(120);
  }
  await page.keyboard.up('KeyW'); await page.keyboard.down('KeyS');
  await untilFn(page, "() => window.__dharma.scenario.pedState === 'crossed' || window.__dharma.state !== 'PLAYING'");
  await page.keyboard.up('KeyS'); await page.keyboard.down('KeyW');
  await untilFn(page, "() => window.__dharma.state !== 'PLAYING'", 180000); await page.keyboard.up('KeyW');
  const resC = await waitResults(page); console.log('CAREFUL', JSON.stringify({ outcome: resC.outcome.id, overall: resC.overall, dims: resC.dims, ledger: resC.ledger }, null, 1));
  await shot(page, 'road-results');
  // Run D: swerve left into the well at speed
  await startScenario(page, 'road-of-dharma');
  await page.keyboard.down('KeyW');
  await untilFn(page, "() => window.__dharma.scenario.pedState === 'crossing' || window.__dharma.state !== 'PLAYING'");
  await page.keyboard.down('KeyA'); // steer toward +x (left side, the well)
  await untilFn(page, "() => window.__dharma.state !== 'PLAYING' || window.__dharma.scenario.vehicle.pos.z > 262", 60000);
  await page.keyboard.up('KeyA'); await page.keyboard.up('KeyW');
  await sleep(500); await shot(page, 'road-swerve');
  const st = await sc(page, "({x: s.vehicle.pos.x, z: s.vehicle.pos.z, kmh: s.vehicle.kmh, state: window.__dharma.state, ev: s.events.map(e=>e.type+(e.with?':'+e.with:''))})"); console.log('SWERVE state', st);
  if (st.state === 'PLAYING') { await page.keyboard.down('KeyD'); await sleep(600); await page.keyboard.up('KeyD'); await page.keyboard.down('KeyW'); await untilFn(page, "() => window.__dharma.state !== 'PLAYING'", 120000); await page.keyboard.up('KeyW'); }
  const resD = await waitResults(page); console.log('SWERVE', JSON.stringify({ outcome: resD.outcome.id, overall: resD.overall, ledger: resD.ledger }, null, 1));
  console.log('ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
