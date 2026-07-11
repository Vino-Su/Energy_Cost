import { readFileSync } from 'node:fs';

const html = readFileSync('03-高保真页面/map-workbench.html', 'utf8');

const expectations = [
  ['uses internal SVG map shell', 'data-testid="svg-map-shell"'],
  ['does not depend on Leaflet CDN', '<script src="https://unpkg.com/leaflet'],
  ['has live vehicle marker', 'data-testid="vehicle-marker"'],
  ['has actual track polyline', 'data-testid="actual-track"'],
  ['has task console coverage metric', 'id="coverageValue"'],
  ['has today task sheet', 'data-testid="task-sheet"'],
  ['has report picker', 'id="reportModal"'],
  ['has repair entry', 'aria-label="一键报修"'],
  ['has dynamic task banner', 'data-testid="dynamic-task-banner"'],
  ['has compact dynamic task banner copy', '<b>新动态任务</b>'],
  ['has dynamic task distance in banner', '<small>-650m</small>'],
  ['has dynamic task data', "type: '动态任务'"],
  ['dynamic task enters pending list', "icon: 'dynamic'"],
  ['keeps handover handler', 'function handleHandover()'],
  ['keeps vehicle motion handler', 'function startVehicleMotion(task)'],
  ['keeps task switching handler', 'function selectTask(id)'],
  ['keeps start task handler', 'function startTask(id)'],
  ['keeps finish task handler', 'function finishTask(id)'],
  ['has longer planned route sample', 'route: [[22.5392,113.9386]'],
  ['has independent actual route sample', 'actualRoute: [[22.5392,113.9386]'],
  ['has visible route bend to the east', '[22.5378,113.9430],[22.5383,113.9441]'],
  ['has visible route bend back to the west', '[22.5351,113.9458],[22.5343,113.9452]'],
  ['uses actual route for red trajectory', 'var actualPath = task.actualRoute || route;'],
  ['places start marker on displayed route start', "setMarkerPosition('startMarker', displayRoute[0]);"],
  ['places end marker on displayed route end', "setMarkerPosition('endMarker', displayRoute[displayRoute.length - 1]);"],
  ['keeps map projection natural after route adjustment', 'maxLat: 22.5420'],
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
