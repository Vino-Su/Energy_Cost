import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/vino/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright-core@1.61.1/node_modules/playwright-core');

const cwd = process.cwd();
const pageDir = fs.readdirSync(cwd).find((name) => name.startsWith('03-'));
const vehicleManagementUrl = pathToFileURL(path.resolve(cwd, pageDir, 'vehicle-management.html')).href;
const qrcodeUrl = pathToFileURL(path.resolve(cwd, pageDir, 'qrcode.html')).href;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

await page.goto(`${vehicleManagementUrl}?demo=reset`, { waitUntil: 'load' });

const initial = await page.evaluate(() => ({
  plateVisible: getComputedStyle(document.getElementById('todayPlate')).display !== 'none',
  unboundVisible: getComputedStyle(document.getElementById('todayUnbound')).display !== 'none',
  unboundText: document.getElementById('todayUnbound').textContent.trim(),
}));
assert(!initial.plateVisible, 'default flow should hide the bound vehicle');
assert(initial.unboundVisible, 'default flow should show the unbound state');
assert(initial.unboundText === '当前未绑定车辆', `unexpected unbound copy: ${initial.unboundText}`);

await page.click('.today-card');
await page.waitForSelector('#verifyModal.show');
const verifyModal = await page.evaluate(() => ({
  title: document.getElementById('verifyModalTitle').textContent.trim(),
  description: document.getElementById('verifyModalDesc').textContent.trim(),
  primaryText: document.getElementById('verifyModalPrimary')?.textContent.trim(),
}));
assert(verifyModal.title === '暂未绑定车辆', `unexpected verify title: ${verifyModal.title}`);
assert(verifyModal.description.includes('车辆绑定'), `unexpected verify description: ${verifyModal.description}`);
assert(verifyModal.primaryText === '去绑定车辆', `unexpected primary action: ${verifyModal.primaryText}`);

await page.click('#verifyModalPrimary');
await page.waitForURL(/qrcode\.html\?scene=bind/);
const bindScene = await page.evaluate(() => ({
  title: document.querySelector('.top-nav-title').textContent.trim(),
  bannerVisible: getComputedStyle(document.getElementById('bindingBanner')).display !== 'none',
  actionText: document.querySelector('[data-testid="binding-complete"]')?.textContent.trim(),
}));
assert(bindScene.title === '车辆绑定', `unexpected binding title: ${bindScene.title}`);
assert(bindScene.bannerVisible, 'binding guidance banner should be visible');
assert(bindScene.actionText?.includes('模拟扫码完成'), `unexpected binding action: ${bindScene.actionText}`);

await page.click('[data-testid="binding-complete"]');
await page.waitForURL(/map-workbench\.html/);
await page.waitForSelector('.vehicle-plate');
assert((await page.textContent('.vehicle-plate')).trim() === '粤B·D2856', 'map workbench should show the bound plate');

await page.click('.top-back');
await page.waitForURL(/vehicle-management\.html/);
const boundCard = await page.evaluate(() => ({
  plateVisible: getComputedStyle(document.getElementById('todayPlate')).display !== 'none',
  unboundVisible: getComputedStyle(document.getElementById('todayUnbound')).display !== 'none',
  plateText: document.getElementById('todayPlate').textContent.replace(/\s+/g, ' ').trim(),
}));
assert(boundCard.plateVisible, 'bound flow should show vehicle information');
assert(!boundCard.unboundVisible, 'bound flow should hide the unbound state');
assert(boundCard.plateText.includes('粤B·D2856') && boundCard.plateText.includes('已绑定'), `unexpected bound card: ${boundCard.plateText}`);

await page.goto(`${qrcodeUrl}?scene=handover`, { waitUntil: 'load' });
assert((await page.textContent('.top-nav-title')).trim() === '交车', 'existing handover scene should remain available');
assert(errors.length === 0, `page errors: ${errors.join('; ')}`);

await browser.close();
console.log('Today vehicle binding flow checks passed.');
