/* 车机全局通话组件：原型信令、状态机、共用浮窗与历史记录。 */
(function (global) {
    'use strict';

    var CAR = global.CAR;
    if (!CAR) return;

    var CALL_STATE_KEY = 'kuwash-car-call-state-v1';
    var CALL_HISTORY_KEY = 'kuwash-car-call-history-v1';
    var PROJECT_ID = 'P-SZ-NS-01';
    var PROJECT_NAME = '南山环卫项目';
    var ACTIVE_STATES = ['requesting', 'incoming', 'connecting', 'connected'];
    var terminalTimer = null;
    var requestTimer = null;
    var tickTimer = null;
    var panel = null;
    var historyPanel = null;
    var historyTrigger = null;
    var historyFilter = 'all';
    var taskDemoStarted = false;
    var taskDemoTimers = [];

    var STATUS_META = {
        requesting: { title: '正在请求通话', status: '等待调度中心接听…' },
        incoming: { title: '调度中心来电', status: '来自云端的通话请求' },
        connecting: { title: '正在建立连接', status: '即将接通调度中心…' },
        connected: { title: '通话中', status: '通话连接正常' },
        ended: { title: '通话已结束', status: '已保存本次通话记录' },
        rejected: { title: '已挂断来电', status: '本次云端通话请求已拒接' },
        missed: { title: '未接听', status: '调度中心来电已超时' },
        cancelled: { title: '已取消请求', status: '已通知调度中心取消呼叫' },
        failed: { title: '未能接通', status: '请检查车辆网络后重试' }
    };

    function phoneIcon(extraPath) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"/>' + (extraPath || '') + '</svg>';
    }
    function chevronIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    }
    function closeIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    }
    function hangupIcon() {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5.2 15.2c4.2-3.2 9.4-3.2 13.6 0"/><path d="M4 14.5 2.8 18l3.7 1.2 1.4-3.1M20 14.5l1.2 3.5-3.7 1.2-1.4-3.1"/></svg>';
    }
    function readJson(key, fallback) {
        try { return JSON.parse(global.localStorage.getItem(key) || JSON.stringify(fallback)); } catch (e) { return fallback; }
    }
    function writeJson(key, value) {
        try { global.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
    function nowIso() { return new Date().toISOString(); }
    function createId() { return 'CALL-' + Date.now() + '-' + Math.floor(Math.random() * 1000); }
    function getCallState() { return readJson(CALL_STATE_KEY, { status: 'idle' }); }
    function saveCallState(state) { writeJson(CALL_STATE_KEY, state); return state; }
    function isActive(state) { return ACTIVE_STATES.indexOf((state || getCallState()).status) !== -1; }
    function currentScope() {
        var st = CAR.getState();
        return {
            projectId: PROJECT_ID,
            projectName: PROJECT_NAME,
            vehicleId: st.vehicleId || 'V-2026-028',
            vehicleNo: st.plateNo || st.vehicleNo || '粤B·D2856',
            driverName: st.driverName || '陈志远'
        };
    }
    function normalizeParticipants(items) {
        var defaults = [{ name: currentScope().driverName }, { name: '调度中心' }];
        var source = Array.isArray(items) && items.length ? items : defaults;
        var seen = {};
        return source.reduce(function (list, item) {
            var name = typeof item === 'string' ? item : item && item.name;
            name = String(name || '').trim();
            if (!name || seen[name]) return list;
            seen[name] = true;
            list.push({ name: name });
            return list;
        }, []).slice(0, 12);
    }
    function participantCount(item) {
        var participants = item && item.participants;
        return Array.isArray(participants) && participants.length ? participants.length : Math.max(1, Number(item && item.participantCount) || 2);
    }
    function participantSummary(item) { return participantCount(item) + '人'; }
    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    }
    function isEligiblePage() {
        var path = global.location.pathname.toLowerCase();
        var params = new URLSearchParams(global.location.search);
        if (params.get('from') === 'review') return false;
        var demoEntry = Boolean(params.get('call')) || ['auto', 'requesting', 'incoming', 'connected', 'history'].indexOf(params.get('callDemo')) !== -1;
        return (CAR.getState().bound || demoEntry) && /car-home\.html$|car-task-running\.html$|car-problem-detail\.html$|car-handover\.html$/.test(path);
    }
    function secondsBetween(from, to) {
        if (!from) return 0;
        return Math.max(0, Math.floor((new Date(to || Date.now()).getTime() - new Date(from).getTime()) / 1000));
    }
    function formatDuration(seconds) {
        seconds = Math.max(0, Number(seconds || 0));
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function formatDateTime(value) {
        if (!value) return '--';
        var d = new Date(value);
        if (isNaN(d.getTime())) return String(value).replace('T', ' ').slice(0, 16);
        var pad = function (n) { return n < 10 ? '0' + n : String(n); };
        return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function seedHistory() {
        var existing = readJson(CALL_HISTORY_KEY, null);
        if (Array.isArray(existing)) return existing;
        var scope = currentScope();
        var list = [
            { callId: 'CALL-DEMO-001', direction: 'incoming', status: 'connected', requestAt: '2026-09-09T08:42:00+08:00', answerAt: '2026-09-09T08:42:08+08:00', endedAt: '2026-09-09T08:45:26+08:00', duration: 198, endReason: 'REMOTE_HANGUP', participants: [{ name: '陈志远' }, { name: '王莉' }, { name: '李工' }] },
            { callId: 'CALL-DEMO-002', direction: 'incoming', status: 'missed', requestAt: '2026-09-09T09:18:00+08:00', endedAt: '2026-09-09T09:18:30+08:00', duration: 0, endReason: 'NO_ANSWER', participants: [{ name: '陈志远' }, { name: '王莉' }] },
            { callId: 'CALL-DEMO-003', direction: 'outgoing', status: 'cancelled', requestAt: '2026-09-08T16:06:00+08:00', endedAt: '2026-09-08T16:06:19+08:00', duration: 0, endReason: 'LOCAL_CANCEL', participants: [{ name: '陈志远' }, { name: '王莉' }] },
            { callId: 'CALL-DEMO-004', direction: 'outgoing', status: 'connected', requestAt: '2026-09-08T11:24:00+08:00', answerAt: '2026-09-08T11:24:10+08:00', endedAt: '2026-09-08T11:29:42+08:00', duration: 332, endReason: 'LOCAL_HANGUP', participants: [{ name: '陈志远' }, { name: '王莉' }, { name: '李工' }] }
        ].map(function (item) {
            var participants = normalizeParticipants(item.participants);
            return Object.assign({ peerName: '调度中心', participants: participants, participantCount: participants.length }, scope, item);
        });
        writeJson(CALL_HISTORY_KEY, list);
        return list;
    }
    function scopedHistory() {
        var scope = currentScope();
        return seedHistory().filter(function (item) {
            return item.projectId === scope.projectId && item.vehicleId === scope.vehicleId && item.driverName === scope.driverName;
        }).sort(function (a, b) { return new Date(b.requestAt).getTime() - new Date(a.requestAt).getTime(); });
    }
    function addHistory(state, finalStatus, reason) {
        if (!state || !state.callId) return;
        var list = seedHistory();
        if (list.some(function (item) { return item.callId === state.callId; })) return;
        var endedAt = nowIso();
        list.unshift(Object.assign({}, currentScope(), {
            callId: state.callId,
            direction: state.direction,
            peerName: state.peerName || '调度中心',
            participants: normalizeParticipants(state.participants),
            participantCount: participantCount(state),
            requestAt: state.requestAt,
            answerAt: state.answerAt || null,
            endedAt: endedAt,
            status: finalStatus,
            duration: state.answerAt ? secondsBetween(state.answerAt, endedAt) : 0,
            endReason: reason || ''
        }));
        writeJson(CALL_HISTORY_KEY, list);
    }

    function mountPanel() {
        if (panel) return panel;
        panel = document.createElement('section');
        panel.className = 'car-call-panel';
        panel.hidden = true;
        panel.setAttribute('aria-live', 'assertive');
        panel.setAttribute('aria-atomic', 'true');
        panel.innerHTML =
            '<div class="car-call-panel__head">' +
                '<span class="car-call-panel__icon">' + phoneIcon() + '</span>' +
                '<div class="car-call-panel__heading"><div class="car-call-panel__title"></div><div class="car-call-panel__peer"></div></div>' +
                '<span class="car-call-panel__elapsed"></span>' +
                '<button type="button" class="car-call-panel__expand" data-call-action="expand" aria-label="展开通话面板" title="展开">' + chevronIcon() + '</button>' +
                '<button type="button" class="car-call-panel__quick-hangup" data-call-action="hangup" aria-label="挂断通话" title="挂断">' + hangupIcon() + '</button>' +
            '</div>' +
            '<div class="car-call-panel__body"><div class="car-call-panel__status"></div><div class="car-call-panel__meta"></div><div class="car-call-panel__members" hidden></div></div>' +
            '<div class="car-call-panel__actions"></div>';
        document.body.appendChild(panel);
        panel.addEventListener('click', onPanelAction);
        return panel;
    }
    function actionButton(action, text, kind) {
        return '<button type="button" class="car-btn car-btn--lg ' + kind + '" data-call-action="' + action + '">' + text + '</button>';
    }
    function renderPanel() {
        var state = getCallState();
        var meta = STATUS_META[state.status];
        mountPanel();
        updateTrigger(state);
        if (!meta || state.status === 'idle') {
            panel.hidden = true;
            var idleApp = document.querySelector('.car-app');
            if (idleApp) idleApp.classList.remove('is-call-active');
            stopTick();
            return;
        }
        var active = isActive(state);
        panel.hidden = false;
        panel.dataset.callState = state.status;
        panel.classList.toggle('is-collapsed', state.status === 'connected' && state.collapsed !== false);
        panel.setAttribute('role', state.status === 'incoming' ? 'alertdialog' : 'status');
        panel.querySelector('.car-call-panel__title').textContent = meta.title;
        panel.querySelector('.car-call-panel__peer').textContent = participantSummary(state);
        var status = panel.querySelector('.car-call-panel__status');
        var callMeta = panel.querySelector('.car-call-panel__meta');
        status.textContent = meta.status;
        status.hidden = state.status === 'connected';
        callMeta.hidden = state.status === 'connected';
        var elapsedFrom = state.answerAt || state.requestAt;
        panel.querySelector('.car-call-panel__elapsed').textContent = formatDuration(secondsBetween(elapsedFrom));
        callMeta.innerHTML = '<span>' + (state.direction === 'incoming' ? '云端呼入' : '主动发起') + '</span><span>' + formatDateTime(state.requestAt) + '</span>';
        renderParticipants(state);
        var actions = '';
        if (state.status === 'requesting') actions = actionButton('cancel', '取消请求', 'car-btn--danger');
        else if (state.status === 'incoming') actions = actionButton('reject', '挂断', 'car-btn--danger') + actionButton('accept', '接听', 'car-btn--success');
        else if (state.status === 'connecting') actions = actionButton('hangup', '挂断', 'car-btn--danger');
        else if (state.status === 'connected') actions = actionButton('collapse', '收起', 'car-btn--ghost') + actionButton('hangup', '挂断', 'car-btn--danger');
        else actions = actionButton('close', '关闭', 'car-btn--ghost');
        panel.querySelector('.car-call-panel__actions').innerHTML = actions;
        var app = document.querySelector('.car-app');
        if (app) app.classList.toggle('is-call-active', active);
        if (active) startTick(); else stopTick();
    }
    function renderParticipants(state) {
        var container = panel.querySelector('.car-call-panel__members');
        if (!container) return;
        var participants = normalizeParticipants(state.participants);
        container.hidden = state.status !== 'connected';
        if (container.hidden) return;
        container.innerHTML = '<div class="car-call-panel__members-title"><span>成员（' + participants.length + '）</span><span class="car-call-panel__members-meta">' + (state.direction === 'incoming' ? '云端呼入' : '主动发起') + ' · ' + formatDateTime(state.requestAt) + '</span></div><div class="car-call-panel__members-list">' + participants.map(function (item) {
            var name = escapeHtml(item.name);
            var initial = escapeHtml(item.name.charAt(0));
            return '<div class="car-call-panel__member"><span class="car-call-panel__member-avatar" aria-hidden="true">' + initial + '</span><span class="car-call-panel__member-name">' + name + '</span></div>';
        }).join('') + '</div>';
    }
    function onPanelAction(event) {
        var button = event.target.closest('[data-call-action]');
        if (!button) return;
        var action = button.dataset.callAction;
        if (action === 'accept') accept();
        else if (action === 'reject') reject();
        else if (action === 'cancel') cancel();
        else if (action === 'hangup') hangup('LOCAL_HANGUP');
        else if (action === 'collapse') setCollapsed(true);
        else if (action === 'expand') setCollapsed(false);
        else if (action === 'close') clearPanel();
    }
    function startTick() {
        if (tickTimer) return;
        tickTimer = global.setInterval(function () {
            if (!panel || panel.hidden) return;
            var state = getCallState();
            var elapsed = panel.querySelector('.car-call-panel__elapsed');
            if (elapsed) elapsed.textContent = formatDuration(secondsBetween(state.answerAt || state.requestAt));
        }, 1000);
    }
    function stopTick() { if (tickTimer) global.clearInterval(tickTimer); tickTimer = null; }
    function clearTerminalTimer() { if (terminalTimer) global.clearTimeout(terminalTimer); terminalTimer = null; }
    function clearRequestTimer() { if (requestTimer) global.clearTimeout(requestTimer); requestTimer = null; }
    function clearPanel() { clearTerminalTimer(); clearRequestTimer(); saveCallState({ status: 'idle' }); renderPanel(); }
    function showTerminal(state, status, finalStatus, reason) {
        clearTerminalTimer();
        addHistory(state, finalStatus, reason);
        saveCallState(Object.assign({}, state, { status: status, endedAt: nowIso(), collapsed: false }));
        renderPanel();
        renderHistory();
        terminalTimer = global.setTimeout(clearPanel, 1600);
    }
    function begin(direction, status, detail) {
        detail = detail || {};
        clearTerminalTimer();
        if (!CAR.getState().bound && !detail.demo) return false;
        if (isActive()) {
            CAR.toast('当前已有通话，无法处理新请求');
            return false;
        }
        closeHistory();
        var state = saveCallState(Object.assign({}, currentScope(), {
            callId: detail.callId || createId(),
            direction: direction,
            peerName: '调度中心',
            participants: normalizeParticipants(detail.participants),
            participantCount: participantCount({ participants: detail.participants }),
            requestAt: detail.requestAt || nowIso(),
            answerAt: null,
            status: status,
            collapsed: false
        }));
        try { if ('speechSynthesis' in global) global.speechSynthesis.cancel(); } catch (e) {}
        renderPanel();
        clearRequestTimer();
        return state;
    }
    function startRequestTimeout(callId, direction) {
        clearRequestTimer();
        requestTimer = global.setTimeout(function () {
            var state = getCallState();
            if (state.callId !== callId || !isActive(state)) return;
            if (direction === 'incoming') showTerminal(state, 'missed', 'missed', 'NO_ANSWER');
            else showTerminal(state, 'failed', 'failed', 'NO_ANSWER');
        }, 30000);
    }
    function requestFromHardware(detail) {
        var state = begin('outgoing', 'requesting', detail);
        if (state) startRequestTimeout(state.callId, 'outgoing');
        return state;
    }
    function receiveFromCloud(detail) {
        if (!isEligiblePage()) return false;
        var state = begin('incoming', 'incoming', detail);
        if (state) {
            startRequestTimeout(state.callId, 'incoming');
            global.setTimeout(function () {
                var acceptButton = panel && panel.querySelector('[data-call-action="accept"]');
                if (acceptButton) acceptButton.focus();
            }, 0);
        }
        return state;
    }
    function accept() {
        var state = getCallState();
        if (state.status !== 'incoming') return false;
        clearRequestTimer();
        state.status = 'connecting';
        saveCallState(state);
        renderPanel();
        global.setTimeout(function () { connect(state.callId); }, 650);
        return state;
    }
    function connect(callId) {
        var state = getCallState();
        if (!isActive(state) || (callId && state.callId !== callId)) return false;
        clearRequestTimer();
        state.status = 'connected';
        state.answerAt = state.answerAt || nowIso();
        state.collapsed = true;
        saveCallState(state);
        renderPanel();
        CAR.toast('通话已接通');
        return state;
    }
    function updateParticipants(detail) {
        var state = getCallState();
        if (!isActive(state)) return false;
        detail = detail || {};
        if (detail.callId && detail.callId !== state.callId) return false;
        if (!Array.isArray(detail.participants) || !detail.participants.length) return false;
        state.participants = normalizeParticipants(detail.participants);
        state.participantCount = state.participants.length;
        saveCallState(state);
        renderPanel();
        return state;
    }
    function reject() {
        var state = getCallState();
        if (state.status !== 'incoming') return false;
        clearRequestTimer();
        showTerminal(state, 'rejected', 'rejected', 'LOCAL_REJECT');
        return true;
    }
    function cancel() {
        var state = getCallState();
        if (state.status !== 'requesting') return false;
        clearRequestTimer();
        showTerminal(state, 'cancelled', 'cancelled', 'LOCAL_CANCEL');
        return true;
    }
    function hangup(reason, silent) {
        var state = getCallState();
        if (!isActive(state)) return false;
        clearRequestTimer();
        var finalStatus = state.answerAt ? 'connected' : (state.direction === 'incoming' ? 'rejected' : 'cancelled');
        if (silent) {
            addHistory(state, finalStatus, reason || 'LOCAL_HANGUP');
            saveCallState({ status: 'idle' });
            renderPanel();
            renderHistory();
        } else {
            showTerminal(state, 'ended', finalStatus, reason || 'LOCAL_HANGUP');
        }
        return true;
    }
    function fail(reason) {
        var state = getCallState();
        if (!isActive(state)) return false;
        showTerminal(state, 'failed', 'failed', reason || 'NETWORK_FAILED');
        return true;
    }
    function setCollapsed(collapsed) {
        var state = getCallState();
        if (state.status !== 'connected') return;
        state.collapsed = Boolean(collapsed);
        saveCallState(state);
        renderPanel();
    }

    function recordStatus(record) {
        if (record.status === 'missed') return '未接听';
        if (record.status === 'rejected') return '已拒接';
        if (record.status === 'cancelled') return '已取消';
        if (record.status === 'failed') return '呼叫失败';
        return '已接通';
    }
    function mountHistory() {
        var topbar = document.querySelector('.car-topbar');
        var app = document.querySelector('.car-app');
        if (!topbar || !app) return;
        historyTrigger = document.createElement('button');
        historyTrigger.type = 'button';
        historyTrigger.className = 'car-call-history-trigger';
        historyTrigger.setAttribute('aria-label', '查看通话记录');
        historyTrigger.setAttribute('aria-expanded', 'false');
        historyTrigger.title = '通话记录';
        historyTrigger.innerHTML = phoneIcon() + '<span class="car-call-history-trigger__badge" hidden></span>';
        var logout = topbar.querySelector('#js-handover');
        topbar.insertBefore(historyTrigger, logout || null);
        historyPanel = document.createElement('aside');
        historyPanel.className = 'car-call-history';
        historyPanel.setAttribute('aria-hidden', 'true');
        historyPanel.setAttribute('aria-label', '通话记录');
        historyPanel.innerHTML =
            '<div class="car-call-history__head"><div class="car-call-history__titles"><div class="car-call-history__title">通话记录</div><div class="car-call-history__scope"></div></div>' +
            '<button type="button" class="car-call-history__close" aria-label="关闭通话记录" title="关闭">' + closeIcon() + '</button></div>' +
            '<div class="car-call-history__filters" role="tablist" aria-label="通话记录筛选"><button type="button" class="car-call-history__filter is-active" data-history-filter="all" role="tab" aria-selected="true">全部</button><button type="button" class="car-call-history__filter" data-history-filter="missed" role="tab" aria-selected="false">未接</button></div>' +
            '<div class="car-call-history__body"></div>';
        app.appendChild(historyPanel);
        historyTrigger.addEventListener('click', handleCallEntry);
        historyPanel.querySelector('.car-call-history__close').addEventListener('click', closeHistory);
        historyPanel.querySelectorAll('[data-history-filter]').forEach(function (button) {
            button.addEventListener('click', function () {
                historyFilter = button.dataset.historyFilter;
                historyPanel.querySelectorAll('[data-history-filter]').forEach(function (item) {
                    var selected = item === button;
                    item.classList.toggle('is-active', selected);
                    item.setAttribute('aria-selected', String(selected));
                });
                renderHistory();
            });
        });
        renderHistory();
    }
    function updateTrigger(state) {
        if (!historyTrigger) return;
        state = state || getCallState();
        var active = isActive(state);
        historyTrigger.classList.toggle('is-call-active', active);
        historyTrigger.setAttribute('aria-label', active ? '查看当前通话' : '查看通话记录');
        historyTrigger.title = active ? '当前通话' : '通话记录';
    }
    function handleCallEntry() {
        var state = getCallState();
        if (isActive(state)) {
            closeHistory();
            if (state.status === 'connected') setCollapsed(false);
            return;
        }
        toggleHistory();
    }
    function toggleHistory() {
        var app = document.querySelector('.car-app');
        if (app && app.classList.contains('is-driving')) {
            CAR.toast('行驶中暂不可查看通话记录');
            return;
        }
        if (historyPanel && historyPanel.classList.contains('is-open')) closeHistory(); else openHistory();
    }
    function openHistory() {
        if (!historyPanel) return;
        renderHistory();
        historyPanel.classList.add('is-open');
        historyPanel.setAttribute('aria-hidden', 'false');
        historyTrigger.classList.add('is-active');
        historyTrigger.setAttribute('aria-expanded', 'true');
        historyPanel.querySelector('.car-call-history__close').focus();
    }
    function closeHistory() {
        if (!historyPanel) return;
        historyPanel.classList.remove('is-open');
        historyPanel.setAttribute('aria-hidden', 'true');
        historyTrigger.classList.remove('is-active');
        historyTrigger.setAttribute('aria-expanded', 'false');
    }
    function renderHistory() {
        if (!historyPanel || !historyTrigger) return;
        var scope = currentScope();
        var records = scopedHistory();
        var missed = records.filter(function (record) { return record.status === 'missed'; }).length;
        var badge = historyTrigger.querySelector('.car-call-history-trigger__badge');
        badge.hidden = missed === 0;
        badge.textContent = missed > 99 ? '99+' : String(missed);
        updateTrigger();
        historyPanel.querySelector('.car-call-history__scope').textContent = scope.projectName + ' · ' + scope.vehicleNo + ' · ' + scope.driverName;
        if (historyFilter === 'missed') records = records.filter(function (record) { return record.status === 'missed'; });
        var body = historyPanel.querySelector('.car-call-history__body');
        if (!records.length) {
            body.innerHTML = '<div class="car-call-history__empty">' + (historyFilter === 'missed' ? '暂无未接通话' : '暂无通话记录') + '</div>';
            return;
        }
        body.innerHTML = records.map(function (record) {
            var incoming = record.direction === 'incoming';
            var missedClass = record.status === 'missed' ? ' is-missed' : '';
            var arrow = incoming ? '<path d="m15 2-5 5 5 5M10 7h8"/>' : '<path d="m9 2 5 5-5 5M14 7H6"/>';
            return '<article class="car-call-record' + missedClass + '">' +
                '<span class="car-call-record__icon">' + phoneIcon(arrow) + '</span>' +
                '<div class="car-call-record__main"><div class="car-call-record__summary"><span class="car-call-record__start">' + formatDateTime(record.requestAt) + '</span><span class="car-call-record__count">' + participantSummary(record) + '</span></div><div class="car-call-record__meta">' + (incoming ? '云端呼入' : '主动发起') + ' · ' + recordStatus(record) + ' · ' + (record.duration ? formatDuration(record.duration) : '--:--') + '</div></div>' +
            '</article>';
        }).join('');
    }

    function handleDemoQuery() {
        var params = new URLSearchParams(global.location.search);
        var mode = params.get('call') || params.get('callDemo');
        if (mode === 'requesting') global.CAR_CALL_DEMO.hardwareRequest({ callId: 'CALL-DEMO-REQUESTING' });
        else if (mode === 'incoming') global.CAR_CALL_DEMO.cloudIncoming({ callId: 'CALL-DEMO-INCOMING' });
        else if (mode === 'connected') {
            var state = global.CAR_CALL_DEMO.hardwareRequest({ callId: 'CALL-DEMO-CONNECTED', participants: [{ name: currentScope().driverName }, { name: '王莉' }, { name: '李工' }] });
            if (state) global.CAR_CALL_DEMO.connect();
        } else if (mode === 'history') global.setTimeout(global.CAR_CALL_DEMO.openHistory, 0);
    }
    function clearTaskDemoTimers() {
        taskDemoTimers.forEach(function (timer) { global.clearTimeout(timer); });
        taskDemoTimers = [];
    }
    function scheduleTaskDemo(delay, step, action) {
        taskDemoTimers.push(global.setTimeout(function () {
            action();
            global.dispatchEvent(new CustomEvent('car:call-demo-step', { detail: { step: step, state: getCallState() } }));
        }, delay));
    }
    function startTaskDemoTimeline(options) {
        options = options || {};
        var path = global.location.pathname.toLowerCase();
        var params = new URLSearchParams(global.location.search);
        if (!options.force && !/car-task-running\.html$/.test(path)) return false;
        if (['off', 'requesting', 'incoming', 'connected', 'history'].indexOf(params.get('callDemo')) !== -1 || taskDemoStarted || isActive()) return false;
        if (!CAR.getState().bound || !CAR.getRunningTask()) return false;
        taskDemoStarted = true;
        clearTaskDemoTimers();
        var started = Date.now();
        scheduleTaskDemo(3000, 'hardware-request', function () {
            global.CAR_CALL_DEMO.hardwareRequest({ callId: 'CALL-TASK-DEMO-OUT-' + started });
        });
        scheduleTaskDemo(7000, 'dispatch-connected', function () {
            if (getCallState().status === 'requesting') global.CAR_CALL_DEMO.connect();
        });
        scheduleTaskDemo(9500, 'participant-joined', function () {
            if (getCallState().status === 'connected') global.CAR_CALL_DEMO.updateParticipants([{ name: currentScope().driverName }, { name: '王莉' }, { name: '李工' }]);
        });
        scheduleTaskDemo(13000, 'dispatch-hangup', function () {
            if (getCallState().status === 'connected') global.CAR_CALL_DEMO.remoteHangup();
        });
        scheduleTaskDemo(17000, 'cloud-incoming', function () {
            if (!isActive()) global.CAR_CALL_DEMO.cloudIncoming({ callId: 'CALL-TASK-DEMO-IN-' + started });
        });
        return true;
    }
    function init() {
        if (!isEligiblePage()) return;
        seedHistory();
        mountPanel();
        mountHistory();
        renderPanel();
        handleDemoQuery();
        if (!new URLSearchParams(global.location.search).get('call')) startTaskDemoTimeline();
        global.addEventListener('car:hardware-call-request', function (event) { requestFromHardware(event.detail || {}); });
        global.addEventListener('car:cloud-call-request', function (event) { receiveFromCloud(event.detail || {}); });
        global.addEventListener('car:call-connected', function (event) { connect(event.detail && event.detail.callId); });
        global.addEventListener('car:call-members-updated', function (event) { updateParticipants(event.detail || {}); });
        global.addEventListener('car:call-ended', function (event) { hangup((event.detail && event.detail.reason) || 'REMOTE_HANGUP', true); });
        global.addEventListener('car:call-failed', function (event) { fail((event.detail && event.detail.reason) || 'NETWORK_FAILED'); });
        global.addEventListener('car:session-ending', function (event) { hangup((event.detail && event.detail.reason) || 'USER_LOGOUT', true); });
        global.addEventListener('storage', function (event) {
            if (event.key === CALL_STATE_KEY) renderPanel();
            if (event.key === CALL_HISTORY_KEY) renderHistory();
        });
        document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && historyPanel && historyPanel.classList.contains('is-open')) closeHistory(); });
        global.dispatchEvent(new CustomEvent('car:call-ready', { detail: { api: CAR.call } }));
    }

    CAR.call = {
        requestFromHardware: requestFromHardware,
        receiveFromCloud: receiveFromCloud,
        accept: accept,
        connect: connect,
        updateParticipants: updateParticipants,
        reject: reject,
        cancel: cancel,
        hangup: hangup,
        fail: fail,
        collapse: function () { setCollapsed(true); },
        expand: function () { setCollapsed(false); },
        isActive: function () { return isActive(); },
        getState: getCallState,
        getHistory: scopedHistory,
        openHistory: openHistory,
        closeHistory: closeHistory
    };

    /* 稳定的演示门面：可直接在控制台或自动化脚本中逐步触发。 */
    CAR.call.demo = {
        hardwareRequest: function (detail) { return requestFromHardware(Object.assign({ demo: true }, detail || {})); },
        cloudIncoming: function (detail) { return receiveFromCloud(Object.assign({ demo: true }, detail || {})); },
        accept: accept,
        connect: function () { return connect(getCallState().callId); },
        updateParticipants: updateParticipants,
        reject: reject,
        cancel: cancel,
        hangup: function () { return hangup('LOCAL_HANGUP'); },
        remoteHangup: function () { return hangup('REMOTE_HANGUP'); },
        fail: function () { return fail('NETWORK_FAILED'); },
        expand: function () { setCollapsed(false); return getCallState(); },
        collapse: function () { setCollapsed(true); return getCallState(); },
        openHistory: openHistory,
        reset: function () { clearPanel(); closeHistory(); return getCallState(); },
        snapshot: function () { return { call: getCallState(), history: scopedHistory() }; }
    };
    CAR.call.demo.startTaskTimeline = function () { return startTaskDemoTimeline({ force: true }); };
    CAR.call.demo.stopTaskTimeline = function () { clearTaskDemoTimers(); taskDemoStarted = false; return true; };
    global.CAR_CALL_DEMO = CAR.call.demo;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
