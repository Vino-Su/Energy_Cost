(function (global) {
    'use strict';

    var TAB_ORDER = ['pending', 'executing', 'ended'];
    var STATUS_TEXT = {
        pending: '待开始', executing: '进行中', completed: '已完成',
        delegated: '已转派', terminated: '已终止', invalid: '已失效'
    };
    var END_STATUSES = ['completed', 'delegated', 'terminated', 'invalid'];
    var RESULT_OPTIONS = [
        { value: 'all', label: '全部结果' },
        { value: 'completed', label: '已完成' },
        { value: 'delegated', label: '已转派' },
        { value: 'terminated', label: '已终止' },
        { value: 'invalid', label: '已失效' }
    ];
    var TYPE_TEXT = { schedule: '常规任务', dynamic: '动态任务' };
    // 常规任务类型筛选枚举（仅常规任务列表使用）
    var TASK_TYPE_OPTIONS = [
        { value: 'all', label: '全部类型' },
        { value: 'regular', label: '常态任务' },
        { value: 'temporary', label: '临时任务' }
    ];
    // 时间搜索选项：今天、明天、近七天、全部、自定义时间段
    var FILTERS = [
        { type: 'today', label: '今天', days: 0 },
        { type: 'tomorrow', label: '明天', days: -1 },
        { type: 'week', label: '近七天', days: 6 },
        { type: 'all', label: '全部', days: null },
        { type: 'custom', label: '自定义时间段', days: null }
    ];

    function init(options) {
        var config = options || {};
        var listType = config.listType;
        var allTasks = Object.keys(global.TASK_DETAIL_DATA || {}).map(function (key) {
            return global.TASK_DETAIL_DATA[key];
        });
        var tasks = allTasks.filter(function (task) { return task.listType === listType; });
        var currentTab = 'pending';
        var referenceDate = parseDate(config.referenceDate || formatDate(new Date()));
        // 默认时间范围：今天
        var currentFilter = rangeFor('today');
        // 车牌筛选：null = 全部车牌（默认值）
        var currentPlate = null;
        // 常规任务类型筛选：all/regular/temporary（默认全部；仅常规任务列表生效）
        var currentTaskType = 'all';
        // “已结束”内的细分结果，切换其他阶段时保留选择但不参与过滤。
        var currentResult = 'all';

        document.body.setAttribute('data-list-type', listType);
        document.getElementById('pageTitle').textContent = config.title;

        function rangeFor(type) {
            var selected = FILTERS.filter(function (item) { return item.type === type; })[0] || FILTERS[0];
            if (selected.days === null) return { type: type, label: selected.label, from: null, to: null };
            var from = new Date(referenceDate);
            var to = new Date(referenceDate);
            if (type === 'tomorrow') {
                // 明天：起止都是 referenceDate + 1
                from.setDate(from.getDate() + 1);
                to.setDate(to.getDate() + 1);
            } else {
                from.setDate(from.getDate() - selected.days);
            }
            return { type: type, label: selected.label, from: formatDate(from), to: formatDate(to) };
        }

        function taskDate(task) {
            return task.date || String(task.dispatchedAt || '').slice(0, 10);
        }

        function isInRange(task) {
            if (!currentFilter.from || !currentFilter.to) return true;
            var value = taskDate(task);
            return value >= currentFilter.from && value <= currentFilter.to;
        }

        // 判断任务是否为临时任务（兼容 type/taskType/tone 三种数据形态）
        function isTemporaryTask(task) {
            return task.tone === 'temporary' || task.type === '临时任务' || task.taskType === '临时任务';
        }

        function isInTaskType(task) {
            if (currentTaskType === 'all') return true;
            return currentTaskType === 'temporary' ? isTemporaryTask(task) : !isTemporaryTask(task);
        }

        function isInTab(task, tab) {
            return tab === 'ended' ? END_STATUSES.indexOf(task.status) !== -1 : task.status === tab;
        }

        function filteredTasks(tab, applyResultFilter) {
            return tasks.filter(function (task) {
                if (!isInTab(task, tab)) return false;
                if (tab === 'ended' && applyResultFilter !== false && currentResult !== 'all' && task.status !== currentResult) return false;
                if (!isInRange(task)) return false;
                if (currentPlate && (task.plateNo || '') !== currentPlate) return false;
                if (listType === 'schedule' && !isInTaskType(task)) return false;
                return true;
            }).sort(function (a, b) {
                var aTime = taskDate(a) + ' ' + (a.time || a.dispatchedAt || '');
                var bTime = taskDate(b) + ' ' + (b.time || b.dispatchedAt || '');
                if (tab === 'ended') return bTime.localeCompare(aTime);
                return aTime.localeCompare(bTime);
            });
        }

        function render() {
            TAB_ORDER.forEach(function (tab) {
                var badge = document.getElementById('badge-' + tab);
                if (badge) badge.textContent = filteredTasks(tab, false).length;
            });
            document.getElementById('filterLabel').textContent = currentFilter.label;
            var resultChip = document.getElementById('resultChip');
            resultChip.hidden = currentTab !== 'ended';
            document.getElementById('resultLabel').textContent = resultOption(currentResult).label;
            var typeLabelEl = document.getElementById('typeLabel');
            if (typeLabelEl) {
                var typeOpt = TASK_TYPE_OPTIONS.filter(function (item) { return item.value === currentTaskType; })[0] || TASK_TYPE_OPTIONS[0];
                typeLabelEl.textContent = typeOpt.label;
            }
            var visible = filteredTasks(currentTab);
            var taskCountEl = document.getElementById('taskCount');
            if (taskCountEl) taskCountEl.textContent = visible.length + ' 项';
            document.getElementById('taskList').innerHTML = visible.length
                ? visible.map(renderCard).join('')
                : renderEmpty(currentTab);
        }

        function renderCard(task) {
            var plate = task.plateNo || task.vehicle || '';
            var plateClass = plate ? '' : ' unassigned';
            var plateText = plate || '未分配车辆';
            var isDynamic = task.listType === 'dynamic';
            var title = isDynamic
                ? (task.location || '问题地点待确认')
                : (task.routeName || '路线待确认');
            var contextClass = TYPE_TEXT[task.listType] ? ' ' + task.listType : '';
            var href = 'task-detail.html?id=' + encodeURIComponent(task.id) +
                '&status=' + encodeURIComponent(task.status) +
                '&source=' + encodeURIComponent(task.listType);

            // 第一行：路线名称/问题地点 + 任务状态
            var firstLine = '<span class="task-card-head">' +
                '<span class="task-card-title-wrap"><span class="task-card-title">' + escapeHtml(title) + '</span></span>' +
                '<span class="status-tag ' + task.status + '">' + (STATUS_TEXT[task.status] || '状态未知') + '</span>' +
            '</span>';

            // 第二行：常态/临时任务展示车牌、任务类型、作业类型；动态任务展示车牌、问题类型、重要程度。
            var tagList = ['<span class="plate-tag' + plateClass + '">' + escapeHtml(plateText) + '</span>'];
            if (isDynamic) {
                tagList.push('<span class="work-type">' + escapeHtml(task.issueType || '问题类型待确认') + '</span>');
                tagList.push('<span class="severity-tag">' + escapeHtml(task.severity || '一般') + '</span>');
            } else {
                var typeText = task.type || task.taskType || '常态任务';
                var typeClass = (task.tone === 'temporary' || task.taskType === '临时任务') ? 'temporary' : 'schedule';
                tagList.push('<span class="type-tag ' + typeClass + '">' + escapeHtml(typeText) + '</span>');
                tagList.push('<span class="work-type">' + escapeHtml(task.workType || '作业类型待确认') + '</span>');
            }
            var secondLine = '<span class="task-card-tags">' + tagList.join('') + '</span>';

            return '<button type="button" class="task-card' + contextClass + '" data-detail-href="' + href + '" aria-label="查看' + escapeHtml(title) + '详情">' +
                firstLine + secondLine + renderMeta(task) +
            '</button>';
        }

        function renderMeta(task) {
            if (task.listType === 'dynamic') {
                return '<span class="task-meta"><span class="task-meta-item">任务派发时间：' +
                    escapeHtml(task.dispatchedAt || '待确认') + '</span></span>';
            }
            return '<span class="task-meta">' +
                '<span class="task-meta-item">计划日期：' + escapeHtml(task.date || '待确认') + '</span>' +
                '<span class="task-meta-sep"></span>' +
                '<span class="task-meta-item">' + escapeHtml(task.time || '时间待确认') + '</span>' +
            '</span>';
        }

        function tabText(tab) {
            return tab === 'ended' ? '已结束' : STATUS_TEXT[tab];
        }

        function resultOption(value) {
            return RESULT_OPTIONS.filter(function (item) { return item.value === value; })[0] || RESULT_OPTIONS[0];
        }

        function renderEmpty(tab) {
            var emptyLabel = tab === 'ended' && currentResult !== 'all'
                ? resultOption(currentResult).label
                : tabText(tab);
            return '<div class="empty-state"><div class="empty-icon">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 3h6l1 2h3v16H5V5h3l1-2z"/><path d="M9 10h6M9 14h6"/></svg>' +
                '</div><div class="empty-title">暂无' + emptyLabel + '任务</div>' +
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
            var tab = event.target.closest('[data-tab]');
            if (!tab) return;
            currentTab = tab.getAttribute('data-tab');
            document.querySelectorAll('[data-tab]').forEach(function (item) {
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

        // ====== 车牌筛选：取当前 listType 下所有任务的唯一 plateNo ======
        function availablePlates() {
            var seen = {};
            var list = [];
            tasks.forEach(function (task) {
                var plate = task.plateNo || task.vehicle || '';
                if (plate && !seen[plate]) {
                    seen[plate] = true;
                    list.push(plate);
                }
            });
            return list;
        }
        function renderPlateSheet() {
            var plates = availablePlates();
            var html = '<button type="button" class="sheet-item' + (currentPlate == null ? ' active' : '') +
                '" data-plate=""><span>全部车牌</span><span class="sheet-check">✓</span></button>';
            plates.forEach(function (plate) {
                var active = currentPlate === plate ? ' active' : '';
                html += '<button type="button" class="sheet-item' + active +
                    '" data-plate="' + escapeHtml(plate) + '"><span>' + escapeHtml(plate) + '</span><span class="sheet-check">✓</span></button>';
            });
            document.getElementById('plateSheetItems').innerHTML = html;
        }
        function openPlateSheet() {
            renderPlateSheet();
            document.getElementById('plateSheet').classList.add('show');
        }
        function closePlateSheet() {
            document.getElementById('plateSheet').classList.remove('show');
        }
        document.getElementById('plateChip').addEventListener('click', openPlateSheet);
        document.getElementById('plateSheetClose').addEventListener('click', closePlateSheet);
        document.getElementById('plateSheet').addEventListener('click', function (event) {
            if (event.target === this) closePlateSheet();
        });
        document.getElementById('plateSheetItems').addEventListener('click', function (event) {
            var item = event.target.closest('[data-plate]');
            if (!item) return;
            var value = item.getAttribute('data-plate');
            currentPlate = value || null;
            document.getElementById('plateLabel').textContent = currentPlate || '全部车牌';
            closePlateSheet();
            render();
        });

        function renderResultSheet() {
            document.getElementById('resultSheetItems').innerHTML = RESULT_OPTIONS.map(function (option) {
                var active = currentResult === option.value ? ' active' : '';
                return '<button type="button" class="sheet-item' + active + '" data-result="' + option.value + '">' +
                    '<span>' + option.label + '</span><span class="sheet-check">✓</span></button>';
            }).join('');
        }
        function closeResultSheet() {
            document.getElementById('resultSheet').classList.remove('show');
        }
        document.getElementById('resultChip').addEventListener('click', function () {
            renderResultSheet();
            document.getElementById('resultSheet').classList.add('show');
        });
        document.getElementById('resultSheetClose').addEventListener('click', closeResultSheet);
        document.getElementById('resultSheet').addEventListener('click', function (event) {
            if (event.target === this) closeResultSheet();
        });
        document.getElementById('resultSheetItems').addEventListener('click', function (event) {
            var item = event.target.closest('[data-result]');
            if (!item) return;
            currentResult = item.getAttribute('data-result');
            closeResultSheet();
            render();
        });

        function closeSheet() {
            document.getElementById('filterSheet').classList.remove('show');
            document.getElementById('customPanel').classList.remove('show');
            document.getElementById('customError').textContent = '';
        }

        // 任务类型筛选（仅常规任务列表，元素存在时才绑定）
        var typeChip = document.getElementById('typeChip');
        if (typeChip) {
            function renderTypeSheet() {
                document.getElementById('typeSheetItems').innerHTML = TASK_TYPE_OPTIONS.map(function (option) {
                    var active = currentTaskType === option.value ? ' active' : '';
                    return '<button type="button" class="sheet-item' + active + '" data-task-type="' + option.value + '">' +
                        '<span>' + option.label + '</span><span class="sheet-check">✓</span></button>';
                }).join('');
            }
            function openTypeSheet() {
                renderTypeSheet();
                document.getElementById('typeSheet').classList.add('show');
            }
            function closeTypeSheet() {
                document.getElementById('typeSheet').classList.remove('show');
            }
            typeChip.addEventListener('click', openTypeSheet);
            document.getElementById('typeSheetClose').addEventListener('click', closeTypeSheet);
            document.getElementById('typeSheet').addEventListener('click', function (event) {
                if (event.target === this) closeTypeSheet();
            });
            document.getElementById('typeSheetItems').addEventListener('click', function (event) {
                var item = event.target.closest('[data-task-type]');
                if (!item) return;
                currentTaskType = item.getAttribute('data-task-type');
                closeTypeSheet();
                render();
            });
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
