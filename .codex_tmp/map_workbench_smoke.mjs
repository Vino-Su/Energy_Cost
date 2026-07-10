import { readFileSync } from 'node:fs';

const html = readFileSync('03-高保真页面/map-workbench.html', 'utf8');

const expectations = [
  ['uses internal SVG map shell', 'data-testid="svg-map-shell"'],
  ['does not depend on Leaflet CDN', '<script src="https://unpkg.com/leaflet'],
  ['has live vehicle marker', 'data-testid="vehicle-marker"'],
  ['has actual track polyline', 'data-testid="actual-track"'],
  ['has task console progress ring', 'data-testid="coverage-ring"'],
  ['has today task sheet', 'data-testid="task-sheet"'],
  ['has report picker', 'id="reportModal"'],
  ['has repair modal', 'id="repairModal"'],
  ['keeps handover handler', 'function handleHandover()'],
  ['keeps vehicle motion handler', 'function startVehicleMotion(task)'],
  ['keeps task switching handler', 'function selectTask(id)'],
  ['keeps start task handler', 'function startTask(id)'],
  ['keeps finish task handler', 'function finishTask(id)'],
];

const failures = expectations
  .filter(([label, needle]) => {
    if (label === 'does not depend on Leaflet CDN') {
      return html.includes(needle);
    }
    return !html.includes(needle);
  })
  .map(([label]) => label);

if (failures.length) {
  console.error('Map workbench smoke checks failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Map workbench smoke checks passed.');
