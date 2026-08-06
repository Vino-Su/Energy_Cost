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
        r.detailBtn = await frame.evaluate(() => !!document.querySelector('.mini-task__detail'));
        r.detailBtnShape = await frame.evaluate(() => { var el = document.querySelector('.mini-task__detail'); if (!el) return null; var s = getComputedStyle(el); return { w: s.width, h: s.height, radius: s.borderRadius }; });
        r.rightCol = await frame.evaluate(() => { var card = document.querySelector('.mini-task'); return card ? getComputedStyle(card).gridTemplateColumns : null; });
        // 点击第一个详情按钮，验证跳转 task-detail（frame 卸载即跳转）
        var beforeUrl = frame.url();
        try {
            await frame.click('.mini-task__detail', { timeout: 2000 });
            await p.waitForTimeout(1000);
            r.afterUrl = p.mainFrame().url();
            r.jumpedToDetail = /task-detail\.html/.test(p.mainFrame().url());
        } catch (e) {
            r.clickErr = e.message;
        }
    } else { r.err = 'no frame'; }
    console.log('RESULT:', JSON.stringify(r, null, 2));
    console.log('ERRORS:', JSON.stringify(errs));
    await b.close();
})().catch(e => { console.error(e); process.exit(1); });
