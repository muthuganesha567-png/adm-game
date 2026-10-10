const { launch, sleep, shot, state } = require('./harness.cjs');
(async () => {
  const { browser, page, errors, logs } = await launch();
  await sleep(1500);
  console.log('STATE', await state(page));
  await shot(page, 'menu');
  const reg = await page.evaluate(() => window.__dharma.registry.all().map((e) => `${e.id}:${e.available}`));
  console.log('REGISTRY', reg.join(' '));
  console.log('ERRORS', errors);
  console.log('LOGS', logs.slice(0, 20));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
