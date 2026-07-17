/**
 * 城市管家 APP 公共脚本 - 项目切换器
 * 功能：
 * 1. 在顶部导航栏显示当前项目名称并支持切换
 * 2. 通过 localStorage 持久化当前项目
 * 3. 所有 APP 页面共享同一套项目数据与状态
 */

(function () {
    'use strict';

    // 示例项目数据（实际应由后端接口提供）
    var PROJECTS = [
        { id: 'sz-ns', name: '深圳南山智慧环卫项目' },
        { id: 'gz-th', name: '广州天河环卫项目' },
        { id: 'sh-pd', name: '上海浦东环卫项目' },
        { id: 'bj-cy', name: '北京朝阳清洁项目' },
        { id: 'hz-xh', name: '杭州西湖环卫项目' }
    ];

    var STORAGE_KEY = 'cityStewardCurrentProject';
    var OVERLAY_ID = 'projectPickerOverlay';

    // 获取当前项目
    function getCurrentProject() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                var parsed = JSON.parse(stored);
                // 校验项目是否仍有效
                var exists = PROJECTS.some(function (p) { return p.id === parsed.id; });
                if (exists) return parsed;
            }
        } catch (e) {
            // 忽略 localStorage 异常
        }
        return PROJECTS[0];
    }

    // 设置当前项目
    function setCurrentProject(project) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        } catch (e) {
            // 忽略 localStorage 异常
        }
    }

    // 渲染顶部项目切换按钮文字
    function renderProjectSwitcher() {
        var switchers = document.querySelectorAll('.project-switcher-text');
        var current = getCurrentProject();
        switchers.forEach(function (el) {
            el.textContent = current ? current.name : '选择项目';
        });
    }

    // 为没有项目切换器的 top-nav 自动注入
    function ensureProjectSwitcher() {
        // 页面通过在 body/html 上声明 data-no-project-switcher="true" 来禁用自动注入
        var root = document.body || document.documentElement;
        if (root && root.getAttribute('data-no-project-switcher') === 'true') return;

        var navs = document.querySelectorAll('.top-nav');
        navs.forEach(function (nav) {
            if (nav.querySelector('.project-switcher')) return;
            // 单个 top-nav 也可以通过 data-no-project-switcher="true" 禁用
            if (nav.getAttribute('data-no-project-switcher') === 'true') return;

            var switcher = document.createElement('div');
            switcher.className = 'project-switcher';
            switcher.setAttribute('role', 'button');
            switcher.setAttribute('aria-label', '切换项目');
            switcher.innerHTML =
                '<span class="project-switcher-text">选择项目</span>' +
                '<svg class="project-switcher-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M6 9l6 6 6-6"/>' +
                '</svg>';
            switcher.addEventListener('click', openProjectPicker);
            nav.appendChild(switcher);
        });
    }

    // 创建项目选择弹窗
    function createProjectPicker() {
        var existing = document.getElementById(OVERLAY_ID);
        if (existing) return existing;

        var overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'project-picker-overlay';
        overlay.innerHTML =
            '<div class="project-picker">' +
                '<div class="project-picker-header">' +
                    '<span class="project-picker-title">切换项目</span>' +
                    '<div class="project-picker-close" role="button" aria-label="关闭">' +
                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                            '<path d="M18 6L6 18M6 6l12 12"/>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="project-picker-search">' +
                    '<svg class="project-picker-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' +
                    '</svg>' +
                    '<input type="text" class="project-picker-search-input" id="projectPickerSearch" placeholder="搜索项目名称">' +
                    '<svg class="project-picker-search-clear" id="projectPickerSearchClear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M18 6L6 18M6 6l12 12"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="project-picker-tip">项目切换会重置当前表单内容</div>' +
                '<div class="project-picker-list" id="projectPickerList"></div>' +
                '<div class="project-picker-cancel" id="projectPickerCancel">取消</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // 关闭事件
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeProjectPicker();
        });
        overlay.querySelector('.project-picker-close').addEventListener('click', closeProjectPicker);
        overlay.querySelector('#projectPickerCancel').addEventListener('click', closeProjectPicker);

        return overlay;
    }

    // 渲染项目列表
    function renderProjectList(listEl, keyword) {
        var current = getCurrentProject();
        var lower = (keyword || '').trim().toLowerCase();
        var filtered = PROJECTS.filter(function (p) {
            return !lower || p.name.toLowerCase().includes(lower);
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="project-picker-empty">未找到匹配项目</div>';
            return;
        }

        listEl.innerHTML = filtered.map(function (p) {
            var isActive = current && current.id === p.id;
            return '<div class="project-picker-item ' + (isActive ? 'active' : '') + '" data-id="' + p.id + '" data-name="' + p.name + '">' +
                '<span>' + p.name + '</span>' +
                '<svg class="project-picker-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">' +
                    '<path d="M20 6L9 17l-5-5"/>' +
                '</svg>' +
            '</div>';
        }).join('');

        listEl.querySelectorAll('.project-picker-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                var selected = PROJECTS.find(function (p) { return p.id === id; });
                if (selected) {
                    selectProject(selected);
                }
            });
        });
    }

    // 打开项目选择弹窗
    function openProjectPicker() {
        var overlay = createProjectPicker();
        var listEl = overlay.querySelector('#projectPickerList');
        var searchInput = overlay.querySelector('#projectPickerSearch');
        var searchClear = overlay.querySelector('#projectPickerSearchClear');

        if (!PROJECTS || PROJECTS.length === 0) {
            listEl.innerHTML = '<div class="project-picker-empty">暂无可用项目</div>';
        } else {
            renderProjectList(listEl, '');
        }

        // 搜索事件
        function handleSearch() {
            var keyword = searchInput.value;
            renderProjectList(listEl, keyword);
            searchClear.style.display = keyword ? 'flex' : 'none';
        }
        searchInput.addEventListener('input', handleSearch);
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            searchInput.focus();
            handleSearch();
        });

        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // 标记所有切换按钮为打开状态
        document.querySelectorAll('.project-switcher').forEach(function (el) {
            el.classList.add('open');
        });
    }

    // 关闭项目选择弹窗
    function closeProjectPicker() {
        var overlay = document.getElementById(OVERLAY_ID);
        if (!overlay) return;
        overlay.classList.remove('show');
        document.body.style.overflow = '';
        document.querySelectorAll('.project-switcher').forEach(function (el) {
            el.classList.remove('open');
        });
    }

    // 选择项目
    function selectProject(project) {
        setCurrentProject(project);
        renderProjectSwitcher();
        closeProjectPicker();

        // 触发项目切换事件，供各页面监听做额外处理（如刷新数据、重置表单）
        var event;
        try {
            event = new CustomEvent('projectChanged', { detail: project });
        } catch (e) {
            // 兼容旧浏览器
            event = document.createEvent('CustomEvent');
            event.initCustomEvent('projectChanged', true, true, project);
        }
        document.dispatchEvent(event);

        // 上报页：切换项目时重置表单（按需求文档要求）
        if (typeof resetReportForm === 'function') {
            resetReportForm();
        }
    }

    // 扫码识别模拟数据
    var SCAN_VEHICLE_DATA = {
        plates: ['粤B·12345', '粤B·67890', '粤B·54321', '粤B·11111', '沪A·88888', '京A·66666'],
        vins: ['LSVAG2180E2100001', 'LSVAG2180E2100002', 'LSVAG2180E2100003', 'LSVAG2180E2100004', 'LSVHJ2180E2200001', 'LSVCH2180E2300001']
    };
    var scanOverlay = null;
    var scanTimer = null;
    var scanCallback = null;

    // 创建扫码弹窗
    function createScanOverlay() {
        if (scanOverlay) return scanOverlay;

        scanOverlay = document.createElement('div');
        scanOverlay.id = 'scanOverlay';
        scanOverlay.className = 'scan-overlay';
        scanOverlay.innerHTML =
            '<div class="scan-close" role="button" aria-label="关闭">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M18 6L6 18M6 6l12 12"/>' +
                '</svg>' +
            '</div>' +
            '<div class="scan-frame">' +
                '<div class="scan-corner-bl"></div>' +
                '<div class="scan-corner-br"></div>' +
                '<div class="scan-line"></div>' +
            '</div>' +
            '<div class="scan-tip" id="scanTip">将车牌号/车架号放入框内，即可自动扫描</div>' +
            '<div class="scan-result-tip" id="scanResultTip"></div>' +
            '<button class="scan-cancel-btn" id="scanCancelBtn">取消</button>';

        document.body.appendChild(scanOverlay);

        scanOverlay.querySelector('.scan-close').addEventListener('click', closeScan);
        scanOverlay.querySelector('#scanCancelBtn').addEventListener('click', closeScan);

        return scanOverlay;
    }

    // 打开扫码弹窗
    function openScan(type, callback) {
        if (typeof callback !== 'function') return;
        scanCallback = callback;

        var overlay = createScanOverlay();
        var tipEl = overlay.querySelector('#scanTip');
        var resultEl = overlay.querySelector('#scanResultTip');

        tipEl.textContent = type === 'vin' ? '将车架号放入框内，即可自动扫描' : '将车牌号放入框内，即可自动扫描';
        resultEl.textContent = '';

        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // 模拟扫描过程：1.5s 后返回结果
        scanTimer = setTimeout(function () {
            var pool = type === 'vin' ? SCAN_VEHICLE_DATA.vins : SCAN_VEHICLE_DATA.plates;
            var result = pool[Math.floor(Math.random() * pool.length)];
            resultEl.textContent = '识别成功：' + result;

            scanTimer = setTimeout(function () {
                closeScan();
                if (scanCallback) scanCallback(result);
            }, 600);
        }, 1500);
    }

    // 关闭扫码弹窗
    function closeScan() {
        if (scanTimer) {
            clearTimeout(scanTimer);
            scanTimer = null;
        }
        if (scanOverlay) {
            scanOverlay.classList.remove('show');
        }
        document.body.style.overflow = '';
        scanCallback = null;
    }

    // 暴露全局 API
    window.CityStewardCommon = {
        getCurrentProject: getCurrentProject,
        setCurrentProject: setCurrentProject,
        getProjects: function () { return PROJECTS; },
        openProjectPicker: openProjectPicker,
        closeProjectPicker: closeProjectPicker,
        openScan: openScan,
        closeScan: closeScan
    };

    // DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ensureProjectSwitcher();
            renderProjectSwitcher();
        });
    } else {
        ensureProjectSwitcher();
        renderProjectSwitcher();
    }
})();
