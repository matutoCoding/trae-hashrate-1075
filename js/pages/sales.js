const SalesPage = {
    currentTab: 'records',

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

    renderRecordsTable() {
        const records = Storage.get('salesRecords') || [];
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">暂无销售记录</div></div>`;
        }

        return `
            <div class="filter-bar">
                <input type="text" id="salesSearch" placeholder="搜索客户/产品..." style="width: 200px;">
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
                <button class="btn btn-secondary btn-sm" onclick="SalesPage.refresh()">查询</button>
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
                        ${sorted.map(item => `
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
                        ${products.map(item => `
                            <tr>
                                <td>${Utils.escapeHtml(item.name)}</td>
                                <td>${item.spec || '-'}</td>
                                <td style="font-weight: 600; color: #ff9800;">${Utils.formatNumber(item.price, 2)}</td>
                                <td>${item.stock || 0}</td>
                                <td>${item.stock > 0 ? '<span class="badge badge-success">有货</span>' : '<span class="badge badge-warning">缺货</span>'}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-secondary btn-sm" onclick="SalesPage.editProduct('${item.id}')">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="SalesPage.deleteProduct('${item.id}')">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderMonthlyStats() {
        const records = Storage.get('salesRecords') || [];
        const monthlyData = {};

        records.forEach(r => {
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
            `<option value="${p.id}" data-price="${p.price}" data-spec="${p.spec}" data-name="${p.name}">${p.name} (${p.spec}) - ¥${p.price}</option>`
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
                        <input type="text" name="customerName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>联系电话</label>
                    <input type="tel" name="customerPhone">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>产品 *</label>
                        <select name="productId" required onchange="SalesPage.onProductChange()">
                            <option value="">请选择产品</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>数量(瓶) *</label>
                        <input type="number" name="quantity" min="1" value="1" required oninput="SalesPage.calcTotal()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>单价(元)</label>
                        <input type="number" name="unitPrice" step="0.01" min="0" value="0" oninput="SalesPage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>总金额(元)</label>
                        <input type="text" name="totalAmount" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
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
                        <select name="status">
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
            const formData = new FormData(form);
            const productId = formData.get('productId');
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(formData.get('quantity')) || 0;
            const unitPrice = parseFloat(formData.get('unitPrice')) || 0;

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
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('salesRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
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
                    <span class="label">销售时间</span>
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

    editRecord(id) {
        const item = Storage.findById('salesRecords', id);
        if (!item) return;

        const products = Storage.get('products') || [];
        const productOptions = products.map(p => 
            `<option value="${p.id}" data-price="${p.price}" data-spec="${p.spec}" data-name="${p.name}" ${p.id === item.productId ? 'selected' : ''}>${p.name} (${p.spec}) - ¥${p.price}</option>`
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
                        <input type="text" name="customerName" value="${Utils.escapeHtml(item.customerName)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>联系电话</label>
                    <input type="tel" name="customerPhone" value="${Utils.escapeHtml(item.customerPhone || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>产品 *</label>
                        <select name="productId" required onchange="SalesPage.onProductChange()">
                            <option value="">请选择产品</option>
                            ${productOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>数量(瓶) *</label>
                        <input type="number" name="quantity" min="1" value="${item.quantity}" required oninput="SalesPage.calcTotal()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>单价(元)</label>
                        <input type="number" name="unitPrice" step="0.01" min="0" value="${item.unitPrice}" oninput="SalesPage.calcTotal()">
                    </div>
                    <div class="form-group">
                        <label>总金额(元)</label>
                        <input type="text" name="totalAmount" value="${Utils.formatNumber(item.totalAmount, 2)}" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
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
                        <select name="status">
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
            const formData = new FormData(form);
            const productId = formData.get('productId');
            const product = products.find(p => p.id === productId);
            const quantity = parseInt(formData.get('quantity')) || 0;
            const unitPrice = parseFloat(formData.get('unitPrice')) || 0;

            const data = {
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                productId: productId,
                productName: product ? product.name : form.productId.selectedOptions[0]?.text.split(' (')[0] || '',
                spec: product ? product.spec : '',
                quantity: quantity,
                unitPrice: unitPrice,
                totalAmount: quantity * unitPrice,
                paymentMethod: formData.get('paymentMethod'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('salesRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteRecord(id) {
        if (!Utils.confirm('确定要删除这条销售记录吗？')) return;
        Storage.delete('salesRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    openProductModal() {
        const content = `
            <form id="productForm">
                <div class="form-group">
                    <label>产品名称 *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>规格</label>
                        <input type="text" name="spec" placeholder="如：500ml、1L">
                    </div>
                    <div class="form-group">
                        <label>单价(元) *</label>
                        <input type="number" name="price" step="0.01" min="0" required>
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
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                spec: formData.get('spec'),
                price: parseFloat(formData.get('price')) || 0,
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
                    <input type="text" name="name" value="${Utils.escapeHtml(product.name)}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>规格</label>
                        <input type="text" name="spec" value="${Utils.escapeHtml(product.spec || '')}" placeholder="如：500ml、1L">
                    </div>
                    <div class="form-group">
                        <label>单价(元) *</label>
                        <input type="number" name="price" step="0.01" min="0" value="${product.price}" required>
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
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                spec: formData.get('spec'),
                price: parseFloat(formData.get('price')) || 0,
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
        if (!Utils.confirm('确定要删除这个产品吗？')) return;
        Storage.delete('products', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    resetFilter() {
        document.getElementById('salesSearch').value = '';
        document.getElementById('paymentFilter').value = '';
        document.getElementById('salesDateStart').value = '';
        document.getElementById('salesDateEnd').value = '';
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
