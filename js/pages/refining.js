const RefiningPage = {
    currentTab: 'refining',

    render() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">🏺</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getRefiningCount()}</div>
                        <div class="stat-label">精炼批次</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">💧</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalRefinedOil()} kg</div>
                        <div class="stat-label">精炼油总量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">🍾</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalBottles()}</div>
                        <div class="stat-label">灌装总瓶数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getAvgRefiningRate()}%</div>
                        <div class="stat-label">平均精炼得率</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="tabs" style="margin-bottom: 0; border-bottom: none;">
                        <div class="tab-item ${this.currentTab === 'refining' ? 'active' : ''}" data-tab="refining">精炼脱胶脱酸</div>
                        <div class="tab-item ${this.currentTab === 'bottling' ? 'active' : ''}" data-tab="bottling">灌装贴标</div>
                    </div>
                    <button class="btn btn-primary" onclick="RefiningPage.openAddModal()">
                        <span>+</span> 新增记录
                    </button>
                </div>
                <div class="card-body">
                    ${this.currentTab === 'refining' ? this.renderRefiningTable() : this.renderBottlingTable()}
                </div>
            </div>
        `;
    },

    renderRefiningTable() {
        const records = Storage.get('refiningRecords') || [];

        if (records.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">🏺</div><div class="empty-state-text">暂无精炼记录</div></div>`;
        }

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>毛油重量(kg)</th>
                            <th>精炼油(kg)</th>
                            <th>得率(%)</th>
                            <th>脱胶</th>
                            <th>脱酸</th>
                            <th>脱色</th>
                            <th>脱臭</th>
                            <th>操作人</th>
                            <th>日期</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(item => `
                            <tr>
                                <td>${item.batchNo}</td>
                                <td>${Utils.formatNumber(item.crudeOilWeight, 1)}</td>
                                <td style="font-weight: 600; color: #2196f3;">${Utils.formatNumber(item.refinedOilWeight, 1)}</td>
                                <td style="font-weight: 600; color: #689f38;">${Utils.formatNumber(item.refiningRate, 2)}</td>
                                <td>${item.degumming ? '✓' : '-'}</td>
                                <td>${item.deacidification ? '✓' : '-'}</td>
                                <td>${item.decolorization ? '✓' : '-'}</td>
                                <td>${item.deodorization ? '✓' : '-'}</td>
                                <td>${Utils.escapeHtml(item.operator || '-')}</td>
                                <td>${Utils.formatDate(item.createdAt)}</td>
                                <td>${this.getStatusBadge(item.status)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-outline btn-sm" onclick="RefiningPage.viewRefining('${item.id}')">查看</button>
                                        <button class="btn btn-secondary btn-sm" onclick="RefiningPage.editRefining('${item.id}')">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="RefiningPage.deleteRefining('${item.id}')">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderBottlingTable() {
        const records = Storage.get('bottlingRecords') || [];

        if (records.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">🍾</div><div class="empty-state-text">暂无灌装记录</div></div>`;
        }

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>油品总量(kg)</th>
                            <th>规格</th>
                            <th>灌装数量(瓶)</th>
                            <th>标签类型</th>
                            <th>操作人</th>
                            <th>日期</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(item => `
                            <tr>
                                <td>${item.batchNo}</td>
                                <td>${Utils.formatNumber(item.oilWeight, 1)}</td>
                                <td>${item.bottleSpec}</td>
                                <td style="font-weight: 600; color: #689f38;">${item.bottleCount}</td>
                                <td>${Utils.escapeHtml(item.labelType || '-')}</td>
                                <td>${Utils.escapeHtml(item.operator || '-')}</td>
                                <td>${Utils.formatDate(item.createdAt)}</td>
                                <td>${this.getStatusBadge(item.status)}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-outline btn-sm" onclick="RefiningPage.viewBottling('${item.id}')">查看</button>
                                        <button class="btn btn-secondary btn-sm" onclick="RefiningPage.editBottling('${item.id}')">编辑</button>
                                        <button class="btn btn-danger btn-sm" onclick="RefiningPage.deleteBottling('${item.id}')">删除</button>
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
            processing: { text: '进行中', class: 'badge-warning' },
            completed: { text: '已完成', class: 'badge-success' },
            paused: { text: '暂停', class: 'badge-secondary' }
        };
        const s = map[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getRefiningCount() {
        const records = Storage.get('refiningRecords') || [];
        return records.length;
    },

    getTotalRefinedOil() {
        const records = Storage.get('refiningRecords') || [];
        return Utils.formatNumber(records.reduce((sum, r) => sum + (r.refinedOilWeight || 0), 0), 1);
    },

    getTotalBottles() {
        const records = Storage.get('bottlingRecords') || [];
        return records.reduce((sum, r) => sum + (r.bottleCount || 0), 0);
    },

    getAvgRefiningRate() {
        const records = Storage.get('refiningRecords') || [];
        const totalCrude = records.reduce((sum, r) => sum + (r.crudeOilWeight || 0), 0);
        const totalRefined = records.reduce((sum, r) => sum + (r.refinedOilWeight || 0), 0);
        const rate = totalCrude > 0 ? (totalRefined / totalCrude) * 100 : 0;
        return Utils.formatNumber(rate, 2);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.refresh();
    },

    openAddModal() {
        if (this.currentTab === 'refining') {
            this.openRefiningModal();
        } else {
            this.openBottlingModal();
        }
    },

    openRefiningModal() {
        const content = `
            <form id="refiningForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('JL')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" name="crudeOilWeight" step="0.1" min="0" required oninput="RefiningPage.calcRefiningRate()">
                    </div>
                </div>
                <div class="form-group">
                    <label>精炼油重量(kg) *</label>
                    <input type="number" name="refinedOilWeight" step="0.1" min="0" required oninput="RefiningPage.calcRefiningRate()">
                </div>
                <div class="form-group">
                    <label>精炼得率(%)</label>
                    <input type="text" name="refiningRate" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                </div>
                <div class="section-title">精炼工艺</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="degumming" checked>
                        <span>脱胶</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="deacidification" checked>
                        <span>脱酸</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="decolorization">
                        <span>脱色</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="deodorization">
                        <span>脱臭</span>
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing">进行中</option>
                            <option value="completed">已完成</option>
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

        Utils.showModal('新增精炼记录', content);

        const form = document.getElementById('refiningForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const crude = parseFloat(formData.get('crudeOilWeight')) || 0;
            const refined = parseFloat(formData.get('refinedOilWeight')) || 0;
            const data = {
                batchNo: formData.get('batchNo'),
                crudeOilWeight: crude,
                refinedOilWeight: refined,
                refiningRate: crude > 0 ? (refined / crude) * 100 : 0,
                degumming: form.degumming.checked,
                deacidification: form.deacidification.checked,
                decolorization: form.decolorization.checked,
                deodorization: form.deodorization.checked,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('refiningRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
        });
    },

    calcRefiningRate() {
        const form = document.getElementById('refiningForm');
        if (!form) return;
        const crude = parseFloat(form.crudeOilWeight.value) || 0;
        const refined = parseFloat(form.refinedOilWeight.value) || 0;
        const rate = crude > 0 ? ((refined / crude) * 100).toFixed(2) : '0.00';
        if (form.refiningRate) {
            form.refiningRate.value = rate + '%';
        }
    },

    viewRefining(id) {
        const item = Storage.findById('refiningRecords', id);
        if (!item) return;

        const content = `
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
                    <span class="label">精炼油重量</span>
                    <span class="value" style="color: #2196f3; font-weight: 700;">${Utils.formatNumber(item.refinedOilWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">精炼得率</span>
                    <span class="value" style="color: #689f38; font-weight: 700;">${Utils.formatNumber(item.refiningRate, 2)}%</span>
                </div>
                <div class="info-item">
                    <span class="label">操作人</span>
                    <span class="value">${Utils.escapeHtml(item.operator || '-')}</span>
                </div>
            </div>
            <div class="section-title" style="margin-top: 20px;">精炼工艺</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
                <div style="padding: 10px; background: ${item.degumming ? '#e8f5e9' : '#f5f5f5'}; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px;">${item.degumming ? '✓' : '✗'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">脱胶</div>
                </div>
                <div style="padding: 10px; background: ${item.deacidification ? '#e8f5e9' : '#f5f5f5'}; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px;">${item.deacidification ? '✓' : '✗'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">脱酸</div>
                </div>
                <div style="padding: 10px; background: ${item.decolorization ? '#e8f5e9' : '#f5f5f5'}; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px;">${item.decolorization ? '✓' : '✗'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">脱色</div>
                </div>
                <div style="padding: 10px; background: ${item.deodorization ? '#e8f5e9' : '#f5f5f5'}; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px;">${item.deodorization ? '✓' : '✗'}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">脱臭</div>
                </div>
            </div>
            ${item.remark ? `
                <div class="form-group">
                    <label>备注</label>
                    <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
                </div>
            ` : ''}
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('精炼详情', content);
    },

    editRefining(id) {
        const item = Storage.findById('refiningRecords', id);
        if (!item) return;

        const content = `
            <form id="refiningForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" name="crudeOilWeight" step="0.1" min="0" value="${item.crudeOilWeight}" required oninput="RefiningPage.calcRefiningRate()">
                    </div>
                </div>
                <div class="form-group">
                    <label>精炼油重量(kg) *</label>
                    <input type="number" name="refinedOilWeight" step="0.1" min="0" value="${item.refinedOilWeight}" required oninput="RefiningPage.calcRefiningRate()">
                </div>
                <div class="form-group">
                    <label>精炼得率(%)</label>
                    <input type="text" name="refiningRate" value="${Utils.formatNumber(item.refiningRate, 2)}%" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                </div>
                <div class="section-title">精炼工艺</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="degumming" ${item.degumming ? 'checked' : ''}>
                        <span>脱胶</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="deacidification" ${item.deacidification ? 'checked' : ''}>
                        <span>脱酸</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="decolorization" ${item.decolorization ? 'checked' : ''}>
                        <span>脱色</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="deodorization" ${item.deodorization ? 'checked' : ''}>
                        <span>脱臭</span>
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator" value="${Utils.escapeHtml(item.operator || '')}">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing" ${item.status === 'processing' ? 'selected' : ''}>进行中</option>
                            <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>
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

        Utils.showModal('编辑精炼记录', content);

        const form = document.getElementById('refiningForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const crude = parseFloat(formData.get('crudeOilWeight')) || 0;
            const refined = parseFloat(formData.get('refinedOilWeight')) || 0;
            const data = {
                crudeOilWeight: crude,
                refinedOilWeight: refined,
                refiningRate: crude > 0 ? (refined / crude) * 100 : 0,
                degumming: form.degumming.checked,
                deacidification: form.deacidification.checked,
                decolorization: form.decolorization.checked,
                deodorization: form.deodorization.checked,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('refiningRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteRefining(id) {
        if (!Utils.confirm('确定要删除这条精炼记录吗？')) return;
        Storage.delete('refiningRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    openBottlingModal() {
        const content = `
            <form id="bottlingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('GZ')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>油品总量(kg) *</label>
                        <input type="number" name="oilWeight" step="0.1" min="0" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>瓶子规格</label>
                        <select name="bottleSpec">
                            <option value="250ml">250ml</option>
                            <option value="500ml" selected>500ml</option>
                            <option value="1L">1L</option>
                            <option value="2.5L">2.5L</option>
                            <option value="5L">5L</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>灌装数量(瓶) *</label>
                        <input type="number" name="bottleCount" min="0" value="0" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>标签类型</label>
                    <select name="labelType">
                        <option value="精品山茶油">精品山茶油</option>
                        <option value="一级山茶油">一级山茶油</option>
                        <option value="农家山茶油">农家山茶油</option>
                        <option value="定制标签">定制标签</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing">进行中</option>
                            <option value="completed">已完成</option>
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

        Utils.showModal('新增灌装记录', content);

        const form = document.getElementById('bottlingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                batchNo: formData.get('batchNo'),
                oilWeight: parseFloat(formData.get('oilWeight')) || 0,
                bottleSpec: formData.get('bottleSpec'),
                bottleCount: parseInt(formData.get('bottleCount')) || 0,
                labelType: formData.get('labelType'),
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('bottlingRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
        });
    },

    viewBottling(id) {
        const item = Storage.findById('bottlingRecords', id);
        if (!item) return;

        const content = `
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
                    <span class="label">油品总量</span>
                    <span class="value">${Utils.formatNumber(item.oilWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">瓶子规格</span>
                    <span class="value">${item.bottleSpec}</span>
                </div>
                <div class="info-item">
                    <span class="label">灌装数量</span>
                    <span class="value" style="color: #689f38; font-weight: 700;">${item.bottleCount} 瓶</span>
                </div>
                <div class="info-item">
                    <span class="label">标签类型</span>
                    <span class="value">${Utils.escapeHtml(item.labelType || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">操作人</span>
                    <span class="value">${Utils.escapeHtml(item.operator || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">灌装日期</span>
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

        Utils.showModal('灌装详情', content);
    },

    editBottling(id) {
        const item = Storage.findById('bottlingRecords', id);
        if (!item) return;

        const content = `
            <form id="bottlingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>油品总量(kg) *</label>
                        <input type="number" name="oilWeight" step="0.1" min="0" value="${item.oilWeight}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>瓶子规格</label>
                        <select name="bottleSpec">
                            <option value="250ml" ${item.bottleSpec === '250ml' ? 'selected' : ''}>250ml</option>
                            <option value="500ml" ${item.bottleSpec === '500ml' ? 'selected' : ''}>500ml</option>
                            <option value="1L" ${item.bottleSpec === '1L' ? 'selected' : ''}>1L</option>
                            <option value="2.5L" ${item.bottleSpec === '2.5L' ? 'selected' : ''}>2.5L</option>
                            <option value="5L" ${item.bottleSpec === '5L' ? 'selected' : ''}>5L</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>灌装数量(瓶) *</label>
                        <input type="number" name="bottleCount" min="0" value="${item.bottleCount}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>标签类型</label>
                    <select name="labelType">
                        <option value="精品山茶油" ${item.labelType === '精品山茶油' ? 'selected' : ''}>精品山茶油</option>
                        <option value="一级山茶油" ${item.labelType === '一级山茶油' ? 'selected' : ''}>一级山茶油</option>
                        <option value="农家山茶油" ${item.labelType === '农家山茶油' ? 'selected' : ''}>农家山茶油</option>
                        <option value="定制标签" ${item.labelType === '定制标签' ? 'selected' : ''}>定制标签</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator" value="${Utils.escapeHtml(item.operator || '')}">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing" ${item.status === 'processing' ? 'selected' : ''}>进行中</option>
                            <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>已完成</option>
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

        Utils.showModal('编辑灌装记录', content);

        const form = document.getElementById('bottlingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                oilWeight: parseFloat(formData.get('oilWeight')) || 0,
                bottleSpec: formData.get('bottleSpec'),
                bottleCount: parseInt(formData.get('bottleCount')) || 0,
                labelType: formData.get('labelType'),
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('bottlingRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteBottling(id) {
        if (!Utils.confirm('确定要删除这条灌装记录吗？')) return;
        Storage.delete('bottlingRecords', id);
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
