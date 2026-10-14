/** 城市管家演示角色注册表；新角色增加配置，功能通过 roleIds 关联。 */
(function () {
    'use strict';
    var STORAGE_KEY = 'cityStewardRole';
    var roleRegistry = [
        { id: 'driver', name: '驾驶员', description: '用车任务、车务上报与车辆维保', workspace: 'vehicle-management.html', icon: '<path d="M5 17H3V9l2-5h14l2 5v8h-2M5 17v3M19 17v3M3 9h18M5 17h14"/><circle cx="7" cy="13" r="1"/><circle cx="17" cy="13" r="1"/>' },
        { id: 'inspector', name: '巡查员', description: '巡查任务、品质事件与车务上报', workspace: 'inspection-management.html', icon: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 3h6v4H9zM8 12l3 3 5-5"/>' }
    ];
    var scriptUrl = document.currentScript && document.currentScript.src;
    var pageBase = new URL('../', scriptUrl || new URL('components/city-steward-role.js', window.location.href));
    var memoryRole = null;
    var picker = null;
    var previousFocus = null;
    var previousOverflow = '';
    var switchers = [];
    function getRole(id) { return roleRegistry.find(function (r) { return r.id === id; }) || null; }
    function storedRole() {
        try { return sessionStorage.getItem(STORAGE_KEY) || memoryRole; } catch (e) { return memoryRole; }
    }
    function getCurrentRole() { return getRole(storedRole()) || roleRegistry[0]; }
    function hasSelection() { return !!getRole(storedRole()); }
    function setRole(id) {
        var role = getRole(id);
        if (!role) return null;
        var previous = getCurrentRole();
        memoryRole = role.id;
        try { sessionStorage.setItem(STORAGE_KEY, role.id); } catch (e) {}
        window.dispatchEvent(new CustomEvent('city-steward-role-change', { detail: { role: role, previousRole: previous } }));
        return role;
    }
    function getWorkspaceUrl(id, tab) {
        var role = getRole(id) || getCurrentRole();
        var url = new URL(role.workspace, pageBase);
        url.searchParams.set('role', role.id);
        url.searchParams.set('tab', tab || 'map');
        return url.href;
    }
    function closePicker() {
        if (!picker) return;
        picker.remove();
        picker = null;
        document.body.style.overflow = previousOverflow;
        document.removeEventListener('keydown', onPickerKey);
        if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    }
    function onPickerKey(event) {
        if (event.key === 'Escape') closePicker();
        if (event.key !== 'Tab' || !picker) return;
        var buttons = picker.querySelectorAll('button');
        var first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function openRolePicker(options) {
        options = options || {};
        closePicker();
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        picker = document.createElement('div');
        picker.className = 'cs-role-overlay';
        var sheet = document.createElement('section');
        sheet.className = 'cs-role-sheet';
        sheet.setAttribute('role', 'dialog');
        sheet.setAttribute('aria-modal', 'true');
        sheet.setAttribute('aria-labelledby', 'csRolePickerTitle');
        sheet.innerHTML = '<div class="cs-role-sheet-header"><div><h2 id="csRolePickerTitle">选择工作角色</h2><p>按角色查看城市管家功能</p></div><button class="cs-role-close" type="button" aria-label="关闭角色选择">×</button></div>';
        sheet.querySelector('.cs-role-close').addEventListener('click', closePicker);
        roleRegistry.forEach(function (role) {
            var current = hasSelection() && getCurrentRole().id === role.id;
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'cs-role-option' + (current ? ' is-current' : '');
            button.dataset.roleId = role.id;
            button.setAttribute('aria-pressed', current ? 'true' : 'false');
            button.innerHTML = '<span class="cs-role-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + role.icon + '</svg></span><span class="cs-role-copy"></span><span class="cs-role-check" aria-hidden="true">' + (current ? '✓' : '›') + '</span>';
            var copy = button.querySelector('.cs-role-copy');
            var name = document.createElement('strong');
            name.textContent = role.name;
            var description = document.createElement('span');
            description.textContent = role.description;
            copy.appendChild(name); copy.appendChild(description);
            button.addEventListener('click', function () {
                setRole(role.id);
                closePicker();
                if (typeof options.onSelect === 'function') options.onSelect(role);
                else window.location.href = getWorkspaceUrl(role.id, 'map');
            });
            sheet.appendChild(button);
        });
        picker.appendChild(sheet);
        picker.addEventListener('click', function (event) { if (event.target === picker) closePicker(); });
        document.body.appendChild(picker);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onPickerKey);
        sheet.querySelector('.cs-role-option').focus();
        return picker;
    }
    function renderSwitcher(target) {
        target.textContent = '';
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'cs-role-switcher';
        button.setAttribute('aria-haspopup', 'dialog');
        button.innerHTML = '<span class="cs-role-switcher-label"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 10 5 5 5-5"/></svg>';
        button.setAttribute('aria-label', '切换工作角色，当前为' + getCurrentRole().name);
        button.querySelector('span').textContent = target.dataset.compactRole === 'true' ? getCurrentRole().name : '当前角色：' + getCurrentRole().name;
        button.addEventListener('click', function () { openRolePicker(); });
        target.appendChild(button);
    }
    function mountRoleSwitcher(target) {
        if (typeof target === 'string') target = document.querySelector(target);
        if (!target) return;
        if (switchers.indexOf(target) < 0) switchers.push(target);
        renderSwitcher(target);
    }
    window.addEventListener('city-steward-role-change', function () {
        switchers = switchers.filter(function (target) { return target.isConnected; });
        switchers.forEach(renderSwitcher);
    });
    window.CityStewardRole = {
        getRoles: function () { return roleRegistry.slice(); },
        getRole: getRole, getCurrentRole: getCurrentRole, hasSelection: hasSelection,
        setRole: setRole, getWorkspaceUrl: getWorkspaceUrl,
        openRolePicker: openRolePicker, mountRoleSwitcher: mountRoleSwitcher,
        registerRole: function (role) {
            if (!role || !role.id || !role.name || !role.workspace) return false;
            var index = roleRegistry.findIndex(function (item) { return item.id === role.id; });
            if (index < 0) roleRegistry.push(role); else roleRegistry[index] = role;
            return true;
        }
    };
})();
