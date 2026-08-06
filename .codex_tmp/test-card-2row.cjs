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
        await frame.click('#taskShortcut');
        await p.waitForTimeout(600);
        r = await frame.evaluate(() => {
            var card = document.querySelector('.mini-task');
            if (!card) return { err: 'no card' };
            var body = card.querySelector('.mini-task__body');
            var rows = card.querySelectorAll('.mini-task__row');
            var row1 = rows[0];
            var row2 = rows[1];
            var detail = card.querySelector('.mini-task__detail');
            var cardRect = card.getBoundingClientRect();
            var detailRect = detail.getBoundingClientRect();
            return {
                bodyFlex: body ? getComputedStyle(body).display + '/' + getComputedStyle(body).flexDirection : null,
                rowCount: rows.length,
                row1: row1 ? {
                    route: (row1.querySelector('.mini-task__route') || {}).textContent,
                    status: (row1.querySelector('.mini-status') || {}).textContent
                } : null,
                row2: row2 ? {
                    type: (row2.querySelector('.mini-type') || {}).textContent,
                    workType: (row2.querySelector('.mini-work-type') || {}).textContent,
                    time: (row2.querySelector('.mini-task__time') || {}).textContent
                } : null,
                detail: {
                    w: detailRect.width, h: detailRect.height,
                    radius: getComputedStyle(detail).borderRadius,
                    // 详情按钮垂直是否跨两行（top 接近 row1 顶部，bottom 接近 row2 底部）
                    top: Math.round(detailRect.top - cardRect.top),
                    bottom: Math.round(cardRect.bottom - detailRect.bottom)
                }
            };
        });
        // 点击详情按钮验证跳转
        try {
            await frame.click('.mini-task__detail', { timeout: 2000 });
            await p.waitForTimeout(900);
            r.afterUrl = p.mainFrame().url();
            r.jumped = /task-detail\.html/.test(p.mainFrame().url());
        } catch (e) { r.clickErr = e.message; }
    } else { r.err = 'no frame'; }
    console.log('RESULT:', JSON.stringify(r, null, 2));
    console.log('ERRORS:', JSON.stringify(errs));
    await p.screenshot({ path: 'D:/claude_code_coding/酷哇APP-车辆能耗成本/07-bugs/vm-task-card-2row_20260803.png' });
    await b.close();
})().catch(e => { console.error(e); process.exit(1); });
