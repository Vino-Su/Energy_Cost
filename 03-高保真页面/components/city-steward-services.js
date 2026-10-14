/** 城市管家服务菜单：复用既有页面样式，由角色及功能注册表生成。 */
(function () {
    'use strict';
    var mounts = [];
    function render(target, roleId) {
        var groups = [];
        var functions = TabAppsData.getAllFunctions(roleId).filter(function (f) { return f.serviceVisible !== false; });
        functions.forEach(function (f) {
            var name = f.section || '常用服务';
            var group = groups.find(function (item) { return item.name === name; });
            if (!group) { group = { name: name, functions: [] }; groups.push(group); }
            group.functions.push(f);
        });
        var content = document.createDocumentFragment();
        groups.forEach(function (group) {
            var title = document.createElement('div');
            title.className = 'section-title';
            title.textContent = group.name;
            content.appendChild(title);
            var grid = document.createElement('div');
            grid.className = 'module-grid';
            group.functions.forEach(function (f) {
                var link = document.createElement('a');
                link.className = 'module-item';
                link.href = f.target;
                link.dataset.funcKey = f.funcKey;
                var icon = document.createElement('div');
                icon.className = 'module-icon ' + (f.iconClass || f.icon || 'grid');
                if (!f.iconClass && !['schedule', 'dynamic', 'fuel', 'water', 'charge', 'records', 'repair', 'maintenance'].includes(f.icon)) {
                    icon.style.background = '#e6f4ff';
                    icon.style.color = '#1677ff';
                }
                if (!f.iconClass && !['schedule', 'dynamic', 'fuel', 'water', 'charge', 'records', 'repair', 'maintenance'].includes(f.icon)) {
                    icon.style.background = '#e6f4ff';
                    icon.style.color = '#1677ff';
                }
                icon.innerHTML = TabAppsData.svg(f.icon);
                var name = document.createElement('span');
                name.className = 'module-name';
                name.textContent = f.name;
                link.appendChild(icon); link.appendChild(name);
                grid.appendChild(link);
            });
            content.appendChild(grid);
        });
        target.textContent = '';
        target.appendChild(content);
        return functions.length;
    }
    function mount(target, roleId) {
        if (typeof target === 'string') target = document.querySelector(target);
        if (!target || !window.TabAppsData) return 0;
        var record = mounts.find(function (item) { return item.target === target; });
        if (!record) { record = { target: target }; mounts.push(record); }
        record.roleId = roleId;
        return render(target, roleId);
    }
    window.addEventListener('city-steward-functions-change', function () {
        mounts = mounts.filter(function (record) { return record.target.isConnected; });
        mounts.forEach(function (record) { render(record.target, record.roleId); });
    });
    window.CityStewardServices = { mount: mount };
})();
