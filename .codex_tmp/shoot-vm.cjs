const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const msgs = [];
  page.on('console', m => msgs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => msgs.push('PAGEERROR: ' + e.message));

  // 默认（地图 Tab）
  await page.goto('http://127.0.0.1:8765/03-高保真页面/vehicle-management.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '07-bugs/vm_map.png', fullPage: false });

  // 服务 Tab
  await page.goto('http://127.0.0.1:8765/03-高保真页面/vehicle-management.html?tab=service', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '07-bugs/vm_service.png', fullPage: true });

  // 抓取底部 tab 栏 DOM
  const tabbars = await page.evaluate(() => {
    const sel = ['.app-tabbar', '.ctab-bar', '.bottom-tab', '[class*="tabbar"]', '[class*="tab-bar"]', 'nav'];
    const out = [];
    document.querySelectorAll('nav, [class*="tabbar"], [class*="tab-bar"], .ctab-bar, .app-tabbar').forEach(el => {
      const r = el.getBoundingClientRect();
      out.push({ cls: el.className, tag: el.tagName, text: (el.innerText || '').replace(/\n/g, '|'), bottom: Math.round(r.bottom), visible: r.width > 0 && r.height > 0 });
    });
    return out;
  });

  console.log('=== BOTTOM BARS ===');
  console.log(JSON.stringify(tabbars, null, 2));
  console.log('=== CONSOLE ===');
  console.log(msgs.join('\n'));

  await browser.close();
})();
