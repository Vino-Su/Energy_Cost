const { chromium } = require('playwright');
(async () => {
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 375, height: 812 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://127.0.0.1:8765/03-高保真页面/vehicle-management.html?demo=bound');
    await p.waitForTimeout(2000);
    const frame = p.frame({ url: /map-workbench/ });
    let r = {};
    if (frame) {
        r.title = await frame.evaluate(() => { var t = document.querySelector('.task-sheet__title'); return t ? t.textContent : null; });
        r.closeBtn = await frame.evaluate(() => !!document.getElementById('taskSheetClose'));
        await frame.click('#taskShortcut');
        await p.waitForTimeout(600);
        r.sheetOpen = await frame.evaluate(() => document.getElementById('taskSheet').classList.contains('is-open'));
        r.maskOpen = await frame.evaluate(() => document.getElementById('taskSheetMask').classList.contains('is-open'));
        r.consoleHidden = await frame.evaluate(() => getComputedStyle(document.getElementById('taskConsole')).display === 'none');
        r.cards = await frame.evaluate(() => document.querySelectorAll('#taskList .mini-task').length);
        await frame.evaluate(() => { var c = document.querySelector('#taskList .mini-task'); if (c) c.click(); });
        await p.waitForTimeout(600);
        r.sheetClosedAfterSelect = await frame.evaluate(() => !document.getElementById('taskSheet').classList.contains('is-open'));
        r.consoleShownAfterSelect = await frame.evaluate(() => getComputedStyle(document.getElementById('taskConsole')).display !== 'none');
    } else { r.err = 'no frame'; }
    console.log('RESULT:', JSON.stringify(r, null, 2));
    console.log('ERRORS:', JSON.stringify(errs));
    await p.screenshot({ path: 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs/vm-task-sheet_20260803.png' });
    await b.close();
})().catch(e => { console.error(e); process.exit(1); });
