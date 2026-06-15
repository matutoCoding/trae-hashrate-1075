const RefiningPage = {
    currentTab: 'refining',
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
                    <button class="btn btn-secondary btn-sm" onclick="RefiningPage.clearNavFilter()">清除筛选</button>
                </div>
            `;
        }
        this.navigationParams = {};
        return `
            ${hintBanner}
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
        const allRecords = Storage.get('refiningRecords') || [];
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
                    <input type="date" value="${this.filterConditions.dateStart}" onchange="RefiningPage.onFilterChange('dateStart', this.value)">
                    <span>至</span>
                    <input type="date" value="${this.filterConditions.dateEnd}" onchange="RefiningPage.onFilterChange('dateEnd', this.value)">
                    <button class="btn btn-secondary btn-sm" onclick="RefiningPage.refresh()">查询</button>
                    <button class="btn btn-secondary btn-sm" onclick="RefiningPage.resetFilter()">重置</button>
                </div>
                <div class="empty-state"><div class="empty-state-icon">🏺</div><div class="empty-state-text">暂无精炼记录</div></div>
            `;
        }

        return `
            <div class="filter-bar">
                <input type="date" value="${this.filterConditions.dateStart}" onchange="RefiningPage.onFilterChange('dateStart', this.value)">
                <span>至</span>
                <input type="date" value="${this.filterConditions.dateEnd}" onchange="RefiningPage.onFilterChange('dateEnd', this.value)">
                <button class="btn btn-secondary btn-sm" onclick="RefiningPage.refresh()">查询</button>
                <button class="btn btn-secondary btn-sm" onclick="RefiningPage.resetFilter()">重置</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>来源批次</th>
                            <th>毛油重量(kg)</th>
                            <th>精炼油(kg)</th>
                            <th>得率(%)</th>
                            <th>脱胶</th>
                            <th>脱酸</th>
                            <th>操作人</th>
                            <th>日期</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => {
                            const filtering = item.filteringId ? Storage.findById('filteringRecords', item.filteringId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo}</td>
                                    <td>${filtering ? filtering.batchNo : '直接精炼'}</td>
                                    <td>${Utils.formatNumber(item.crudeOilWeight, 1)}</td>
                                    <td style="font-weight: 600; color: #2196f3;">${Utils.formatNumber(item.refinedOilWeight, 1)}</td>
                                    <td style="font-weight: 600; color: #689f38;">${Utils.formatNumber(item.refiningRate, 2)}</td>
                                    <td>${item.degumming ? '✓' : '-'}</td>
                                    <td>${item.deacidification ? '✓' : '-'}</td>
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
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderBottlingTable() {
        const allRecords = Storage.get('bottlingRecords') || [];
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
                    <input type="date" value="${this.filterConditions.dateStart}" onchange="RefiningPage.onFilterChange('dateStart', this.value)">
                    <span>至</span>
                    <input type="date" value="${this.filterConditions.dateEnd}" onchange="RefiningPage.onFilterChange('dateEnd', this.value)">
                    <button class="btn btn-secondary btn-sm" onclick="RefiningPage.refresh()">查询</button>
                    <button class="btn btn-secondary btn-sm" onclick="RefiningPage.resetFilter()">重置</button>
                </div>
                <div class="empty-state"><div class="empty-state-icon">🍾</div><div class="empty-state-text">暂无灌装记录</div></div>
            `;
        }

        return `
            <div class="filter-bar">
                <input type="date" value="${this.filterConditions.dateStart}" onchange="RefiningPage.onFilterChange('dateStart', this.value)">
                <span>至</span>
                <input type="date" value="${this.filterConditions.dateEnd}" onchange="RefiningPage.onFilterChange('dateEnd', this.value)">
                <button class="btn btn-secondary btn-sm" onclick="RefiningPage.refresh()">查询</button>
                <button class="btn btn-secondary btn-sm" onclick="RefiningPage.resetFilter()">重置</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>来源批次</th>
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
                        ${sorted.map(item => {
                            const refining = item.refiningId ? Storage.findById('refiningRecords', item.refiningId) : null;
                            const product = item.productId ? Storage.findById('products', item.productId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo}</td>
                                    <td>${refining ? refining.batchNo : '直接灌装'}</td>
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
                            `;
                        }).join('')}
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
        const filteringList = (Storage.get('filteringRecords') || [])
            .filter(f => f.status === 'completed');
        const filteringOptions = filteringList.map(f => 
            `<option value="${f.id}" data-weight="${f.filteredOilWeight}">
                ${f.batchNo} - ${Utils.formatNumber(f.filteredOilWeight, 1)}kg净油
            </option>`
        ).join('');

        const content = `
            <form id="refiningForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('JL')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源过滤批次</label>
                        <select id="filteringSelect" name="filteringId" onchange="RefiningPage.onFilteringChange()">
                            <option value="">直接精炼（无来源）</option>
                            ${filteringOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" id="refiningCrudeOil" name="crudeOilWeight" step="0.1" min="0" required oninput="RefiningPage.calcRefiningRate()">
                    </div>
                    <div class="form-group">
                        <label>精炼油重量(kg) *</label>
                        <input type="number" id="refiningRefinedOil" name="refinedOilWeight" step="0.1" min="0" required oninput="RefiningPage.calcRefiningRate()">
                    </div>
                </div>
                <div class="form-group">
                    <label>精炼得率(%)</label>
                    <input type="text" id="refiningRate" name="refiningRateDisplay" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
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
            Utils.clearFieldErrors('refiningForm');

            const formData = new FormData(form);
            const crude = parseFloat(formData.get('crudeOilWeight')) || 0;
            const refined = parseFloat(formData.get('refinedOilWeight')) || 0;

            const crudeCheck = Utils.validate.positiveNumber(crude, '毛油重量');
            if (!crudeCheck.valid) {
                Utils.showFieldError('refiningCrudeOil', crudeCheck.message);
                return;
            }

            const refinedCheck = Utils.validate.positiveNumber(refined, '精炼油重量');
            if (!refinedCheck.valid) {
                Utils.showFieldError('refiningRefinedOil', refinedCheck.message);
                return;
            }

            const oilCheck = Utils.validate.refinedOil(refined, crude);
            if (!oilCheck.valid) {
                Utils.showFieldError('refiningRefinedOil', oilCheck.message);
                return;
            }
            if (oilCheck.warning) {
                Utils.showFieldError('refiningRefinedOil', oilCheck.warning, 'warning');
            }

            const data = {
                batchNo: formData.get('batchNo'),
                filteringId: formData.get('filteringId') || null,
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

    onFilteringChange() {
        const select = document.getElementById('filteringSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('refiningCrudeOil');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
            this.calcRefiningRate();
        }
    },

    calcRefiningRate() {
        const form = document.getElementById('refiningForm');
        if (!form) return;
        const crude = parseFloat(form.crudeOilWeight.value) || 0;
        const refined = parseFloat(form.refinedOilWeight.value) || 0;
        const rate = crude > 0 ? ((refined / crude) * 100).toFixed(2) : '0.00';
        if (form.refiningRateDisplay) {
            form.refiningRateDisplay.value = rate + '%';
        }
    },

    viewRefining(id) {
        const item = Storage.findById('refiningRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('refiningRecords', id);
        const filtering = chain.source;

        let sourceHtml = '';
        if (filtering) {
            sourceHtml = `
                <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('filtering');">
                    <span style="color: #1976d2; font-weight: 600;">${filtering.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(filtering.filteredOilWeight || 0, 1)}kg净油</span>
                    <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源过滤</span>
                </div>
            `;
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接精炼）</div>';
        }

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('refining');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${t.bottleCount || 0}瓶 ${t.bottleSpec || ''}</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 灌装</span>
                </div>
            `).join('');
        } else {
            targetHtml = '<div style="color: #aaa; font-size: 13px;">暂无后续环节</div>';
        }

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

        Utils.showModal('精炼详情', content);
    },

    editRefining(id) {
        const item = Storage.findById('refiningRecords', id);
        if (!item) return;

        const filteringList = (Storage.get('filteringRecords') || [])
            .filter(f => f.status === 'completed' || f.id === item.filteringId);
        const filteringOptions = filteringList.map(f => 
            `<option value="${f.id}" ${f.id === item.filteringId ? 'selected' : ''}>
                ${f.batchNo} - ${Utils.formatNumber(f.filteredOilWeight, 1)}kg净油
            </option>`
        ).join('');

        const content = `
            <form id="refiningForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源过滤批次</label>
                        <select name="filteringId">
                            <option value="">直接精炼（无来源）</option>
                            ${filteringOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" id="refiningCrudeOil" name="crudeOilWeight" step="0.1" min="0" value="${item.crudeOilWeight}" required oninput="RefiningPage.calcRefiningRate()">
                    </div>
                    <div class="form-group">
                        <label>精炼油重量(kg) *</label>
                        <input type="number" id="refiningRefinedOil" name="refinedOilWeight" step="0.1" min="0" value="${item.refinedOilWeight}" required oninput="RefiningPage.calcRefiningRate()">
                    </div>
                </div>
                <div class="form-group">
                    <label>精炼得率(%)</label>
                    <input type="text" name="refiningRateDisplay" value="${Utils.formatNumber(item.refiningRate, 2)}%" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
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
            Utils.clearFieldErrors('refiningForm');

            const formData = new FormData(form);
            const crude = parseFloat(formData.get('crudeOilWeight')) || 0;
            const refined = parseFloat(formData.get('refinedOilWeight')) || 0;

            const oilCheck = Utils.validate.refinedOil(refined, crude);
            if (!oilCheck.valid) {
                Utils.showFieldError('refiningRefinedOil', oilCheck.message);
                return;
            }

            const data = {
                filteringId: formData.get('filteringId') || null,
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
        if (!Utils.confirm('确定要删除这条精炼记录吗？删除后无法恢复。')) return;
        Storage.delete('refiningRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    openBottlingModal() {
        const refiningList = (Storage.get('refiningRecords') || [])
            .filter(r => r.status === 'completed');
        const refiningOptions = refiningList.map(r => 
            `<option value="${r.id}" data-weight="${r.refinedOilWeight}">
                ${r.batchNo} - ${Utils.formatNumber(r.refinedOilWeight, 1)}kg精炼油
            </option>`
        ).join('');

        const products = Storage.get('products') || [];
        const productOptions = products.map(p => 
            `<option value="${p.id}" data-spec="${p.spec}" data-name="${p.name}">
                ${p.name} (${p.spec}) - ¥${p.price}
            </option>`
        ).join('');

        const content = `
            <form id="bottlingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('GZ')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源精炼批次</label>
                        <select id="refiningSelect" name="refiningId" onchange="RefiningPage.onRefiningChange()">
                            <option value="">直接灌装（无来源）</option>
                            ${refiningOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>油品总量(kg) *</label>
                        <input type="number" id="bottlingOilWeight" name="oilWeight" step="0.1" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>关联产品</label>
                        <select id="productSelect" name="productId" onchange="RefiningPage.onProductChange()">
                            <option value="">不关联产品</option>
                            ${productOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>瓶子规格</label>
                        <select id="bottleSpecSelect" name="bottleSpec">
                            <option value="250ml">250ml</option>
                            <option value="500ml" selected>500ml</option>
                            <option value="1L">1L</option>
                            <option value="2.5L">2.5L</option>
                            <option value="5L">5L</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>灌装数量(瓶) *</label>
                        <input type="number" id="bottlingBottleCount" name="bottleCount" min="0" value="0" required>
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
            Utils.clearFieldErrors('bottlingForm');

            const formData = new FormData(form);
            const oilWeight = parseFloat(formData.get('oilWeight')) || 0;
            const bottleCount = parseInt(formData.get('bottleCount')) || 0;
            const productId = formData.get('productId') || null;

            const oilCheck = Utils.validate.positiveNumber(oilWeight, '油品总量');
            if (!oilCheck.valid) {
                Utils.showFieldError('bottlingOilWeight', oilCheck.message);
                return;
            }

            if (bottleCount <= 0) {
                Utils.showFieldError('bottlingBottleCount', '灌装数量必须大于0');
                return;
            }

            const data = {
                batchNo: formData.get('batchNo'),
                refiningId: formData.get('refiningId') || null,
                oilWeight: oilWeight,
                bottleSpec: formData.get('bottleSpec'),
                bottleCount: bottleCount,
                labelType: formData.get('labelType'),
                productId: productId,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            if (productId && data.status === 'completed') {
                const stockResult = Storage.updateProductStock(productId, bottleCount, `灌装入库 ${data.batchNo}`);
                if (!stockResult.success) {
                    Utils.toast(stockResult.message, 'error');
                    return;
                }
            }

            Storage.add('bottlingRecords', data);
            Utils.hideModal();
            Utils.toast(productId ? '保存成功，库存已更新' : '保存成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    onRefiningChange() {
        const select = document.getElementById('refiningSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('bottlingOilWeight');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
        }
    },

    onProductChange() {
        const select = document.getElementById('productSelect');
        const option = select.options[select.selectedIndex];
        const specSelect = document.getElementById('bottleSpecSelect');
        if (option && option.dataset.spec) {
            for (let i = 0; i < specSelect.options.length; i++) {
                if (specSelect.options[i].value === option.dataset.spec) {
                    specSelect.selectedIndex = i;
                    break;
                }
            }
        }
    },

    viewBottling(id) {
        const item = Storage.findById('bottlingRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('bottlingRecords', id);
        const refining = chain.source;
        const traceData = Storage.getFullBatchChainFromBottling(id);
        const fullChain = traceData.chain || [];

        const chainHtml = fullChain.length === 0
            ? `<div class="empty-state" style="padding: 20px;"><div class="empty-state-icon">🔗</div><div class="empty-state-text">暂无批次追溯信息</div></div>`
            : fullChain.map((step, idx) => {
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
                    <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #8bc34a 0%, #689f38 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; margin-right: 12px;">
                            ${idx + 1}
                        </div>
                        <div style="flex: 1; padding-bottom: ${idx < fullChain.length - 1 ? '20px' : '0'}; position: relative;">
                            ${idx < fullChain.length - 1 ? `<div style="position: absolute; left: 16px; top: 40px; bottom: 0; width: 2px; background: #e0e0e0;"></div>` : ''}
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

        const product = item.productId ? Storage.findById('products', item.productId) : null;

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

            ${product ? `
                <div class="section-title" style="margin-top: 20px;">关联产品</div>
                <div style="padding: 12px; background: #f0f9eb; border-radius: 8px;">
                    <div style="font-weight: 600; color: #333;">${product.name}</div>
                    <div style="color: #888; font-size: 13px; margin-top: 4px;">规格: ${product.spec} | 单价: ¥${product.price} | 当前库存: ${product.stock}瓶</div>
                </div>
            ` : ''}

            <div class="section-title" style="margin-top: 20px;">批次追溯链路</div>
            <div style="max-height: 360px; overflow-y: auto; padding: 8px;">
                ${chainHtml}
            </div>

            ${item.remark ? `
                <div class="section-title" style="margin-top: 20px;">备注</div>
                <p style="padding: 10px; background: #f5f5f5; border-radius: 6px;">${Utils.escapeHtml(item.remark)}</p>
            ` : ''}
            <div class="modal-footer" style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="Utils.hideModal()">关闭</button>
            </div>
        `;

        Utils.showModal('灌装详情', content);
    },

    editBottling(id) {
        const item = Storage.findById('bottlingRecords', id);
        if (!item) return;

        const refiningList = (Storage.get('refiningRecords') || [])
            .filter(r => r.status === 'completed' || r.id === item.refiningId);
        const refiningOptions = refiningList.map(r => 
            `<option value="${r.id}" ${r.id === item.refiningId ? 'selected' : ''}>
                ${r.batchNo} - ${Utils.formatNumber(r.refinedOilWeight, 1)}kg精炼油
            </option>`
        ).join('');

        const products = Storage.get('products') || [];
        const productOptions = products.map(p => 
            `<option value="${p.id}" ${p.id === item.productId ? 'selected' : ''} data-spec="${p.spec}">
                ${p.name} (${p.spec}) - ¥${p.price}
            </option>`
        ).join('');

        const content = `
            <form id="bottlingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源精炼批次</label>
                        <select name="refiningId">
                            <option value="">直接灌装（无来源）</option>
                            ${refiningOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>油品总量(kg) *</label>
                        <input type="number" id="bottlingOilWeight" name="oilWeight" step="0.1" min="0" value="${item.oilWeight}" required>
                    </div>
                    <div class="form-group">
                        <label>关联产品</label>
                        <select name="productId">
                            <option value="">不关联产品</option>
                            ${productOptions}
                        </select>
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
                        <input type="number" id="bottlingBottleCount" name="bottleCount" min="0" value="${item.bottleCount}" required>
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
            const bottleCount = parseInt(formData.get('bottleCount')) || 0;
            const productId = formData.get('productId') || null;

            if (bottleCount <= 0) {
                Utils.toast('灌装数量必须大于0', 'error');
                return;
            }

            const oldProductId = item.productId;
            const oldCount = item.bottleCount || 0;
            const oldCompleted = item.status === 'completed';

            const data = {
                refiningId: formData.get('refiningId') || null,
                oilWeight: parseFloat(formData.get('oilWeight')) || 0,
                bottleSpec: formData.get('bottleSpec'),
                bottleCount: bottleCount,
                labelType: formData.get('labelType'),
                productId: productId,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            const newCompleted = data.status === 'completed';

            if (oldCompleted && oldProductId) {
                Storage.updateProductStock(oldProductId, -oldCount, `编辑灌装单 ${item.batchNo} 回滚`);
            }

            if (newCompleted && productId) {
                const stockResult = Storage.updateProductStock(productId, bottleCount, `编辑灌装单 ${item.batchNo} 入库`);
                if (!stockResult.success) {
                    Utils.toast(stockResult.message, 'error');
                    if (oldCompleted && oldProductId) {
                        Storage.updateProductStock(oldProductId, oldCount, '回滚恢复');
                    }
                    return;
                }
            }

            Storage.update('bottlingRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    deleteBottling(id) {
        if (!Utils.confirm('确定要删除这条灌装记录吗？删除后无法恢复。')) return;
        const item = Storage.findById('bottlingRecords', id);
        if (item && item.productId && item.status === 'completed' && item.bottleCount) {
            Storage.updateProductStock(item.productId, -item.bottleCount, `删除灌装单 ${item.batchNo}`);
        }
        Storage.delete('bottlingRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
        App.updateSidebarStats();
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
