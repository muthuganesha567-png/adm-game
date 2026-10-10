// Touch overlay check: emulated touch device, taps on the on-screen controls move the character / vehicle.
const { chromium, devices } = require(process.env.PW_PATH || 'playwright');
const { sleep, shot } = require('./harness.cjs');
(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 960, height: 540 }, hasTouch: true, isMobile: false });
  const page = await context.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('dharmaDecision.settings.v1', JSON.stringify({ quality: 'low', shadows: false, particles: false })); });
  await page.goto('http://localhost:8000/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__dharma && window.__dharma.state === 'MENU', null, { timeout: 30000 });
  await page.evaluate(() => { window.__dharma.simSteps = 2; window.__dharma.save.setTutorialSeen(true); window.__dharma.startScenario('lost-wallet', { mode: 'manual', skipIntro: true }); });
  await page.waitForFunction(() => window.__dharma.state === 'PLAYING', null, { timeout: 20000 }); await sleep(300);
  const vis = await page.$eval('.touch-controls', (e) => getComputedStyle(e).display);
  const before = await page.evaluate(() => ({ x: window.__dharma.scenario.player.pos.x, z: window.__dharma.scenario.player.pos.z }));
  const up = await page.$('.touch-controls button[data-t="up"]'); const box = await up.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await sleep(1200);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(200);
  const after = await page.evaluate(() => ({ x: window.__dharma.scenario.player.pos.x, z: window.__dharma.scenario.player.pos.z, t: window.__dharma.input.touch }));
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  await shot(page, 'touch-overlay');
  console.log('overlay display:', vis, '| moved', moved.toFixed(2), 'm | touch state after release', JSON.stringify(after.t));
  console.log(moved > 1 && vis === 'block' && after.t.forward === 0 ? 'TOUCH OK' : 'TOUCH FAILED');
  console.log('ERRORS', errors); await browser.close();
})();
