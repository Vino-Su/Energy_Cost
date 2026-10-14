/**
 * 工作台底部 Tab 自定义 - 小程序功能数据源
 * 定义用户权限范围内的各小程序及其具体功能清单。
 * - 功能粒度：小程序内的具体功能（funcKey 为最小配置单元）
 * - 前端功能注册表：roleIds 关联角色，未配置 roleIds 的公共功能持续可用
 * - 图标统一用内联 SVG path（stroke 或 fill 由调用方决定），存于 iconSvg 字段
 */
(function () {
    'use strict';

    // 图标库（path 数据，统一 24x24 viewBox，默认 stroke 风格；fill 风格单独标注）
    var ICONS = {
        // 用车管理
        map: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>',
        schedule: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h4M8 18h4"/>',
        dynamic: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
        fuel: { fill: true, d: '<path d="M19.77 7.23L19.78 7.22 16.06 3.5 15 4.56 17.11 6.67c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM12 10H6V5h6v5z"/>' },
        water: { fill: true, d: '<path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.15 0-6-2.38-6-6.2 0-2.34 1.78-5.23 6-8.92 4.22 3.69 6 6.58 6 8.92 0 3.82-2.85 6.2-6 6.2z"/>' },
        charge: { fill: true, d: '<path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>' },
        records: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
        repair: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
        maintenance: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
        statTrip: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/>',
        statTask: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
        // 通用 Tab 图标
        message: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
        workbench: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
        profile: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        moreDots: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
        grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
    };

    // 小程序图标背景色（用于宫格浅底配色，沿用 vehicle-management 配色）
    var APP_TINTS = {
        'vehicle': { bg: '#e6f4ff', color: '#1677ff' },
        'inspection': { bg: '#f6ffed', color: '#52c41a' },
        'attendance': { bg: '#f6ffed', color: '#52c41a' },
        'approval': { bg: '#fff7e6', color: '#fa8c16' },
        'system': { bg: '#f2f0ff', color: '#722ed1' }
    };

    // 小程序与其具体功能清单
    var APPS = [
        {
            appKey: 'vehicle',
            appName: '城市管家',
            groupKey: 'city-steward',
            tint: APP_TINTS.vehicle,
            functions: [
                { funcKey: 'vehicle-map', name: '地图页', icon: 'map', target: 'vehicle-management.html', roleIds: ['driver'], serviceVisible: false },
                { funcKey: 'vehicle-schedule', name: '常规任务', icon: 'schedule', target: 'schedule-tasks.html', roleIds: ['driver'], section: '任务管理', serviceVisible: true },
                { funcKey: 'vehicle-dynamic', name: '动态任务', icon: 'dynamic', target: 'dynamic-tasks.html', roleIds: ['driver'], section: '任务管理', serviceVisible: true },
                { funcKey: 'vehicle-fuel', name: '加油上报', icon: 'fuel', target: 'fuel-report-ocr.html?from=vehicle', roleIds: ['driver'], section: '车务管理', serviceVisible: true },
                { funcKey: 'vehicle-water', name: '加水上报', icon: 'water', target: 'water-report-ocr.html?from=vehicle', roleIds: ['driver'], section: '车务管理', serviceVisible: true },
                { funcKey: 'vehicle-charge', name: '充电上报', icon: 'charge', target: 'charge-report-ocr.html?from=vehicle', roleIds: ['driver'], section: '车务管理', serviceVisible: true },
                { funcKey: 'vehicle-records', name: '上报记录', icon: 'records', target: 'records.html?from=vehicle', roleIds: ['driver'], section: '车务管理', serviceVisible: true },
                { funcKey: 'vehicle-repair', name: '故障报修', icon: 'repair', target: 'repair-bottomsheet.html?source=vehicle-management', roleIds: ['driver'], section: '维保管理', serviceVisible: true },
                { funcKey: 'vehicle-maintenance', name: '维修记录', icon: 'maintenance', target: 'placeholder.html?from=repair-records&title=维修记录&returnUrl=vehicle-management.html%3Ftab%3Dservice', roleIds: ['driver'], section: '维保管理', serviceVisible: true },
                { funcKey: 'vehicle-stat-trip', name: '出车统计', icon: 'statTrip', iconClass: 'stat-trip', target: 'placeholder.html?from=stats-trip&title=出车统计&returnUrl=vehicle-management.html%3Ftab%3Dservice', roleIds: ['driver'], section: '数据统计', serviceVisible: true },
                { funcKey: 'vehicle-stat-task', name: '任务统计', icon: 'statTask', iconClass: 'stat-task', target: 'placeholder.html?from=stats-task&title=任务统计&returnUrl=vehicle-management.html%3Ftab%3Dservice', roleIds: ['driver'], section: '数据统计', serviceVisible: true }
            ]
        },
        {
            appKey: 'inspection',
            appName: '城市管家',
            groupKey: 'city-steward',
            tint: APP_TINTS.inspection,
            functions: [
                { funcKey: 'inspection-manage', name: '巡查服务', icon: 'grid', target: 'inspection-management.html?tab=service', roleIds: ['inspector'], serviceVisible: false },
                { funcKey: 'inspection-map', name: '巡查地图', icon: 'map', target: 'inspection-management.html?tab=map', roleIds: ['inspector'], serviceVisible: false },
                { funcKey: 'inspection-task', name: '巡查任务', icon: 'schedule', iconClass: 'inspection', target: 'inspection-task-management.html', roleIds: ['inspector'], section: '品质管理', serviceVisible: true },
                { funcKey: 'inspection-report', name: '事件上报', icon: 'repair', target: 'inspection-problem-report.html', roleIds: ['inspector'], serviceVisible: false },
                { funcKey: 'inspection-list', name: '品质事件', icon: 'records', iconClass: 'problem', target: 'inspection-problem-management.html', roleIds: ['inspector'], section: '品质管理', serviceVisible: true },
                { funcKey: 'inspection-fuel', name: '加油上报', icon: 'fuel', target: 'fuel-report-ocr.html?from=inspection', roleIds: ['inspector'], section: '车务管理', serviceVisible: true },
                { funcKey: 'inspection-water', name: '加水上报', icon: 'water', target: 'water-report-ocr.html?from=inspection', roleIds: ['inspector'], section: '车务管理', serviceVisible: true },
                { funcKey: 'inspection-charge', name: '充电上报', icon: 'charge', target: 'charge-report-ocr.html?from=inspection', roleIds: ['inspector'], section: '车务管理', serviceVisible: true },
                { funcKey: 'inspection-records', name: '上报记录', icon: 'records', target: 'records.html?from=inspection', roleIds: ['inspector'], section: '车务管理', serviceVisible: true },
                { funcKey: 'inspection-repair', name: '故障报修', icon: 'repair', target: 'placeholder.html?from=inspection-repair&title=故障报修&returnUrl=inspection-management.html%3Ftab%3Dservice', roleIds: ['inspector'], section: '维保管理', serviceVisible: true },
                { funcKey: 'inspection-stat', name: '巡查统计', icon: 'statTrip', iconClass: 'stat', target: 'placeholder.html?from=inspection-stat&title=巡查统计&returnUrl=inspection-management.html%3Ftab%3Dservice', roleIds: ['inspector'], section: '数据统计', serviceVisible: true }
            ]
        },
        {
            appKey: 'attendance',
            appName: '酷哇考勤',
            tint: APP_TINTS.attendance,
            functions: [
                { funcKey: 'attendance-clock', name: '考勤打卡', icon: 'schedule', target: 'placeholder.html?from=attendance&title=酷哇考勤', serviceVisible: false }
            ]
        },
        {
            appKey: 'approval',
            appName: '酷哇审批',
            tint: APP_TINTS.approval,
            functions: [
                { funcKey: 'approval-list', name: '审批列表', icon: 'records', target: 'placeholder.html?from=approval&title=酷哇审批', serviceVisible: false }
            ]
        }
    ];

    // 系统内置 Tab（非小程序功能，固定项）：消息、工作台、我的
    var SYSTEM_TABS = [
        { funcKey: 'sys-message', name: '消息', icon: 'message', target: 'placeholder.html?from=messages&title=消息', system: true, tint: APP_TINTS.system },
        { funcKey: 'sys-workbench', name: '工作台', icon: 'workbench', target: 'home.html', system: true, tint: APP_TINTS.system },
        { funcKey: 'sys-profile', name: '我的', icon: 'profile', target: 'profile.html', system: true, tint: APP_TINTS.system }
    ];

    // 生成 SVG 字符串
    function svg(iconKey, strokeW) {
        var ic = ICONS[iconKey] || ICONS.grid;
        var sw = strokeW || 2;
        if (ic && ic.fill) {
            return '<svg viewBox="0 0 24 24" fill="currentColor">' + ic.d + '</svg>';
        }
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '">' + ic + '</svg>';
    }

    // 取全部可配置功能（系统Tab + 各小程序功能），扁平化，带 appKey/appName/tint
    function getRegisteredFunctions() {
        var list = [];
        SYSTEM_TABS.forEach(function (t) {
            list.push({
                funcKey: t.funcKey, name: t.name, icon: t.icon, target: t.target,
                appKey: 'system', appName: '系统', tint: t.tint, system: true, serviceVisible: false
            });
        });
        APPS.forEach(function (app) {
            app.functions.forEach(function (f) {
                list.push({
                    funcKey: f.funcKey, name: f.name, icon: f.icon, target: f.target,
                    appKey: app.appKey, appName: app.appName, groupKey: app.groupKey || app.appKey,
                    tint: app.tint, system: false, roleIds: f.roleIds ? f.roleIds.slice() : [],
                    section: f.section || '常用服务', serviceVisible: f.serviceVisible !== false,
                    iconClass: f.iconClass || f.icon
                });
            });
        });
        return list;
    }

    function currentRoleId() {
        return window.CityStewardRole ? CityStewardRole.getCurrentRole().id : 'driver';
    }
    function isAvailable(f, roleId) {
        return !!f && (!f.roleIds || !f.roleIds.length || f.roleIds.indexOf(roleId || currentRoleId()) >= 0);
    }
    function roleTarget(f, roleId) {
        if (!f.roleIds || !f.roleIds.length) return f.target;
        var pieces = f.target.split('#');
        var route = pieces[0].split('?');
        var params = new URLSearchParams(route[1] || '');
        params.set('role', roleId || currentRoleId());
        // 共用服务页返回当前角色的工作空间，新增角色无需复制返回规则。
        if (f.serviceVisible !== false && window.CityStewardRole) {
            params.set('returnUrl', CityStewardRole.getWorkspaceUrl(roleId || currentRoleId(), 'service'));
        }
        // 共用服务页返回当前角色的工作空间，新增角色无需复制返回规则。
        if (f.serviceVisible !== false && window.CityStewardRole) {
            params.set('returnUrl', CityStewardRole.getWorkspaceUrl(roleId || currentRoleId(), 'service'));
        }
        return route[0] + '?' + params.toString() + (pieces[1] ? '#' + pieces[1] : '');
    }
    function getAllFunctions(roleId) {
        return getRegisteredFunctions().filter(function (f) { return isAvailable(f, roleId); }).map(function (f) {
            f.target = roleTarget(f, roleId);
            return f;
        });
    }

    // 按 appKey 分组（系统项单独一组，小程序各自一组），返回 [{appKey,appName,tint,functions:[]}]
    function getGroupedFunctions(roleId) {
        var groups = [];
        // 系统组
        groups.push({
            appKey: 'system', appName: '常用', tint: APP_TINTS.system,
            functions: SYSTEM_TABS.map(function (t) {
                return { funcKey: t.funcKey, name: t.name, icon: t.icon, target: t.target, system: true };
            })
        });
        APPS.forEach(function (app) {
            var functions = app.functions.filter(function (f) { return isAvailable(f, roleId); });
            if (!functions.length) return;
            var key = app.groupKey || app.appKey;
            var group = groups.find(function (g) { return g.appKey === key; });
            if (!group) {
                group = { appKey: key, appName: app.appName, tint: app.tint, functions: [] };
                groups.push(group);
            }
            functions.forEach(function (f) {
                group.functions.push({ funcKey: f.funcKey, name: f.name, icon: f.icon, target: roleTarget(f, roleId),
                    system: false, roleIds: f.roleIds ? f.roleIds.slice() : [] });
            });
        });
        return groups;
    }

    // 按 funcKey 查单个功能
    function getFunction(funcKey, roleId) {
        return getAllFunctions(roleId).find(function (f) { return f.funcKey === funcKey; }) || null;
    }
    function getRegisteredFunction(funcKey) {
        return getRegisteredFunctions().find(function (f) { return f.funcKey === funcKey; }) || null;
    }

    // 新增功能只注册一次，可用 roleIds 同时关联一个或多个角色。
    function registerFunction(appKey, entry) {
        var app = APPS.find(function (item) { return item.appKey === appKey; });
        if (!app || !entry || !entry.funcKey || !entry.name || !entry.target) return false;
        var existing = getRegisteredFunction(entry.funcKey);
        if (existing && existing.appKey !== appKey) return false;
        var index = app.functions.findIndex(function (f) { return f.funcKey === entry.funcKey; });
        if (index < 0) app.functions.push(entry); else app.functions[index] = entry;
        window.dispatchEvent(new CustomEvent('city-steward-functions-change', { detail: { funcKey: entry.funcKey } }));
        return true;
    }

    // 初始默认业务 Tab 配置：消息、工作台、我的（顺序即首页位→末位）
    function getDefaultTabs() {
        return ['sys-message', 'sys-workbench', 'sys-profile'];
    }

    window.TabAppsData = {
        ICONS: ICONS,
        APPS: APPS,
        SYSTEM_TABS: SYSTEM_TABS,
        svg: svg,
        getAllFunctions: getAllFunctions,
        getGroupedFunctions: getGroupedFunctions,
        getFunction: getFunction,
        getRegisteredFunctions: getRegisteredFunctions,
        getRegisteredFunction: getRegisteredFunction,
        isAvailable: isAvailable,
        registerFunction: registerFunction,
        getDefaultTabs: getDefaultTabs
    };
})();
