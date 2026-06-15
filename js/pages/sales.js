const SalesPage = {
    currentTab: 'records',
    filterConditions: {
        keyword: '',
        paymentMethod: '',
        status: '',
        dateStart: '',
        dateEnd: ''
    },

    render() {
        return `
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
                                        <button class="btn btn-secondary btn-sm" onclick="SalesPage.editRecord('${item.id}')">编辑</button>
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
        const products = Storage.get('products') || [];

        if (products.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">🏷️</div><div class="empty-state-text">暂无产品</div></div>`;
        }

        return `
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

            if (status === 'completed') {
                const stockResult = Storage.updateProductStock(productId, -quantity, `销售出库 - 订单 ${formData.get('orderNo')}`);
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
                productName: product ? product.name : '',
                spec: product ? product.spec : '',
                quantity: quantity,
                unitPrice: unitPrice,
                totalAmount: quantity * unitPrice,
                paymentMethod: formData.get('paymentMethod'),
                status: status,
                stockDeducted: status === 'completed',
                remark: formData.get('remark')
            };

            Storage.add('salesRecords', data);
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
                    <span class="label">销售时间</span>
                    <span class="value">${Utils.formatDateTime(item.createdAt)}</span>
                </div>
            </div>
            ${product ? `
                <div class="section-title" style="margin-top: 20px;">产品库存</div>
                <div style="padding: 12px; background: #f5f7fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #666;">当前库存：</span>
                    <span style="font-weight: 700; font-size: 18px; color: ${product.stock > 10 ? '#689f38' : product.stock > 0 ? '#ff9800' : '#f44336'};">${product.stock || 0} 瓶</span>
                </div>
            ` : ''}
            ${item.remark ? `
                <div class="section-title" style="margin-top: 20px;">备注</div>
                <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
            ` : ''}
            <div class="modal-footer" style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('销售详情', content);
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

        const form = document.getElementById('saleForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('saleForm');

            const formData = new FormData(form);
            const productId = formData.get('productId');
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(formData.get('quantity')) || 0;
            const unitPrice = parseFloat(formData.get('unitPrice')) || 0;
            const newStatus = formData.get('status');

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

            const oldStatus = item.status;
            const oldStockDeducted = item.stockDeducted;
            const newStockDeducted = newStatus === 'completed';
            const productChanged = productId !== item.productId;
            const quantityChanged = quantity !== item.quantity;

            if (oldStockDeducted && (productChanged || quantityChanged || !newStockDeducted)) {
                const rollbackResult = Storage.updateProductStock(item.productId, item.quantity, `销售回滚 - 订单 ${item.orderNo}`);
                if (!rollbackResult.success) {
                    Utils.toast('库存回滚失败', 'error');
                    return;
                }
            }

            if (newStockDeducted && (!oldStockDeducted || productChanged || quantityChanged)) {
                const deductResult = Storage.updateProductStock(productId, -quantity, `销售出库 - 订单 ${item.orderNo}`);
                if (!deductResult.success) {
                    Utils.showFieldError('saleQuantity', deductResult.message || '库存不足');
                    if (oldStockDeducted && (productChanged || quantityChanged)) {
                        Storage.updateProductStock(item.productId, -item.quantity, `销售恢复 - 订单 ${item.orderNo}`);
                    }
                    return;
                }
            }

            const data = {
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                productId: productId,
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
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    deleteRecord(id) {
        const item = Storage.findById('salesRecords', id);
        if (!item) return;

        if (!Utils.confirm('确定要删除这条销售记录吗？删除后库存将自动恢复。')) return;

        if (item.stockDeducted && item.productId) {
            Storage.updateProductStock(item.productId, item.quantity, `销售删除回滚 - 订单 ${item.orderNo}`);
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

            const data = {
                name: name,
                spec: formData.get('spec'),
                price: price,
                stock: parseInt(formData.get('stock')) || 0,
                description: formData.get('description')
            };

            Storage.add('products', data);
            Utils.hideModal();
            Utils.toast('产品添加成功', 'success');
            this.refresh();
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

            const data = {
                name: name,
                spec: formData.get('spec'),
                price: price,
                stock: parseInt(formData.get('stock')) || 0,
                description: formData.get('description')
            };

            Storage.update('products', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
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

    init() {
        this.refresh();
    }
};
