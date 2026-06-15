const CakePage = {
    currentTab: 'inventory',

    render() {
        return `
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
        const records = (Storage.get('cakeRecords') || []).filter(r => r.type === 'produce');

        if (records.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">暂无入库记录</div></div>`;
        }

        return `
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
                        ${records.map(item => `
                            <tr>
                                <td>${item.batchNo || '-'}</td>
                                <td>${item.pressingId ? '-' : '-'}</td>
                                <td style="font-weight: 600; color: #795548;">${Utils.formatNumber(item.cakeWeight, 1)}</td>
                                <td>${item.cakeCount || '-'}</td>
                                <td>${item.cakeCount && item.cakeCount > 0 ? Utils.formatNumber(item.cakeWeight / item.cakeCount, 2) : '-'} kg</td>
                                <td>${Utils.formatDateTime(item.createdAt)}</td>
                                <td>${this.getStatusBadge(item.status)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-secondary btn-sm" onclick="CakePage.editInventory('${item.id}')">编辑</button>
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

    renderSalesTable() {
        const records = (Storage.get('cakeRecords') || []).filter(r => r.type === 'sell');

        if (records.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-text">暂无销售记录</div></div>`;
        }

        return `
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
                        ${records.map(item => `
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
        return records.filter(r => r.type === 'sell').reduce((sum, r) => sum + (r.totalAmount || 0), 0);
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
        const content = `
            <form id="cakeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('CK')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>茶枯重量(kg) *</label>
                        <input type="number" name="cakeWeight" step="0.1" min="0" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>茶枯数量(块)</label>
                    <input type="number" name="cakeCount" min="0" value="0">
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
            const formData = new FormData(form);
            const data = {
                type: 'produce',
                batchNo: formData.get('batchNo'),
                cakeWeight: parseFloat(formData.get('cakeWeight')) || 0,
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

    editInventory(id) {
        const item = Storage.findById('cakeRecords', id);
        if (!item) return;

        const content = `
            <form id="cakeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo || ''}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>茶枯重量(kg) *</label>
                        <input type="number" name="cakeWeight" step="0.1" min="0" value="${item.cakeWeight}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>茶枯数量(块)</label>
                    <input type="number" name="cakeCount" min="0" value="${item.cakeCount || 0}">
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
            const formData = new FormData(form);
            const data = {
                cakeWeight: parseFloat(formData.get('cakeWeight')) || 0,
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
                        <input type="number" name="cakeWeight" step="0.1" min="0" required oninput="CakePage.calcTotal()">
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
            const formData = new FormData(form);
            const weight = parseFloat(formData.get('cakeWeight')) || 0;
            const price = parseFloat(formData.get('price')) || 0;
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
                        <input type="number" name="cakeWeight" step="0.1" min="0" value="${item.cakeWeight}" required oninput="CakePage.calcTotal()">
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
            const formData = new FormData(form);
            const weight = parseFloat(formData.get('cakeWeight')) || 0;
            const price = parseFloat(formData.get('price')) || 0;
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

    init() {
        this.refresh();
    }
};
