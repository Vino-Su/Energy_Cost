/* ========================================================================
   车机端 APP 公共脚本 — 品质巡查模块
   职责：演示状态管理（sessionStorage）、Toast、确认弹窗、语音播报、
   通用 DOM 工具。纯原生 JS，无外部依赖。
   与移动端 vehicle-demo-state.js 同思路，车机专用独立维护。
   ======================================================================== */
(function (global) {
    'use strict';

    var CAR = global.CAR || (global.CAR = {});

    /* ---------- 1. 演示状态、任务与事件数据 ---------- */
    var STATE_KEY = 'car-bind-state';
    var TASK_STATE_KEY = 'car-today-task-state';
    var TASK_METRICS_KEY = 'car-today-task-metrics';
    var LIVE_PROBLEM_KEY = 'car-live-problems';
    var STATE = {
        vehicleNo: '粤B·D2856',
        vehicleId: 'V-2026-028',
        driverName: '陈志远',
        bound: false,
        bindTime: null,
        bindLocation: '深圳市南山区中央广场停车场',
        handoverTime: null,
        handoverLocation: null,
        vehicleOnline: true,
        vehicleInTaskArea: true,
        boundByOther: false,
        driverHasOtherVehicle: false,
        driving: false
    };

    var TASK_STATUS = {
        pending: { text: '待接收', tag: 'car-tag--warning', order: 0 },
        running: { text: '进行中', tag: 'car-tag--info', order: 1 },
        done: { text: '已完成', tag: 'car-tag--success', order: 2 },
        transferred: { text: '已转派', tag: 'car-tag--neutral', order: 3 },
        terminated: { text: '已终止', tag: 'car-tag--danger', order: 4 },
        invalid: { text: '已失效', tag: 'car-tag--neutral', order: 5 }
    };
    var EVENT_STATUS = {
        judging: { text: '待判别', tag: 'car-tag--neutral', order: 0, node: '等待事件判别' },
        assigning: { text: '待分配', tag: 'car-tag--info', order: 1, node: '等待责任人分配' },
        pending: { text: '待处理', tag: 'car-tag--warning', order: 2, node: '等待责任人接收' },
        processing: { text: '处理中', tag: 'car-tag--warning', order: 3, node: '责任人处理中' },
        review: { text: '待核查', tag: 'car-tag--info', order: 4, node: '等待巡查核查' },
        done: { text: '已完成', tag: 'car-tag--success', order: 5, node: '处置完成' }
    };

    var BASE_TASKS = [
        { id: 'T001', no: 'CGRW202607300001', area: '滨江路东段', date: '2026-07-30', time: '08:00-10:00', resource: '陈志远', type: '巡查任务', workType: '品质巡查', status: 'done', start: '08:02', mileage: 9.42, duration: 118, req: '对作业后路面进行质量检查，发现事件及时通过车辆套件上报。', zone: { left: '22%', top: '26%', width: '46%', height: '44%' }, vehicle: { left: '67%', top: '62%' }, phone: { left: '59%', top: '55%' }, track: 'M 25 64 C 30 57, 33 48, 39 45 S 50 43, 56 49 S 60 58, 67 62', phoneTrack: 'M 27 67 C 35 62, 39 54, 43 50 S 51 47, 59 55', points: [{ name: '滨江路18号路口', left: '32%', top: '38%' }, { name: '公交枢纽站', left: '54%', top: '48%' }] },
        { id: 'T002', no: 'CGRW202607300002', area: '中央广场片区', date: '2026-07-30', time: '10:30-12:00', resource: '陈志远', type: '巡查任务', workType: '品质巡查', status: 'pending', start: null, mileage: 0, duration: 0, req: '重点关注广场出入口路面破损与积水情况。', zone: { left: '28%', top: '32%', width: '40%', height: '38%' }, vehicle: { left: '58%', top: '52%' }, phone: { left: '52%', top: '47%' }, track: 'M 31 66 C 37 59, 40 51, 46 47 S 54 46, 58 52', phoneTrack: 'M 34 68 C 39 61, 43 55, 47 52 S 50 49, 52 47', points: [{ name: '中央广场北门', left: '35%', top: '42%' }, { name: '中央广场南门', left: '58%', top: '61%' }, { name: '喷泉广场', left: '48%', top: '50%' }] },
        { id: 'T003', no: 'CGRW202607300003', area: '解放南路沿线', date: '2026-07-30', time: '13:30-15:00', resource: '陈志远', type: '巡查任务', workType: '品质巡查', status: 'pending', start: null, mileage: 0, duration: 0, req: '重点关注沿线路面破损和匝道接缝处平整度。', zone: { left: '18%', top: '40%', width: '52%', height: '36%' }, vehicle: { left: '46%', top: '59%' }, phone: { left: '41%', top: '53%' }, track: 'M 18 76 C 27 70, 34 64, 40 60 S 54 49, 65 56 S 75 49, 82 38', phoneTrack: 'M 20 79 C 29 72, 35 67, 42 62 S 51 55, 58 57', points: [{ name: '解放南路1号桥', left: '30%', top: '55%' }, { name: '解放南路匝道', left: '52%', top: '42%' }, { name: '文昌路口', left: '65%', top: '63%' }] },
        { id: 'T004', no: 'CGRW202607300004', area: '人民东路-文昌路', date: '2026-07-30', time: '15:30-17:00', resource: '陈志远', type: '巡查任务', workType: '品质巡查', status: 'pending', start: null, mileage: 0, duration: 0, req: '关注学校周边路面清洁度和通行安全。', zone: { left: '24%', top: '22%', width: '44%', height: '48%' }, vehicle: { left: '48%', top: '55%' }, phone: { left: '44%', top: '49%' }, track: 'M 20 82 C 29 75, 36 68, 44 65 S 57 55, 66 60 S 75 48, 80 34', phoneTrack: 'M 23 84 C 31 76, 38 71, 45 67 S 52 60, 60 61', points: [{ name: '人民东路跨线桥', left: '34%', top: '35%' }, { name: '文昌路小学', left: '55%', top: '52%' }, { name: '文昌路地铁口', left: '43%', top: '67%' }] }
    ];

    var BASE_PROBLEMS = [
        { id: 'P001', taskId: 'T001', no: 'Q20260730-0014', status: 'done', occurrenceTime: '2026-07-30 09:12', reportTime: '2026-07-30 09:12', source: '车载监控采样', discoveryType: 'AI', discoverer: '巡查车 粤B·D2856', coordinates: '113.264,23.129', location: '滨江路18号路口', detailedLocation: '滨江路东段K1+200北侧车道', problemType: '路面油污', description: '路面存在大面积油污，已完成清洗并通过核查。', point: { left: '32%', top: '38%' }, handler: '李建国', handlerTime: '2026-07-30 10:06', handlerDesc: '路面油污已清洗完毕，复检合格。' },
        { id: 'P002', taskId: 'T002', no: 'Q20260730-0033', status: 'processing', occurrenceTime: '2026-07-30 11:08', reportTime: '2026-07-30 11:08', source: '车载监控采样', discoveryType: 'AI', discoverer: '巡查车 粤B·D2856', coordinates: '113.271,23.135', location: '中央广场北门', detailedLocation: '中央广场北门入口东侧约20米', problemType: '路面积水', description: '广场北门入口路面存在积水，责任人正在现场处置。', point: { left: '35%', top: '42%' }, handler: '王建军', handlerTime: '—', handlerDesc: '已到场排查排水口，正在清理积水。' },
        { id: 'P003', taskId: 'T001', no: 'Q20260730-0021', status: 'assigning', occurrenceTime: '2026-07-30 09:46', reportTime: '2026-07-30 09:46', source: '车载监控采样', discoveryType: '人工', discoverer: '巡查员 陈志远', coordinates: '113.268,23.127', location: '滨江路东段K2+300', detailedLocation: '滨江路东段公交站南侧', problemType: '路面破损', description: '路段局部路面破损，已完成事件判别，待分配处置责任人。', point: { left: '54%', top: '60%' }, handler: '—', handlerTime: '—', handlerDesc: '等待责任人分配。' }
    ];

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
    function getTaskMetrics() {
        try { return JSON.parse(sessionStorage.getItem(TASK_METRICS_KEY) || '{}'); } catch (e) { return {}; }
    }
    function setTaskMetrics(taskId, patch) {
        var all = getTaskMetrics();
        all[taskId] = Object.assign({}, all[taskId] || {}, patch || {});
        try { sessionStorage.setItem(TASK_METRICS_KEY, JSON.stringify(all)); } catch (e) {}
    }
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function getLiveProblems() {
        try {
            var list = JSON.parse(sessionStorage.getItem(LIVE_PROBLEM_KEY) || '[]');
            return Array.isArray(list) ? list : [];
        } catch (e) { return []; }
    }
    function getProblems(taskId) {
        var merged = BASE_PROBLEMS.concat(getLiveProblems()).map(function (problem) {
            var p = clone(problem);
            var meta = EVENT_STATUS[p.status] || EVENT_STATUS.judging;
            var task = BASE_TASKS.find(function (item) { return item.id === p.taskId; });
            p.statusText = meta.text;
            p.statusTag = meta.tag;
            p.currentNode = meta.node;
            p.taskArea = task ? task.area : '未知任务';
            return p;
        });
        if (taskId) merged = merged.filter(function (problem) { return problem.taskId === taskId; });
        return merged.sort(function (a, b) { return a.reportTime < b.reportTime ? 1 : -1; });
    }
    function addProblem(problem) {
        var list = getLiveProblems().filter(function (item) { return item.id !== problem.id; });
        list.unshift(problem);
        try { sessionStorage.setItem(LIVE_PROBLEM_KEY, JSON.stringify(list)); } catch (e) {}
        return problem;
    }
    function getTasks() {
        var states = getTaskStates();
        var metrics = getTaskMetrics();
        return BASE_TASKS.map(function (task) {
            var item = Object.assign(clone(task), metrics[task.id] || {});
            item.status = states[task.id] || task.status;
            item.statusText = (TASK_STATUS[item.status] || TASK_STATUS.invalid).text;
            item.statusTag = (TASK_STATUS[item.status] || TASK_STATUS.invalid).tag;
            item.problemsList = getProblems(item.id);
            item.problems = item.problemsList.length;
            return item;
        });
    }
    function getTask(taskId) { return getTasks().find(function (task) { return task.id === taskId; }) || null; }
    function getProblem(problemId) { return getProblems().find(function (problem) { return problem.id === problemId; }) || null; }
    function sortedTasks(tasks) {
        return (tasks || getTasks()).slice().sort(function (a, b) {
            var ao = (TASK_STATUS[a.status] || TASK_STATUS.invalid).order;
            var bo = (TASK_STATUS[b.status] || TASK_STATUS.invalid).order;
            return ao === bo ? (a.time < b.time ? -1 : 1) : ao - bo;
        });
    }
    function getRunningTask() { return getTasks().find(function (task) { return task.status === 'running'; }) || null; }
    function getNextPendingTask(excludeId) {
        return sortedTasks().find(function (task) { return task.status === 'pending' && task.id !== excludeId; }) || null;
    }
    function resetState() {
        STATE = { vehicleNo: '粤B·D2856', vehicleId: 'V-2026-028', driverName: '陈志远', bound: false, bindTime: null, bindLocation: '深圳市南山区中央广场停车场', handoverTime: null, handoverLocation: null, vehicleOnline: true, vehicleInTaskArea: true, boundByOther: false, driverHasOtherVehicle: false, driving: false };
        resetTaskStates();
        try { sessionStorage.removeItem(TASK_METRICS_KEY); sessionStorage.removeItem(LIVE_PROBLEM_KEY); } catch (e) {}
        saveState();
    }
    function bindVehicle(driver) {
        resetTaskStates();
        try { sessionStorage.removeItem(TASK_METRICS_KEY); sessionStorage.removeItem(LIVE_PROBLEM_KEY); } catch (e) {}
        STATE.bound = true; STATE.driverName = driver || STATE.driverName;
        STATE.bindTime = formatNow();
        STATE.handoverTime = null; STATE.handoverLocation = null;
        saveState();
    }
    function unbindVehicle() {
        STATE.bound = false;
        STATE.handoverTime = formatNow();
        STATE.handoverLocation = STATE.bindLocation;
        saveState();
    }
    function startTask(taskId) {
        setTaskStatus(taskId, 'running');
        setTaskMetrics(taskId, { start: hhmm(), mileage: 0.18, duration: 1 });
        return getTask(taskId);
    }
    function finishTask(taskId, metrics) {
        setTaskMetrics(taskId, metrics || {});
        setTaskStatus(taskId, 'done');
        return { task: getTask(taskId), next: getNextPendingTask(taskId) };
    }
    function demoMode() { return query('demo') || ''; }
    function validateBind() {
        var st = loadState(), demo = demoMode();
        if (st.boundByOther || demo === 'bind-other') return { ok: false, message: '当前车辆已被【李明】绑定，请绑定其他车辆！' };
        if (st.driverHasOtherVehicle || demo === 'driver-other') return { ok: false, message: '您当前已绑定【粤B·K1028】，请交车后重新绑定！' };
        return { ok: true, warning: (!st.vehicleOnline || demo === 'offline') ? '当前车辆网联装置离线，请检查' : '' };
    }
    function validateStart(task) {
        var st = loadState(), demo = demoMode(), running = getRunningTask();
        if (!st.bound) return { ok: false, message: '当前车辆尚未绑定巡查员' };
        if (demo === 'start-time') return { ok: false, message: '当前不在开始时间范围内' };
        if (running && (!task || running.id !== task.id)) return { ok: false, message: '当前存在进行中任务', focusTaskId: running.id };
        if (!st.vehicleInTaskArea || demo === 'out-of-area') return { ok: false, message: '任务车辆不在任务路段范围，请检查' };
        return { ok: true, warning: (!st.vehicleOnline || demo === 'offline') ? '当前车辆网联装置离线，请检查' : '' };
    }
    function validateFinish(task, mileage) {
        if (demoMode() === 'zero-mileage' || Number(mileage === undefined ? task && task.mileage : mileage) <= 0) return { ok: false, message: '当前任务里程数为 0，无法结束任务' };
        return { ok: true };
    }
    function validateHandover() {
        var running = getRunningTask();
        if (running) return { ok: false, message: '当前存在进行中任务', focusTaskId: running.id };
        return { ok: true };
    }
    function getReviewData() {
        var tasks = getTasks(), problems = getProblems();
        var done = tasks.filter(function (task) { return task.status === 'done'; });
        var counts = {};
        Object.keys(EVENT_STATUS).forEach(function (key) { counts[key] = 0; });
        problems.forEach(function (problem) { counts[problem.status] = (counts[problem.status] || 0) + 1; });
        return {
            done: done.length,
            mileage: done.reduce(function (sum, task) { return sum + Number(task.mileage || 0); }, 0),
            duration: done.reduce(function (sum, task) { return sum + Number(task.duration || 0); }, 0),
            problems: problems.length,
            eventCounts: counts,
            todayPending: tasks.filter(function (task) { return task.status === 'pending'; }),
            tomorrow: [
                { id: 'N001', area: '临江大道东段', date: '2026-07-31', time: '08:00-09:30', status: 'pending', statusText: '待接收' },
                { id: 'N002', area: '云山路片区', date: '2026-07-31', time: '10:00-11:30', status: 'pending', statusText: '待接收' },
                { id: 'N003', area: '凤起路-文二路', date: '2026-07-31', time: '14:00-15:30', status: 'pending', statusText: '待接收' }
            ]
        };
    }

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

    /* ---------- 10. 顶栏新任务提醒 ---------- */
    function bindTaskNotice(opts) {
        opts = opts || {};
        var notice = document.getElementById(opts.id || 'js-task-notice');
        if (!notice) return null;
        var summary = notice.querySelector('[data-task-notice-summary]');
        var more = notice.querySelector('[data-task-notice-more]');
        var view = notice.querySelector('[data-task-notice-view]');
        var close = notice.querySelector('[data-task-notice-close]');
        var duration = opts.duration === undefined ? 60000 : opts.duration;
        var timer = null;

        if (summary && opts.summary) {
            summary.textContent = opts.summary;
            summary.title = opts.summary;
        }
        if (more) {
            if (opts.moreCount > 0) {
                more.textContent = '+' + opts.moreCount;
                more.setAttribute('aria-label', '另有' + opts.moreCount + '条新任务');
            } else {
                more.classList.add('car-hidden');
            }
        }

        function dismiss() {
            if (notice.classList.contains('car-hidden') || notice.classList.contains('is-dismissing')) return;
            global.clearTimeout(timer);
            notice.classList.add('is-dismissing');
            global.setTimeout(function () { notice.classList.add('car-hidden'); }, 180);
        }

        if (view) {
            view.addEventListener('click', function () {
                global.clearTimeout(timer);
                if (opts.onView) opts.onView();
            });
        }
        if (close) close.addEventListener('click', dismiss);
        if (opts.announcement) {
            global.setTimeout(function () { speak(opts.announcement); }, opts.announcementDelay || 600);
        }
        if (duration > 0) timer = global.setTimeout(dismiss, duration);
        return { dismiss: dismiss };
    }

    /* ---------- 11. 隐藏调试入口（长按3s触发） ---------- */
    function applyRuntimeState() {
        var demo = demoMode();
        var config = {
            offline: { text: '车辆网联装置离线，当前显示最后一次有效数据', type: 'warning' },
            'location-error': { text: '定位异常，当前显示最后一次有效位置', type: 'warning' },
            loading: { text: '数据加载中，当前布局与缓存数据保持可见', type: 'loading' },
            driving: { text: '车辆行驶中，复杂浏览与交车操作已暂停', type: 'warning' }
        }[demo];
        if (!config || document.querySelector('.car-runtime-alert')) return;
        var host = document.querySelector('.car-topbar__center') || document.querySelector('.car-topbar__spacer');
        if (!host) return;
        var alert = document.createElement('div');
        alert.className = 'car-runtime-alert car-runtime-alert--' + config.type;
        alert.setAttribute('role', 'status');
        alert.textContent = config.text;
        host.appendChild(alert);
        var app = document.querySelector('.car-app');
        if (app && demo === 'loading') app.classList.add('is-loading');
        if (app && demo === 'driving') {
            app.classList.add('is-driving');
            document.addEventListener('click', function (event) {
                var restricted = event.target.closest('#js-handover, #js-fullscreen, #js-layer, #js-finish, #js-start, #js-task-tool, #js-problem-tool, [data-detail], .home-task, .run-task-item, .car-task-problem');
                if (!restricted) return;
                event.preventDefault(); event.stopImmediatePropagation();
                toast('行驶中暂不可执行该操作');
            }, true);
        }
    }

    function installDebugFab(opts) {
        opts = opts || {};
        applyRuntimeState();
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

    /* ---------- 12. 导出 ---------- */
    CAR.state = loadState;
    CAR.saveState = saveState;
    CAR.resetState = resetState;
    CAR.bindVehicle = bindVehicle;
    CAR.unbindVehicle = unbindVehicle;
    CAR.getState = function () { return loadState(); };
    CAR.getTaskStatus = getTaskStatus;
    CAR.setTaskStatus = setTaskStatus;
    CAR.setTaskMetrics = setTaskMetrics;
    CAR.resetTaskStates = resetTaskStates;
    CAR.TASK_STATUS = TASK_STATUS;
    CAR.EVENT_STATUS = EVENT_STATUS;
    CAR.getTasks = getTasks;
    CAR.getTask = getTask;
    CAR.sortedTasks = sortedTasks;
    CAR.getRunningTask = getRunningTask;
    CAR.getNextPendingTask = getNextPendingTask;
    CAR.getProblems = getProblems;
    CAR.getProblem = getProblem;
    CAR.addProblem = addProblem;
    CAR.startTask = startTask;
    CAR.finishTask = finishTask;
    CAR.validateBind = validateBind;
    CAR.validateStart = validateStart;
    CAR.validateFinish = validateFinish;
    CAR.validateHandover = validateHandover;
    CAR.getReviewData = getReviewData;
    CAR.toast = toast;
    CAR.confirm = confirm;
    CAR.speak = speak;
    CAR.query = query;
    CAR.qrSVG = qrSVG;
    CAR.bindClock = bindClock;
    CAR.formatNow = formatNow;
    CAR.hhmm = hhmm;
    CAR.go = go;
    CAR.bindTaskNotice = bindTaskNotice;
    CAR.installDebugFab = installDebugFab;

    // 初始加载
    loadState();
})(window);
