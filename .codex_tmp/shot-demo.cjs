const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { sessionStorage.setItem('car-bind-state', JSON.stringify({ bound: false, vehicleNo: '粤B·D2856', vehicleId: 'V-2026-028', driverName: '陈志远' })); } catch (e) {}
  });
  const dir = 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs';
  // 绑定页（未绑定态）
  await page.goto('file:///D:/claude_code_coding/酷哇APP-车辆能耗成本/03-高保真页面/car-bind.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dir + '/demo_bind.png' });
  // 交车页
  await page.goto('file:///D:/claude_code_coding/酷哇APP-车辆能耗成本/03-高保真页面/car-handover.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: dir + '/demo_handover.png' });
  console.log('OK');
  await browser.close();
})();
