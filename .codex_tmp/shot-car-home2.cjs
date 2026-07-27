// 截图 car-home.html：横屏 1280×720，三态对比（CommonJS + async）
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { sessionStorage.setItem('car-bind-state', JSON.stringify({ bound: true, vehicleNo: '粤B·D2856', driverName: '陈志远', bindTime: '2026-07-27 08:00' })); } catch (e) {}
  });
  const file = 'file:///D:/claude_code_coding/酷哇APP-车辆能耗成本/03-高保真页面/car-home.html';
  await page.goto(file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const dir = 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs';
  const tag = 'v3_';
  await page.screenshot({ path: dir + '/' + tag + 'default.png' });
  await page.click('#js-entry');
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + '/' + tag + 'drawer.png' });
  await page.click('#js-close');
  await page.waitForTimeout(350);
  await page.evaluate(() => { document.querySelectorAll('.home-task').forEach(el => { if (el.dataset.id === 'T003') el.click(); }); });
  await page.waitForTimeout(450);
  await page.screenshot({ path: dir + '/' + tag + 'todo.png' });
  console.log('OK 3 shots');
  await browser.close();
})();
