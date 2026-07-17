(function () {
    'use strict';

    let currentConfig = null;

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function ensureModal() {
        if (document.getElementById('webRecordModal')) return;
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay web-record-modal-overlay" id="webRecordModal" role="dialog" aria-modal="true" aria-labelledby="webRecordModalTitle">
                <div class="modal web-record-modal">
                    <div class="modal-header">
                        <span class="modal-title" id="webRecordModalTitle"></span>
                        <button type="button" class="modal-close web-record-modal-close" aria-label="关闭">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="web-record-field-grid" id="webRecordModalFields"></div>
                    </div>
                    <div class="modal-footer web-record-modal-footer" id="webRecordModalFooter"></div>
                </div>
            </div>
        `);

        const overlay = document.getElementById('webRecordModal');
        overlay.addEventListener('click', event => {
            if (event.target === overlay) close();
        });
        overlay.querySelector('.web-record-modal-close').addEventListener('click', close);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && overlay.classList.contains('active')) close();
        });
    }

    function optionMarkup(field) {
        return (field.options || []).map(option => {
            const value = typeof option === 'string' ? option : option.value;
            const label = typeof option === 'string' ? option : option.label;
            return `<option value="${escapeHtml(value)}" ${String(value) === String(field.value) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
        }).join('');
    }

    function detailValueMarkup(field) {
        if (field.type === 'image') {
            return field.value
                ? `<img class="web-record-photo" src="${escapeHtml(field.value)}" alt="${escapeHtml(field.label)}">`
                : '<span class="web-record-empty">-</span>';
        }
        const value = field.displayValue != null ? field.displayValue : field.value;
        return `<span>${escapeHtml(value === '' || value == null ? '-' : value)}</span>`;
    }

    function editControlMarkup(field) {
        const key = escapeHtml(field.key);
        const disabled = field.disabled ? 'disabled' : '';
        const required = field.required ? 'required' : '';
        const rawValue = field.value == null ? '' : field.value;
        const value = field.type === 'datetime-local'
            ? String(rawValue).replace(' ', 'T')
            : rawValue;

        if (field.type === 'select') {
            return `<select data-field-key="${key}" ${disabled} ${required}>${optionMarkup(field)}</select>`;
        }
        if (field.type === 'textarea') {
            return `<textarea data-field-key="${key}" maxlength="200" ${disabled} ${required}>${escapeHtml(value)}</textarea>`;
        }
        if (field.type === 'image') {
            const preview = field.value
                ? `<img class="web-record-photo" src="${escapeHtml(field.value)}" alt="${escapeHtml(field.label)}">`
                : '<span class="web-record-empty">暂无图片</span>';
            return `
                <div class="web-record-image-editor">
                    <div class="web-record-image-preview">${preview}</div>
                    <label class="btn btn-default btn-sm web-record-upload-button">
                        更换图片
                        <input type="file" accept="image/*" data-field-key="${key}" data-image-value="${escapeHtml(field.value || '')}">
                    </label>
                </div>
            `;
        }

        const type = field.type || 'text';
        const step = field.step ? `step="${escapeHtml(field.step)}"` : '';
        const min = field.min != null ? `min="${escapeHtml(field.min)}"` : '';
        return `<input type="${escapeHtml(type)}" data-field-key="${key}" value="${escapeHtml(value)}" ${step} ${min} ${disabled} ${required}>`;
    }

    function fieldMarkup(field, mode) {
        const classes = ['web-record-field'];
        if (field.wide || field.type === 'image' || field.type === 'textarea') classes.push('is-wide');
        const requiredMark = field.required && mode === 'edit' ? '<span class="web-record-required">*</span>' : '';
        const valueMarkup = mode === 'detail' ? detailValueMarkup(field) : editControlMarkup(field);
        return `
            <div class="${classes.join(' ')}">
                <div class="web-record-field-label">${requiredMark}${escapeHtml(field.label)}</div>
                <div class="web-record-field-value">${valueMarkup}</div>
            </div>
        `;
    }

    function collectValues() {
        const values = {};
        document.querySelectorAll('#webRecordModal [data-field-key]').forEach(control => {
            const key = control.dataset.fieldKey;
            values[key] = control.type === 'file' ? control.dataset.imageValue : control.value;
        });
        return values;
    }

    function bindImageInputs() {
        document.querySelectorAll('#webRecordModal input[type="file"][data-field-key]').forEach(input => {
            input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = event => {
                    input.dataset.imageValue = event.target.result;
                    input.closest('.web-record-image-editor').querySelector('.web-record-image-preview').innerHTML =
                        `<img class="web-record-photo" src="${event.target.result}" alt="图片预览">`;
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function renderFooter() {
        const footer = document.getElementById('webRecordModalFooter');
        if (currentConfig.mode === 'edit') {
            footer.innerHTML = `
                <button type="button" class="btn btn-default" data-action="cancel">取消</button>
                <button type="button" class="btn btn-primary" data-action="save">保存</button>
            `;
            footer.querySelector('[data-action="cancel"]').addEventListener('click', close);
            footer.querySelector('[data-action="save"]').addEventListener('click', () => {
                const result = currentConfig.onSave ? currentConfig.onSave(collectValues()) : true;
                if (result !== false) close();
            });
            return;
        }

        footer.innerHTML = `
            <button type="button" class="btn btn-default" data-action="close">关闭</button>
            <div class="web-record-modal-actions">
                ${currentConfig.onDelete ? '<button type="button" class="btn btn-danger" data-action="delete">删除</button>' : ''}
                ${currentConfig.onEdit ? '<button type="button" class="btn btn-primary" data-action="edit">编辑</button>' : ''}
            </div>
        `;
        footer.querySelector('[data-action="close"]').addEventListener('click', close);
        const deleteButton = footer.querySelector('[data-action="delete"]');
        const editButton = footer.querySelector('[data-action="edit"]');
        if (deleteButton) deleteButton.addEventListener('click', currentConfig.onDelete);
        if (editButton) editButton.addEventListener('click', currentConfig.onEdit);
    }

    function render() {
        document.getElementById('webRecordModalTitle').textContent = currentConfig.title;
        document.getElementById('webRecordModalFields').innerHTML = currentConfig.fields
            .map(field => fieldMarkup(field, currentConfig.mode))
            .join('');
        renderFooter();
        if (currentConfig.mode === 'edit') bindImageInputs();
    }

    function open(config) {
        ensureModal();
        currentConfig = config;
        render();
        document.getElementById('webRecordModal').classList.add('active');
    }

    function close() {
        const modal = document.getElementById('webRecordModal');
        if (modal) modal.classList.remove('active');
        currentConfig = null;
    }

    window.WebRecordModal = { open, close };
})();
