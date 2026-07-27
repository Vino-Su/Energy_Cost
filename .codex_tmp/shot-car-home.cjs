// 截图 car-home.html：横屏 1280×720，注入绑定态避免跳转
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { sessionStorage.setItem('car-bind-state', JSON.stringify({ bound: true, vehicleNo: '粤B·D2856', driverName: '陈志远', bindTime: '2026-07-27 08:00' })); } catch (e) {}
  });
  const file = 'file:///D:/claude_code_coding/酷哇APP-车辆能耗成本/03-高保真页面/car-home.html';
  await page.goto(file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs/car-home_before.png', fullPage: false });
  console.log('OK');
  await browser.close();
})();
