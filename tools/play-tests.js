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
async function snap(page, name) { await page.screenshot({ path: PATH.join(SHOT, name + '.png') }); }
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
  if (t0.mode === 'title') pass('title loads'); else fail('title loads', JSON.stringify(t0));

  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__dbg && window.__dbg.snapshot().mode === 'play', null, { timeout: 8000 });
  await page.waitForTimeout(400);
  const t1 = await st(page);
  if (t1.mode === 'play' && t1.hp > 0) pass('start with Space', 'stage=' + t1.stageName);
  else fail('start with Space', JSON.stringify(t1));
  await snap(page, '02-siddun-start');

  const x0 = t1.x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(80);
  const t2 = await st(page);
  if (t2.x > x0 + 1.2) pass('walk right', 'x ' + x0.toFixed(2) + ' -> ' + t2.x.toFixed(2));
  else fail('walk right', 'x ' + x0 + ' -> ' + t2.x);

  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
  const t3 = await st(page);
  if (t3.vy > 2 || t3.y > 0.3) pass('tap jump', 'y=' + t3.y.toFixed(2) + ' vy=' + t3.vy.toFixed(2));
  else fail('tap jump', JSON.stringify({ y: t3.y, vy: t3.vy }));
  await page.waitForTimeout(700);
  await snap(page, '03-jump');

  // Fly: hold Space
  const sta0 = (await st(page)).sta;
  await page.keyboard.down('Space');
  await page.waitForTimeout(900);
  const t4 = await st(page);
  if (t4.flying && t4.y > 2.4 && t4.sta < sta0 - 5) pass('hold Space to fly', 'y=' + t4.y.toFixed(2) + ' sta=' + t4.sta.toFixed(1) + ' flying=' + t4.flying);
  else fail('hold Space to fly', JSON.stringify({ flying: t4.flying, y: t4.y, sta: t4.sta, sta0 }));
  await snap(page, '04-fly');
  await page.keyboard.up('Space');
  await page.waitForTimeout(250);

  // Throw upward while flying (hold Up + F)
  await page.keyboard.down('Space');
  await page.waitForTimeout(200);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(50);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(50);
  const t5 = await st(page);
  if ((t5.disc === 'fly' || t5.disc === 'return') && t5.discVY > 2) pass('throw upward while flying', 'disc=' + t5.disc + ' vy=' + t5.discVY.toFixed(2));
  else fail('throw upward while flying', JSON.stringify({ disc: t5.disc, vx: t5.discVX, vy: t5.discVY }));
  await snap(page, '05-throw-up');
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('Space');
  await page.waitForTimeout(800);

  // Throw down while flying
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(50);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(90);
  const t6 = await st(page);
  if ((t6.disc === 'fly' || t6.disc === 'return') && t6.discVY < -2) pass('throw downward while flying', 'disc=' + t6.disc + ' vy=' + t6.discVY.toFixed(2));
  else fail('throw downward while flying', JSON.stringify({ disc: t6.disc, vx: t6.discVX, vy: t6.discVY, flying: t6.flying }));
  await snap(page, '06-throw-down');
  await page.keyboard.up('ArrowDown');
  await page.keyboard.up('Space');
  await page.waitForFunction(() => window.__dbg.snapshot().disc === 'held', null, { timeout: 2000 });
  await page.waitForTimeout(150);

  // Horizontal throw
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(80);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(50);
  const t7 = await st(page);
  if ((t7.disc === 'fly' || t7.disc === 'return') && t7.discVX > 2) pass('throw right', 'vx=' + t7.discVX.toFixed(2));
  else fail('throw right', JSON.stringify({ disc: t7.disc, vx: t7.discVX }));
  await page.keyboard.up('ArrowRight');
  await page.waitForFunction(() => window.__dbg.snapshot().disc === 'held', null, { timeout: 2000 });
  await page.waitForTimeout(200);

  // Charged piercing throw
  await page.keyboard.down('KeyF');
  await page.waitForTimeout(500);
  const charging = await st(page);
  if (charging.charging && charging.charge >= 0.35) pass('charge builds on hold F', 'charge=' + charging.charge.toFixed(2));
  else fail('charge builds on hold F', JSON.stringify({ charging: charging.charging, charge: charging.charge, disc: charging.disc }));
  await page.keyboard.up('KeyF');
  await page.waitForTimeout(100);
  const t8 = await st(page);
  if (t8.charged && t8.pierce && (t8.disc === 'fly' || t8.disc === 'return')) pass('charged pierce throw', 'state=' + t8.disc + ' vx=' + (t8.discVX || 0).toFixed(1));
  else fail('charged pierce throw', JSON.stringify({ disc: t8.disc, charged: t8.charged, pierce: t8.pierce }));
  await snap(page, '07-charge');
  await page.waitForTimeout(800);

  // Land, then dash
  await page.waitForTimeout(400);
  const beforeDash = await st(page);
  // if still airborne, drop
  if (!beforeDash.onGround) {
    await page.waitForTimeout(700);
  }
  const d0 = await st(page);
  await page.keyboard.down('ShiftLeft');
  await page.waitForTimeout(40);
  await page.keyboard.up('ShiftLeft');
  await page.waitForTimeout(40);
  const t9 = await st(page);
  if (t9.dashT > 0 || Math.abs(t9.vx) > 10 || Math.abs(t9.x - d0.x) > 0.8) {
    pass('ground dash (Shift)', 'vx=' + t9.vx.toFixed(2) + ' x ' + d0.x.toFixed(2) + ' -> ' + t9.x.toFixed(2));
  } else fail('ground dash (Shift)', JSON.stringify({ before: { x: d0.x, onGround: d0.onGround, sta: d0.sta }, after: t9 }));
  await snap(page, '08-dash');
  await page.waitForTimeout(300);

  // Combat stretch
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(500);
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(400);
  await page.keyboard.down('KeyF');
  await page.waitForTimeout(450);
  await page.keyboard.up('KeyF');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(500);
  const t10 = await st(page);
  await snap(page, '09-combat');
  pass('combat stretch', 'x=' + t10.x.toFixed(1) + ' y=' + t10.y.toFixed(1) + ' enemies=' + t10.enemies + '/' + t10.totalEnemies + ' gold=' + t10.gold + ' hp=' + t10.hp);

  const real = errs.filter(e => !/The play\(\) request was interrupted|AbortError/.test(e));
  if (real.length) fail('page errors', real.slice(0, 4).join(' | '));
  else pass('no page errors');

  await browser.close();
  console.log(failed ? ('FAILED ' + failed) : 'ALL PASSED');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
