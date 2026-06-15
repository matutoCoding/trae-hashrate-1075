const SalesPage = {
    currentTab: 'records',
    filterConditions: {
        keyword: '',
        paymentMethod: '',
        status: '',
        dateStart: '',
        dateEnd: ''
    },
    productStockLogFilter: {
        productId: '',
        changeType: '',
        dateStart: '',
        dateEnd: ''
    },
    onlyShowLowStockProducts: false,

    render() {
        const params = this.navigationParams || {};
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (params.tab) {
            this.currentTab = params.tab;
        }
        if (params.lowStock) {
            this.onlyShowLowStockProducts = true;
            this.currentTab = 'products';
        }
        if (params.dateFilter === 'today') {
            this.filterConditions = {
                keyword: '',
                paymentMethod: '',
                status: '',
                dateStart: todayStr,
                dateEnd: todayStr
            };
            this.currentTab = 'records';
        }
        const hintBanner = (params.dateFilter === 'today' || params.lowStock) ? `
            <div style="padding: 10px 16px; margin-bottom: 16px; background: ${params.lowStock ? '#fff3e0' : '#e8f5e9'}; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: ${params.lowStock ? '#e65100' : '#2e7d32'};">
                    ${params.lowStock ? '📌 当前筛选：低库存产品（≤10瓶）' : `📌 当前筛选：${todayStr} 销售记录`}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="SalesPage.clearNavFilter()">清除筛选</button>
            </div>
        ` : '';
        this.navigationParams = {};
        return `
            ${hintBanner}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">💰</div>
                    <div class="stat-info">
                        <div class="stat-value">${Utils.formatMoney(this.getTotalSales())}</div>
                        <div class="stat-label">累计销售额</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">📦</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalQuantity()}</div>
                        <div class="stat-label">累计销量(瓶)</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">👥</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getCustomerCount()}</div>
                        <div class="stat-label">客户数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📋</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getOrderCount()}</div>
                        <div class="stat-label">订单总数</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="tabs" style="margin-bottom: 0; border-bottom: none;">
                        <div class="tab-item ${this.currentTab === 'records' ? 'active' : ''}" data-tab="records">销售台账</div>
                        <div class="tab-item ${this.currentTab === 'products' ? 'active' : ''}" data-tab="products">产品管理</div>
                    </div>
                    <button class="btn btn-primary" onclick="SalesPage.openAddModal()">
                        <span>+</span> ${this.currentTab === 'records' ? '新增销售' : '新增产品'}
                    </button>
                </div>
                <div class="card-body">
                    ${this.currentTab === 'records' ? this.renderRecordsTable() : this.renderProductsTable()}
                </div>
            </div>

            ${this.currentTab === 'records' ? this.renderMonthlyStats() : ''}
        `;
    },

    getFilteredRecords() {
        const records = Storage.get('salesRecords') || [];
        const { keyword, paymentMethod, status, dateStart, dateEnd } = this.filterConditions;

        return records.filter(item => {
            if (keyword) {
                const kw = keyword.toLowerCase();
                const matchName = (item.customerName || '').toLowerCase().includes(kw);
                const matchProduct = (item.productName || '').toLowerCase().includes(kw);
                const matchPhone = (item.customerPhone || '').includes(kw);
                const matchOrder = (item.orderNo || '').toLowerCase().includes(kw);
                if (!matchName && !matchProduct && !matchPhone && !matchOrder) return false;
            }

            if (paymentMethod && item.paymentMethod !== paymentMethod) return false;

            if (status && item.status !== status) return false;

            if (dateStart && new Date(item.createdAt) < new Date(dateStart)) return false;
            if (dateEnd) {
                const end = new Date(dateEnd);
                end.setHours(23, 59, 59, 999);
                if (new Date(item.createdAt) > end) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    renderRecordsTable() {
        const records = this.getFilteredRecords();

        if (records.length === 0) {
            return `
                <div class="filter-bar">
                    <input type="text" id="salesSearch" placeholder="搜索客户/产品/订单号..." style="width: 220px;">
                    <select id="statusFilter">
                        <option value="">全部状态</option>
                        <option value="completed">已完成</option>
                        <option value="pending">待付款</option>
                        <option value="cancelled">已取消</option>
                        <option value="refunded">已退款</option>
                    </select>
                    <select id="paymentFilter">
                        <option value="">全部支付方式</option>
                        <option value="微信">微信</option>
                        <option value="支付宝">支付宝</option>
                        <option value="现金">现金</option>
                        <option value="银行卡">银行卡</option>
                        <option value="赊账">赊账</option>
                    </select>
                    <input type="date" id="salesDateStart">
                    <span>至</span>
                    <input type="date" id="salesDateEnd">
                    <button class="btn btn-secondary btn-sm" onclick="SalesPage.applyFilter()">查询</button>
                    <button class="btn btn-secondary btn-sm" onclick="SalesPage.resetFilter()">重置</button>
                </div>
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-text">暂无销售记录</div>
                </div>
            `;
        }

        return `
            <div class="filter-bar">
                <input type="text" id="salesSearch" placeholder="搜索客户/产品/订单号..." style="width: 220px;" value="${Utils.escapeHtml(this.filterConditions.keyword)}">
                <select id="statusFilter">
                    <option value="">全部状态</option>
                    <option value="completed" ${this.filterConditions.status === 'completed' ? 'selected' : ''}>已完成</option>
                    <option value="pending" ${this.filterConditions.status === 'pending' ? 'selected' : ''}>待付款</option>
                    <option value="cancelled" ${this.filterConditions.status === 'cancelled' ? 'selected' : ''}>已取消</option>
                    <option value="refunded" ${this.filterConditions.status === 'refunded' ? 'selected' : ''}>已退款</option>
                </select>
                <select id="paymentFilter">
                    <option value="">全部支付方式</option>
                    <option value="微信" ${this.filterConditions.paymentMethod === '微信' ? 'selected' : ''}>微信</option>
                    <option value="支付宝" ${this.filterConditions.paymentMethod === '支付宝' ? 'selected' : ''}>支付宝</option>
                    <option value="现金" ${this.filterConditions.paymentMethod === '现金' ? 'selected' : ''}>现金</option>
                    <option value="银行卡" ${this.filterConditions.paymentMethod === '银行卡' ? 'selected' : ''}>银行卡</option>
                    <option value="赊账" ${this.filterConditions.paymentMethod === '赊账' ? 'selected' : ''}>赊账</option>
                </select>
                <input type="date" id="salesDateStart" value="${this.filterConditions.dateStart}">
                <span>至</span>
                <input type="date" id="salesDateEnd" value="${this.filterConditions.dateEnd}">
                <button class="btn btn-secondary btn-sm" onclick="SalesPage.applyFilter()">查询</button>
                <button class="btn btn-secondary btn-sm" onclick="SalesPage.resetFilter()">重置</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>日期</th>
                            <th>客户姓名</th>
                            <th>联系电话</th>
                            <th>产品名称</th>
                            <th>规格</th>
                            <th>数量(瓶)</th>
                            <th>单价(元)</th>
                            <th>总金额(元)</th>
                            <th>支付方式</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(item => `
                            <tr>
                                <td>${item.orderNo}</td>
                                <td>${Utils.formatDate(item.createdAt)}</td>
                                <td>${Utils.escapeHtml(item.customerName)}</td>
                                <td>${Utils.escapeHtml(item.customerPhone || '-')}</td>
                                <td>${Utils.escapeHtml(item.productName)}</td>
                                <td>${item.spec || '-'}</td>
                                <td>${item.quantity}</td>
                                <td>${Utils.formatNumber(item.unitPrice, 2)}</td>
                                <td style="font-weight: 700; color: #689f38;">${Utils.formatNumber(item.totalAmount, 2)}</td>
                                <td>${this.getPaymentBadge(item.paymentMethod)}</td>
                                <td>${this.getStatusBadge(item.status)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-outline btn-sm" onclick="SalesPage.viewRecord('${item.id}')">查看</button>
                                        ${(item.status === 'completed' && !item.stockRestored) ? `
                                            <button class="btn btn-warning btn-sm" onclick="SalesPage.openCancelOrRefundModal('${item.id}', 'refund')">退货</button>
                                        ` : ''}
                                        ${(item.status === 'pending' && !item.stockRestored) ? `
                                            <button class="btn btn-secondary btn-sm" onclick="SalesPage.openCancelOrRefundModal('${item.id}', 'cancel')">取消</button>
                                        ` : ''}
                                        ${(item.status !== 'cancelled' && item.status !== 'refunded') ? `
                                            <button class="btn btn-secondary btn-sm" onclick="SalesPage.editRecord('${item.id}')">编辑</button>
                                        ` : ''}
                                        <button class="btn btn-danger btn-sm" onclick="SalesPage.deleteRecord('${item.id}')">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderProductsTable() {
        const products = this.getFilteredProducts();
        const lowStockCount = (Storage.get('products') || []).filter(p => (p.stock || 0) <= 10).length;

        if (products.length === 0) {
            return `
                <div class="filter-bar">
                    <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                        <input type="checkbox" id="onlyShowLowStock" 
                               ${this.onlyShowLowStockProducts ? 'checked' : ''} 
                               onchange="SalesPage.toggleLowStockFilter(this.checked)">
                        <span>只看低库存产品（≤10瓶，共 ${lowStockCount} 种）</span>
                    </label>
                </div>
                <div class="empty-state"><div class="empty-state-icon">🏷️</div><div class="empty-state-text">暂无产品</div></div>
            `;
        }

        return `
            <div class="filter-bar">
                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="onlyShowLowStock" 
                           ${this.onlyShowLowStockProducts ? 'checked' : ''} 
                           onchange="SalesPage.toggleLowStockFilter(this.checked)">
                    <span>只看低库存产品（≤10瓶，共 ${lowStockCount} 种）</span>
                </label>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>产品名称</th>
                            <th>规格</th>
                            <th>单价(元)</th>
                            <th>库存(瓶)</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(item => {
                            const isLowStock = item.stock <= 10;
                            return `
                                <tr>
                                    <td>${Utils.escapeHtml(item.name)}</td>
                                    <td>${item.spec || '-'}</td>
                                    <td style="font-weight: 600; color: #ff9800;">${Utils.formatNumber(item.price, 2)}</td>
                                    <td style="font-weight: 600; color: ${isLowStock ? '#f44336' : '#333'};">${item.stock || 0}</td>
                                    <td>
                                        ${item.stock > 10 ? '<span class="badge badge-success">有货</span>' : 
                                          item.stock > 0 ? '<span class="badge badge-warning">库存低</span>' : 
                                          '<span class="badge badge-danger">缺货</span>'}
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-outline btn-sm" onclick="SalesPage.viewProductDetail('${item.id}')">详情</button>
                                            <button class="btn btn-secondary btn-sm" onclick="SalesPage.adjustProductStock('${item.id}')">调库存</button>
                                            <button class="btn btn-secondary btn-sm" onclick="SalesPage.editProduct('${item.id}')">编辑</button>
                                            <button class="btn btn-danger btn-sm" onclick="SalesPage.deleteProduct('${item.id}')">删除</button>
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

    toggleLowStockFilter(checked) {
        this.onlyShowLowStockProducts = checked;
        this.refresh();
    },

    viewProductDetail(productId) {
        const product = Storage.findById('products', productId);
        if (!product) return;

        this.productStockLogFilter = {
            productId: productId,
            changeType: '',
            dateStart: '',
            dateEnd: ''
        };

        this.renderProductDetailModal(product);
    },

    renderProductDetailModal(product) {
        const logs = Storage.getStockLogs(this.productStockLogFilter);
        const totalIn = logs.filter(l => l.changeType === 'in').reduce((s, l) => s + l.change, 0);
        const totalOut = logs.filter(l => l.changeType === 'out').reduce((s, l) => s + Math.abs(l.change), 0);
        const totalAdjust = logs.filter(l => l.changeType === 'adjust').reduce((s, l) => s + l.change, 0);

        const logsHtml = logs.length === 0 
            ? `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">暂无库存流水</div></div></td></tr>`
            : logs.map(log => {
                const typeMap = {
                    in: { text: '入库', class: 'badge-success', sign: '+' },
                    out: { text: '出库', class: 'badge-danger', sign: '-' },
                    adjust: { text: '调整', class: log.change >= 0 ? 'badge-warning' : 'badge-info', sign: log.change >= 0 ? '+' : '' }
                };
                const t = typeMap[log.changeType] || { text: log.changeType, class: 'badge-secondary', sign: '' };
                return `
                    <tr>
                        <td>${Utils.formatDateTime(log.createdAt)}</td>
                        <td><span class="badge ${t.class}">${t.text}</span></td>
                        <td style="font-weight: 600; color: ${log.change >= 0 ? '#4caf50' : '#f44336'};">${t.sign}${log.change}</td>
                        <td>${log.stockBefore} → ${log.stockAfter}</td>
                        <td>${Utils.escapeHtml(log.reason || '-')}</td>
                        <td>${Utils.escapeHtml(log.operator || '-')}</td>
                    </tr>
                `;
            }).join('');

        const content = `
            <div style="margin-bottom: 20px;">
                <div class="info-grid" style="grid-template-columns: repeat(4, 1fr);">
                    <div class="info-item">
                        <span class="label">产品名称</span>
                        <span class="value">${Utils.escapeHtml(product.name)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">规格</span>
                        <span class="value">${product.spec || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">单价</span>
                        <span class="value">¥${Utils.formatNumber(product.price, 2)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">当前库存</span>
                        <span class="value" style="font-weight: 600; color: ${(product.stock || 0) <= 10 ? '#f44336' : '#4caf50'};">${product.stock || 0} 瓶</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 16px; padding: 12px 16px; background: #f9f9f9; border-radius: 8px; display: flex; gap: 24px;">
                <div><span style="color: #666;">累计入库：</span><span style="color: #4caf50; font-weight: 600;">+${totalIn} 瓶</span></div>
                <div><span style="color: #666;">累计出库：</span><span style="color: #f44336; font-weight: 600;">-${totalOut} 瓶</span></div>
                <div><span style="color: #666;">手工调整：</span><span style="color: #ff9800; font-weight: 600;">${totalAdjust >= 0 ? '+' : ''}${totalAdjust} 瓶</span></div>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 16px;">
                <h4 style="margin: 0 0 12px 0; font-size: 15px;">库存流水记录</h4>
                <div class="filter-bar" style="margin-bottom: 12px;">
                    <select onchange="SalesPage.filterProductStockLogs('changeType', this.value)" style="min-width: 120px;">
                        <option value="">全部类型</option>
                        <option value="in" ${this.productStockLogFilter.changeType === 'in' ? 'selected' : ''}>入库</option>
                        <option value="out" ${this.productStockLogFilter.changeType === 'out' ? 'selected' : ''}>出库</option>
                        <option value="adjust" ${this.productStockLogFilter.changeType === 'adjust' ? 'selected' : ''}>调整</option>
                    </select>
                    <input type="date" value="${this.productStockLogFilter.dateStart}" 
                           onchange="SalesPage.filterProductStockLogs('dateStart', this.value)">
                    <span>至</span>
                    <input type="date" value="${this.productStockLogFilter.dateEnd}" 
                           onchange="SalesPage.filterProductStockLogs('dateEnd', this.value)">
                    <button class="btn btn-secondary btn-sm" onclick="SalesPage.filterProductStockLogs('reset', '')">重置</button>
                </div>
                <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>类型</th>
                                <th>变动</th>
                                <th>库存变化</th>
                                <th>原因</th>
                                <th>操作人</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logsHtml}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
                <button type="button" class="btn btn-primary" onclick="Utils.hideModal(); SalesPage.adjustProductStock('${product.id}')">调整库存</button>
            </div>
        `;

        Utils.showModal(`产品详情 - ${product.name}`, content);
    },

    filterProductStockLogs(field, value) {
        if (field === 'reset') {
            this.productStockLogFilter = {
                ...this.productStockLogFilter,
                changeType: '',
                dateStart: '',
                dateEnd: ''
            };
        } else {
            this.productStockLogFilter[field] = value;
        }
        const product = Storage.findById('products', this.productStockLogFilter.productId);
        if (product) {
            this.renderProductDetailModal(product);
        }
    },

    adjustProductStock(productId) {
        const product = Storage.findById('products', productId);
        if (!product) return;

        const content = `
            <form id="adjustStockForm">
                <div class="info-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 16px;">
                    <div class="info-item">
                        <span class="label">产品名称</span>
                        <span class="value">${Utils.escapeHtml(product.name)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">当前库存</span>
                        <span class="value" style="font-weight: 600; color: #2196f3;">${product.stock || 0} 瓶</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>调整方式 *</label>
                    <select id="adjustType" name="adjustType" onchange="SalesPage.updateAdjustHint()" required>
                        <option value="set">直接设为（覆盖当前值）</option>
                        <option value="add">增加</option>
                        <option value="sub">减少</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>数量(瓶) *</label>
                    <input type="number" id="adjustValue" name="adjustValue" min="0" value="0" required 
                           oninput="SalesPage.updateAdjustHint()">
                    <div id="adjustHint" style="margin-top: 4px; font-size: 13px; color: #666;">
                        调整后库存：<strong style="color: #2196f3;">${product.stock || 0} 瓶</strong>
                    </div>
                </div>
                <div class="form-group">
                    <label>调整原因 *</label>
                    <input type="text" id="adjustReason" name="reason" placeholder="如：盘点差异、破损报损、赠品出库等" required>
                </div>
                <div class="form-group">
                    <label>操作人</label>
                    <input type="text" name="operator" placeholder="请输入操作人姓名">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认调整</button>
                </div>
            </form>
        `;

        Utils.showModal('调整库存', content);

        const form = document.getElementById('adjustStockForm');
        const adjustPage = this;
        form._currentProduct = { id: productId, stock: product.stock || 0 };
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('adjustStockForm');

            const formData = new FormData(form);
            const adjustType = formData.get('adjustType');
            const adjustValue = parseInt(formData.get('adjustValue')) || 0;
            const reason = formData.get('reason');
            const operator = formData.get('operator');
            const currentStock = form._currentProduct.stock;

            if (!reason) {
                Utils.showFieldError('adjustReason', '请填写调整原因');
                return;
            }
            if (adjustValue < 0) {
                Utils.showFieldError('adjustValue', '调整数量不能为负数');
                return;
            }

            let newStock;
            if (adjustType === 'set') {
                newStock = adjustValue;
            } else if (adjustType === 'add') {
                newStock = currentStock + adjustValue;
            } else {
                newStock = currentStock - adjustValue;
            }

            if (newStock < 0) {
                Utils.showFieldError('adjustValue', '调整后库存不能为负数');
                return;
            }

            const result = Storage.adjustProductStock(productId, newStock, reason, operator);
            if (result.success) {
                Utils.hideModal();
                Utils.toast(result.unchanged ? '库存未变化' : '库存调整成功', 'success');
                adjustPage.refresh();
                App.updateSidebarStats();
            } else {
                Utils.toast(result.message || '调整失败', 'error');
            }
        });
    },

    updateAdjustHint() {
        const form = document.getElementById('adjustStockForm');
        if (!form) return;
        const type = document.getElementById('adjustType').value;
        const value = parseInt(document.getElementById('adjustValue').value) || 0;
        const current = form._currentProduct?.stock || 0;
        let newStock;
        if (type === 'set') newStock = value;
        else if (type === 'add') newStock = current + value;
        else newStock = current - value;
        const hint = document.getElementById('adjustHint');
        if (hint) {
            const color = newStock < 0 ? '#f44336' : (newStock <= 10 ? '#ff9800' : '#4caf50');
            hint.innerHTML = `调整后库存：<strong style="color: ${color};">${newStock} 瓶</strong>${newStock < 0 ? '（不能为负）' : ''}`;
        }
    },

    renderMonthlyStats() {
        const records = Storage.get('salesRecords') || [];
        const monthlyData = {};

        records.filter(r => r.status !== 'cancelled' && r.status !== 'refunded').forEach(r => {
            const month = Utils.formatDate(r.createdAt, 'YYYY-MM');
            if (!monthlyData[month]) {
                monthlyData[month] = { amount: 0, count: 0 };
            }
            monthlyData[month].amount += r.totalAmount || 0;
            monthlyData[month].count += 1;
        });

        const months = Object.keys(monthlyData).sort().slice(-6);
        if (months.length === 0) return '';

        const maxAmount = Math.max(...months.map(m => monthlyData[m].amount), 1);
        const bars = months.map(month => {
            const height = (monthlyData[month].amount / maxAmount) * 100;
            return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                    <div style="font-size: 12px; color: #689f38; font-weight: 600; margin-bottom: 4px;">¥${(monthlyData[month].amount / 1000).toFixed(1)}k</div>
                    <div style="width: 32px; height: ${height}%; background: linear-gradient(180deg, #8bc34a 0%, #689f38 100%); border-radius: 4px 4px 0 0; min-height: 8px;"></div>
                    <div style="font-size: 12px; color: #999; margin-top: 8px;">${month}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h3>销售趋势</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container" style="height: 180px;">
                        ${bars}
                    </div>
                </div>
            </div>
        `;
    },

    getStatusBadge(status) {
        const map = {
            completed: { text: '已完成', class: 'badge-success' },
            pending: { text: '待付款', class: 'badge-warning' },
            cancelled: { text: '已取消', class: 'badge-secondary' },
            refunded: { text: '已退款', class: 'badge-danger' }
        };
        const s = map[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getPaymentBadge(method) {
        const map = {
            '微信': { class: 'badge-success' },
            '支付宝': { class: 'badge-info' },
            '现金': { class: 'badge-warning' },
            '银行卡': { class: 'badge-secondary' },
            '赊账': { class: 'badge-danger' }
        };
        const s = map[method] || { class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${method || '-'}</span>`;
    },

    getTotalSales() {
        const records = Storage.get('salesRecords') || [];
        return records.filter(r => r.status !== 'cancelled' && r.status !== 'refunded')
            .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    },

    getTotalQuantity() {
        const records = Storage.get('salesRecords') || [];
        return records.filter(r => r.status !== 'cancelled' && r.status !== 'refunded')
            .reduce((sum, r) => sum + (r.quantity || 0), 0);
    },

    getCustomerCount() {
        const records = Storage.get('salesRecords') || [];
        const customers = new Set(records.map(r => r.customerName));
        return customers.size;
    },

    getOrderCount() {
        const records = Storage.get('salesRecords') || [];
        return records.length;
    },

    getFilteredProducts() {
        let products = Storage.get('products') || [];
        if (this.onlyShowLowStockProducts) {
            products = products.filter(p => (p.stock || 0) <= 10);
        }
        return products;
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.refresh();
    },

    applyFilter() {
        this.filterConditions.keyword = document.getElementById('salesSearch').value.trim();
        this.filterConditions.paymentMethod = document.getElementById('paymentFilter').value;
        this.filterConditions.status = document.getElementById('statusFilter').value;
        this.filterConditions.dateStart = document.getElementById('salesDateStart').value;
        this.filterConditions.dateEnd = document.getElementById('salesDateEnd').value;
        this.refresh();
    },

    resetFilter() {
        this.filterConditions = {
            keyword: '',
            paymentMethod: '',
            status: '',
            dateStart: '',
            dateEnd: ''
        };
        this.refresh();
    },

    clearNavFilter() {
        this.filterConditions = {
            keyword: '',
            paymentMethod: '',
            status: '',
            dateStart: '',
            dateEnd: ''
        };
        this.onlyShowLowStockProducts = false;
        this.refresh();
    },

    openAddModal() {
        if (this.currentTab === 'records') {
            this.openSaleModal();
        } else {
            this.openProductModal();
        }
    },

    openSaleModal() {
        const products = Storage.get('products') || [];
        const productOptions = products.map(p => 
            `<option value="${p.id}" data-price="${p.price}" data-spec="${p.spec}" data-name="${p.name}" data-stock="${p.stock || 0}">
                ${p.name} (${p.spec}) - ¥${p.price} - 库存${p.stock || 0}瓶
            </option>`
        ).join('');

        const content = `
            <form id="saleForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>订单号</label>
                        <input type="text" name="orderNo" value="${Utils.generateBatchNo('XS')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>客户姓名 *</label>
                        <input type="text" id="customerName" name="customerName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>联系电话</label>
                    <input type="tel" id="customerPhone" name="customerPhone">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>产品 *</label>
                        <select id="productSelect" name="productId" required onchange="SalesPage.onProductChange()">
                            <option value="">请选择产品</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>数量(瓶) *</label>
                        <input type="number" id="saleQuantity" name="quantity" min="1" value="1" required oninput="SalesPage.calcTotal()">
                    </div>
                </div>
                <div class="form-group">
                    <label>出库灌装批次 *</label>
                    <select id="bottlingSelect" name="bottlingId" required>
                        <option value="">请先选择产品</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>单价(元)</label>
                        <input type="number" id="saleUnitPrice" name="unitPrice" step="0.01" min="0" value="0" oninput="SalesPage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>总金额(元)</label>
                        <input type="text" id="saleTotalAmount" name="totalAmount" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>支付方式</label>
                        <select name="paymentMethod">
                            <option value="微信">微信</option>
                            <option value="支付宝">支付宝</option>
                            <option value="现金">现金</option>
                            <option value="银行卡">银行卡</option>
                            <option value="赊账">赊账</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select id="saleStatus" name="status">
                            <option value="completed">已完成</option>
                            <option value="pending">待付款</option>
                        </select>
                    </div>
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

        Utils.showModal('新增销售记录', content);

        const form = document.getElementById('saleForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('saleForm');

            const formData = new FormData(form);
            const productId = formData.get('productId');
            const bottlingId = formData.get('bottlingId');
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(formData.get('quantity')) || 0;
            const unitPrice = parseFloat(formData.get('unitPrice')) || 0;
            const status = formData.get('status');

            const nameCheck = Utils.validate.notEmpty(formData.get('customerName'), '客户姓名');
            if (!nameCheck.valid) {
                Utils.showFieldError('customerName', nameCheck.message);
                return;
            }

            const phoneCheck = Utils.validate.phone(formData.get('customerPhone'));
            if (!phoneCheck.valid) {
                Utils.showFieldError('customerPhone', phoneCheck.message);
                return;
            }

            const qtyCheck = Utils.validate.positiveNumber(quantity, '数量');
            if (!qtyCheck.valid) {
                Utils.showFieldError('saleQuantity', qtyCheck.message);
                return;
            }

            if (!bottlingId) {
                Utils.showFieldError('saleQuantity', '请选择出库灌装批次');
                return;
            }

            const bottling = Storage.findById('bottlingRecords', bottlingId);
            if (!bottling) {
                Utils.showFieldError('saleQuantity', '所选灌装批次不存在');
                return;
            }

            const remainingQty = (bottling.bottleCount || 0) - (bottling._soldCount || 0);
            if (quantity > remainingQty) {
                Utils.showFieldError('saleQuantity', `该批次剩余${remainingQty}瓶，不足${quantity}瓶`);
                return;
            }

            if (status === 'completed') {
                const stockResult = Storage.updateProductStock(
                    productId, 
                    -quantity, 
                    `销售出库 - 订单 ${formData.get('orderNo')}`,
                    { relatedId: bottlingId }
                );
                if (!stockResult.success) {
                    Utils.showFieldError('saleQuantity', stockResult.message || '库存不足');
                    return;
                }
            }

            const data = {
                orderNo: formData.get('orderNo'),
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                productId: productId,
                bottlingId: bottlingId,
                productName: product ? product.name : '',
                spec: product ? product.spec : '',
                quantity: quantity,
                unitPrice: unitPrice,
                totalAmount: quantity * unitPrice,
                paymentMethod: formData.get('paymentMethod'),
                status: status,
                stockDeducted: status === 'completed',
                remark: formData.get('remark'),
                processLogs: [{
                    id: Storage.generateId ? Storage.generateId() : Date.now().toString(),
                    type: 'create',
                    reason: '创建销售订单',
                    time: new Date().toISOString(),
                    operator: ''
                }]
            };

            Storage.add('salesRecords', data);
            
            const allBottling = Storage.get('bottlingRecords') || [];
            const bIdx = allBottling.findIndex(b => b.id === bottlingId);
            if (bIdx !== -1) {
                allBottling[bIdx]._soldCount = (allBottling[bIdx]._soldCount || 0) + quantity;
                Storage.set('bottlingRecords', allBottling);
            }
            
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    onProductChange() {
        const form = document.getElementById('saleForm');
        if (!form) return;
        const select = form.productId;
        const option = select.options[select.selectedIndex];
        if (option && option.dataset.price) {
            form.unitPrice.value = option.dataset.price;
            this.calcTotal();
        }
        
        const bottlingSelect = form.bottlingId;
        if (bottlingSelect) {
            const productId = select.value;
            if (!productId) {
                bottlingSelect.innerHTML = '<option value="">请先选择产品</option>';
                return;
            }
            const allBottling = Storage.get('bottlingRecords') || [];
            const productBottling = allBottling.filter(b => b.productId === productId && b.status === 'completed');
            if (productBottling.length === 0) {
                bottlingSelect.innerHTML = '<option value="">该产品暂无可用灌装批次</option>';
                return;
            }
            bottlingSelect.innerHTML = '<option value="">请选择出库批次</option>' + 
                productBottling.map(b => {
                    const remaining = (b.bottleCount || 0) - (b._soldCount || 0);
                    return `<option value="${b.id}" data-batchno="${b.batchNo}" data-remaining="${remaining}">
                        ${b.batchNo} - ${b.bottleSpec} - 剩余${remaining}瓶 - ${Utils.formatDate(b.createdAt)}
                    </option>`;
                }).join('');
        }
    },

    calcTotal() {
        const form = document.getElementById('saleForm');
        if (!form) return;
        const quantity = parseInt(form.quantity.value) || 0;
        const price = parseFloat(form.unitPrice.value) || 0;
        const total = (quantity * price).toFixed(2);
        if (form.totalAmount) {
            form.totalAmount.value = total;
        }
    },

    viewRecord(id) {
        const item = Storage.findById('salesRecords', id);
        if (!item) return;

        const product = item.productId ? Storage.findById('products', item.productId) : null;
        const logs = item.processLogs || [];
        const traceData = Storage.getFullBatchChainFromSale(id);
        const chain = traceData.chain || [];

        const logsHtml = logs.length === 0 
            ? `<div class="empty-state" style="padding: 20px;"><div class="empty-state-icon">📝</div><div class="empty-state-text">暂无处理记录</div></div>`
            : logs.map(log => {
                const typeMap = {
                    create: { text: '创建订单', class: 'badge-info', icon: '➕' },
                    edit: { text: '编辑订单', class: 'badge-secondary', icon: '✏️' },
                    cancel: { text: '取消订单', class: 'badge-secondary', icon: '❌' },
                    refund: { text: '退货退款', class: 'badge-danger', icon: '↩️' },
                    stock_restore: { text: '库存恢复', class: 'badge-success', icon: '📦' }
                };
                const t = typeMap[log.type] || { text: log.type, class: 'badge-secondary', icon: '📌' };
                let extra = '';
                if (log.stockRestored) {
                    extra = `<div style="margin-top: 6px; font-size: 12px; color: #4caf50;">库存已恢复：+${log.quantity} 瓶</div>`;
                }
                return `
                    <div style="padding: 12px; background: #f9f9f9; border-radius: 8px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span class="badge ${t.class}">${t.icon} ${t.text}</span>
                                <span style="margin-left: 10px; font-size: 13px; color: #666;">${Utils.formatDateTime(log.time)}</span>
                                ${log.operator ? `<span style="margin-left: 10px; font-size: 13px; color: #999;">操作人：${Utils.escapeHtml(log.operator)}</span>` : ''}
                            </div>
                        </div>
                        ${log.reason ? `<div style="margin-top: 8px; font-size: 14px;">原因：${Utils.escapeHtml(log.reason)}</div>` : ''}
                        ${extra}
                    </div>
                `;
            }).join('');

        const chainHtml = chain.length === 0
            ? `<div class="empty-state" style="padding: 20px;"><div class="empty-state-icon">🔗</div><div class="empty-state-text">暂无批次追溯信息</div></div>`
            : chain.map((step, idx) => {
                const weightFieldMap = {
                    bottlingRecords: 'bottledQuantity',
                    refiningRecords: 'refinedOilWeight',
                    filteringRecords: 'filteredOilWeight',
                    pressingRecords: 'crudeOilWeight',
                    roastingRecords: 'kernelWeight',
                    shellingRecords: 'kernelWeight',
                    dryingRecords: 'driedWeight',
                    purchases: 'weight'
                };
                const wf = weightFieldMap[step.type] || 'weight';
                const weight = step.data[wf] || step.data.weight || 0;
                const statusMap = {
                    completed: '<span class="badge badge-success">已完成</span>',
                    processing: '<span class="badge badge-warning">进行中</span>',
                    pending: '<span class="badge badge-info">待处理</span>'
                };
                const statusBadge = statusMap[step.status] || (step.status ? `<span class="badge badge-secondary">${step.status}</span>` : '');
                return `
                    <div style="display: flex; align-items: flex-start; margin-bottom: ${idx < chain.length - 1 ? '0' : '0'};">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #8bc34a 0%, #689f38 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; margin-right: 12px;">
                            ${idx + 1}
                        </div>
                        <div style="flex: 1; padding-bottom: ${idx < chain.length - 1 ? '20px' : '0'}; position: relative;">
                            ${idx < chain.length - 1 ? `<div style="position: absolute; left: 16px; top: 40px; bottom: 0; width: 2px; background: #e0e0e0;"></div>` : ''}
                            <div style="padding: 12px; background: #f5f7fa; border-radius: 8px; border-left: 4px solid #689f38;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span style="font-weight: 700; color: #333;">${step.label}</span>
                                    ${statusBadge}
                                </div>
                                <div style="font-size: 13px; color: #666; margin-bottom: 4px;">
                                    批次号：<strong>${step.batchNo || '-'}</strong>
                                </div>
                                ${weight ? `<div style="font-size: 13px; color: #4caf50;">重量：${weight} kg</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        const content = `
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">订单号</span>
                    <span class="value">${item.orderNo}</span>
                </div>
                <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value">${this.getStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">客户姓名</span>
                    <span class="value">${Utils.escapeHtml(item.customerName)}</span>
                </div>
                <div class="info-item">
                    <span class="label">联系电话</span>
                    <span class="value">${Utils.escapeHtml(item.customerPhone || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">产品名称</span>
                    <span class="value">${Utils.escapeHtml(item.productName)}</span>
                </div>
                <div class="info-item">
                    <span class="label">规格</span>
                    <span class="value">${item.spec || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">数量</span>
                    <span class="value">${item.quantity} 瓶</span>
                </div>
                <div class="info-item">
                    <span class="label">单价</span>
                    <span class="value">${Utils.formatMoney(item.unitPrice)}</span>
                </div>
                <div class="info-item">
                    <span class="label">总金额</span>
                    <span class="value" style="color: #689f38; font-weight: 700; font-size: 18px;">${Utils.formatMoney(item.totalAmount)}</span>
                </div>
                <div class="info-item">
                    <span class="label">支付方式</span>
                    <span class="value">${this.getPaymentBadge(item.paymentMethod)}</span>
                </div>
                <div class="info-item">
                    <span class="label">库存扣减</span>
                    <span class="value">${item.stockDeducted ? '<span class="badge badge-success">已扣减</span>' : '<span class="badge badge-warning">未扣减</span>'}</span>
                </div>
                <div class="info-item">
                    <span class="label">出库批次</span>
                    <span class="value">${item.bottlingId ? traceData.bottling ? traceData.bottling.batchNo : item.bottlingId : '未指定'}</span>
                </div>
                <div class="info-item">
                    <span class="label">销售时间</span>
                    <span class="value">${Utils.formatDateTime(item.createdAt)}</span>
                </div>
                <div class="info-item">
                    <span class="label">库存恢复</span>
                    <span class="value">${item.stockRestored ? '<span class="badge badge-success">已恢复</span>' : '<span class="badge badge-secondary">未恢复</span>'}</span>
                </div>
            </div>
            ${product ? `
                <div class="section-title" style="margin-top: 20px;">产品库存</div>
                <div style="padding: 12px; background: #f5f7fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #666;">当前库存：</span>
                    <span style="font-weight: 700; font-size: 18px; color: ${product.stock > 10 ? '#689f38' : product.stock > 0 ? '#ff9800' : '#f44336'};">${product.stock || 0} 瓶</span>
                </div>
            ` : ''}
            <div class="section-title" style="margin-top: 20px;">批次追溯链路</div>
            <div style="max-height: 320px; overflow-y: auto; padding: 8px;">
                ${chainHtml}
            </div>
            <div class="section-title" style="margin-top: 20px;">处理记录</div>
            <div style="max-height: 240px; overflow-y: auto;">
                ${logsHtml}
            </div>
            ${item.remark ? `
                <div class="section-title" style="margin-top: 20px;">备注</div>
                <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
            ` : ''}
            <div class="modal-footer" style="margin-top: 20px;">
                ${(item.status === 'completed' && !item.stockRestored) ? `
                    <button class="btn btn-warning" onclick="Utils.hideModal(); SalesPage.openCancelOrRefundModal('${item.id}', 'refund')">退货退款</button>
                ` : ''}
                ${(item.status === 'pending' && !item.stockRestored) ? `
                    <button class="btn btn-secondary" onclick="Utils.hideModal(); SalesPage.openCancelOrRefundModal('${item.id}', 'cancel')">取消订单</button>
                ` : ''}
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('销售详情', content);
    },

    openCancelOrRefundModal(saleId, actionType) {
        const sale = Storage.findById('salesRecords', saleId);
        if (!sale) return;

        if (sale.status === 'refunded' || sale.status === 'cancelled' || sale.stockRestored) {
            Utils.toast('该订单已处理，无法重复操作', 'warning');
            return;
        }

        const isRefund = actionType === 'refund';
        const title = isRefund ? '退货退款' : '取消订单';
        const hintText = isRefund
            ? `将退还 ¥${Utils.formatNumber(sale.totalAmount, 2)}${sale.stockDeducted ? `，并恢复 ${sale.quantity} 瓶库存` : ''}`
            : (sale.stockDeducted ? `将恢复 ${sale.quantity} 瓶库存` : '订单状态变更为已取消');

        const content = `
            <form id="cancelRefundForm">
                <div class="info-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 16px;">
                    <div class="info-item">
                        <span class="label">订单号</span>
                        <span class="value">${sale.orderNo}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">客户姓名</span>
                        <span class="value">${Utils.escapeHtml(sale.customerName)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">产品</span>
                        <span class="value">${Utils.escapeHtml(sale.productName)} ${sale.spec || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">数量</span>
                        <span class="value">${sale.quantity} 瓶</span>
                    </div>
                </div>
                <div style="padding: 12px 16px; background: ${isRefund ? '#fff8e1' : '#f5f5f5'}; border-radius: 8px; margin-bottom: 16px; color: #666;">
                    <strong>📌 ${title}说明：</strong>${hintText}
                </div>
                <div class="form-group">
                    <label>${title}原因 *</label>
                    <select name="reasonType" onchange="SalesPage.onReasonTypeChange(this.value)" required>
                        <option value="">请选择原因类型</option>
                        ${isRefund ? `
                            <option value="quality">质量问题</option>
                            <option value="wrong">发错产品/规格</option>
                            <option value="damaged">运输破损</option>
                            <option value="customer">客户不想要了</option>
                            <option value="expired">临期/过期</option>
                        ` : `
                            <option value="customer">客户取消</option>
                            <option value="stock">库存不足</option>
                            <option value="payment">未按时付款</option>
                            <option value="error">录入错误</option>
                        `}
                        <option value="other">其他原因</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>详细说明</label>
                    <textarea id="reasonDetail" name="reasonDetail" rows="3" placeholder="请填写详细说明（选填）"></textarea>
                </div>
                <div class="form-group">
                    <label>操作人</label>
                    <input type="text" name="operator" placeholder="请输入操作人姓名（选填）">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn ${isRefund ? 'btn-danger' : 'btn-secondary'}">确认${title}</button>
                </div>
            </form>
        `;

        Utils.showModal(title, content);

        const form = document.getElementById('cancelRefundForm');
        const salesPage = this;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('cancelRefundForm');

            const formData = new FormData(form);
            const reasonType = formData.get('reasonType');
            const reasonDetail = formData.get('reasonDetail');
            const operator = formData.get('operator');

            if (!reasonType) {
                Utils.showFieldError('reasonDetail', '请选择原因类型');
                return;
            }

            const reasonTypeMap = {
                quality: '质量问题', wrong: '发错产品/规格', damaged: '运输破损',
                customer: isRefund ? '客户不想要了' : '客户取消',
                expired: '临期/过期', stock: '库存不足',
                payment: '未按时付款', error: '录入错误', other: '其他原因'
            };
            let fullReason = reasonTypeMap[reasonType] || reasonType;
            if (reasonDetail) fullReason += ` - ${reasonDetail}`;

            const newStatus = isRefund ? 'refunded' : 'cancelled';
            const processLogs = sale.processLogs || [];
            let stockRestored = false;

            if (sale.stockDeducted && sale.productId) {
                const restoreResult = Storage.updateProductStock(
                    sale.productId, 
                    sale.quantity, 
                    `${isRefund ? '退货恢复' : '取消恢复'} - 订单 ${sale.orderNo}`,
                    { operator: operator, relatedId: sale.id }
                );
                if (restoreResult.success) {
                    stockRestored = true;
                    if (sale.bottlingId) {
                        const allBottling = Storage.get('bottlingRecords') || [];
                        const bIdx = allBottling.findIndex(b => b.id === sale.bottlingId);
                        if (bIdx !== -1) {
                            allBottling[bIdx]._soldCount = Math.max(0, (allBottling[bIdx]._soldCount || 0) - sale.quantity);
                            Storage.set('bottlingRecords', allBottling);
                        }
                    }
                }
            }

            Storage.update('salesRecords', saleId, {
                status: newStatus,
                stockDeducted: stockRestored ? false : sale.stockDeducted,
                stockRestored: stockRestored
            });

            const newLogs = [...processLogs];
            newLogs.push({
                id: Storage.generateId ? Storage.generateId() : Date.now().toString(),
                type: actionType,
                reason: fullReason,
                time: new Date().toISOString(),
                operator: operator
            });
            if (stockRestored) {
                newLogs.push({
                    id: (Storage.generateId ? Storage.generateId() : (Date.now() + 1).toString()),
                    type: 'stock_restore',
                    reason: `${isRefund ? '退货' : '取消订单'}恢复库存`,
                    quantity: sale.quantity,
                    stockRestored: true,
                    time: new Date().toISOString(),
                    operator: operator
                });
            }

            const updatedSale = Storage.findById('salesRecords', saleId);
            if (updatedSale) {
                updatedSale.processLogs = newLogs;
                const allSales = Storage.get('salesRecords') || [];
                const idx = allSales.findIndex(s => s.id === saleId);
                if (idx !== -1) {
                    allSales[idx] = updatedSale;
                    Storage.set('salesRecords', allSales);
                }
            }

            Utils.hideModal();
            Utils.toast(`${title}成功`, 'success');
            salesPage.refresh();
            App.updateSidebarStats();
        });
    },

    onReasonTypeChange(val) {
        const reasonTextarea = document.getElementById('reasonDetail');
        if (reasonTextarea && val === 'other') {
            reasonTextarea.placeholder = '请详细说明原因（必填）';
            reasonTextarea.required = true;
        } else if (reasonTextarea) {
            reasonTextarea.placeholder = '请填写详细说明（选填）';
            reasonTextarea.required = false;
        }
    },

    editRecord(id) {
        const item = Storage.findById('salesRecords', id);
        if (!item) return;

        const products = Storage.get('products') || [];
        const productOptions = products.map(p => 
            `<option value="${p.id}" data-price="${p.price}" data-spec="${p.spec}" data-name="${p.name}" data-stock="${p.stock || 0}" ${p.id === item.productId ? 'selected' : ''}>
                ${p.name} (${p.spec}) - ¥${p.price} - 库存${p.stock || 0}瓶
            </option>`
        ).join('');

        const content = `
            <form id="saleForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>订单号</label>
                        <input type="text" name="orderNo" value="${item.orderNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>客户姓名 *</label>
                        <input type="text" id="customerName" name="customerName" value="${Utils.escapeHtml(item.customerName)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>联系电话</label>
                    <input type="tel" id="customerPhone" name="customerPhone" value="${Utils.escapeHtml(item.customerPhone || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>产品 *</label>
                        <select id="productSelect" name="productId" required onchange="SalesPage.onProductChange()">
                            <option value="">请选择产品</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>数量(瓶) *</label>
                        <input type="number" id="saleQuantity" name="quantity" min="1" value="${item.quantity}" required oninput="SalesPage.calcTotal()">
                    </div>
                </div>
                <div class="form-group">
                    <label>出库灌装批次 *</label>
                    <select id="bottlingSelect" name="bottlingId" required>
                        <option value="">请先选择产品</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>单价(元)</label>
                        <input type="number" id="saleUnitPrice" name="unitPrice" step="0.01" min="0" value="${item.unitPrice}" oninput="SalesPage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>总金额(元)</label>
                        <input type="text" id="saleTotalAmount" name="totalAmount" value="${Utils.formatNumber(item.totalAmount, 2)}" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>支付方式</label>
                        <select name="paymentMethod">
                            <option value="微信" ${item.paymentMethod === '微信' ? 'selected' : ''}>微信</option>
                            <option value="支付宝" ${item.paymentMethod === '支付宝' ? 'selected' : ''}>支付宝</option>
                            <option value="现金" ${item.paymentMethod === '现金' ? 'selected' : ''}>现金</option>
                            <option value="银行卡" ${item.paymentMethod === '银行卡' ? 'selected' : ''}>银行卡</option>
                            <option value="赊账" ${item.paymentMethod === '赊账' ? 'selected' : ''}>赊账</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select id="saleStatus" name="status">
                            <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>
                            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>待付款</option>
                            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>已取消</option>
                            <option value="refunded" ${item.status === 'refunded' ? 'selected' : ''}>已退款</option>
                        </select>
                    </div>
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
        
        setTimeout(() => {
            SalesPage.onProductChange();
            const bottlingSelect = document.getElementById('bottlingSelect');
            if (bottlingSelect && item.bottlingId) {
                bottlingSelect.value = item.bottlingId;
            }
        }, 50);

        const form = document.getElementById('saleForm');
        const salesPage = this;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('saleForm');

            const formData = new FormData(form);
            const productId = formData.get('productId');
            const newBottlingId = formData.get('bottlingId');
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(formData.get('quantity')) || 0;
            const unitPrice = parseFloat(formData.get('unitPrice')) || 0;
            const newStatus = formData.get('status');

            const oldStatus = item.status;
            const statusGoingToCancelled = (oldStatus !== 'cancelled' && oldStatus !== 'refunded') && 
                                          (newStatus === 'cancelled' || newStatus === 'refunded');
            
            if (statusGoingToCancelled) {
                Utils.hideModal();
                const actionType = newStatus === 'refunded' ? 'refund' : 'cancel';
                setTimeout(() => {
                    salesPage.openCancelOrRefundModal(id, actionType);
                }, 100);
                return;
            }

            const nameCheck = Utils.validate.notEmpty(formData.get('customerName'), '客户姓名');
            if (!nameCheck.valid) {
                Utils.showFieldError('customerName', nameCheck.message);
                return;
            }

            const qtyCheck = Utils.validate.positiveNumber(quantity, '数量');
            if (!qtyCheck.valid) {
                Utils.showFieldError('saleQuantity', qtyCheck.message);
                return;
            }

            if (!newBottlingId) {
                Utils.showFieldError('saleQuantity', '请选择出库灌装批次');
                return;
            }

            const oldStockDeducted = item.stockDeducted;
            const newStockDeducted = newStatus === 'completed';
            const productChanged = productId !== item.productId;
            const quantityChanged = quantity !== item.quantity;
            const bottlingChanged = newBottlingId !== item.bottlingId;

            if (oldStockDeducted && (productChanged || quantityChanged || !newStockDeducted)) {
                const rollbackResult = Storage.updateProductStock(item.productId, item.quantity, `销售回滚 - 订单 ${item.orderNo}`);
                if (!rollbackResult.success) {
                    Utils.toast('库存回滚失败', 'error');
                    return;
                }
                if (item.bottlingId) {
                    const allBottling = Storage.get('bottlingRecords') || [];
                    const oldBIdx = allBottling.findIndex(b => b.id === item.bottlingId);
                    if (oldBIdx !== -1) {
                        allBottling[oldBIdx]._soldCount = Math.max(0, (allBottling[oldBIdx]._soldCount || 0) - item.quantity);
                        Storage.set('bottlingRecords', allBottling);
                    }
                }
            }

            if (newStockDeducted && (!oldStockDeducted || productChanged || quantityChanged || bottlingChanged)) {
                const deductResult = Storage.updateProductStock(productId, -quantity, `销售出库 - 订单 ${item.orderNo}`);
                if (!deductResult.success) {
                    Utils.showFieldError('saleQuantity', deductResult.message || '库存不足');
                    if (oldStockDeducted && (productChanged || quantityChanged)) {
                        Storage.updateProductStock(item.productId, -item.quantity, `销售恢复 - 订单 ${item.orderNo}`);
                        if (item.bottlingId) {
                            const allBottling = Storage.get('bottlingRecords') || [];
                            const oldBIdx = allBottling.findIndex(b => b.id === item.bottlingId);
                            if (oldBIdx !== -1) {
                                allBottling[oldBIdx]._soldCount = (allBottling[oldBIdx]._soldCount || 0) + item.quantity;
                                Storage.set('bottlingRecords', allBottling);
                            }
                        }
                    }
                    return;
                }
                const allBottling = Storage.get('bottlingRecords') || [];
                const newBIdx = allBottling.findIndex(b => b.id === newBottlingId);
                if (newBIdx !== -1) {
                    allBottling[newBIdx]._soldCount = (allBottling[newBIdx]._soldCount || 0) + quantity;
                    Storage.set('bottlingRecords', allBottling);
                }
            }

            const data = {
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                productId: productId,
                bottlingId: newBottlingId,
                productName: product ? product.name : '',
                spec: product ? product.spec : '',
                quantity: quantity,
                unitPrice: unitPrice,
                totalAmount: quantity * unitPrice,
                paymentMethod: formData.get('paymentMethod'),
                status: newStatus,
                stockDeducted: newStockDeducted,
                remark: formData.get('remark')
            };

            Storage.update('salesRecords', id, data);
            const updated = Storage.findById('salesRecords', id);
            if (updated) {
                const processLogs = updated.processLogs || [];
                const changedFields = [];
                if (productChanged) changedFields.push('产品');
                if (quantityChanged) changedFields.push('数量');
                if (oldStatus !== newStatus) changedFields.push(`状态(${oldStatus}→${newStatus})`);
                if (formData.get('customerName') !== item.customerName) changedFields.push('客户姓名');
                if (formData.get('paymentMethod') !== item.paymentMethod) changedFields.push('支付方式');
                if (unitPrice !== item.unitPrice) changedFields.push('单价');
                processLogs.push({
                    id: Storage.generateId ? Storage.generateId() : Date.now().toString(),
                    type: 'edit',
                    reason: changedFields.length ? `编辑订单：${changedFields.join('、')}` : '编辑订单',
                    time: new Date().toISOString(),
                    operator: ''
                });
                const allSales = Storage.get('salesRecords') || [];
                const sidx = allSales.findIndex(s => s.id === id);
                if (sidx !== -1) {
                    allSales[sidx].processLogs = processLogs;
                    Storage.set('salesRecords', allSales);
                }
            }
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    deleteRecord(id) {
        const item = Storage.findById('salesRecords', id);
        if (!item) return;

        const willRestoreStock = item.stockDeducted && item.productId && !item.stockRestored;
        const confirmText = willRestoreStock 
            ? `确定要删除这条销售记录吗？删除后将自动恢复 ${item.quantity} 瓶库存。`
            : '确定要删除这条销售记录吗？';

        if (!Utils.confirm(confirmText)) return;

        if (willRestoreStock) {
            Storage.updateProductStock(
                item.productId, 
                item.quantity, 
                `销售删除回滚 - 订单 ${item.orderNo}`
            );
        }
        
        if (item.bottlingId && !item.stockRestored) {
            const allBottling = Storage.get('bottlingRecords') || [];
            const bIdx = allBottling.findIndex(b => b.id === item.bottlingId);
            if (bIdx !== -1) {
                allBottling[bIdx]._soldCount = Math.max(0, (allBottling[bIdx]._soldCount || 0) - item.quantity);
                Storage.set('bottlingRecords', allBottling);
            }
        }

        Storage.delete('salesRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
        App.updateSidebarStats();
    },

    openProductModal() {
        const content = `
            <form id="productForm">
                <div class="form-group">
                    <label>产品名称 *</label>
                    <input type="text" id="productName" name="name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>规格</label>
                        <input type="text" name="spec" placeholder="如：500ml、1L">
                    </div>
                    <div class="form-group">
                        <label>单价(元) *</label>
                        <input type="number" id="productPrice" name="price" step="0.01" min="0" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>库存(瓶)</label>
                    <input type="number" name="stock" min="0" value="0">
                </div>
                <div class="form-group">
                    <label>产品描述</label>
                    <textarea name="description" rows="2"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认添加</button>
                </div>
            </form>
        `;

        Utils.showModal('新增产品', content);

        const form = document.getElementById('productForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('productForm');

            const formData = new FormData(form);
            const name = formData.get('name');
            const price = parseFloat(formData.get('price')) || 0;

            const nameCheck = Utils.validate.notEmpty(name, '产品名称');
            if (!nameCheck.valid) {
                Utils.showFieldError('productName', nameCheck.message);
                return;
            }

            const priceCheck = Utils.validate.positiveNumber(price, '单价');
            if (!priceCheck.valid) {
                Utils.showFieldError('productPrice', priceCheck.message);
                return;
            }

            const initialStock = parseInt(formData.get('stock')) || 0;
            const data = {
                name: name,
                spec: formData.get('spec'),
                price: price,
                stock: 0,
                description: formData.get('description')
            };

            const newProduct = Storage.add('products', data);
            
            if (initialStock > 0 && newProduct && newProduct.id) {
                Storage.adjustProductStock(
                    newProduct.id, 
                    initialStock, 
                    '初始库存设置', 
                    '系统'
                );
            }
            
            Utils.hideModal();
            Utils.toast('产品添加成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    editProduct(id) {
        const product = Storage.findById('products', id);
        if (!product) return;

        const content = `
            <form id="productForm">
                <div class="form-group">
                    <label>产品名称 *</label>
                    <input type="text" id="productName" name="name" value="${Utils.escapeHtml(product.name)}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>规格</label>
                        <input type="text" name="spec" value="${Utils.escapeHtml(product.spec || '')}" placeholder="如：500ml、1L">
                    </div>
                    <div class="form-group">
                        <label>单价(元) *</label>
                        <input type="number" id="productPrice" name="price" step="0.01" min="0" value="${product.price}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>库存(瓶)</label>
                    <input type="number" name="stock" min="0" value="${product.stock || 0}">
                </div>
                <div class="form-group">
                    <label>产品描述</label>
                    <textarea name="description" rows="2">${Utils.escapeHtml(product.description || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal('编辑产品', content);

        const form = document.getElementById('productForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('productForm');

            const formData = new FormData(form);
            const name = formData.get('name');
            const price = parseFloat(formData.get('price')) || 0;

            const nameCheck = Utils.validate.notEmpty(name, '产品名称');
            if (!nameCheck.valid) {
                Utils.showFieldError('productName', nameCheck.message);
                return;
            }

            const priceCheck = Utils.validate.positiveNumber(price, '单价');
            if (!priceCheck.valid) {
                Utils.showFieldError('productPrice', priceCheck.message);
                return;
            }

            const newStockValue = parseInt(formData.get('stock')) || 0;
            const oldStockValue = product.stock || 0;
            const stockChanged = newStockValue !== oldStockValue;

            const data = {
                name: name,
                spec: formData.get('spec'),
                price: price,
                description: formData.get('description')
            };

            if (!stockChanged) {
                data.stock = oldStockValue;
                Storage.update('products', id, data);
            } else {
                Storage.update('products', id, data);
                Storage.adjustProductStock(
                    id,
                    newStockValue,
                    '编辑产品改库存',
                    '管理员'
                );
            }

            Utils.hideModal();
            Utils.toast(stockChanged ? '更新成功，库存变化已记录流水' : '更新成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    deleteProduct(id) {
        const product = Storage.findById('products', id);
        if (!product) return;

        const salesRecords = Storage.get('salesRecords') || [];
        const used = salesRecords.some(r => r.productId === id);
        if (used) {
            Utils.toast('该产品已有销售记录，无法删除', 'error');
            return;
        }

        if (!Utils.confirm('确定要删除这个产品吗？')) return;
        Storage.delete('products', id);
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

    init(params = {}) {
        this.navigationParams = params;
        this.refresh();
    },
};
