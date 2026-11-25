// Real-time Playwright tests. Real keyboard on the live rAF loop. No autopilot.
const { chromium } = require('playwright-core');
const FS = require('fs');
const PATH = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8788/index.html';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--autoplay-policy=no-user-gesture-required',
];
const SHOT = PATH.resolve(__dirname, '../shots');
FS.mkdirSync(SHOT, { recursive: true });

let failed = 0;
function pass(name, extra) { console.log('PASS  ' + name + (extra ? '  ' + extra : '')); }
function fail(name, extra) { failed++; console.log('FAIL  ' + name + (extra ? '  ' + extra : '')); }

async function snap(page, name) {
  await page.screenshot({ path: PATH.join(SHOT, name + '.png') });
}
async function st(page) { return page.evaluate(() => window.__dbg.snapshot()); }

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ARGS });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ready && window.__dbg, null, { timeout: 30000 });
  await page.waitForTimeout(400);

  await snap(page, '01-title');
  const t0 = await st(page);
  if (t0.mode === 'title') pass('title loads', 'mode=' + t0.mode);
  else fail('title loads', JSON.stringify(t0));

  // start with a real keypress
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__dbg && window.__dbg.snapshot().mode === 'play', null, { timeout: 8000 });
  await page.waitForTimeout(500);
  const t1 = await st(page);
  if (t1.mode === 'play' && t1.hp > 0) pass('start with Space', 'stage=' + t1.stageName + ' hp=' + t1.hp);
  else fail('start with Space', JSON.stringify(t1));
  await snap(page, '02-siddun-start');

  // walk right with a real held key
  const x0 = t1.x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(80);
  const t2 = await st(page);
  if (t2.x > x0 + 1.5) pass('walk right (ArrowRight)', 'x ' + x0.toFixed(2) + ' -> ' + t2.x.toFixed(2));
  else fail('walk right (ArrowRight)', 'x ' + x0 + ' -> ' + t2.x);
  await snap(page, '03-walk');

  // walk left
  const x1 = t2.x;
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(60);
  const t2b = await st(page);
  if (t2b.x < x1 - 0.4) pass('walk left (ArrowLeft)', 'x ' + x1.toFixed(2) + ' -> ' + t2b.x.toFixed(2));
  else fail('walk left (ArrowLeft)', 'x ' + x1 + ' -> ' + t2b.x);

  // jump with Space
  // first make sure we are on the ground
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  const t3 = await st(page);
  if (t3.vy > 2 || t3.y > 0.3) pass('jump (Space)', 'y=' + t3.y.toFixed(2) + ' vy=' + t3.vy.toFixed(2));
  else fail('jump (Space)', JSON.stringify(t3));
  await snap(page, '04-jump');
  await page.waitForTimeout(700); // land

  // throw disc with F
  const before = await st(page);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(90);
  const t4 = await st(page);
  if (t4.disc === 'fly' || t4.disc === 'return' || (t4.discX && Math.abs(t4.discX - t4.x) > 0.3)) {
    pass('throw disc (KeyF)', 'state=' + t4.disc + ' discX=' + t4.discX.toFixed(2));
  } else fail('throw disc (KeyF)', JSON.stringify(t4));
  await snap(page, '05-throw');
  await page.waitForTimeout(700); // return
  const t5 = await st(page);
  if (t5.disc === 'held') pass('disc returns to hand', 'state=' + t5.disc);
  else fail('disc returns to hand', 'state=' + t5.disc);

  // WASD walk as well (after disc is held, from a standing start)
  await page.waitForTimeout(200);
  const mid = await st(page);
  if (mid.x > 8) {
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(250);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(200);
  }
  const x2 = (await st(page)).x;
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(50);
  const t6 = await st(page);
  if (t6.x > x2 + 1.2) pass('walk with WASD (KeyD)', 'x ' + x2.toFixed(2) + ' -> ' + t6.x.toFixed(2));
  else fail('walk with WASD (KeyD)', 'x ' + x2 + ' -> ' + t6.x);

  // walk further into Siddun and throw toward rats
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(900);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(900);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(700);
  const t7 = await st(page);
  await snap(page, '06-combat');
  pass('combat stretch reached', 'x=' + t7.x.toFixed(1) + ' enemies=' + t7.enemies + '/' + t7.totalEnemies + ' gold=' + t7.gold + ' hp=' + t7.hp);

  if (errs.length) {
    // filter benign
    const real = errs.filter(e => !/The play\(\) request was interrupted|AbortError/.test(e));
    if (real.length) fail('page errors', real.slice(0, 4).join(' | '));
    else pass('no page errors');
  } else pass('no page errors');

  await browser.close();
  console.log(failed ? ('FAILED ' + failed) : 'ALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
