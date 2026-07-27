// 截图 car-home.html：验证结束任务按钮链路
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
  // 1. 进行中任务，底部应有"结束任务"按钮
  await page.screenshot({ path: dir + '/v4_running.png' });
  // 2. 点击结束任务 → 弹确认窗
  await page.click('#js-start');
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + '/v4_finish_confirm.png' });
  // 3. 点确认 → 任务变已完成
  await page.click('.car-modal__foot [data-act=ok]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + '/v4_finished.png' });
  // 4. 此时点交车应能进入交车页（无进行中任务）
  await page.click('#js-handover');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: dir + '/v4_handover.png' });
  console.log('OK 4 shots, url=', page.url());
  await browser.close();
})();
