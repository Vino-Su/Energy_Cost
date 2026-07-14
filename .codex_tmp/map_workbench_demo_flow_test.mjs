import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const cwd = process.cwd();
const pageDir = fs.readdirSync(cwd).find((name) => name.startsWith('03-'));
const htmlPath = path.resolve(cwd, pageDir, 'map-workbench.html');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const expectedPending = '\u5f85\u5f00\u59cb';
const expectedStart = '\u5f00\u59cb\u4efb\u52a1';
const expectedExecuting = '\u6267\u884c\u4e2d';

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

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.waitForTimeout(600);

const initial = await page.evaluate(() => {
  const banner = document.querySelector('[data-testid="dynamic-task-banner"]');
  const marker = document.getElementById('vehicleMarker');
  const markerRect = marker.getBoundingClientRect();
  return {
    taskState: document.getElementById('taskState').textContent.trim(),
    actionText: document.getElementById('primaryAction').textContent.trim(),
    bannerVisible: getComputedStyle(banner).display !== 'none' && getComputedStyle(banner).visibility !== 'hidden' && getComputedStyle(banner).opacity !== '0',
    markerLeft: Math.round(markerRect.left),
    markerTop: Math.round(markerRect.top),
    actualTrack: document.getElementById('actualTrack').getAttribute('points') || '',
    dynamicInList: Boolean(document.querySelector('#taskList .mini-task[data-task-id="6"][data-task-type="\u52a8\u6001\u4efb\u52a1"]')),
  };
});

assert(initial.taskState === expectedPending, `expected initial task state pending, got ${initial.taskState}`);
assert(initial.actionText === expectedStart, `expected initial action start, got ${initial.actionText}`);
assert(!initial.bannerVisible, 'dynamic task banner should be hidden before task starts');
assert(!initial.actualTrack, 'actual track should be empty before task starts');
assert(!initial.dynamicInList, 'dynamic task should not enter list before dispatch');

await page.click('#primaryAction');
await page.waitForTimeout(1800);

const duringMotion = await page.evaluate(() => {
  const marker = document.getElementById('vehicleMarker');
  const markerRect = marker.getBoundingClientRect();
  const banner = document.querySelector('[data-testid="dynamic-task-banner"]');
  return {
    taskState: document.getElementById('taskState').textContent.trim(),
    actionText: document.getElementById('primaryAction').textContent.trim(),
    markerLeft: Math.round(markerRect.left),
    markerTop: Math.round(markerRect.top),
    actualTrack: document.getElementById('actualTrack').getAttribute('points') || '',
    bannerVisible: getComputedStyle(banner).display !== 'none' && getComputedStyle(banner).visibility !== 'hidden' && getComputedStyle(banner).opacity !== '0',
  };
});

assert(duringMotion.taskState === expectedExecuting, `expected executing after start, got ${duringMotion.taskState}`);
assert(duringMotion.actionText !== expectedStart, 'primary action should no longer be start after playback begins');
assert(duringMotion.actualTrack, 'actual track should appear after playback begins');
assert(duringMotion.markerLeft !== initial.markerLeft || duringMotion.markerTop !== initial.markerTop, 'vehicle marker should move after playback begins');
assert(!duringMotion.bannerVisible, 'dynamic task banner should not appear immediately after start');

await page.waitForFunction(() => {
  const banner = document.querySelector('[data-testid="dynamic-task-banner"]');
  const style = getComputedStyle(banner);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}, { timeout: 14000 });

const dispatched = await page.evaluate(() => ({
  bannerVisible: getComputedStyle(document.querySelector('[data-testid="dynamic-task-banner"]')).display !== 'none',
  dynamicInList: Boolean(document.querySelector('#taskList .mini-task[data-task-id="6"][data-task-type="\u52a8\u6001\u4efb\u52a1"]')),
  topTaskCount: document.getElementById('topTaskCount').textContent.trim(),
}));

assert(dispatched.bannerVisible, 'dynamic task banner should appear mid-playback');
assert(dispatched.dynamicInList, 'dynamic task should enter task list when banner appears');
assert(dispatched.topTaskCount === '6', `expected task count to become 6 after dispatch, got ${dispatched.topTaskCount}`);
assert(errors.length === 0, `page errors: ${errors.join('; ')}`);

await browser.close();
console.log('Map workbench demo flow checks passed.');
