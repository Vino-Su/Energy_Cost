/*
 * 通用顶部胶囊组件
 * 用法：
 *   1. 页面引入 components/top-capsule.css 和本 JS
 *   2. 放置占位：<div data-top-capsule></div>
 *   3. 调用 TopCapsule.mount(占位元素, options)
 *
 * options:
 *   title      {String}   居中标题（必填）
 *   backUrl    {String}   返回跳转地址（与 back 二选一）
 *   back       {Function} 返回自定义回调（优先于 backUrl）
 *   capsule    {Boolean}  是否显示右上角胶囊（更多/退出），默认 true
 *   moreItems  {Array}    更多菜单项 [{label, action}]，action 为回调
 *   onExit     {Function} 退出按钮回调，缺省 history.back()
 *   exitLabel  {String}   退出按钮文案占位（无文案，仅图标），保留兼容
 */
(function () {
    'use strict';

    var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';
    var ICON_MORE = '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="6" cy="14" r="2.2" fill="currentColor"/><circle cx="14" cy="14" r="2.8" fill="currentColor"/><circle cx="22" cy="14" r="2.2" fill="currentColor"/></svg>';
    var ICON_EXIT = '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="9.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="14" cy="14" r="3.25" fill="currentColor"/></svg>';

    function mount(el, options) {
        if (!el) return;
        options = options || {};
        var title = options.title || '';
        var hasCapsule = options.capsule !== false;

        var bar = document.createElement('header');
        bar.className = 'tc-bar' + (hasCapsule ? '' : ' tc-bar--simple');

        // 返回按钮
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'tc-back';
        back.setAttribute('aria-label', '返回');
        back.innerHTML = ICON_BACK;
        back.addEventListener('click', function () {
            if (typeof options.back === 'function') { options.back(); }
            else if (options.backUrl) { location.href = options.backUrl; }
            else if (history.length > 1) { history.back(); }
        });
        bar.appendChild(back);

        // 标题
        var titleEl = document.createElement('span');
        titleEl.className = 'tc-title';
        titleEl.textContent = title;
        bar.appendChild(titleEl);

        if (hasCapsule) {
            var capsule = document.createElement('div');
            capsule.className = 'tc-capsule';

            // 更多按钮 + 下拉
            var moreBtn = document.createElement('button');
            moreBtn.type = 'button';
            moreBtn.className = 'tc-btn';
            moreBtn.setAttribute('aria-label', '更多');
            moreBtn.setAttribute('aria-haspopup', 'menu');
            moreBtn.setAttribute('aria-expanded', 'false');
            moreBtn.innerHTML = ICON_MORE;

            var pop = document.createElement('div');
            pop.className = 'tc-pop';
            var items = options.moreItems || [];
            items.forEach(function (it) {
                var itemBtn = document.createElement('button');
                itemBtn.type = 'button';
                itemBtn.className = 'tc-pop__item';
                itemBtn.textContent = it.label;
                itemBtn.addEventListener('click', function () {
                    pop.classList.remove('show');
                    moreBtn.setAttribute('aria-expanded', 'false');
                    if (typeof it.action === 'function') it.action();
                });
                pop.appendChild(itemBtn);
            });

            moreBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                pop.classList.toggle('show');
                moreBtn.setAttribute('aria-expanded', pop.classList.contains('show') ? 'true' : 'false');
            });
            document.addEventListener('click', function () {
                pop.classList.remove('show');
                moreBtn.setAttribute('aria-expanded', 'false');
            });

            var divider = document.createElement('span');
            divider.className = 'tc-divider';
            divider.setAttribute('aria-hidden', 'true');

            // 退出按钮
            var exitBtn = document.createElement('button');
            exitBtn.type = 'button';
            exitBtn.className = 'tc-btn';
            exitBtn.setAttribute('aria-label', options.exitLabel || '退出');
            exitBtn.innerHTML = ICON_EXIT;
            exitBtn.addEventListener('click', function () {
                if (typeof options.onExit === 'function') options.onExit();
                else if (history.length > 1) history.back();
            });

            capsule.appendChild(moreBtn);
            capsule.appendChild(divider);
            capsule.appendChild(exitBtn);
            capsule.appendChild(pop);
            bar.appendChild(capsule);
        }

        el.appendChild(bar);
        return { bar: bar, back: back };
    }

    window.TopCapsule = { mount: mount };
})();
