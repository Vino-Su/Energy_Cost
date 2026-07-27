const path = require('path');
const { chromium } = require('playwright');
const HTML = 'file:///D:/claude_code_coding/酷哇APP-车辆能耗成本/03-高保真页面/car-task-running.html';
const OUT = 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => {
    sessionStorage.setItem('car-bind-state', JSON.stringify({ vehicleNo: '粤B·D2856', vehicleId: 'V-2026-028', driverName: '陈志远', bound: true, bindTime: '2026-07-27 08:00', review: { done: 4, mileage: 38.62, duration: 312, problems: 6 } }));
    sessionStorage.removeItem('car-today-task-state');
  });
  await page.goto(HTML, { waitUntil: 'networkidle' });
  // 等动画跑到约 60%（>0.54 触发2个问题，>0.78触发第3个）
  await page.waitForTimeout(11000);
  await page.screenshot({ path: path.join(OUT, 'task_running_badge_mid.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
