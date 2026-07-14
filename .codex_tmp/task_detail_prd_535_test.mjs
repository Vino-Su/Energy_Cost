import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const cwd = process.cwd();
const pageDir = fs.readdirSync(cwd).find((name) => name.startsWith('03-'));
const htmlPath = path.resolve(cwd, pageDir, 'task-detail.html');
const screenshotDir = path.resolve(cwd, '07-bugs', '任务详情_20260711');
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
page.on('pageerror', (err) => errors.push(err.message));

async function openTask(id, status) {
  const url = new URL(pathToFileURL(htmlPath).href);
  url.searchParams.set('id', id);
  if (status) url.searchParams.set('status', status);
  await page.goto(url.href, { waitUntil: 'load' });
  await page.waitForTimeout(120);
}

async function text(testId) {
  return page.getByTestId(testId).textContent().then((value) => value.trim());
}

async function assertCompactHeader(expectedStatus) {
  assert(await page.getByTestId('task-type').count() === 1, 'task type should appear once in the summary header');
  assert(await page.getByTestId('task-number').count() === 1, 'task number should appear once in the summary header');
  assert(await text('task-status') === expectedStatus, `task status should be ${expectedStatus}`);
  const detailLabels = await page.locator('#detailContent .info-label').allTextContents();
  assert(!detailLabels.includes('\u4efb\u52a1\u7c7b\u578b'), 'detail fields should not repeat task type');
  assert(!detailLabels.includes('\u4efb\u52a1\u7f16\u53f7'), 'detail fields should not repeat task number');
}

await openTask('1');
assert(await text('task-type') === '\u5e38\u89c4\u4efb\u52a1', 'task 1 should render as a regular task');
assert((await text('task-number')).startsWith('CGRW'), 'regular task number should use CGRW prefix');
await assertCompactHeader('\u5f85\u5f00\u59cb');
assert(await text('task-date') === '2026-04-28', 'regular task should show task date');
assert(await text('route-id') !== '', 'regular task should show route ID');
assert(await page.getByTestId('segment-card').count() >= 2, 'regular task should show multiple segment cards');
assert(await page.locator('.demo-tabs').count() === 0, 'detail page should not contain demo state tabs');
assert(await page.locator('.sheet-actions').count() === 0, 'detail page should be read-only');
assert(await page.locator('link[href*="leaflet"], script[src*="leaflet"], .leaflet-container').count() === 0, 'detail page should not depend on Leaflet');
await page.screenshot({ path: path.join(screenshotDir, '常规任务详情.png'), fullPage: true });

await openTask('1', 'executing');
await assertCompactHeader('\u6267\u884c\u4e2d');

await openTask('3', 'completed');
await assertCompactHeader('\u5df2\u5b8c\u6210');

await openTask('6');
assert(await text('task-type') === '\u52a8\u6001\u4efb\u52a1', 'task 6 should render as a dynamic task');
assert((await text('task-number')).startsWith('DTRW'), 'dynamic task number should use DTRW prefix');
await assertCompactHeader('\u5f85\u5f00\u59cb');
assert((await text('issue-coordinate')).includes('114.38'), 'dynamic task should show issue coordinates');
assert((await text('issue-location')).length > 8, 'dynamic task should show issue location');
assert(await page.getByTestId('issue-image').count() >= 2, 'dynamic task should show multiple issue images');
await page.screenshot({ path: path.join(screenshotDir, '动态任务详情.png'), fullPage: true });

await openTask('2');
assert(await text('task-type') === '\u5e94\u6025\u4efb\u52a1', 'task 2 should render as an emergency task');
assert((await text('task-number')).startsWith('YJRW'), 'emergency task number should use YJRW prefix');
await assertCompactHeader('\u5f85\u5f00\u59cb');
assert(await text('task-date') === '2026-04-28', 'emergency task should show task date');
assert(await text('route-id') !== '', 'emergency task should show route ID');
assert(await page.getByTestId('segment-card').count() >= 2, 'emergency task should show multiple segment cards');
await page.screenshot({ path: path.join(screenshotDir, '应急任务详情.png'), fullPage: true });

await openTask('999');
assert(await page.getByTestId('empty-state').isVisible(), 'unknown task should show an empty state');
assert((await text('empty-state')).includes('\u4efb\u52a1\u4e0d\u5b58\u5728'), 'empty state should explain that the task does not exist');
await page.screenshot({ path: path.join(screenshotDir, '未知任务空状态.png'), fullPage: true });
assert(errors.length === 0, `page errors: ${errors.join('; ')}`);

await browser.close();
console.log('Task detail PRD 5.3.5 checks passed.');
