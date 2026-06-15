const FilteringPage = {
    filters: {
        method: '',
        dateStart: '',
        dateEnd: ''
    },

    render() {
        const params = this.navigationParams || {};
        let hintBanner = '';
        let todayStr = '';
        if (params.dateFilter === 'today') {
            const today = new Date();
            todayStr = today.toISOString().split('T')[0];
            this.filters = {
                method: '',
                dateStart: todayStr,
                dateEnd: todayStr
            };
            hintBanner = `
                <div style="padding: 10px 16px; margin-bottom: 16px; background: #e8f5e9; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #2e7d32;">
                        📌 当前筛选：${todayStr} 记录
                    </span>
                    <button class="btn btn-secondary btn-sm" onclick="FilteringPage.clearNavFilter()">清除筛选</button>
                </div>
            `;
        }
        this.navigationParams = {};
        return `
            ${hintBanner}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">🧪</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getFilteringCount()}</div>
                        <div class="stat-label">过滤批次</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">🛢️</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalCrudeOil()} kg</div>
                        <div class="stat-label">毛油总投入</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">💧</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalFilteredOil()} kg</div>
                        <div class="stat-label">过滤后净油</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getFilterRate()}%</div>
                        <div class="stat-label">平均过滤得率</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>毛油沉淀过滤记录</h3>
                    <button class="btn btn-primary" onclick="FilteringPage.openAddModal()">
                        <span>+</span> 新增记录
                    </button>
                </div>
                <div class="card-body">
                    <div class="filter-bar">
                        <select id="filterMethod" onchange="FilteringPage.applyFilter()">
                            <option value="">全部过滤方式</option>
                            <option value="板框过滤" ${this.filters.method === '板框过滤' ? 'selected' : ''}>板框过滤</option>
                            <option value="离心过滤" ${this.filters.method === '离心过滤' ? 'selected' : ''}>离心过滤</option>
                            <option value="自然沉淀" ${this.filters.method === '自然沉淀' ? 'selected' : ''}>自然沉淀</option>
                            <option value="硅藻土过滤" ${this.filters.method === '硅藻土过滤' ? 'selected' : ''}>硅藻土过滤</option>
                        </select>
                        <input type="date" id="filterDateStart" value="${this.filters.dateStart}" onchange="FilteringPage.applyFilter()">
                        <span>至</span>
                        <input type="date" id="filterDateEnd" value="${this.filters.dateEnd}" onchange="FilteringPage.applyFilter()">
                        <button class="btn btn-secondary btn-sm" onclick="FilteringPage.refresh()">查询</button>
                        <button class="btn btn-secondary btn-sm" onclick="FilteringPage.resetFilter()">重置</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>批次号</th>
                                    <th>来源批次</th>
                                    <th>毛油重量(kg)</th>
                                    <th>净油重量(kg)</th>
                                    <th>油脚沉淀(kg)</th>
                                    <th>过滤方式</th>
                                    <th>操作人</th>
                                    <th>日期</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderTableRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    getFilteredData() {
        const records = Storage.get('filteringRecords') || [];
        const { method, dateStart, dateEnd } = this.filters;

        return records.filter(item => {
            if (method && item.filterMethod !== method) return false;
            if (dateStart && !Utils.isDateInRange(item.createdAt, dateStart, null)) return false;
            if (dateEnd && !Utils.isDateInRange(item.createdAt, null, dateEnd)) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    renderTableRows() {
        const records = this.getFilteredData();

        if (records.length === 0) {
            return `<tr><td colspan="10"><div class="empty-state"><div class="empty-state-icon">🧪</div><div class="empty-state-text">暂无过滤记录</div></div></td></tr>`;
        }

        return records.map(item => {
            const pressing = item.pressingId ? Storage.findById('pressingRecords', item.pressingId) : null;
            return `
                <tr>
                    <td>${item.batchNo}</td>
                    <td>${pressing ? pressing.batchNo : '直接过滤'}</td>
                    <td>${Utils.formatNumber(item.crudeOilWeight, 1)}</td>
                    <td style="font-weight: 600; color: #2196f3;">${Utils.formatNumber(item.filteredOilWeight, 1)}</td>
                    <td>${Utils.formatNumber(item.sedimentWeight, 1)}</td>
                    <td>${item.filterMethod}</td>
                    <td>${Utils.escapeHtml(item.operator || '-')}</td>
                    <td>${Utils.formatDate(item.createdAt)}</td>
                    <td>${this.getStatusBadge(item.status)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-outline btn-sm" onclick="FilteringPage.viewDetail('${item.id}')">查看</button>
                            <button class="btn btn-secondary btn-sm" onclick="FilteringPage.editRecord('${item.id}')">编辑</button>
                            <button class="btn btn-danger btn-sm" onclick="FilteringPage.deleteRecord('${item.id}')">删除</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    applyFilter() {
        this.filters.method = document.getElementById('filterMethod').value;
        this.filters.dateStart = document.getElementById('filterDateStart').value;
        this.filters.dateEnd = document.getElementById('filterDateEnd').value;
        this.refresh();
    },

    getStatusBadge(status) {
        const map = {
            settling: { text: '沉淀中', class: 'badge-warning' },
            filtering: { text: '过滤中', class: 'badge-info' },
            completed: { text: '已完成', class: 'badge-success' }
        };
        const s = map[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getFilteringCount() {
        const records = this.getFilteredData();
        return records.length;
    },

    getTotalCrudeOil() {
        const records = Storage.get('filteringRecords') || [];
        return Utils.formatNumber(records.reduce((sum, r) => sum + (r.crudeOilWeight || 0), 0), 1);
    },

    getTotalFilteredOil() {
        const records = Storage.get('filteringRecords') || [];
        return Utils.formatNumber(records.reduce((sum, r) => sum + (r.filteredOilWeight || 0), 0), 1);
    },

    getFilterRate() {
        const records = Storage.get('filteringRecords') || [];
        const totalCrude = records.reduce((sum, r) => sum + (r.crudeOilWeight || 0), 0);
        const totalFiltered = records.reduce((sum, r) => sum + (r.filteredOilWeight || 0), 0);
        const rate = totalCrude > 0 ? (totalFiltered / totalCrude) * 100 : 0;
        return Utils.formatNumber(rate, 2);
    },

    openAddModal() {
        const pressingList = (Storage.get('pressingRecords') || [])
            .filter(p => p.status === 'completed');
        const pressingOptions = pressingList.map(p => 
            `<option value="${p.id}" data-weight="${p.crudeOilWeight}">
                ${p.batchNo} - ${Utils.formatNumber(p.crudeOilWeight, 1)}kg毛油
            </option>`
        ).join('');

        const content = `
            <form id="filteringForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('GL')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源压榨批次</label>
                        <select id="pressingSelect" name="pressingId" onchange="FilteringPage.onPressingChange()">
                            <option value="">直接过滤（无来源）</option>
                            ${pressingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" id="filteringCrudeOil" name="crudeOilWeight" step="0.1" min="0" required oninput="FilteringPage.calcSediment()">
                    </div>
                    <div class="form-group">
                        <label>净油重量(kg) *</label>
                        <input type="number" id="filteringFilteredOil" name="filteredOilWeight" step="0.1" min="0" required oninput="FilteringPage.calcSediment()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>油脚沉淀(kg)</label>
                        <input type="text" id="filteringSediment" name="sedimentWeightDisplay" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>过滤方式</label>
                        <select name="filterMethod">
                            <option value="板框过滤">板框过滤</option>
                            <option value="离心过滤">离心过滤</option>
                            <option value="自然沉淀">自然沉淀</option>
                            <option value="硅藻土过滤">硅藻土过滤</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>过滤时间(分钟)</label>
                        <input type="number" name="filterTime" min="0" value="180">
                    </div>
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator">
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="settling">沉淀中</option>
                        <option value="filtering">过滤中</option>
                        <option value="completed">已完成</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="2"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal('新增过滤记录', content);

        const form = document.getElementById('filteringForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('filteringForm');

            const formData = new FormData(form);
            const crude = parseFloat(formData.get('crudeOilWeight')) || 0;
            const filtered = parseFloat(formData.get('filteredOilWeight')) || 0;

            const crudeCheck = Utils.validate.positiveNumber(crude, '毛油重量');
            if (!crudeCheck.valid) {
                Utils.showFieldError('filteringCrudeOil', crudeCheck.message);
                return;
            }

            const filteredCheck = Utils.validate.positiveNumber(filtered, '净油重量');
            if (!filteredCheck.valid) {
                Utils.showFieldError('filteringFilteredOil', filteredCheck.message);
                return;
            }

            const oilCheck = Utils.validate.filteredOil(filtered, crude);
            if (!oilCheck.valid) {
                Utils.showFieldError('filteringFilteredOil', oilCheck.message);
                return;
            }
            if (oilCheck.warning) {
                Utils.showFieldError('filteringFilteredOil', oilCheck.warning, 'warning');
            }

            const data = {
                batchNo: formData.get('batchNo'),
                pressingId: formData.get('pressingId') || null,
                crudeOilWeight: crude,
                filteredOilWeight: filtered,
                sedimentWeight: crude - filtered,
                filterMethod: formData.get('filterMethod'),
                filterTime: parseFloat(formData.get('filterTime')) || 0,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('filteringRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
        });
    },

    onPressingChange() {
        const select = document.getElementById('pressingSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('filteringCrudeOil');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
            this.calcSediment();
        }
    },

    calcSediment() {
        const form = document.getElementById('filteringForm');
        if (!form) return;
        const crude = parseFloat(form.crudeOilWeight.value) || 0;
        const filtered = parseFloat(form.filteredOilWeight.value) || 0;
        const sediment = Math.max(0, crude - filtered).toFixed(1);
        if (form.sedimentWeightDisplay) {
            form.sedimentWeightDisplay.value = sediment + ' kg';
        }
    },

    viewDetail(id) {
        const item = Storage.findById('filteringRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('filteringRecords', id);
        const pressing = chain.source;

        let sourceHtml = '';
        if (pressing) {
            sourceHtml = `
                <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('pressing');">
                    <span style="color: #1976d2; font-weight: 600;">${pressing.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(pressing.crudeOilWeight || 0, 1)}kg毛油</span>
                    <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源压榨</span>
                </div>
            `;
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接过滤）</div>';
        }

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('refining');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(t.refinedOilWeight || 0, 1)}kg精炼油</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 精炼</span>
                </div>
            `).join('');
        } else {
            targetHtml = '<div style="color: #aaa; font-size: 13px;">暂无后续环节</div>';
        }

        const rate = item.crudeOilWeight > 0 ? ((item.filteredOilWeight / item.crudeOilWeight) * 100).toFixed(2) : '0.00';

        const content = `
            <div class="section-title">基本信息</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">批次号</span>
                    <span class="value">${item.batchNo}</span>
                </div>
                <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value">${this.getStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">毛油重量</span>
                    <span class="value">${Utils.formatNumber(item.crudeOilWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">净油重量</span>
                    <span class="value" style="color: #2196f3; font-weight: 700;">${Utils.formatNumber(item.filteredOilWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">油脚沉淀</span>
                    <span class="value">${Utils.formatNumber(item.sedimentWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">过滤得率</span>
                    <span class="value" style="color: #689f38; font-weight: 700;">${rate}%</span>
                </div>
                <div class="info-item">
                    <span class="label">过滤方式</span>
                    <span class="value">${item.filterMethod}</span>
                </div>
                <div class="info-item">
                    <span class="label">过滤时间</span>
                    <span class="value">${item.filterTime || '-'} 分钟</span>
                </div>
                <div class="info-item">
                    <span class="label">操作人</span>
                    <span class="value">${Utils.escapeHtml(item.operator || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">过滤日期</span>
                    <span class="value">${Utils.formatDateTime(item.createdAt)}</span>
                </div>
            </div>

            <div class="section-title" style="margin-top: 20px;">批次流转</div>
            <div style="padding: 12px; background: #fafafa; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 13px; color: #888; margin-bottom: 8px;">📥 来源批次</div>
                ${sourceHtml}
            </div>
            <div style="padding: 12px; background: #fafafa; border-radius: 8px;">
                <div style="font-size: 13px; color: #888; margin-bottom: 8px;">📤 流转去向</div>
                ${targetHtml}
            </div>

            ${item.remark ? `
                <div class="section-title" style="margin-top: 20px;">备注</div>
                <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
            ` : ''}
            <div class="modal-footer" style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('过滤详情', content);
    },

    editRecord(id) {
        const item = Storage.findById('filteringRecords', id);
        if (!item) return;

        const pressingList = (Storage.get('pressingRecords') || [])
            .filter(p => p.status === 'completed' || p.id === item.pressingId);
        const pressingOptions = pressingList.map(p => 
            `<option value="${p.id}" ${p.id === item.pressingId ? 'selected' : ''}>
                ${p.batchNo} - ${Utils.formatNumber(p.crudeOilWeight, 1)}kg毛油
            </option>`
        ).join('');

        const content = `
            <form id="filteringForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源压榨批次</label>
                        <select name="pressingId">
                            <option value="">直接过滤（无来源）</option>
                            ${pressingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" id="filteringCrudeOil" name="crudeOilWeight" step="0.1" min="0" value="${item.crudeOilWeight}" required oninput="FilteringPage.calcSediment()">
                    </div>
                    <div class="form-group">
                        <label>净油重量(kg) *</label>
                        <input type="number" id="filteringFilteredOil" name="filteredOilWeight" step="0.1" min="0" value="${item.filteredOilWeight}" required oninput="FilteringPage.calcSediment()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>油脚沉淀(kg)</label>
                        <input type="text" name="sedimentWeightDisplay" value="${Utils.formatNumber(item.sedimentWeight, 1)} kg" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>过滤方式</label>
                        <select name="filterMethod">
                            <option value="板框过滤" ${item.filterMethod === '板框过滤' ? 'selected' : ''}>板框过滤</option>
                            <option value="离心过滤" ${item.filterMethod === '离心过滤' ? 'selected' : ''}>离心过滤</option>
                            <option value="自然沉淀" ${item.filterMethod === '自然沉淀' ? 'selected' : ''}>自然沉淀</option>
                            <option value="硅藻土过滤" ${item.filterMethod === '硅藻土过滤' ? 'selected' : ''}>硅藻土过滤</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>过滤时间(分钟)</label>
                        <input type="number" name="filterTime" min="0" value="${item.filterTime || 0}">
                    </div>
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator" value="${Utils.escapeHtml(item.operator || '')}">
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="settling" ${item.status === 'settling' ? 'selected' : ''}>沉淀中</option>
                        <option value="filtering" ${item.status === 'filtering' ? 'selected' : ''}>过滤中</option>
                        <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="2">${Utils.escapeHtml(item.remark || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal('编辑过滤记录', content);

        const form = document.getElementById('filteringForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('filteringForm');

            const formData = new FormData(form);
            const crude = parseFloat(formData.get('crudeOilWeight')) || 0;
            const filtered = parseFloat(formData.get('filteredOilWeight')) || 0;

            const oilCheck = Utils.validate.filteredOil(filtered, crude);
            if (!oilCheck.valid) {
                Utils.showFieldError('filteringFilteredOil', oilCheck.message);
                return;
            }

            const data = {
                pressingId: formData.get('pressingId') || null,
                crudeOilWeight: crude,
                filteredOilWeight: filtered,
                sedimentWeight: crude - filtered,
                filterMethod: formData.get('filterMethod'),
                filterTime: parseFloat(formData.get('filterTime')) || 0,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('filteringRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteRecord(id) {
        if (!Utils.confirm('确定要删除这条过滤记录吗？删除后无法恢复。')) return;
        Storage.delete('filteringRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    resetFilter() {
        this.filters = {
            method: '',
            dateStart: '',
            dateEnd: ''
        };
        this.refresh();
    },

    clearNavFilter() {
        this.filters = {
            method: '',
            dateStart: '',
            dateEnd: ''
        };
        this.refresh();
    },

    refresh() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = this.render();
    },

    init(params = {}) {
        this.navigationParams = params;
        this.refresh();
    }
};
