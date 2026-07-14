import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const pageDir = path.resolve(cwd, fs.readdirSync(cwd).find((name) => name.startsWith('03-')));
const prdDir = path.resolve(cwd, fs.readdirSync(cwd).find((name) => name.startsWith('02-')));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.resolve(cwd, relativePath), 'utf8');
}

function readPage(name) {
  return fs.readFileSync(path.join(pageDir, name), 'utf8');
}

for (const page of ['schedule-tasks.html', 'emergency-tasks.html', 'dynamic-tasks.html']) {
  assert(fs.existsSync(path.join(pageDir, page)), `${page} should exist`);
}
const taskPages = [
  ['schedule-tasks.html', 'schedule'],
  ['emergency-tasks.html', 'emergency'],
  ['dynamic-tasks.html', 'dynamic'],
];

for (const [page, type] of taskPages) {
  const html = readPage(page);
  assert(html.includes('driver-task-list.css'), `${page} should use the shared list styles`);
  assert(html.includes('driver-task-list.js'), `${page} should use the shared list behavior`);
  assert(html.includes(`listType: '${type}'`), `${page} should initialize the ${type} task source`);
  for (const landmark of ['scope-strip', 'tabBar', 'filterChip', 'taskList', 'filterSheet']) {
    assert(html.includes(landmark), `${page} should contain the shared ${landmark} structure`);
  }
}

const schedulePage = readPage('schedule-tasks.html');
assert(schedulePage.includes('task-detail-demo-data.js'), 'schedule should use the shared cross-vehicle task data');

const vehicleManagement = readPage('vehicle-management.html');
assert(vehicleManagement.includes('href="schedule-tasks.html"'), 'schedule entry should open the schedule list');
assert(vehicleManagement.includes('href="emergency-tasks.html"'), 'emergency entry should open the emergency list');
assert(vehicleManagement.includes('href="dynamic-tasks.html"'), 'dynamic entry should open the dynamic list');

const listBehavior = read('03-高保真页面/components/driver-task-list.js');
assert(listBehavior.includes("source="), 'list cards should pass their source to task detail');
assert(listBehavior.includes("plateNo"), 'list cards should render the assigned plate number');
assert(listBehavior.includes("未分配车辆"), 'tasks without a vehicle should have an explicit fallback');
assert(listBehavior.includes("schedule: '常规任务'"), 'shared cards should map the schedule task type explicitly');

const detailData = read('03-高保真页面/components/task-detail-demo-data.js');
for (const type of ['schedule', 'emergency', 'dynamic']) {
  assert(detailData.includes(`listType: '${type}'`), `detail data should contain ${type} tasks`);
}
const plateNumbers = new Set([...detailData.matchAll(/plateNo: '([^']+)'/g)].map((match) => match[1]));
assert(plateNumbers.size >= 6, 'driver task data should demonstrate multiple assigned vehicles');

const detailPage = readPage('task-detail.html');
assert(detailPage.includes("sourceContext"), 'task detail should resolve its source context');
assert(detailPage.includes("schedule-tasks.html"), 'task detail should return to the schedule list');
assert(detailPage.includes("emergency-tasks.html"), 'task detail should return to the emergency list');
assert(detailPage.includes("dynamic-tasks.html"), 'task detail should return to the dynamic list');
assert(detailPage.includes("readonly-detail"), 'standalone task details should use read-only mode');
assert(detailPage.includes("派发时间"), 'dynamic detail should show dispatch time');

assert(fs.existsSync(path.join(prdDir, '应急与动态任务列表PRD.md')), 'emergency and dynamic PRD should exist');
const schedulePrd = fs.readFileSync(path.join(prdDir, '排班任务列表PRD.md'), 'utf8');
assert(schedulePrd.includes('任务详情'), 'schedule PRD should include task detail behavior');
assert(schedulePrd.includes('当前驾驶员'), 'schedule PRD should define the driver-level data scope');

console.log('Driver task query page contract passed.');
