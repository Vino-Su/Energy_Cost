/**
 * 工作台底部 Tab 自定义组件
 * 依赖：tab-apps-data.js（TabAppsData）
 * 能力：
 *  - 底部业务 Tab 渲染（首页位=第一位，名称随绑定功能动态显示）
 *  - 「更多」Tab 唤起底部弹窗（一行四宫格、按小程序分组）
 *  - 弹窗单击功能直接跳转
 *  - 编辑态：业务Tab 删除角标移除、弹窗长按添加、拖拽排序、完成保存/放弃回滚
 *  - 规则：含「更多」最多5个（业务Tab最多4个）；除更多外至少保留1个；同一功能不可重复占位
 *  - 演示阶段用 sessionStorage 跨页保留配置（关闭标签页丢失），支持多页面共享同一配置
 */
(function () {
    'use strict';

    var MAX_BIZ_TABS = 4;            // 业务 Tab 上限（含首页位）
    var MIN_BIZ_TABS = 1;            // 除更多外至少保留1个
    var STORAGE_KEY = 'ctabConfig';  // sessionStorage key，存业务Tab funcKey 数组

    // 当前业务 Tab 顺序（funcKey 数组，第一位为首页位）
    var bizTabs = [];
    // 编辑前快照（用于放弃回滚）
    var snapshot = null;
    var editing = false;

    var barEl = null;       // 底部 Tab 栏
    var overlayEl = null;   // 更多弹窗
    var activeKey = null;   // 当前高亮 Tab（默认首页位）

    // ===== 工具 =====
    function deepCopy(arr) { return arr.slice(); }
    function getFunc(funcKey) { return TabAppsData.getFunction(funcKey); }

    // sessionStorage 持久化（跨页共享配置）
    function saveStorage() {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bizTabs)); } catch (e) {}
    }
    function loadStorage() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length >= MIN_BIZ_TABS) return arr;
        } catch (e) {}
        return null;
    }

    function toast(msg) {
        var t = document.querySelector('.ctab-toast');
        if (!t) {
            t = document.createElement('div');
            t.className = 'ctab-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 1800);
    }

    // ===== 底部 Tab 渲染 =====
    function renderBar() {
        if (!barEl) return;
        barEl.innerHTML = '';
        barEl.classList.toggle('editing', editing);

        // 业务 Tab
        bizTabs.forEach(function (funcKey, idx) {
            var f = getFunc(funcKey);
            if (!f) return;
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'ctab-item' + (activeKey === funcKey ? ' active' : '');
            item.setAttribute('data-key', funcKey);
            item.setAttribute('data-idx', idx);
            item.setAttribute('draggable', editing ? 'true' : 'false');
            item.innerHTML =
                '<span class="ctab-remove" aria-label="移除">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
                '</span>' +
                '<span class="ctab-icon">' + TabAppsData.svg(f.icon) + '</span>' +
                '<span class="ctab-label">' + f.name + '</span>';
            // 点击：编辑态下点击业务Tab不跳转（仅可拖拽/删除）；非编辑态跳转
            item.addEventListener('click', function (e) {
                if (editing) return;
                if (e.target.closest('.ctab-remove')) return;
                goTarget(f);
            });
            // 删除角标
            var rm = item.querySelector('.ctab-remove');
            rm.addEventListener('click', function (e) {
                e.stopPropagation();
                removeTab(funcKey);
            });
            // 拖拽排序
            if (editing) bindDrag(item);
            barEl.appendChild(item);
        });

        // 「更多」Tab（固定末位）
        var more = document.createElement('button');
        more.type = 'button';
        more.className = 'ctab-item ctab-more' + (activeKey === '__more__' ? ' active' : '');
        more.innerHTML =
            '<span class="ctab-icon">' + TabAppsData.svg('moreDots') + '</span>' +
            '<span class="ctab-label">更多</span>';
        more.addEventListener('click', function () {
            if (editing) return; // 编辑态下更多仅作占位，不弹窗
            openSheet();
        });
        barEl.appendChild(more);
    }

    function goTarget(f) {
        activeKey = f.funcKey;
        renderBar();
        // 跳转
        window.location.href = f.target;
    }

    // ===== 移除业务 Tab =====
    function removeTab(funcKey) {
        if (bizTabs.length <= MIN_BIZ_TABS) {
            toast('至少保留1个Tab');
            return;
        }
        var idx = bizTabs.indexOf(funcKey);
        if (idx < 0) return;
        bizTabs.splice(idx, 1);
        // 若移除的是当前高亮，且还有 Tab，高亮首位
        if (activeKey === funcKey) activeKey = bizTabs[0] || '__more__';
        saveStorage();
        renderBar();
        renderSheetFunctions(); // 已占用标记同步
    }

    // ===== 长按添加业务 Tab =====
    function addTab(funcKey) {
        if (bizTabs.indexOf(funcKey) >= 0) return; // 不可重复占位
        if (bizTabs.length >= MAX_BIZ_TABS) {
            toast('最多5个Tab');
            return;
        }
        bizTabs.push(funcKey);
        saveStorage();
        renderBar();
        renderSheetFunctions();
    }

    // ===== 拖拽排序 =====
    var dragSrcIdx = null;
    function bindDrag(item) {
        item.addEventListener('dragstart', function (e) {
            dragSrcIdx = parseInt(item.getAttribute('data-idx'), 10);
            item.classList.add('dragging');
            try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragSrcIdx)); } catch (err) {}
        });
        item.addEventListener('dragend', function () {
            item.classList.remove('dragging');
            barEl.querySelectorAll('.ctab-item').forEach(function (el) { el.classList.remove('drop-target'); });
            dragSrcIdx = null;
        });
        item.addEventListener('dragover', function (e) {
            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
            item.classList.add('drop-target');
        });
        item.addEventListener('dragleave', function () {
            item.classList.remove('drop-target');
        });
        item.addEventListener('drop', function (e) {
            e.preventDefault();
            item.classList.remove('drop-target');
            var dstIdx = parseInt(item.getAttribute('data-idx'), 10);
            if (dragSrcIdx === null || dragSrcIdx === dstIdx) return;
            var moved = bizTabs.splice(dragSrcIdx, 1)[0];
            bizTabs.splice(dstIdx, 0, moved);
            saveStorage();
            renderBar();
        });
    }

    // ===== 更多弹窗 =====
    function ensureOverlay() {
        if (overlayEl) return overlayEl;
        overlayEl = document.createElement('div');
        overlayEl.className = 'ctab-overlay';
        overlayEl.innerHTML =
            '<div class="ctab-sheet" role="dialog" aria-modal="true" aria-label="更多功能">' +
                '<div class="ctab-sheet-header">' +
                    '<span class="ctab-sheet-title">全部功能</span>' +
                    '<button type="button" class="ctab-sheet-edit" id="ctabEditBtn">编辑</button>' +
                '</div>' +
                '<div class="ctab-sheet-body" id="ctabSheetBody"></div>' +
                '<div class="ctab-sheet-tip" id="ctabSheetTip"></div>' +
            '</div>';
        document.body.appendChild(overlayEl);

        // 点击遮罩关闭
        overlayEl.addEventListener('click', function (e) {
            if (e.target === overlayEl) closeSheet();
        });
        // 编辑/完成按钮
        overlayEl.querySelector('#ctabEditBtn').addEventListener('click', function () {
            if (editing) finishEdit();
            else startEdit();
        });
        return overlayEl;
    }

    function openSheet() {
        ensureOverlay();
        renderSheetFunctions();
        overlayEl.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSheet() {
        if (!overlayEl) return;
        // 编辑态下关闭 = 放弃改动回滚
        if (editing) cancelEdit();
        overlayEl.classList.remove('show');
        document.body.style.overflow = '';
    }

    // 渲染弹窗功能列表（按小程序分组、一行四宫格）
    function renderSheetFunctions() {
        if (!overlayEl) return;
        var body = overlayEl.querySelector('#ctabSheetBody');
        var tip = overlayEl.querySelector('#ctabSheetTip');
        var groups = TabAppsData.getGroupedFunctions();
        var html = '';
        groups.forEach(function (g) {
            html += '<div class="ctab-group-title">' + g.appName + '</div>';
            html += '<div class="ctab-group-grid">';
            g.functions.forEach(function (f) {
                var occupied = bizTabs.indexOf(f.funcKey) >= 0;
                var tint = g.tint;
                html +=
                    '<a class="ctab-func' + (occupied ? ' occupied' : '') + '" ' +
                        'data-key="' + f.funcKey + '" ' +
                        'style="color:inherit;">' +
                        '<span class="ctab-func-icon" style="background:' + tint.bg + ';color:' + tint.color + ';">' +
                            TabAppsData.svg(f.icon) +
                        '</span>' +
                        '<span class="ctab-func-name">' + f.name + '</span>' +
                    '</a>';
            });
            html += '</div>';
        });
        body.innerHTML = html;

        // 提示文案
        if (editing) {
            tip.textContent = '长按功能图标可添加到底部Tab，拖拽底部Tab可调整顺序';
        } else {
            tip.textContent = '点击图标直接进入功能';
        }

        // 绑定交互
        body.querySelectorAll('.ctab-func').forEach(function (el) {
            var funcKey = el.getAttribute('data-key');
            if (editing) {
                bindLongPress(el, funcKey);
            } else {
                el.addEventListener('click', function () {
                    var f = getFunc(funcKey);
                    if (f) {
                        closeSheet();
                        goTarget(f);
                    }
                });
            }
        });
    }

    // 长按添加（编辑态）
    function bindLongPress(el, funcKey) {
        var timer = null;
        var started = false;
        function start(e) {
            if (bizTabs.indexOf(funcKey) >= 0) return; // 已占用不可再加
            started = false;
            timer = setTimeout(function () {
                started = true;
                addTab(funcKey);
                el.classList.add('added-pulse');
                setTimeout(function () { el.classList.remove('added-pulse'); }, 400);
                toast('已添加到底部Tab');
            }, 500);
        }
        function cancel() {
            if (timer) { clearTimeout(timer); timer = null; }
        }
        el.addEventListener('touchstart', start, { passive: true });
        el.addEventListener('touchend', cancel);
        el.addEventListener('touchmove', cancel);
        el.addEventListener('mousedown', start);
        el.addEventListener('mouseup', cancel);
        el.addEventListener('mouseleave', cancel);
        // 阻止编辑态下单击跳转
        el.addEventListener('click', function (e) {
            if (started) { e.preventDefault(); }
        });
    }

    // ===== 编辑态控制 =====
    function startEdit() {
        snapshot = deepCopy(bizTabs);   // 保存快照
        editing = true;
        activeKey = null;
        var btn = overlayEl.querySelector('#ctabEditBtn');
        btn.textContent = '完成';
        btn.classList.add('done');
        overlayEl.classList.add('editing');
        renderBar();
        renderSheetFunctions();
    }

    function finishEdit() {
        editing = false;
        snapshot = null;
        var btn = overlayEl.querySelector('#ctabEditBtn');
        btn.textContent = '编辑';
        btn.classList.remove('done');
        overlayEl.classList.remove('editing');
        if (!activeKey) activeKey = bizTabs[0] || null;
        renderBar();
        renderSheetFunctions();
        toast('已保存');
    }

    function cancelEdit() {
        if (snapshot) {
            bizTabs = snapshot;
            snapshot = null;
            saveStorage(); // 回滚后同步到 sessionStorage
        }
        editing = false;
        var btn = overlayEl.querySelector('#ctabEditBtn');
        if (btn) { btn.textContent = '编辑'; btn.classList.remove('done'); }
        overlayEl.classList.remove('editing');
        if (!activeKey) activeKey = bizTabs[0] || null;
        renderBar();
        renderSheetFunctions();
    }

    // ===== 初始化 =====
    function init(options) {
        options = options || {};
        barEl = options.barEl || document.querySelector('.ctab-bar');
        if (!barEl) return;

        // 初始业务 Tab：优先读 sessionStorage，无则用默认 消息/工作台/我的
        var saved = loadStorage();
        bizTabs = (saved && saved.length) ? saved.slice() : TabAppsData.getDefaultTabs().slice();
        // 高亮：优先用调用方指定的 activeKey（当前页对应功能），否则高亮首页位
        activeKey = options.activeKey || bizTabs[0] || null;

        renderBar();
    }

    // 暴露 API
    window.CustomTabbar = {
        init: init,
        openSheet: openSheet,
        closeSheet: closeSheet,
        getBizTabs: function () { return bizTabs.slice(); }
    };
})();
