const { launch, sleep, shot, startScenario, untilFn, waitResults, sc, walkTo, interact, choose, dialogueText } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await launch({ simSteps: 2 });
  // RUN A: honest path — read notice, examine wallet, take it, refuse friend, find owner, return intact
  await startScenario(page, 'lost-wallet');
  let d = await walkTo(page, 3.2, -25.5); await interact(page); console.log('notice', await dialogueText(page)); await choose(page, 'Continue');
  d = await walkTo(page, 12, -7, { tol: 1.6 }); console.log('wallet dist', d.toFixed(2)); await interact(page);
  console.log('wallet dlg', (await dialogueText(page))?.text.slice(0, 60)); await choose(page, 'Take the wallet with you');
  await shot(page, 'wallet-picked');
  // friend near canteen
  await walkTo(page, -16, 16.2, { tol: 0.6 }); await interact(page); const fr = await dialogueText(page); console.log('friend', fr?.name, fr?.text.slice(0, 50)); await choose(page, /returning it/); await choose(page, 'Continue').catch(() => {});
  // follow the owner (she walks a loop) — approach her current position repeatedly
  for (let i = 0; i < 12; i++) { const o = await sc(page, "({x: s.owner.x, z: s.owner.z})"); const dd = await walkTo(page, o.x, o.z, { tol: 1.8, timeout: 8000 }); if (dd <= 2.1) break; }
  await interact(page); const ow = await dialogueText(page); console.log('owner', ow?.name, ow?.text.slice(0, 50));
  await choose(page, /found it/); const thanks = await dialogueText(page); console.log('owner says', thanks?.text.slice(0, 60)); await choose(page, 'Continue');
  // results may require clicking continue in dialogue
  const resA = await waitResults(page); console.log('RUN A', JSON.stringify({ outcome: resA.outcome.id, title: resA.outcome.title, overall: resA.overall, dims: resA.dims, theme: resA.theme }));
  console.log(resA.ledger.join('\n'));
  await shot(page, 'wallet-results');

  // RUN B: take money, spend at canteen, lie to owner... then leave the park
  await startScenario(page, 'lost-wallet');
  await walkTo(page, 12, -7, { tol: 1.6 }); await interact(page); await choose(page, 'Take only the money');
  await walkTo(page, -23, 18.3, { tol: 1.0 }); await interact(page); await choose(page, /pay with the cash/);
  await walkTo(page, 0, -28.2, { tol: 0.6 }); await interact(page); await choose(page, 'Leave');
  const resB = await waitResults(page); console.log('RUN B', JSON.stringify({ outcome: resB.outcome.id, overall: resB.overall, dims: resB.dims, theme: resB.theme }));
  console.log(resB.ledger.join('\n'));
  const hist = await page.evaluate(() => window.__dharma.save.getHistory().length); console.log('history', hist);
  console.log('ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
