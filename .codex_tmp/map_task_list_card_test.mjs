import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const cwd = process.cwd();
const pageDir = fs.readdirSync(cwd).find((name) => name.startsWith('03-'));
const htmlPath = path.resolve(cwd, pageDir, 'map-workbench.html');
const screenshotDir = path.resolve(cwd, '07-bugs', '地图工作台_任务清单_20260711');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(screenshotDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.click('#taskSheetTrigger');

async function card(id) {
  return page.locator(`.mini-task[data-task-id="${id}"]`);
}

const regular = await card('1');
assert(await regular.locator('.mini-type').textContent() === '常规任务', 'regular card should show task type');
assert((await regular.locator('.mini-primary').textContent()).includes('科苑南路至高新南九道'), 'regular card should use route name as primary field');
assert((await regular.locator('.mini-secondary').textContent()).includes('08:30-10:30'), 'regular card should show work time');
assert((await regular.locator('.mini-secondary').textContent()).includes('路段'), 'regular card should show segment field');

const emergency = await card('2');
assert(await emergency.locator('.mini-type').textContent() === '应急任务', 'emergency card should show task type');
assert((await emergency.locator('.mini-primary').textContent()).includes('沙河西路全段'), 'emergency card should use route name as primary field');
assert((await emergency.locator('.mini-secondary').textContent()).includes('10:30-11:30'), 'emergency card should show work time');
await page.screenshot({ path: path.join(screenshotDir, '375_默认任务清单.png') });

await page.evaluate(() => {
  const dynamic = window.tasks.find((task) => task.id === '6');
  dynamic.dispatched = true;
  window.renderTaskDrawer();
});
const dynamic = await card('6');
assert(await dynamic.locator('.mini-type').textContent() === '动态任务', 'dynamic card should show task type');
assert((await dynamic.locator('.mini-primary').textContent()).includes('明显垃圾'), 'dynamic card should show issue type');
assert((await dynamic.locator('.mini-primary').textContent()).includes('紧急'), 'dynamic card should show issue severity');
assert((await dynamic.locator('.mini-secondary').textContent()).includes('李屋小区'), 'dynamic card should show issue location');
await dynamic.scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(screenshotDir, '375_动态任务卡片.png') });

const statusPlacement = await page.locator('.mini-task').evaluateAll((items) => items.map((item) => ({
  id: item.dataset.taskId,
  isLastChild: item.lastElementChild?.classList.contains('mini-status') || false,
  statusRight: item.querySelector('.mini-status')?.getBoundingClientRect().right || 0,
  cardRight: item.getBoundingClientRect().right,
})));
assert(statusPlacement.every((item) => item.isLastChild), 'every card should place task status as the last/right column');
assert(statusPlacement.every((item) => item.cardRight - item.statusRight <= 14), 'every task status should align to the right edge');

await page.evaluate(() => {
  window.tasks.find((task) => task.id === '1').status = 'completed';
  window.renderTaskDrawer();
});
const sortedIds = await page.locator('.mini-task').evaluateAll((items) => items.map((item) => item.dataset.taskId));
assert(sortedIds.at(-1) === '1', `completed task should move to bottom, got order ${sortedIds.join(',')}`);
assert(await (await card('1')).locator('.mini-status').textContent() === '已完成', 'completed task should keep completed status at right');
await (await card('1')).scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(screenshotDir, '375_已完成任务置底.png') });
await page.setViewportSize({ width: 414, height: 896 });
await (await card('1')).scrollIntoViewIfNeeded();
await page.screenshot({ path: path.join(screenshotDir, '414_任务清单适配.png') });
for (const viewport of [{ width: 320, height: 720 }, { width: 768, height: 1024 }]) {
  await page.setViewportSize(viewport);
  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    cardsInsideViewport: Array.from(document.querySelectorAll('.mini-task')).every((item) => {
      const rect = item.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    }),
  }));
  assert(layout.documentWidth <= layout.viewportWidth, `${viewport.width}px viewport should not have horizontal overflow`);
  assert(layout.cardsInsideViewport, `${viewport.width}px task cards should stay inside viewport`);
}
assert(errors.length === 0, `page errors: ${errors.join('; ')}`);

await browser.close();
console.log('Map task list card checks passed.');
