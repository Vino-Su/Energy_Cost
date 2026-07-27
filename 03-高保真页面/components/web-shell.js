(function () {
    'use strict';

    const PROJECT_STORAGE_KEY = 'coolwa.web.currentProject';
    const SIDEBAR_STORAGE_KEY = 'coolwa.web.sidebarCollapsed';
    const DEFAULT_PROJECT = '深圳南山智慧环卫项目';
    const projects = [
        { name: '深圳南山智慧环卫项目', label: '广东省 / 深圳市 / 南山智慧环卫项目' },
        { name: '广州天河环卫项目', label: '广东省 / 广州市 / 天河环卫项目' },
        { name: '北京朝阳清洁项目', label: '北京市 / 朝阳区 / 清洁项目' },
        { name: '上海浦东环卫项目', label: '上海市 / 浦东新区 / 环卫项目' }
    ];

    const icons = {
        info: '<svg class="web-topnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>',
        realtime: '<svg class="web-topnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a8 8 0 0116 0"/><path d="M12 14l4-4"/><path d="M6 18h12"/></svg>',
        plan: '<svg class="web-topnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
        analysis: '<svg class="web-topnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.56V21h-4v-.08A1.7 1.7 0 009 19.37a1.7 1.7 0 00-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 004.63 15 1.7 1.7 0 003.08 14H3v-4h.08A1.7 1.7 0 004.63 9a1.7 1.7 0 00-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 009 4.63 1.7 1.7 0 0010 3.08V3h4v.08A1.7 1.7 0 0015 4.63a1.7 1.7 0 001.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0019.37 9 1.7 1.7 0 0020.92 10H21v4h-.08A1.7 1.7 0 0019.4 15z"/></svg>',
        city: '<svg class="web-topnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
        energy: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
        fuel: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V5a2 2 0 012-2h7a2 2 0 012 2v16"/><path d="M3 21h13M7 7h5M15 8h2l2 2v7a2 2 0 002 2"/></svg>',
        fuelAnalysis: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a2 2 0 012-2h7a2 2 0 012 2v14"/><path d="M3 19h14"/><path d="M7 9h5"/><path d="M18 8v8M21 12h-6"/></svg>',
        water: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 6.2 6 11a6 6 0 11-12 0c0-4.8 6-11 6-11z"/></svg>',
        charge: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L6 13h6l-1 9 7-12h-6z"/></svg>',
        chargeAnalysis: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L6 13h6l-1 9 7-12h-6z"/><path d="M18 14v6M21 17h-6"/></svg>',
        vehicleUse: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15L19 4M18 5l3 3M15 8l3 3"/></svg>',
        vehicleUseGroup: '<svg class="web-side-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>'
    };

    function readStoredProject() {
        const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
        return projects.some((project) => project.name === stored) ? stored : DEFAULT_PROJECT;
    }

    function projectLabel(name) {
        return projects.find((project) => project.name === name)?.label || name;
    }

    function shellTemplate(activeSide, projectLocked) {
        const sideGroups = [
            {
                title: '能耗成本管理',
                groupIcon: icons.energy,
                items: [
                    { key: 'fuel', label: '加油记录', href: 'web-fuel-records.html', icon: icons.fuel },
                    { key: 'water', label: '加水记录', href: 'web-water-records.html', icon: icons.water },
                    { key: 'charge', label: '充电记录', href: 'web-charge-records.html', icon: icons.charge },
                    { key: 'fuelAnalysis', label: '油耗分析', href: 'web-fuel-analysis.html', icon: icons.fuelAnalysis },
                    { key: 'chargeAnalysis', label: '电耗分析', href: 'web-charge-analysis.html', icon: icons.chargeAnalysis }
                ]
            },
            {
                title: '用车记录',
                groupIcon: icons.vehicleUseGroup,
                items: [
                    { key: 'vehicleUse', label: '用车记录', href: 'web-vehicle-use-records.html', icon: icons.vehicleUse }
                ]
            }
        ];
        const currentProject = readStoredProject();
        return `
            <header class="web-topbar" aria-label="全局导航">
                <a class="web-brand" href="../index.html" aria-label="酷哇智慧环卫首页">
                    <svg class="web-brand-mark" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <ellipse cx="16" cy="16" rx="14" ry="6"/><ellipse cx="16" cy="16" rx="14" ry="6" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="14" ry="6" transform="rotate(120 16 16)"/><circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none"/>
                    </svg>
                    <span class="web-brand-name">酷哇智慧环卫</span>
                </a>
                <nav class="web-topnav" aria-label="业务模块">
                    <a class="web-topnav-item active" href="web-fuel-records.html" aria-current="page">${icons.info}<span>车辆运营</span></a>
                </nav>
                <div class="web-header-spacer"></div>
                <div class="web-header-tools">
                    <div class="web-project-picker">
                        <button class="web-project-trigger" id="webProjectTrigger" type="button" aria-haspopup="listbox" aria-expanded="false" ${projectLocked ? 'disabled title="编辑或详情状态下不可切换项目"' : ''}>
                            <span class="web-project-display" id="webProjectDisplay">${projectLabel(currentProject)}</span>
                            <span class="web-visually-hidden" id="currentProject">${currentProject}</span>
                            <svg class="web-project-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="web-project-dropdown project-dropdown" id="projectDropdown" role="listbox">
                            <div class="web-project-dropdown-title">切换项目</div>
                            ${projects.map((project) => `<button class="web-project-option project-dropdown-item${project.name === currentProject ? ' active' : ''}" type="button" role="option" data-project="${project.name}" aria-selected="${project.name === currentProject}"><span>${project.label}</span>${project.name === currentProject ? '<span data-project-check aria-hidden="true">✓</span>' : ''}</button>`).join('')}
                        </div>
                    </div>
                    <button class="web-icon-button" id="webBackButton" type="button" title="返回上一页" aria-label="返回上一页">
                        <svg class="web-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14l-4-4 4-4"/><path d="M5 10h8a6 6 0 016 6v2"/></svg>
                    </button>
                    <div class="web-user">
                        <span class="web-user-avatar" aria-hidden="true"><svg class="web-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg></span>
                        <div class="web-user-copy"><div class="web-user-name">孙继成</div><div class="web-user-role">产品经理</div></div>
                    </div>
                </div>
            </header>
            <aside class="web-sidebar" aria-label="车辆运营导航">
                <div class="web-sidebar-scroll">
                    ${sideGroups.map((group) => `
                        <div class="web-side-group">
                            <div class="web-side-group-title">${group.groupIcon}<span class="web-side-label">${group.title}</span><svg class="web-side-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 15l6-6 6 6"/></svg></div>
                            ${group.items.map((item) => `<a class="web-side-item${item.key === activeSide ? ' active' : ''}" href="${item.href}" ${item.key === activeSide ? 'aria-current="page"' : ''} title="${item.label}">${item.icon}<span class="web-side-label">${item.label}</span></a>`).join('')}
                        </div>
                    `).join('')}
                </div>
                <div class="web-sidebar-footer"><button class="web-sidebar-toggle" id="webSidebarToggle" type="button" title="收起侧边栏" aria-label="收起侧边栏"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/><path d="M4 4h16v16H4z"/></svg></button></div>
            </aside>`;
    }

    function updateProject(name, notify) {
        const hiddenProject = document.getElementById('currentProject');
        const displayProject = document.getElementById('webProjectDisplay');
        const metaProject = document.getElementById('metaProject');
        if (hiddenProject) hiddenProject.textContent = name;
        if (displayProject) displayProject.textContent = projectLabel(name);
        if (metaProject) metaProject.textContent = name;
        document.querySelectorAll('.web-project-option').forEach((option) => {
            const selected = option.dataset.project === name;
            option.classList.toggle('active', selected);
            option.setAttribute('aria-selected', String(selected));
            const oldCheck = option.querySelector('[data-project-check]');
            if (oldCheck) oldCheck.remove();
            if (selected) {
                const check = document.createElement('span');
                check.dataset.projectCheck = '';
                check.setAttribute('aria-hidden', 'true');
                check.textContent = '✓';
                option.appendChild(check);
            }
        });
        localStorage.setItem(PROJECT_STORAGE_KEY, name);
        if (notify) {
            window.dispatchEvent(new CustomEvent('web:project-change', { detail: { projectName: name } }));
        }
    }

    function setDefaultDateRange() {
        const months = Number(document.body.dataset.dateRangeMonths || 0);
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        if (!months || !startInput || !endInput) return;
        const end = new Date();
        const start = new Date(end);
        start.setMonth(start.getMonth() - months);
        const format = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        startInput.value = format(start);
        endInput.value = format(end);
    }

    function closeProjectDropdown() {
        const trigger = document.getElementById('webProjectTrigger');
        const dropdown = document.getElementById('projectDropdown');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (dropdown) dropdown.classList.remove('show');
    }

    function initializeShell() {
        const legacySidebar = document.body.querySelector(':scope > .sidebar');
        const legacyHeader = document.body.querySelector(':scope > .top-header');
        if (legacySidebar) legacySidebar.remove();
        if (legacyHeader) legacyHeader.remove();
        let host = document.getElementById('webShell');
        if (!host) {
            host = document.createElement('div');
            host.id = 'webShell';
            document.body.prepend(host);
        }
        document.body.classList.add('web-shell-page');
        const activeSide = document.body.dataset.sideActive || 'fuel';
        const projectLocked = document.body.dataset.projectLocked === 'true';
        host.innerHTML = shellTemplate(activeSide, projectLocked);

        if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true') {
            document.body.classList.add('web-sidebar-collapsed');
        }

        updateProject(readStoredProject(), false);
        setDefaultDateRange();

        const trigger = document.getElementById('webProjectTrigger');
        const dropdown = document.getElementById('projectDropdown');
        trigger?.addEventListener('click', (event) => {
            event.stopPropagation();
            const open = !dropdown.classList.contains('show');
            dropdown.classList.toggle('show', open);
            trigger.setAttribute('aria-expanded', String(open));
        });

        document.querySelectorAll('.web-project-option').forEach((option) => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                const nextProject = option.dataset.project;
                const activeModal = document.querySelector('#formModal.active');
                if (activeModal && !window.confirm('当前表单有未保存的内容，切换项目将清空表单。确定切换吗？')) return;
                if (activeModal) activeModal.classList.remove('active');
                updateProject(nextProject, true);
                closeProjectDropdown();
            });
        });

        document.getElementById('webBackButton')?.addEventListener('click', () => {
            if (window.history.length > 1) window.history.back();
            else {
                const fallback = { fuelAnalysis: 'web-fuel-analysis.html', chargeAnalysis: 'web-charge-analysis.html' };
                window.location.href = fallback[activeSide] || `web-${activeSide}-records.html`;
            }
        });

        document.getElementById('webSidebarToggle')?.addEventListener('click', () => {
            const collapsed = document.body.classList.toggle('web-sidebar-collapsed');
            localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
        });

        document.addEventListener('click', closeProjectDropdown);
        window.dispatchEvent(new CustomEvent('web:shell-ready', { detail: { projectName: readStoredProject() } }));
    }

    window.WebShell = {
        projects: projects.slice(),
        getCurrentProject: readStoredProject,
        resetDateRange: setDefaultDateRange
    };

    initializeShell();
})();
