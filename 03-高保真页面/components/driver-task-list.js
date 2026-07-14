(function (global) {
    'use strict';

    var STATUS_ORDER = ['pending', 'executing', 'completed'];
    var STATUS_TEXT = { pending: '待开始', executing: '执行中', completed: '已完成' };
    var TYPE_TEXT = { schedule: '常规任务', emergency: '应急任务', dynamic: '动态任务' };
    var FILTERS = [
        { type: 'today', label: '今天', days: 0 },
        { type: 'week', label: '近 7 天', days: 6 },
        { type: 'month', label: '近 30 天', days: 29 },
        { type: 'all', label: '全部时间', days: null },
        { type: 'custom', label: '自定义时间段', days: null }
    ];

    function init(options) {
        var config = options || {};
        var listType = config.listType;
        var allTasks = Object.keys(global.TASK_DETAIL_DATA || {}).map(function (key) {
            return global.TASK_DETAIL_DATA[key];
        });
        var tasks = allTasks.filter(function (task) { return task.listType === listType; });
        var currentStatus = 'pending';
        var referenceDate = parseDate(config.referenceDate || formatDate(new Date()));
        var currentFilter = rangeFor('today');

        document.body.setAttribute('data-list-type', listType);
        document.getElementById('pageTitle').textContent = config.title;

        function rangeFor(type) {
            var selected = FILTERS.filter(function (item) { return item.type === type; })[0] || FILTERS[0];
            if (selected.days === null) return { type: type, label: selected.label, from: null, to: null };
            var from = new Date(referenceDate);
            from.setDate(from.getDate() - selected.days);
            return { type: type, label: selected.label, from: formatDate(from), to: formatDate(referenceDate) };
        }

        function taskDate(task) {
            return task.date || String(task.dispatchedAt || '').slice(0, 10);
        }

        function isInRange(task) {
            if (!currentFilter.from || !currentFilter.to) return true;
            var value = taskDate(task);
            return value >= currentFilter.from && value <= currentFilter.to;
        }

        function filteredTasks(status) {
            return tasks.filter(function (task) {
                return task.status === status && isInRange(task);
            }).sort(function (a, b) {
                var aTime = taskDate(a) + ' ' + (a.time || a.dispatchedAt || '');
                var bTime = taskDate(b) + ' ' + (b.time || b.dispatchedAt || '');
                if (status === 'completed') return bTime.localeCompare(aTime);
                return aTime.localeCompare(bTime);
            });
        }

        function render() {
            STATUS_ORDER.forEach(function (status) {
                document.getElementById('badge-' + status).textContent = filteredTasks(status).length;
            });
            document.getElementById('filterLabel').textContent = currentFilter.label;
            var visible = filteredTasks(currentStatus);
            document.getElementById('taskCount').textContent = visible.length + ' 项';
            document.getElementById('taskList').innerHTML = visible.length
                ? visible.map(renderCard).join('')
                : renderEmpty(currentStatus);
        }

        function renderCard(task) {
            var plate = task.plateNo || task.vehicle || '';
            var plateClass = plate ? '' : ' unassigned';
            var plateText = plate || '未分配车辆';
            var title = task.name || '未命名任务';
            var contextClass = TYPE_TEXT[task.listType] ? ' ' + task.listType : '';
            var typeText = TYPE_TEXT[task.listType] || '任务';
            var href = 'task-detail.html?id=' + encodeURIComponent(task.id) +
                '&status=' + encodeURIComponent(task.status) +
                '&source=' + encodeURIComponent(task.listType);
            var tags = '<span class="plate-tag' + plateClass + '">' + escapeHtml(plateText) + '</span>' +
                '<span class="type-tag ' + task.listType + '">' + typeText + '</span>';
            if (task.listType === 'dynamic' && task.severity) {
                tags += '<span class="severity-tag">' + escapeHtml(task.severity) + '</span>';
            }

            return '<button type="button" class="task-card' + contextClass + '" data-detail-href="' + href + '" aria-label="查看' + escapeHtml(title) + '详情">' +
                '<span class="task-card-head"><span class="task-card-title-wrap">' +
                    '<span class="task-card-title">' + escapeHtml(title) + '</span>' +
                    '<span class="task-card-identifiers">' + tags + '</span>' +
                '</span><span class="status-tag ' + task.status + '">' + STATUS_TEXT[task.status] + '</span></span>' +
                renderMeta(task) + renderSummary(task) +
            '</button>';
        }

        function renderMeta(task) {
            if (task.listType === 'dynamic') {
                return '<span class="task-meta">' +
                    '<span class="task-meta-item">' + escapeHtml(task.dispatchedAt || '派发时间待确认') + '</span>' +
                    '<span class="task-meta-sep"></span>' +
                    '<span class="task-meta-item grow">' + escapeHtml(task.location || '问题地点待确认') + '</span>' +
                '</span>';
            }
            return '<span class="task-meta">' +
                '<span class="task-meta-item">' + escapeHtml(task.date || '日期待确认') + '</span>' +
                '<span class="task-meta-sep"></span>' +
                '<span class="task-meta-item">' + escapeHtml(task.time || '时间待确认') + '</span>' +
                '<span class="task-meta-sep"></span>' +
                '<span class="task-meta-item grow">' + escapeHtml(task.routeName || '路线待确认') + '</span>' +
            '</span>';
        }

        function renderSummary(task) {
            if (task.listType === 'dynamic') {
                var issueText = (task.issueTypes || []).join(' / ') || '问题类型待确认';
                return '<span class="task-summary">问题类型：' + escapeHtml(issueText) + '</span>';
            }
            return '<span class="task-summary">' + escapeHtml(task.requirement || '暂无补充作业要求') + '</span>';
        }

        function renderEmpty(status) {
            return '<div class="empty-state"><div class="empty-icon">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 3h6l1 2h3v16H5V5h3l1-2z"/><path d="M9 10h6M9 14h6"/></svg>' +
                '</div><div class="empty-title">暂无' + STATUS_TEXT[status] + '任务</div>' +
                '<div class="empty-desc">当前范围为“' + escapeHtml(currentFilter.label) + '”，可切换时间范围查看其他任务。</div></div>';
        }

        function renderSheet() {
            document.getElementById('sheetItems').innerHTML = FILTERS.map(function (filter) {
                var active = currentFilter.type === filter.type ? ' active' : '';
                return '<button type="button" class="sheet-item' + active + '" data-filter="' + filter.type + '">' +
                    '<span>' + filter.label + '</span><span class="sheet-check">✓</span></button>';
            }).join('');
        }

        document.getElementById('tabBar').addEventListener('click', function (event) {
            var tab = event.target.closest('[data-status]');
            if (!tab) return;
            currentStatus = tab.getAttribute('data-status');
            document.querySelectorAll('[data-status]').forEach(function (item) {
                item.classList.toggle('active', item === tab);
                item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
            });
            render();
        });

        document.getElementById('taskList').addEventListener('click', function (event) {
            var card = event.target.closest('[data-detail-href]');
            if (card) window.location.href = card.getAttribute('data-detail-href');
        });

        document.getElementById('filterChip').addEventListener('click', function () {
            renderSheet();
            document.getElementById('filterSheet').classList.add('show');
        });
        document.getElementById('sheetClose').addEventListener('click', closeSheet);
        document.getElementById('filterSheet').addEventListener('click', function (event) {
            if (event.target === this) closeSheet();
        });
        document.getElementById('sheetItems').addEventListener('click', function (event) {
            var item = event.target.closest('[data-filter]');
            if (!item) return;
            var type = item.getAttribute('data-filter');
            if (type === 'custom') {
                document.getElementById('customPanel').classList.add('show');
                return;
            }
            currentFilter = rangeFor(type);
            closeSheet();
            render();
        });
        document.getElementById('customCancel').addEventListener('click', function () {
            document.getElementById('customPanel').classList.remove('show');
            document.getElementById('customError').textContent = '';
        });
        document.getElementById('customConfirm').addEventListener('click', function () {
            var from = document.getElementById('customStart').value;
            var to = document.getElementById('customEnd').value;
            if (!from || !to) {
                document.getElementById('customError').textContent = '请选择完整的起止日期';
                return;
            }
            if (from > to) {
                document.getElementById('customError').textContent = '起始日期不能晚于结束日期';
                return;
            }
            currentFilter = { type: 'custom', label: from + ' 至 ' + to, from: from, to: to };
            closeSheet();
            render();
        });

        function closeSheet() {
            document.getElementById('filterSheet').classList.remove('show');
            document.getElementById('customPanel').classList.remove('show');
            document.getElementById('customError').textContent = '';
        }

        render();
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    }

    function parseDate(value) {
        var parts = value.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function formatDate(date) {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    global.DriverTaskList = { init: init };
}(window));
