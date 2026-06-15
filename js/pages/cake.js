const CakePage = {
    currentTab: 'inventory',
    filterConditions: {
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
            this.filterConditions = {
                dateStart: todayStr,
                dateEnd: todayStr
            };
            hintBanner = `
                <div style="padding: 10px 16px; margin-bottom: 16px; background: #e8f5e9; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #2e7d32;">
                        📌 当前筛选：${todayStr} 记录
                    </span>
                    <button class="btn btn-secondary btn-sm" onclick="CakePage.clearNavFilter()">清除筛选</button>
                </div>
            `;
        }
        this.navigationParams = {};
        return `
            ${hintBanner}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">🥮</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getInstockWeight()} kg</div>
                        <div class="stat-label">库存茶枯</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">📦</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getInstockCount()} 块</div>
                        <div class="stat-label">库存数量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">💰</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatMoney(this.getTotalSales())}</div>
                        <div class="stat-label">累计销售</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalProduced()} kg</div>
                        <div class="stat-label">累计产出</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="tabs" style="margin-bottom: 0; border-bottom: none;">
                        <div class="tab-item ${this.currentTab === 'inventory' ? 'active' : ''}" data-tab="inventory">茶枯库存</div>
                        <div class="tab-item ${this.currentTab === 'sales' ? 'active' : ''}" data-tab="sales">茶枯销售</div>
                    </div>
                    <button class="btn btn-primary" onclick="CakePage.openAddModal()">
                        <span>+</span> ${this.currentTab === 'inventory' ? '入库登记' : '新增销售'}
                    </button>
                </div>
                <div class="card-body">
                    ${this.currentTab === 'inventory' ? this.renderInventoryTable() : this.renderSalesTable()}
                </div>
            </div>
        `;
    },

    renderInventoryTable() {
        const allRecords = (Storage.get('cakeRecords') || []).filter(r => r.type === 'produce');
        const { dateStart, dateEnd } = this.filterConditions;
        const records = allRecords.filter(item => {
            if (dateStart && !Utils.isDateInRange(item.createdAt, dateStart, null)) return false;
            if (dateEnd && !Utils.isDateInRange(item.createdAt, null, dateEnd)) return false;
            return true;
        });
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `
                <div class="filter-bar">
                    <input type="date" value="${this.filterConditions.dateStart}" onchange="CakePage.onFilterChange('dateStart', this.value)">
                    <span>至</span>
                    <input type="date" value="${this.filterConditions.dateEnd}" onchange="CakePage.onFilterChange('dateEnd', this.value)">
                    <button class="btn btn-secondary btn-sm" onclick="CakePage.refresh()">查询</button>
                    <button class="btn btn-secondary btn-sm" onclick="CakePage.resetFilter()">重置</button>
                </div>
                <div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">暂无入库记录</div></div>
            `;
        }

        return `
            <div class="filter-bar">
                <input type="date" value="${this.filterConditions.dateStart}" onchange="CakePage.onFilterChange('dateStart', this.value)">
                <span>至</span>
                <input type="date" value="${this.filterConditions.dateEnd}" onchange="CakePage.onFilterChange('dateEnd', this.value)">
                <button class="btn btn-secondary btn-sm" onclick="CakePage.refresh()">查询</button>
                <button class="btn btn-secondary btn-sm" onclick="CakePage.resetFilter()">重置</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>关联压榨批次</th>
                            <th>茶枯重量(kg)</th>
                            <th>数量(块)</th>
                            <th>单块重量(kg)</th>
                            <th>入库时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => {
                            const pressing = item.pressingId ? Storage.findById('pressingRecords', item.pressingId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo || '-'}</td>
                                    <td>${pressing ? pressing.batchNo : '无来源'}</td>
                                    <td style="font-weight: 600; color: #795548;">${Utils.formatNumber(item.cakeWeight, 1)}</td>
                                    <td>${item.cakeCount || '-'}</td>
                                    <td>${item.cakeCount && item.cakeCount > 0 ? Utils.formatNumber(item.cakeWeight / item.cakeCount, 2) : '-'} kg</td>
                                    <td>${Utils.formatDateTime(item.createdAt)}</td>
                                    <td>${this.getStatusBadge(item.status)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-outline btn-sm" onclick="CakePage.viewInventory('${item.id}')">查看</button>
                                            <button class="btn btn-secondary btn-sm" onclick="CakePage.editInventory('${item.id}')">编辑</button>
                                            <button class="btn btn-danger btn-sm" onclick="CakePage.deleteRecord('${item.id}')">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSalesTable() {
        const allRecords = (Storage.get('cakeRecords') || []).filter(r => r.type === 'sell');
        const { dateStart, dateEnd } = this.filterConditions;
        const records = allRecords.filter(item => {
            if (dateStart && !Utils.isDateInRange(item.createdAt, dateStart, null)) return false;
            if (dateEnd && !Utils.isDateInRange(item.createdAt, null, dateEnd)) return false;
            return true;
        });
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `
                <div class="filter-bar">
                    <input type="date" value="${this.filterConditions.dateStart}" onchange="CakePage.onFilterChange('dateStart', this.value)">
                    <span>至</span>
                    <input type="date" value="${this.filterConditions.dateEnd}" onchange="CakePage.onFilterChange('dateEnd', this.value)">
                    <button class="btn btn-secondary btn-sm" onclick="CakePage.refresh()">查询</button>
                    <button class="btn btn-secondary btn-sm" onclick="CakePage.resetFilter()">重置</button>
                </div>
                <div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-text">暂无销售记录</div></div>
            `;
        }

        return `
            <div class="filter-bar">
                <input type="date" value="${this.filterConditions.dateStart}" onchange="CakePage.onFilterChange('dateStart', this.value)">
                <span>至</span>
                <input type="date" value="${this.filterConditions.dateEnd}" onchange="CakePage.onFilterChange('dateEnd', this.value)">
                <button class="btn btn-secondary btn-sm" onclick="CakePage.refresh()">查询</button>
                <button class="btn btn-secondary btn-sm" onclick="CakePage.resetFilter()">重置</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>日期</th>
                            <th>客户姓名</th>
                            <th>联系电话</th>
                            <th>茶枯重量(kg)</th>
                            <th>数量(块)</th>
                            <th>单价(元/kg)</th>
                            <th>总金额(元)</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => `
                            <tr>
                                <td>${Utils.formatDate(item.createdAt)}</td>
                                <td>${Utils.escapeHtml(item.customerName || '-')}</td>
                                <td>${Utils.escapeHtml(item.customerPhone || '-')}</td>
                                <td style="font-weight: 600; color: #795548;">${Utils.formatNumber(item.cakeWeight, 1)}</td>
                                <td>${item.cakeCount || '-'}</td>
                                <td>${Utils.formatNumber(item.price, 2)}</td>
                                <td style="font-weight: 600; color: #689f38;">${Utils.formatNumber(item.totalAmount, 2)}</td>
                                <td>${this.getStatusBadge(item.status)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-outline btn-sm" onclick="CakePage.viewSale('${item.id}')">查看</button>
                                        <button class="btn btn-secondary btn-sm" onclick="CakePage.editSale('${item.id}')">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="CakePage.deleteRecord('${item.id}')">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getStatusBadge(status) {
        const map = {
            instock: { text: '在库', class: 'badge-success' },
            sold: { text: '已售', class: 'badge-info' },
            completed: { text: '已完成', class: 'badge-success' },
            pending: { text: '待付款', class: 'badge-warning' }
        };
        const s = map[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getInstockWeight() {
        const records = Storage.get('cakeRecords') || [];
        const produced = records.filter(r => r.type === 'produce').reduce((sum, r) => sum + (r.cakeWeight || 0), 0);
        const sold = records.filter(r => r.type === 'sell').reduce((sum, r) => sum + (r.cakeWeight || 0), 0);
        return Utils.formatNumber(Math.max(0, produced - sold), 1);
    },

    getInstockCount() {
        const records = Storage.get('cakeRecords') || [];
        const produced = records.filter(r => r.type === 'produce').reduce((sum, r) => sum + (r.cakeCount || 0), 0);
        const sold = records.filter(r => r.type === 'sell').reduce((sum, r) => sum + (r.cakeCount || 0), 0);
        return Math.max(0, produced - sold);
    },

    getTotalSales() {
        const records = Storage.get('cakeRecords') || [];
        return records.filter(r => r.type === 'sell' && r.status !== 'cancelled')
            .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    },

    getTotalProduced() {
        const records = Storage.get('cakeRecords') || [];
        return Utils.formatNumber(records.filter(r => r.type === 'produce').reduce((sum, r) => sum + (r.cakeWeight || 0), 0), 1);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.refresh();
    },

    openAddModal() {
        if (this.currentTab === 'inventory') {
            this.openInventoryModal();
        } else {
            this.openSaleModal();
        }
    },

    openInventoryModal() {
        const pressingList = (Storage.get('pressingRecords') || [])
            .filter(r => r.status === 'completed');
        const pressingOptions = pressingList.map(p => 
            `<option value="${p.id}" data-weight="${p.cakeWeight || 0}" data-oil="${p.crudeOilWeight || 0}">
                ${p.batchNo} - ${Utils.formatNumber(p.cakeWeight || 0, 1)}kg 茶枯
            </option>`
        ).join('');

        const content = `
            <form id="cakeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('CK')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源压榨批次</label>
                        <select id="pressingSelect" name="pressingId" onchange="CakePage.onPressingChange()">
                            <option value="">直接入库（无来源）</option>
                            ${pressingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶枯重量(kg) *</label>
                        <input type="number" id="cakeWeight" name="cakeWeight" step="0.1" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>茶枯数量(块)</label>
                        <input type="number" name="cakeCount" min="0" value="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="instock">在库</option>
                        <option value="sold">已售</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="2"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认入库</button>
                </div>
            </form>
        `;

        Utils.showModal('茶枯入库登记', content);

        const form = document.getElementById('cakeForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('cakeForm');

            const formData = new FormData(form);
            const cakeWeight = parseFloat(formData.get('cakeWeight')) || 0;

            const weightCheck = Utils.validate.positiveNumber(cakeWeight, '茶枯重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('cakeWeight', weightCheck.message);
                return;
            }

            const data = {
                type: 'produce',
                batchNo: formData.get('batchNo'),
                pressingId: formData.get('pressingId') || null,
                cakeWeight: cakeWeight,
                cakeCount: parseInt(formData.get('cakeCount')) || 0,
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('cakeRecords', data);
            Utils.hideModal();
            Utils.toast('入库成功', 'success');
            this.refresh();
        });
    },

    onPressingChange() {
        const select = document.getElementById('pressingSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('cakeWeight');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
        }
    },

    viewInventory(id) {
        const item = Storage.findById('cakeRecords', id);
        if (!item) return;

        let sourceHtml = '';
        if (item.pressingId) {
            const pressing = Storage.findById('pressingRecords', item.pressingId);
            if (pressing) {
                sourceHtml = `
                    <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                         onclick="Utils.hideModal(); App.switchPage('pressing');">
                        <span style="color: #1976d2; font-weight: 600;">${pressing.batchNo}</span>
                        <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(pressing.cakeWeight || 0, 1)}kg 茶枯</span>
                        <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源压榨</span>
                    </div>
                `;
            } else {
                sourceHtml = '<div style="color: #aaa; font-size: 13px;">来源批次已删除</div>';
            }
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接入库）</div>';
        }

        const content = `
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">批次号</span>
                    <span class="value">${item.batchNo || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value">${this.getStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">茶枯重量</span>
                    <span class="value" style="color: #795548; font-weight: 700;">${Utils.formatNumber(item.cakeWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">数量</span>
                    <span class="value">${item.cakeCount || 0} 块</span>
                </div>
                <div class="info-item">
                    <span class="label">单块重量</span>
                    <span class="value">${item.cakeCount && item.cakeCount > 0 ? Utils.formatNumber(item.cakeWeight / item.cakeCount, 2) : '-'} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">入库时间</span>
                    <span class="value">${Utils.formatDateTime(item.createdAt)}</span>
                </div>
            </div>

            <div class="section-title" style="margin-top: 20px;">来源批次</div>
            <div style="padding: 12px; background: #fafafa; border-radius: 8px;">
                ${sourceHtml}
            </div>

            ${item.remark ? `
                <div class="section-title" style="margin-top: 20px;">备注</div>
                <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
            ` : ''}
            <div class="modal-footer" style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('入库详情', content);
    },

    editInventory(id) {
        const item = Storage.findById('cakeRecords', id);
        if (!item) return;

        const pressingList = (Storage.get('pressingRecords') || [])
            .filter(r => r.status === 'completed' || r.id === item.pressingId);
        const pressingOptions = pressingList.map(p => 
            `<option value="${p.id}" ${p.id === item.pressingId ? 'selected' : ''}>
                ${p.batchNo} - ${Utils.formatNumber(p.cakeWeight || 0, 1)}kg 茶枯
            </option>`
        ).join('');

        const content = `
            <form id="cakeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo || ''}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源压榨批次</label>
                        <select name="pressingId">
                            <option value="">直接入库（无来源）</option>
                            ${pressingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶枯重量(kg) *</label>
                        <input type="number" id="cakeWeight" name="cakeWeight" step="0.1" min="0" value="${item.cakeWeight}" required>
                    </div>
                    <div class="form-group">
                        <label>茶枯数量(块)</label>
                        <input type="number" name="cakeCount" min="0" value="${item.cakeCount || 0}">
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="instock" ${item.status === 'instock' ? 'selected' : ''}>在库</option>
                        <option value="sold" ${item.status === 'sold' ? 'selected' : ''}>已售</option>
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

        Utils.showModal('编辑入库记录', content);

        const form = document.getElementById('cakeForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('cakeForm');

            const formData = new FormData(form);
            const cakeWeight = parseFloat(formData.get('cakeWeight')) || 0;

            const weightCheck = Utils.validate.positiveNumber(cakeWeight, '茶枯重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('cakeWeight', weightCheck.message);
                return;
            }

            const data = {
                pressingId: formData.get('pressingId') || null,
                cakeWeight: cakeWeight,
                cakeCount: parseInt(formData.get('cakeCount')) || 0,
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('cakeRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    openSaleModal() {
        const instockWeight = parseFloat(this.getInstockWeight()) || 0;

        const content = `
            <form id="cakeSaleForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>客户姓名 *</label>
                        <input type="text" name="customerName" required>
                    </div>
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" name="customerPhone">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶枯重量(kg) *</label>
                        <input type="number" id="saleCakeWeight" name="cakeWeight" step="0.1" min="0" required oninput="CakePage.calcTotal()">
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">当前库存: ${instockWeight} kg</div>
                    </div>
                    <div class="form-group">
                        <label>数量(块)</label>
                        <input type="number" name="cakeCount" min="0" value="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>单价(元/kg) *</label>
                        <input type="number" name="price" step="0.01" min="0" value="2.5" required oninput="CakePage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>总金额(元)</label>
                        <input type="text" name="totalAmount" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="completed">已完成</option>
                        <option value="pending">待付款</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="2"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认销售</button>
                </div>
            </form>
        `;

        Utils.showModal('新增茶枯销售', content);

        const form = document.getElementById('cakeSaleForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('cakeSaleForm');

            const formData = new FormData(form);
            const weight = parseFloat(formData.get('cakeWeight')) || 0;
            const price = parseFloat(formData.get('price')) || 0;

            const weightCheck = Utils.validate.positiveNumber(weight, '茶枯重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('saleCakeWeight', weightCheck.message);
                return;
            }

            if (weight > instockWeight) {
                Utils.showFieldError('saleCakeWeight', `库存不足！当前库存 ${instockWeight}kg`);
                return;
            }

            const data = {
                type: 'sell',
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                cakeWeight: weight,
                cakeCount: parseInt(formData.get('cakeCount')) || 0,
                price: price,
                totalAmount: weight * price,
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('cakeRecords', data);
            Utils.hideModal();
            Utils.toast('销售记录已保存', 'success');
            this.refresh();
        });
    },

    calcTotal() {
        const form = document.getElementById('cakeSaleForm');
        if (!form) return;
        const weight = parseFloat(form.cakeWeight.value) || 0;
        const price = parseFloat(form.price.value) || 0;
        const total = (weight * price).toFixed(2);
        if (form.totalAmount) {
            form.totalAmount.value = total;
        }
    },

    viewSale(id) {
        const item = Storage.findById('cakeRecords', id);
        if (!item) return;

        const content = `
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">客户姓名</span>
                    <span class="value">${Utils.escapeHtml(item.customerName || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">联系电话</span>
                    <span class="value">${Utils.escapeHtml(item.customerPhone || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">茶枯重量</span>
                    <span class="value">${Utils.formatNumber(item.cakeWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">数量</span>
                    <span class="value">${item.cakeCount || 0} 块</span>
                </div>
                <div class="info-item">
                    <span class="label">单价</span>
                    <span class="value">${Utils.formatMoney(item.price)}/kg</span>
                </div>
                <div class="info-item">
                    <span class="label">总金额</span>
                    <span class="value" style="color: #689f38; font-weight: 700;">${Utils.formatMoney(item.totalAmount)}</span>
                </div>
                <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value">${this.getStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">销售日期</span>
                    <span class="value">${Utils.formatDateTime(item.createdAt)}</span>
                </div>
            </div>
            ${item.remark ? `
                <div class="form-group" style="margin-top: 16px;">
                    <label>备注</label>
                    <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
                </div>
            ` : ''}
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('销售详情', content);
    },

    editSale(id) {
        const item = Storage.findById('cakeRecords', id);
        if (!item) return;

        const instockWeight = parseFloat(this.getInstockWeight()) || 0;

        const content = `
            <form id="cakeSaleForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>客户姓名 *</label>
                        <input type="text" name="customerName" value="${Utils.escapeHtml(item.customerName || '')}" required>
                    </div>
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" name="customerPhone" value="${Utils.escapeHtml(item.customerPhone || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶枯重量(kg) *</label>
                        <input type="number" id="saleCakeWeight" name="cakeWeight" step="0.1" min="0" value="${item.cakeWeight}" required oninput="CakePage.calcTotal()">
                        <div style="font-size: 12px; color: #888; margin-top: 4px;">当前库存: ${instockWeight} kg</div>
                    </div>
                    <div class="form-group">
                        <label>数量(块)</label>
                        <input type="number" name="cakeCount" min="0" value="${item.cakeCount || 0}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>单价(元/kg) *</label>
                        <input type="number" name="price" step="0.01" min="0" value="${item.price}" required oninput="CakePage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>总金额(元)</label>
                        <input type="text" name="totalAmount" value="${Utils.formatNumber(item.totalAmount, 2)}" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>
                        <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>待付款</option>
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

        Utils.showModal('编辑销售记录', content);

        const form = document.getElementById('cakeSaleForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('cakeSaleForm');

            const formData = new FormData(form);
            const weight = parseFloat(formData.get('cakeWeight')) || 0;
            const price = parseFloat(formData.get('price')) || 0;

            const weightCheck = Utils.validate.positiveNumber(weight, '茶枯重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('saleCakeWeight', weightCheck.message);
                return;
            }

            if (weight > instockWeight + item.cakeWeight) {
                Utils.showFieldError('saleCakeWeight', `库存不足！当前库存 ${instockWeight}kg`);
                return;
            }

            const data = {
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                cakeWeight: weight,
                cakeCount: parseInt(formData.get('cakeCount')) || 0,
                price: price,
                totalAmount: weight * price,
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('cakeRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteRecord(id) {
        if (!Utils.confirm('确定要删除这条记录吗？')) return;
        Storage.delete('cakeRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    onFilterChange(field, value) {
        this.filterConditions[field] = value;
    },

    resetFilter() {
        this.filterConditions = {
            dateStart: '',
            dateEnd: ''
        };
        this.refresh();
    },

    clearNavFilter() {
        this.filterConditions = {
            dateStart: '',
            dateEnd: ''
        };
        this.refresh();
    },

    refresh() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = this.render();
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    },

    init(params = {}) {
        this.navigationParams = params;
        this.refresh();
    }
};
