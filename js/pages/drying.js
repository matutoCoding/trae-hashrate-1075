const DryingPage = {
    currentTab: 'drying',

    render() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">☀️</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getDryingCount()}</div>
                        <div class="stat-label">晾晒中批次</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">⚖️</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalDryingWeight()} kg</div>
                        <div class="stat-label">晾晒总重量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">🌰</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalShellingWeight()} kg</div>
                        <div class="stat-label">累计剥壳籽重</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getAvgShellingRate()}%</div>
                        <div class="stat-label">平均出仁率</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="tabs" style="margin-bottom: 0; border-bottom: none;">
                        <div class="tab-item ${this.currentTab === 'drying' ? 'active' : ''}" data-tab="drying">含水率晾晒</div>
                        <div class="tab-item ${this.currentTab === 'shelling' ? 'active' : ''}" data-tab="shelling">剥壳去杂</div>
                    </div>
                    <button class="btn btn-primary" onclick="DryingPage.openAddModal()">
                        <span>+</span> 新增记录
                    </button>
                </div>
                <div class="card-body">
                    ${this.currentTab === 'drying' ? this.renderDryingTable() : this.renderShellingTable()}
                </div>
            </div>
        `;
    },

    renderDryingTable() {
        const records = Storage.get('dryingRecords') || [];
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">☀️</div><div class="empty-state-text">暂无晾晒记录</div></div>`;
        }

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>来源批次</th>
                            <th>茶籽重量(kg)</th>
                            <th>初始含水率(%)</th>
                            <th>当前含水率(%)</th>
                            <th>目标含水率(%)</th>
                            <th>晾晒方式</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => {
                            const purchase = item.purchaseId ? Storage.findById('purchases', item.purchaseId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo}</td>
                                    <td>${purchase ? Utils.escapeHtml(purchase.farmerName) : '直接入库'}</td>
                                    <td>${Utils.formatNumber(item.seedWeight, 1)}</td>
                                    <td>${Utils.formatNumber(item.initialMoisture, 1)}</td>
                                    <td style="font-weight: 600; color: ${item.currentMoisture <= item.targetMoisture ? '#4caf50' : '#ff9800'};">${Utils.formatNumber(item.currentMoisture, 1)}</td>
                                    <td>${Utils.formatNumber(item.targetMoisture, 1)}</td>
                                    <td>${item.dryingMethod}</td>
                                    <td>${this.getDryingStatusBadge(item.status)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-outline btn-sm" onclick="DryingPage.viewDrying('${item.id}')">查看</button>
                                            <button class="btn btn-secondary btn-sm" onclick="DryingPage.updateMoisture('${item.id}')">更新水分</button>
                                            <button class="btn btn-danger btn-sm" onclick="DryingPage.deleteDrying('${item.id}')">删除</button>
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

    renderShellingTable() {
        const records = Storage.get('shellingRecords') || [];
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">🌰</div><div class="empty-state-text">暂无剥壳记录</div></div>`;
        }

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>来源批次</th>
                            <th>茶籽重量(kg)</th>
                            <th>壳重(kg)</th>
                            <th>仁重(kg)</th>
                            <th>出仁率(%)</th>
                            <th>操作人</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => {
                            const drying = item.dryingId ? Storage.findById('dryingRecords', item.dryingId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo}</td>
                                    <td>${drying ? drying.batchNo : '直接剥壳'}</td>
                                    <td>${Utils.formatNumber(item.seedWeight, 1)}</td>
                                    <td>${Utils.formatNumber(item.shellWeight, 1)}</td>
                                    <td>${Utils.formatNumber(item.kernelWeight, 1)}</td>
                                    <td style="font-weight: 600; color: #689f38;">${Utils.formatNumber(item.shellingRate, 1)}</td>
                                    <td>${Utils.escapeHtml(item.operator || '-')}</td>
                                    <td>${this.getShellingStatusBadge(item.status)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-outline btn-sm" onclick="DryingPage.viewShelling('${item.id}')">查看</button>
                                            <button class="btn btn-secondary btn-sm" onclick="DryingPage.editShelling('${item.id}')">编辑</button>
                                            <button class="btn btn-danger btn-sm" onclick="DryingPage.deleteShelling('${item.id}')">删除</button>
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

    getDryingStatusBadge(status) {
        const map = {
            drying: { text: '晾晒中', class: 'badge-warning' },
            completed: { text: '已完成', class: 'badge-success' },
            paused: { text: '暂停', class: 'badge-secondary' }
        };
        const s = map[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getShellingStatusBadge(status) {
        const map = {
            processing: { text: '加工中', class: 'badge-warning' },
            completed: { text: '已完成', class: 'badge-success' }
        };
        const s = map[status] || { text: status, class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${s.text}</span>`;
    },

    getDryingCount() {
        const records = Storage.get('dryingRecords') || [];
        return records.filter(r => r.status === 'drying').length;
    },

    getTotalDryingWeight() {
        const records = Storage.get('dryingRecords') || [];
        return Utils.formatNumber(records.reduce((sum, r) => sum + (r.seedWeight || 0), 0), 1);
    },

    getTotalShellingWeight() {
        const records = Storage.get('shellingRecords') || [];
        return Utils.formatNumber(records.reduce((sum, r) => sum + (r.seedWeight || 0), 0), 1);
    },

    getAvgShellingRate() {
        const records = Storage.get('shellingRecords') || [];
        if (records.length === 0) return '0.0';
        const avg = records.reduce((sum, r) => sum + (r.shellingRate || 0), 0) / records.length;
        return Utils.formatNumber(avg, 1);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.refresh();
    },

    openAddModal() {
        if (this.currentTab === 'drying') {
            this.openDryingModal();
        } else {
            this.openShellingModal();
        }
    },

    openDryingModal() {
        const purchases = (Storage.get('purchases') || [])
            .filter(p => p.status === 'completed');
        const purchaseOptions = purchases.map(p => 
            `<option value="${p.id}" data-weight="${p.weight}" data-moisture="${p.moisture}" data-farmer="${p.farmerName}">
                ${p.farmerName} - ${Utils.formatNumber(p.weight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="dryingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('GZ')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源收购批次</label>
                        <select id="purchaseSelect" name="purchaseId" onchange="DryingPage.onPurchaseChange()">
                            <option value="">直接入库（无来源）</option>
                            ${purchaseOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶籽重量(kg) *</label>
                        <input type="number" id="dryingSeedWeight" name="seedWeight" step="0.1" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>初始含水率(%) *</label>
                        <input type="number" id="dryingInitialMoisture" name="initialMoisture" step="0.1" min="0" max="100" value="12" required
                               onblur="DryingPage.validateMoisture('dryingInitialMoisture')">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>目标含水率(%) *</label>
                        <input type="number" id="dryingTargetMoisture" name="targetMoisture" step="0.1" min="0" max="100" value="8" required>
                    </div>
                    <div class="form-group">
                        <label>晾晒方式</label>
                        <select name="dryingMethod">
                            <option value="自然晾晒">自然晾晒</option>
                            <option value="烘干房">烘干房</option>
                            <option value="烘干机">烘干机</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="drying">晾晒中</option>
                        <option value="paused">暂停</option>
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

        Utils.showModal('新增晾晒记录', content);

        const form = document.getElementById('dryingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('dryingForm');

            const formData = new FormData(form);
            const seedWeight = parseFloat(formData.get('seedWeight')) || 0;
            const initialMoisture = parseFloat(formData.get('initialMoisture')) || 0;
            const targetMoisture = parseFloat(formData.get('targetMoisture')) || 0;

            const weightCheck = Utils.validate.positiveNumber(seedWeight, '茶籽重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('dryingSeedWeight', weightCheck.message);
                return;
            }

            const moistureCheck = Utils.validate.moisture(initialMoisture);
            if (!moistureCheck.valid) {
                Utils.showFieldError('dryingInitialMoisture', moistureCheck.message);
                return;
            }

            if (targetMoisture >= initialMoisture) {
                Utils.toast('目标含水率不能大于初始含水率', 'error');
                return;
            }

            const data = {
                batchNo: formData.get('batchNo'),
                purchaseId: formData.get('purchaseId') || null,
                seedWeight: seedWeight,
                initialMoisture: initialMoisture,
                currentMoisture: initialMoisture,
                targetMoisture: targetMoisture,
                dryingMethod: formData.get('dryingMethod'),
                status: formData.get('status'),
                startTime: new Date().toISOString(),
                remark: formData.get('remark')
            };

            Storage.add('dryingRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
        });
    },

    onPurchaseChange() {
        const select = document.getElementById('purchaseSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('dryingSeedWeight');
        const moistureInput = document.getElementById('dryingInitialMoisture');

        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
            if (option.dataset.moisture) {
                moistureInput.value = option.dataset.moisture;
            }
        }
    },

    validateMoisture(fieldId) {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const value = parseFloat(input.value) || 0;
        const result = Utils.validate.moisture(value);
        if (!result.valid) {
            Utils.showFieldError(fieldId, result.message);
        } else if (result.warning) {
            Utils.showFieldError(fieldId, result.warning, 'warning');
        } else {
            Utils.showFieldError(fieldId, '');
        }
    },

    viewDrying(id) {
        const item = Storage.findById('dryingRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('dryingRecords', id);
        const purchase = chain.source;

        let sourceHtml = '';
        if (purchase) {
            sourceHtml = `
                <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('purchase');">
                    <span style="color: #1976d2; font-weight: 600;">${Utils.escapeHtml(purchase.farmerName)}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(purchase.weight, 1)}kg</span>
                    <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源收购</span>
                </div>
            `;
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接入库）</div>';
        }

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('drying');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(t.seedWeight || 0, 1)}kg</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 剥壳</span>
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
                    <span class="value">${this.getDryingStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">茶籽重量</span>
                    <span class="value">${Utils.formatNumber(item.seedWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">晾晒方式</span>
                    <span class="value">${item.dryingMethod}</span>
                </div>
                <div class="info-item">
                    <span class="label">初始含水率</span>
                    <span class="value">${Utils.formatNumber(item.initialMoisture, 1)} %</span>
                </div>
                <div class="info-item">
                    <span class="label">当前含水率</span>
                    <span class="value" style="color: ${item.currentMoisture <= item.targetMoisture ? '#4caf50' : '#ff9800'}; font-weight: 600;">${Utils.formatNumber(item.currentMoisture, 1)} %</span>
                </div>
                <div class="info-item">
                    <span class="label">目标含水率</span>
                    <span class="value">${Utils.formatNumber(item.targetMoisture, 1)} %</span>
                </div>
                <div class="info-item">
                    <span class="label">开始时间</span>
                    <span class="value">${Utils.formatDateTime(item.startTime)}</span>
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

        Utils.showModal('晾晒详情', content);
    },

    updateMoisture(id) {
        const record = Storage.findById('dryingRecords', id);
        if (!record) return;

        const content = `
            <form id="moistureForm">
                <div class="form-group">
                    <label>批次号</label>
                    <input type="text" value="${record.batchNo}" readonly style="background: #f5f5f5;">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>初始含水率(%)</label>
                        <input type="text" value="${Utils.formatNumber(record.initialMoisture, 1)}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>目标含水率(%)</label>
                        <input type="text" value="${Utils.formatNumber(record.targetMoisture, 1)}" readonly style="background: #f5f5f5;">
                    </div>
                </div>
                <div class="form-group">
                    <label>当前含水率(%) *</label>
                    <input type="number" id="updateMoistureValue" name="currentMoisture" step="0.1" min="0" max="100" value="${record.currentMoisture}" required>
                </div>
                <div class="form-group">
                    <label>状态</label>
                    <select name="status">
                        <option value="drying" ${record.status === 'drying' ? 'selected' : ''}>晾晒中</option>
                        <option value="paused" ${record.status === 'paused' ? 'selected' : ''}>暂停</option>
                        <option value="completed" ${record.status === 'completed' ? 'selected' : ''}>已完成</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认更新</button>
                </div>
            </form>
        `;

        Utils.showModal('更新含水率', content);

        const form = document.getElementById('moistureForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const moisture = parseFloat(formData.get('currentMoisture')) || 0;
            let status = formData.get('status');

            const moistureCheck = Utils.validate.moisture(moisture);
            if (!moistureCheck.valid) {
                Utils.toast(moistureCheck.message, 'error');
                return;
            }

            if (moisture <= record.targetMoisture && status !== 'completed') {
                if (Utils.confirm('含水率已达标，是否标记为已完成？')) {
                    status = 'completed';
                }
            }

            Storage.update('dryingRecords', id, {
                currentMoisture: moisture,
                status: status
            });

            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteDrying(id) {
        if (!Utils.confirm('确定要删除这条晾晒记录吗？删除后无法恢复。')) return;
        Storage.delete('dryingRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    openShellingModal() {
        const dryingList = (Storage.get('dryingRecords') || [])
            .filter(d => d.status === 'completed');
        const dryingOptions = dryingList.map(d => 
            `<option value="${d.id}" data-weight="${d.seedWeight}">
                ${d.batchNo} - ${Utils.formatNumber(d.seedWeight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="shellingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('BK')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源晾晒批次</label>
                        <select id="dryingSelect" name="dryingId" onchange="DryingPage.onDryingChange()">
                            <option value="">直接剥壳（无来源）</option>
                            ${dryingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶籽重量(kg) *</label>
                        <input type="number" id="shellingSeedWeight" name="seedWeight" step="0.1" min="0" required oninput="DryingPage.calcShelling()">
                    </div>
                    <div class="form-group">
                        <label>含杂率(%)</label>
                        <input type="number" name="impurityRate" step="0.01" min="0" max="100" value="1.0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>壳重(kg)</label>
                        <input type="number" name="shellWeight" step="0.1" min="0" oninput="DryingPage.calcShelling()">
                    </div>
                    <div class="form-group">
                        <label>仁重(kg) *</label>
                        <input type="number" id="shellingKernelWeight" name="kernelWeight" step="0.1" min="0" required oninput="DryingPage.calcShelling()">
                    </div>
                </div>
                <div class="form-group">
                    <label>出仁率(%)</label>
                    <input type="text" name="shellingRate" readonly style="background: #f5f5f5; color: #689f38; font-weight: 600;">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing">加工中</option>
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

        Utils.showModal('新增剥壳记录', content);

        const form = document.getElementById('shellingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('shellingForm');

            const formData = new FormData(form);
            const seedWeight = parseFloat(formData.get('seedWeight')) || 0;
            const kernelWeight = parseFloat(formData.get('kernelWeight')) || 0;

            const seedCheck = Utils.validate.positiveNumber(seedWeight, '茶籽重量');
            if (!seedCheck.valid) {
                Utils.showFieldError('shellingSeedWeight', seedCheck.message);
                return;
            }

            const shellingCheck = Utils.validate.shelling(kernelWeight, seedWeight);
            if (!shellingCheck.valid) {
                Utils.showFieldError('shellingKernelWeight', shellingCheck.message);
                return;
            }

            const data = {
                batchNo: formData.get('batchNo'),
                dryingId: formData.get('dryingId') || null,
                seedWeight: seedWeight,
                shellWeight: parseFloat(formData.get('shellWeight')) || 0,
                kernelWeight: kernelWeight,
                shellingRate: seedWeight > 0 ? (kernelWeight / seedWeight) * 100 : 0,
                impurityRate: parseFloat(formData.get('impurityRate')) || 0,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('shellingRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
        });
    },

    onDryingChange() {
        const select = document.getElementById('dryingSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('shellingSeedWeight');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
        }
    },

    calcShelling() {
        const form = document.getElementById('shellingForm');
        if (!form) return;
        const seedWeight = parseFloat(form.seedWeight.value) || 0;
        const kernelWeight = parseFloat(form.kernelWeight.value) || 0;
        const rate = seedWeight > 0 ? ((kernelWeight / seedWeight) * 100).toFixed(2) : '0.00';
        if (form.shellingRate) {
            form.shellingRate.value = rate + '%';
        }
    },

    viewShelling(id) {
        const item = Storage.findById('shellingRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('shellingRecords', id);
        const drying = chain.source;

        let sourceHtml = '';
        if (drying) {
            sourceHtml = `
                <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('drying');">
                    <span style="color: #1976d2; font-weight: 600;">${drying.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(drying.seedWeight, 1)}kg</span>
                    <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源晾晒</span>
                </div>
            `;
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接剥壳）</div>';
        }

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('pressing');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(t.kernelWeight || 0, 1)}kg</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 炒制</span>
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
                    <span class="value">${this.getShellingStatusBadge(item.status)}</span>
                </div>
                <div class="info-item">
                    <span class="label">茶籽重量</span>
                    <span class="value">${Utils.formatNumber(item.seedWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">壳重</span>
                    <span class="value">${Utils.formatNumber(item.shellWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">仁重</span>
                    <span class="value" style="color: #689f38; font-weight: 600;">${Utils.formatNumber(item.kernelWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">出仁率</span>
                    <span class="value" style="color: #689f38; font-weight: 700;">${Utils.formatNumber(item.shellingRate, 2)}%</span>
                </div>
                <div class="info-item">
                    <span class="label">含杂率</span>
                    <span class="value">${Utils.formatNumber(item.impurityRate, 2)}%</span>
                </div>
                <div class="info-item">
                    <span class="label">操作人</span>
                    <span class="value">${Utils.escapeHtml(item.operator || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">加工时间</span>
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

        Utils.showModal('剥壳详情', content);
    },

    editShelling(id) {
        const item = Storage.findById('shellingRecords', id);
        if (!item) return;

        const dryingList = (Storage.get('dryingRecords') || [])
            .filter(d => d.status === 'completed' || d.id === item.dryingId);
        const dryingOptions = dryingList.map(d => 
            `<option value="${d.id}" ${d.id === item.dryingId ? 'selected' : ''}>
                ${d.batchNo} - ${Utils.formatNumber(d.seedWeight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="shellingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${item.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源晾晒批次</label>
                        <select name="dryingId">
                            <option value="">直接剥壳（无来源）</option>
                            ${dryingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶籽重量(kg) *</label>
                        <input type="number" name="seedWeight" step="0.1" min="0" value="${item.seedWeight}" required oninput="DryingPage.calcShelling()">
                    </div>
                    <div class="form-group">
                        <label>含杂率(%)</label>
                        <input type="number" name="impurityRate" step="0.01" min="0" max="100" value="${item.impurityRate}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>壳重(kg)</label>
                        <input type="number" name="shellWeight" step="0.1" min="0" value="${item.shellWeight}" oninput="DryingPage.calcShelling()">
                    </div>
                    <div class="form-group">
                        <label>仁重(kg) *</label>
                        <input type="number" name="kernelWeight" step="0.1" min="0" value="${item.kernelWeight}" required oninput="DryingPage.calcShelling()">
                    </div>
                </div>
                <div class="form-group">
                    <label>出仁率(%)</label>
                    <input type="text" name="shellingRate" value="${Utils.formatNumber(item.shellingRate, 2)}%" readonly style="background: #f5f5f5; color: #689f38; font-weight: 600;">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator" value="${Utils.escapeHtml(item.operator || '')}">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing" ${item.status === 'processing' ? 'selected' : ''}>加工中</option>
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

        Utils.showModal('编辑剥壳记录', content);

        const form = document.getElementById('shellingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const seedWeight = parseFloat(formData.get('seedWeight')) || 0;
            const kernelWeight = parseFloat(formData.get('kernelWeight')) || 0;

            const shellingCheck = Utils.validate.shelling(kernelWeight, seedWeight);
            if (!shellingCheck.valid) {
                Utils.toast(shellingCheck.message, 'error');
                return;
            }

            const data = {
                dryingId: formData.get('dryingId') || null,
                seedWeight: seedWeight,
                shellWeight: parseFloat(formData.get('shellWeight')) || 0,
                kernelWeight: kernelWeight,
                shellingRate: seedWeight > 0 ? (kernelWeight / seedWeight) * 100 : 0,
                impurityRate: parseFloat(formData.get('impurityRate')) || 0,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('shellingRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteShelling(id) {
        if (!Utils.confirm('确定要删除这条剥壳记录吗？删除后无法恢复。')) return;
        Storage.delete('shellingRecords', id);
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
