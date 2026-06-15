const PurchasePage = {
    currentTab: 'buy',
    filterKeyword: '',
    filterStatus: '',
    filterDateStart: '',
    filterDateEnd: '',

    render() {
        const filteredData = this.getFilteredData();

        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">📥</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatNumber(this.getTotalWeight(), 1)} kg</div>
                        <div class="stat-label">累计收购茶籽</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">💰</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatMoney(this.getTotalAmount())}</div>
                        <div class="stat-label">累计收购金额</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">👨‍🌾</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getFarmerCount()}</div>
                        <div class="stat-label">合作农户数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">⚙️</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getProcessingCount()}</div>
                        <div class="stat-label">代榨处理中</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="tabs" style="margin-bottom: 0; border-bottom: none;">
                        <div class="tab-item ${this.currentTab === 'buy' ? 'active' : ''}" data-tab="buy">过磅收购</div>
                        <div class="tab-item ${this.currentTab === 'process' ? 'active' : ''}" data-tab="process">来料代榨</div>
                    </div>
                    <button class="btn btn-primary" onclick="PurchasePage.openAddModal()">
                        <span>+</span> 新增记录
                    </button>
                </div>
                <div class="card-body">
                    <div class="filter-bar">
                        <input type="text" id="purchaseSearch" placeholder="搜索农户姓名/村庄/电话..." 
                               style="width: 200px;" value="${this.filterKeyword}"
                               oninput="PurchasePage.onSearchChange(this.value)">
                        <select id="purchaseStatusFilter" onchange="PurchasePage.onStatusChange(this.value)">
                            <option value="">全部状态</option>
                            <option value="pending" ${this.filterStatus === 'pending' ? 'selected' : ''}>待付款</option>
                            <option value="completed" ${this.filterStatus === 'completed' ? 'selected' : ''}>已完成</option>
                            <option value="processing" ${this.filterStatus === 'processing' ? 'selected' : ''}>加工中</option>
                        </select>
                        <input type="date" id="purchaseDateStart" value="${this.filterDateStart}"
                               onchange="PurchasePage.onDateStartChange(this.value)">
                        <span>至</span>
                        <input type="date" id="purchaseDateEnd" value="${this.filterDateEnd}"
                               onchange="PurchasePage.onDateEndChange(this.value)">
                        <button class="btn btn-secondary btn-sm" onclick="PurchasePage.refreshList()">查询</button>
                        <button class="btn btn-secondary btn-sm" onclick="PurchasePage.resetFilter()">重置</button>
                    </div>
                    <div style="margin-bottom: 10px; font-size: 13px; color: #888;">
                        共 ${filteredData.length} 条记录
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>农户姓名</th>
                                    <th>联系电话</th>
                                    <th>村庄</th>
                                    <th>茶籽品种</th>
                                    <th>重量(kg)</th>
                                    <th>含水率(%)</th>
                                    ${this.currentTab === 'buy' ? '<th>单价(元)</th><th>金额(元)</th>' : '<th>加工费(元)</th>'}
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderTableRows(filteredData)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    getFilteredData() {
        const purchases = Storage.get('purchases') || [];
        let filtered = purchases.filter(p => p.type === this.currentTab);

        if (this.filterKeyword) {
            const keyword = this.filterKeyword.toLowerCase();
            filtered = filtered.filter(p => 
                (p.farmerName && p.farmerName.toLowerCase().includes(keyword)) ||
                (p.village && p.village.toLowerCase().includes(keyword)) ||
                (p.farmerPhone && p.farmerPhone.includes(keyword))
            );
        }

        if (this.filterStatus) {
            filtered = filtered.filter(p => p.status === this.filterStatus);
        }

        if (this.filterDateStart || this.filterDateEnd) {
            filtered = filtered.filter(p => 
                Utils.isDateInRange(p.createdAt, this.filterDateStart, this.filterDateEnd)
            );
        }

        return filtered;
    },

    renderTableRows(data) {
        if (data.length === 0) {
            return `<tr><td colspan="11"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无记录</div></div></td></tr>`;
        }

        return data.map(item => `
            <tr>
                <td>${Utils.formatDateTime(item.createdAt)}</td>
                <td>${Utils.escapeHtml(item.farmerName)}</td>
                <td>${Utils.escapeHtml(item.farmerPhone)}</td>
                <td>${Utils.escapeHtml(item.village || '-')}</td>
                <td>${Utils.escapeHtml(item.seedType || '-')}</td>
                <td>${Utils.formatNumber(item.weight, 1)}</td>
                <td>${Utils.formatNumber(item.moisture, 1)}</td>
                ${this.currentTab === 'buy' 
                    ? `<td>${Utils.formatNumber(item.price, 2)}</td><td>${Utils.formatNumber(item.totalAmount, 2)}</td>`
                    : `<td>${Utils.formatNumber(item.processFee || 0, 2)}</td>`
                }
                <td>${this.getStatusBadge(item.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="PurchasePage.viewDetail('${item.id}')">查看</button>
                        <button class="btn btn-secondary btn-sm" onclick="PurchasePage.editRecord('${item.id}')">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="PurchasePage.deleteRecord('${item.id}')">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getStatusBadge(status) {
        const statusMap = {
            pending: { text: '待付款', class: 'badge-warning' },
            completed: { text: '已完成', class: 'badge-success' },
            processing: { text: '加工中', class: 'badge-info' },
            cancelled: { text: '已取消', class: 'badge-secondary' }
        };
        const s = statusMap[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getTotalWeight() {
        const purchases = Storage.get('purchases') || [];
        return purchases.filter(p => p.type === 'buy').reduce((sum, p) => sum + (p.weight || 0), 0);
    },

    getTotalAmount() {
        const purchases = Storage.get('purchases') || [];
        return purchases.filter(p => p.type === 'buy').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    },

    getFarmerCount() {
        const purchases = Storage.get('purchases') || [];
        const farmers = new Set(purchases.map(p => p.farmerName));
        return farmers.size;
    },

    getProcessingCount() {
        const purchases = Storage.get('purchases') || [];
        return purchases.filter(p => p.type === 'process' && p.status === 'processing').length;
    },

    onSearchChange(value) {
        this.filterKeyword = value;
    },

    onStatusChange(value) {
        this.filterStatus = value;
        this.refresh();
    },

    onDateStartChange(value) {
        this.filterDateStart = value;
    },

    onDateEndChange(value) {
        this.filterDateEnd = value;
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.filterKeyword = '';
        this.filterStatus = '';
        this.filterDateStart = '';
        this.filterDateEnd = '';
        this.refresh();
    },

    openAddModal() {
        const isBuy = this.currentTab === 'buy';
        const title = isBuy ? '新增收购记录' : '新增加工记录';

        const content = `
            <form id="purchaseForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>农户姓名 *</label>
                        <input type="text" id="farmerName" name="farmerName" required>
                    </div>
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" id="farmerPhone" name="farmerPhone">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>所在村庄</label>
                        <input type="text" name="village">
                    </div>
                    <div class="form-group">
                        <label>茶籽品种</label>
                        <select name="seedType">
                            <option value="普通油茶籽">普通油茶籽</option>
                            <option value="红花油茶籽">红花油茶籽</option>
                            <option value="小果油茶籽">小果油茶籽</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>毛重(kg) *</label>
                        <input type="number" id="purchaseWeight" name="weight" step="0.1" min="0" required oninput="PurchasePage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>含水率(%)</label>
                        <input type="number" id="purchaseMoisture" name="moisture" step="0.1" min="0" max="100" value="12" onblur="PurchasePage.validateMoisture()">
                    </div>
                </div>
                ${isBuy ? `
                    <div class="form-row">
                        <div class="form-group">
                            <label>单价(元/kg) *</label>
                            <input type="number" id="purchasePrice" name="price" step="0.01" min="0" required oninput="PurchasePage.calcTotal()">
                        </div>
                        <div class="form-group">
                            <label>总金额(元)</label>
                            <input type="text" name="totalAmount" readonly style="background: #f5f5f5; font-weight: 600; color: #689f38;">
                        </div>
                    </div>
                ` : `
                    <div class="form-group">
                        <label>加工费(元)</label>
                        <input type="number" name="processFee" step="0.01" min="0" value="0">
                    </div>
                `}
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        ${isBuy 
                            ? '<option value="pending">待付款</option><option value="completed">已完成</option>'
                            : '<option value="processing">加工中</option><option value="completed">已完成</option>'
                        }
                    </select>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="3" placeholder="请输入备注信息"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal(title, content);
        this.initFormSubmit();
    },

    validateMoisture() {
        const input = document.getElementById('purchaseMoisture');
        if (!input) return;
        const value = parseFloat(input.value) || 0;
        const result = Utils.validate.moisture(value);
        if (!result.valid) {
            Utils.showFieldError('purchaseMoisture', result.message);
        } else if (result.warning) {
            Utils.showFieldError('purchaseMoisture', result.warning, 'warning');
        } else {
            Utils.showFieldError('purchaseMoisture', '');
        }
    },

    calcTotal() {
        const form = document.getElementById('purchaseForm');
        if (!form) return;
        const weight = parseFloat(form.weight.value) || 0;
        const price = parseFloat(form.price?.value) || 0;
        const total = (weight * price).toFixed(2);
        if (form.totalAmount) {
            form.totalAmount.value = total;
        }
    },

    initFormSubmit() {
        const form = document.getElementById('purchaseForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('purchaseForm');

            const formData = new FormData(form);
            const farmerName = formData.get('farmerName');
            const weight = parseFloat(formData.get('weight')) || 0;
            const moisture = parseFloat(formData.get('moisture')) || 0;

            const nameCheck = Utils.validate.notEmpty(farmerName, '农户姓名');
            if (!nameCheck.valid) {
                Utils.showFieldError('farmerName', nameCheck.message);
                return;
            }

            const weightCheck = Utils.validate.positiveNumber(weight, '毛重');
            if (!weightCheck.valid) {
                Utils.showFieldError('purchaseWeight', weightCheck.message);
                return;
            }

            const moistureCheck = Utils.validate.moisture(moisture);
            if (!moistureCheck.valid) {
                Utils.showFieldError('purchaseMoisture', moistureCheck.message);
                return;
            }

            const phone = formData.get('farmerPhone');
            const phoneCheck = Utils.validate.phone(phone);
            if (!phoneCheck.valid) {
                Utils.showFieldError('farmerPhone', phoneCheck.message);
                return;
            }

            const data = {
                type: this.currentTab,
                farmerName: farmerName,
                farmerPhone: phone,
                village: formData.get('village'),
                seedType: formData.get('seedType'),
                weight: weight,
                moisture: moisture,
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            if (this.currentTab === 'buy') {
                const price = parseFloat(formData.get('price')) || 0;
                const priceCheck = Utils.validate.positiveNumber(price, '单价');
                if (!priceCheck.valid) {
                    Utils.showFieldError('purchasePrice', priceCheck.message);
                    return;
                }
                data.price = price;
                data.totalAmount = weight * price;
            } else {
                data.processFee = parseFloat(formData.get('processFee')) || 0;
            }

            Storage.add('purchases', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    viewDetail(id) {
        const item = Storage.findById('purchases', id);
        if (!item) return;

        const isBuy = item.type === 'buy';
        const chain = Storage.getBatchChain('purchases', id);

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="App.switchPage('drying');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${t.seedWeight || '-'}kg</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 晾晒中</span>
                </div>
            `).join('');
        } else {
            targetHtml = '<div style="color: #aaa; font-size: 13px;">暂无后续环节</div>';
        }

        const content = `
            <div class="section-title">基本信息</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">农户姓名</span>
                    <span class="value">${Utils.escapeHtml(item.farmerName)}</span>
                </div>
                <div class="info-item">
                    <span class="label">联系电话</span>
                    <span class="value">${Utils.escapeHtml(item.farmerPhone || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">所在村庄</span>
                    <span class="value">${Utils.escapeHtml(item.village || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">茶籽品种</span>
                    <span class="value">${Utils.escapeHtml(item.seedType || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">重量</span>
                    <span class="value">${Utils.formatNumber(item.weight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">含水率</span>
                    <span class="value">${Utils.formatNumber(item.moisture, 1)} %</span>
                </div>
                ${isBuy ? `
                    <div class="info-item">
                        <span class="label">单价</span>
                        <span class="value">${Utils.formatMoney(item.price)}/kg</span>
                    </div>
                    <div class="info-item">
                        <span class="label">总金额</span>
                        <span class="value" style="color: #689f38; font-weight: 700;">${Utils.formatMoney(item.totalAmount)}</span>
                    </div>
                ` : `
                    <div class="info-item">
                        <span class="label">加工费</span>
                        <span class="value">${Utils.formatMoney(item.processFee || 0)}</span>
                    </div>
                `}
                <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value">${this.getStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">登记时间</span>
                    <span class="value">${Utils.formatDateTime(item.createdAt)}</span>
                </div>
            </div>

            <div class="section-title" style="margin-top: 20px;">批次流转</div>
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

        Utils.showModal('记录详情', content);
    },

    editRecord(id) {
        const item = Storage.findById('purchases', id);
        if (!item) return;

        const isBuy = item.type === 'buy';
        const title = isBuy ? '编辑收购记录' : '编辑加工记录';

        const content = `
            <form id="purchaseForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>农户姓名 *</label>
                        <input type="text" id="farmerName" name="farmerName" value="${Utils.escapeHtml(item.farmerName)}" required>
                    </div>
                    <div class="form-group">
                        <label>联系电话</label>
                        <input type="tel" id="farmerPhone" name="farmerPhone" value="${Utils.escapeHtml(item.farmerPhone || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>所在村庄</label>
                        <input type="text" name="village" value="${Utils.escapeHtml(item.village || '')}">
                    </div>
                    <div class="form-group">
                        <label>茶籽品种</label>
                        <select name="seedType">
                            <option value="普通油茶籽" ${item.seedType === '普通油茶籽' ? 'selected' : ''}>普通油茶籽</option>
                            <option value="红花油茶籽" ${item.seedType === '红花油茶籽' ? 'selected' : ''}>红花油茶籽</option>
                            <option value="小果油茶籽" ${item.seedType === '小果油茶籽' ? 'selected' : ''}>小果油茶籽</option>
                            <option value="其他" ${item.seedType === '其他' ? 'selected' : ''}>其他</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>毛重(kg) *</label>
                        <input type="number" id="purchaseWeight" name="weight" step="0.1" min="0" value="${item.weight}" required oninput="PurchasePage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>含水率(%)</label>
                        <input type="number" id="purchaseMoisture" name="moisture" step="0.1" min="0" max="100" value="${item.moisture || 12}" onblur="PurchasePage.validateMoisture()">
                    </div>
                </div>
                ${isBuy ? `
                    <div class="form-row">
                        <div class="form-group">
                            <label>单价(元/kg) *</label>
                            <input type="number" id="purchasePrice" name="price" step="0.01" min="0" value="${item.price}" required oninput="PurchasePage.calcTotal()">
                        </div>
                        <div class="form-group">
                            <label>总金额(元)</label>
                            <input type="text" name="totalAmount" readonly value="${item.totalAmount?.toFixed(2) || ''}" style="background: #f5f5f5; font-weight: 600; color: #689f38;">
                        </div>
                    </div>
                ` : `
                    <div class="form-group">
                        <label>加工费(元)</label>
                        <input type="number" name="processFee" step="0.01" min="0" value="${item.processFee || 0}">
                    </div>
                `}
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        ${isBuy 
                            ? `<option value="pending" ${item.status === 'pending' ? 'selected' : ''}>待付款</option><option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>`
                            : `<option value="processing" ${item.status === 'processing' ? 'selected' : ''}>加工中</option><option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>`
                        }
                    </select>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="3">${Utils.escapeHtml(item.remark || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal(title, content);

        const form = document.getElementById('purchaseForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('purchaseForm');

            const formData = new FormData(form);
            const farmerName = formData.get('farmerName');
            const weight = parseFloat(formData.get('weight')) || 0;
            const moisture = parseFloat(formData.get('moisture')) || 0;

            const nameCheck = Utils.validate.notEmpty(farmerName, '农户姓名');
            if (!nameCheck.valid) {
                Utils.showFieldError('farmerName', nameCheck.message);
                return;
            }

            const weightCheck = Utils.validate.positiveNumber(weight, '毛重');
            if (!weightCheck.valid) {
                Utils.showFieldError('purchaseWeight', weightCheck.message);
                return;
            }

            const moistureCheck = Utils.validate.moisture(moisture);
            if (!moistureCheck.valid) {
                Utils.showFieldError('purchaseMoisture', moistureCheck.message);
                return;
            }

            const data = {
                farmerName: farmerName,
                farmerPhone: formData.get('farmerPhone'),
                village: formData.get('village'),
                seedType: formData.get('seedType'),
                weight: weight,
                moisture: moisture,
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            if (isBuy) {
                data.price = parseFloat(formData.get('price')) || 0;
                data.totalAmount = data.weight * data.price;
            } else {
                data.processFee = parseFloat(formData.get('processFee')) || 0;
            }

            Storage.update('purchases', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    deleteRecord(id) {
        if (!Utils.confirm('确定要删除这条记录吗？删除后无法恢复。')) return;
        Storage.delete('purchases', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
        App.updateSidebarStats();
    },

    refreshList() {
        this.refresh();
    },

    resetFilter() {
        this.filterKeyword = '';
        this.filterStatus = '';
        this.filterDateStart = '';
        this.filterDateEnd = '';
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
