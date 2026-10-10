const { launch, sleep, shot, startScenario, waitResults, sc, walkTo, interact, choose, dialogueText } = require('./harness.cjs');
(async () => {
  const { browser, page, errors } = await launch({ simSteps: 2 });
  await startScenario(page, 'lost-wallet');
  await walkTo(page, 12, -7, { tol: 1.6 }); await interact(page); await choose(page, 'Take only the money');
  const d = await walkTo(page, -23, 18.3, { tol: 1.0 }); console.log('canteen dist', d, await sc(page, "({p: [s.player.pos.x.toFixed(1), s.player.pos.z.toFixed(1)], prompt: document.querySelector('.hud-prompt')?.textContent, cur: s.interact.current?.id, pocket: s.state.pocket})"));
  await interact(page); console.log('dlg', await dialogueText(page)); await shot(page, 'wallet-canteen');
  await choose(page, /pay with the cash/);
  await walkTo(page, 0, -28.2, { tol: 0.6 }); await interact(page); await choose(page, 'Leave');
  const resB = await waitResults(page); console.log('RUN B', JSON.stringify({ outcome: resB.outcome.id, overall: resB.overall, dims: resB.dims, theme: resB.theme }));
  console.log(resB.ledger.join('\n'));
  console.log('ERRORS', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
