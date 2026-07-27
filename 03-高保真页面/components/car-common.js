/* ========================================================================
   车机端 APP 公共脚本 — 品质巡查模块
   职责：演示状态管理（sessionStorage）、Toast、确认弹窗、语音播报、
   通用 DOM 工具。纯原生 JS，无外部依赖。
   与移动端 vehicle-demo-state.js 同思路，车机专用独立维护。
   ======================================================================== */
(function (global) {
    'use strict';

    var CAR = global.CAR || (global.CAR = {});

    /* ---------- 1. 演示状态（人车绑定关系） ---------- */
    var STATE_KEY = 'car-bind-state';
    var TASK_STATE_KEY = 'car-today-task-state';
    var STATE = {
        vehicleNo: '粤B·D2856',     // 车牌
        vehicleId: 'V-2026-028',    // 车辆标识
        driverName: '陈志远',        // 绑定巡查员
        bound: false,               // 是否已绑定
        bindTime: null,
        // 当日回顾指标
        review: { done: 4, mileage: 38.62, duration: 312, problems: 6 }
    };

    function loadState() {
        try {
            var raw = sessionStorage.getItem(STATE_KEY);
            if (raw) { var s = JSON.parse(raw); STATE = Object.assign(STATE, s); }
        } catch (e) {}
        return STATE;
    }
    function saveState() { try { sessionStorage.setItem(STATE_KEY, JSON.stringify(STATE)); } catch (e) {} }
    function getTaskStates() {
        try { return JSON.parse(sessionStorage.getItem(TASK_STATE_KEY) || '{}'); } catch (e) { return {}; }
    }
    function getTaskStatus(taskId) {
        return getTaskStates()[taskId] || null;
    }
    function setTaskStatus(taskId, status) {
        var states = getTaskStates();
        states[taskId] = status;
        try { sessionStorage.setItem(TASK_STATE_KEY, JSON.stringify(states)); } catch (e) {}
    }
    function resetTaskStates() {
        try { sessionStorage.removeItem(TASK_STATE_KEY); } catch (e) {}
    }
    function resetState() {
        STATE = { vehicleNo: '粤B·D2856', vehicleId: 'V-2026-028', driverName: '陈志远', bound: false, bindTime: null, review: { done: 4, mileage: 38.62, duration: 312, problems: 6 } };
        resetTaskStates();
        saveState();
    }
    function bindVehicle(driver) {
        resetTaskStates();
        STATE.bound = true; STATE.driverName = driver || STATE.driverName;
        STATE.bindTime = formatNow();
        saveState();
    }
    function unbindVehicle() { STATE.bound = false; saveState(); }

    /* ---------- 2. 时间工具（演示用，不依赖 Date.now 之外） ---------- */
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function formatNow() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function hhmm() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

    /* ---------- 3. Toast（规范 9.2） ---------- */
    function ensureToast() {
        var el = document.querySelector('.car-toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'car-toast';
            document.body.appendChild(el);
        }
        return el;
    }
    var toastTimer = null;
    function toast(msg, duration) {
        var el = ensureToast();
        el.textContent = msg;
        el.classList.add('is-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('is-show'); }, duration || 2400);
    }

    /* ---------- 4. 确认弹窗（规范 9.3，不嵌套弹窗） ---------- */
    function confirm(opts) {
        opts = opts || {};
        var mask = document.createElement('div');
        mask.className = 'car-modal-mask';
        var danger = opts.danger ? 'car-btn--danger' : 'car-btn--primary';
        mask.innerHTML =
            '<div class="car-modal">' +
            '<div class="car-modal__head">' + (opts.title || '提示') + '</div>' +
            '<div class="car-modal__body">' + (opts.content || '') + '</div>' +
            '<div class="car-modal__foot">' +
            '<button class="car-btn car-btn--ghost" data-act="cancel">' + (opts.cancelText || '取消') + '</button>' +
            '<button class="car-btn ' + danger + '" data-act="ok">' + (opts.okText || '确认') + '</button>' +
            '</div></div>';
        document.body.appendChild(mask);
        // 强制重绘后显示
        var raf = requestAnimationFrame || function (cb) { setTimeout(cb, 16); };
        raf(function () { mask.classList.add('is-show'); });
        function close() { mask.classList.remove('is-show'); setTimeout(function () { mask.remove(); }, 200); }
        mask.querySelector('[data-act=cancel]').addEventListener('click', function () { close(); if (opts.onCancel) opts.onCancel(); });
        mask.querySelector('[data-act=ok]').addEventListener('click', function () { close(); if (opts.onOk) opts.onOk(); });
        return mask;
    }

    /* ---------- 5. 语音播报（规范：语音不得是唯一方式，屏幕保留摘要） ---------- */
    function speak(text) {
        try {
            if ('speechSynthesis' in global) {
                var u = new SpeechSynthesisUtterance(text);
                u.lang = 'zh-CN'; u.rate = 1;
                global.speechSynthesis.cancel();
                global.speechSynthesis.speak(u);
            }
        } catch (e) {}
    }

    /* ---------- 6. URL 参数 ---------- */
    function query(name) {
        var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
        return m ? decodeURIComponent(m[1]) : null;
    }

    /* ---------- 7. 简单二维码占位（25×25 网格 SVG） ---------- */
    function qrSVG(seed) {
        var size = 25, cells = '';
        // 伪随机基于 seed
        var s = 0; for (var i = 0; i < (seed || 'x').length; i++) { s = (s * 31 + seed.charCodeAt(i)) & 0xffffffff; }
        function rand() { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s / 0x7fffffff); }
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                if (rand() > 0.5) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#000"/>';
            }
        }
        // 三个角的定位框
        function finder(fx, fy) {
            return '<rect x="' + fx + '" y="' + fy + '" width="7" height="7" fill="#000"/>' +
                   '<rect x="' + (fx + 1) + '" y="' + (fy + 1) + '" width="5" height="5" fill="#fff"/>' +
                   '<rect x="' + (fx + 2) + '" y="' + (fy + 2) + '" width="3" height="3" fill="#000"/>';
        }
        return '<svg class="car-qr" viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg">' +
            '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + cells +
            finder(0, 0) + finder(size - 7, 0) + finder(0, size - 7) + '</svg>';
    }

    /* ---------- 8. 顶栏时间刷新 ---------- */
    function bindClock(selector) {
        var el = document.querySelector(selector || '.js-clock');
        if (!el) return;
        function tick() { el.textContent = hhmm(); }
        tick(); setInterval(tick, 30000);
    }

    /* ---------- 9. 页面跳转过渡（Toast + 淡出） ---------- */
    function go(url, opts) {
        opts = opts || {};
        var delay = opts.delay || 600;
        var msg = opts.toast;
        if (msg) toast(msg);
        var app = document.querySelector('.car-app');
        if (app) app.classList.add('is-leaving');
        setTimeout(function () { location.href = url; }, delay);
    }

    /* ---------- 10. 隐藏调试入口（长按3s触发） ---------- */
    function installDebugFab(opts) {
        opts = opts || {};
        var fab = document.createElement('button');
        fab.className = 'car-debug-fab';
        fab.setAttribute('aria-label', '调试');
        fab.setAttribute('aria-hidden', 'true');
        fab.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
        document.body.appendChild(fab);
        var timer = null;
        fab.addEventListener('pointerdown', function () {
            timer = setTimeout(function () {
                if (opts.onActivate) opts.onActivate();
                else { resetState(); toast('调试：已重置演示状态'); setTimeout(function(){location.href='car-bind.html';},800); }
            }, 3000);
        });
        fab.addEventListener('pointerup', function () { clearTimeout(timer); });
        fab.addEventListener('pointerleave', function () { clearTimeout(timer); });
        return fab;
    }

    /* ---------- 11. 导出 ---------- */
    CAR.state = loadState;
    CAR.saveState = saveState;
    CAR.resetState = resetState;
    CAR.bindVehicle = bindVehicle;
    CAR.unbindVehicle = unbindVehicle;
    CAR.getState = function () { return loadState(); };
    CAR.getTaskStatus = getTaskStatus;
    CAR.setTaskStatus = setTaskStatus;
    CAR.resetTaskStates = resetTaskStates;
    CAR.toast = toast;
    CAR.confirm = confirm;
    CAR.speak = speak;
    CAR.query = query;
    CAR.qrSVG = qrSVG;
    CAR.bindClock = bindClock;
    CAR.formatNow = formatNow;
    CAR.hhmm = hhmm;
    CAR.go = go;
    CAR.installDebugFab = installDebugFab;

    // 初始加载
    loadState();
})(window);
