const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { sessionStorage.setItem('car-bind-state', JSON.stringify({ bound: false, vehicleNo: '粤B·D2856', driverName: '陈志远', bindTime: '2026-07-27 08:00', review: { done: 4, mileage: 38.62, duration: 312, problems: 6 } })); } catch (e) {}
  });
  await page.goto('file:///D:/claude_code_coding/酷哇APP-车辆能耗成本/03-高保真页面/car-today-review.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs/review_after.png' });
  console.log('OK');
  await browser.close();
})();
