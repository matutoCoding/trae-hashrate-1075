const PressingPage = {
    currentTab: 'roasting',

    render() {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">🔥</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getRoastingCount()}</div>
                        <div class="stat-label">炒制批次</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">⚙️</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getPressingCount()}</div>
                        <div class="stat-label">压榨批次</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">🛢️</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getTotalOil()} kg</div>
                        <div class="stat-label">累计毛油产量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.getAvgOilYield()}%</div>
                        <div class="stat-label">平均出油率</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="tabs" style="margin-bottom: 0; border-bottom: none;">
                        <div class="tab-item ${this.currentTab === 'roasting' ? 'active' : ''}" data-tab="roasting">炒籽火候</div>
                        <div class="tab-item ${this.currentTab === 'pressing' ? 'active' : ''}" data-tab="pressing">液压榨油</div>
                        <div class="tab-item ${this.currentTab === 'stats' ? 'active' : ''}" data-tab="stats">出油率统计</div>
                    </div>
                    <button class="btn btn-primary" onclick="PressingPage.openAddModal()">
                        <span>+</span> 新增记录
                    </button>
                </div>
                <div class="card-body">
                    ${this.currentTab === 'roasting' ? this.renderRoastingTable() : ''}
                    ${this.currentTab === 'pressing' ? this.renderPressingTable() : ''}
                    ${this.currentTab === 'stats' ? this.renderStats() : ''}
                </div>
            </div>
        `;
    },

    renderRoastingTable() {
        const records = Storage.get('roastingRecords') || [];
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">🔥</div><div class="empty-state-text">暂无炒制记录</div></div>`;
        }

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>来源批次</th>
                            <th>籽仁重量(kg)</th>
                            <th>炒制温度(°C)</th>
                            <th>炒制时间(分钟)</th>
                            <th>炒制程度</th>
                            <th>操作人</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => {
                            const shelling = item.shellingId ? Storage.findById('shellingRecords', item.shellingId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo}</td>
                                    <td>${shelling ? shelling.batchNo : '直接炒制'}</td>
                                    <td>${Utils.formatNumber(item.kernelWeight, 1)}</td>
                                    <td style="color: #ff5722; font-weight: 600;">${item.temperature}°C</td>
                                    <td>${item.roastingTime} min</td>
                                    <td>${this.getRoastLevelBadge(item.roastLevel)}</td>
                                    <td>${Utils.escapeHtml(item.operator || '-')}</td>
                                    <td>${this.getStatusBadge(item.status)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-outline btn-sm" onclick="PressingPage.viewRoasting('${item.id}')">查看</button>
                                            <button class="btn btn-secondary btn-sm" onclick="PressingPage.editRoasting('${item.id}')">编辑</button>
                                            <button class="btn btn-danger btn-sm" onclick="PressingPage.deleteRoasting('${item.id}')">删除</button>
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

    renderPressingTable() {
        const records = Storage.get('pressingRecords') || [];
        const sorted = records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (sorted.length === 0) {
            return `<div class="empty-state"><div class="empty-state-icon">⚙️</div><div class="empty-state-text">暂无压榨记录</div></div>`;
        }

        return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>来源批次</th>
                            <th>籽仁重量(kg)</th>
                            <th>毛油重量(kg)</th>
                            <th>茶枯重量(kg)</th>
                            <th>出油率(%)</th>
                            <th>操作人</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(item => {
                            const roasting = item.roastingId ? Storage.findById('roastingRecords', item.roastingId) : null;
                            return `
                                <tr>
                                    <td>${item.batchNo}</td>
                                    <td>${roasting ? roasting.batchNo : '直接压榨'}</td>
                                    <td>${Utils.formatNumber(item.kernelWeight, 1)}</td>
                                    <td style="color: #ff9800; font-weight: 600;">${Utils.formatNumber(item.crudeOilWeight, 1)}</td>
                                    <td>${Utils.formatNumber(item.cakeWeight, 1)}</td>
                                    <td style="font-weight: 700; color: #689f38;">${Utils.formatNumber(item.oilYieldRate, 2)}%</td>
                                    <td>${Utils.escapeHtml(item.operator || '-')}</td>
                                    <td>${this.getStatusBadge(item.status)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-outline btn-sm" onclick="PressingPage.viewPressing('${item.id}')">查看</button>
                                            <button class="btn btn-secondary btn-sm" onclick="PressingPage.editPressing('${item.id}')">编辑</button>
                                            <button class="btn btn-danger btn-sm" onclick="PressingPage.deletePressing('${item.id}')">删除</button>
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

    renderStats() {
        const pressingRecords = Storage.get('pressingRecords') || [];
        const recentRecords = pressingRecords.slice(0, 10);

        const totalKernel = pressingRecords.reduce((sum, r) => sum + (r.kernelWeight || 0), 0);
        const totalOil = pressingRecords.reduce((sum, r) => sum + (r.crudeOilWeight || 0), 0);
        const totalCake = pressingRecords.reduce((sum, r) => sum + (r.cakeWeight || 0), 0);
        const avgYield = totalKernel > 0 ? (totalOil / totalKernel) * 100 : 0;

        const maxYield = pressingRecords.length > 0 
            ? Math.max(...pressingRecords.map(r => r.oilYieldRate || 0)) 
            : 0;
        const minYield = pressingRecords.length > 0 
            ? Math.min(...pressingRecords.filter(r => r.oilYieldRate > 0).map(r => r.oilYieldRate)) 
            : 0;

        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #689f38;">${Utils.formatNumber(avgYield, 2)}%</div>
                    <div style="font-size: 13px; color: #888; margin-top: 6px;">综合出油率</div>
                </div>
                <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #f57c00;">${Utils.formatNumber(maxYield, 2)}%</div>
                    <div style="font-size: 13px; color: #888; margin-top: 6px;">最高出油率</div>
                </div>
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 28px; font-weight: 700; color: #1976d2;">${Utils.formatNumber(minYield, 2)}%</div>
                    <div style="font-size: 13px; color: #888; margin-top: 6px;">最低出油率</div>
                </div>
            </div>

            <div class="section-title">出油率趋势图</div>
            <div class="chart-container" style="height: 200px; margin-bottom: 24px;">
                ${this.renderYieldChart(recentRecords)}
            </div>

            <div class="section-title">近期压榨记录</div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>批次号</th>
                            <th>日期</th>
                            <th>籽仁(kg)</th>
                            <th>毛油(kg)</th>
                            <th>茶枯(kg)</th>
                            <th>出油率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentRecords.length === 0 ? '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">暂无数据</td></tr>' : 
                            recentRecords.map(r => `
                                <tr>
                                    <td>${r.batchNo}</td>
                                    <td>${Utils.formatDate(r.createdAt)}</td>
                                    <td>${Utils.formatNumber(r.kernelWeight, 1)}</td>
                                    <td>${Utils.formatNumber(r.crudeOilWeight, 1)}</td>
                                    <td>${Utils.formatNumber(r.cakeWeight, 1)}</td>
                                    <td style="font-weight: 600; color: #689f38;">${Utils.formatNumber(r.oilYieldRate, 2)}%</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                <div style="background: #fafafa; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 6px;">总批次</div>
                    <div style="font-size: 20px; font-weight: 700; color: #333;">${pressingRecords.length}</div>
                </div>
                <div style="background: #fafafa; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 6px;">总籽仁</div>
                    <div style="font-size: 20px; font-weight: 700; color: #333;">${Utils.formatNumber(totalKernel, 1)} kg</div>
                </div>
                <div style="background: #fafafa; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 6px;">总毛油</div>
                    <div style="font-size: 20px; font-weight: 700; color: #ff9800;">${Utils.formatNumber(totalOil, 1)} kg</div>
                </div>
                <div style="background: #fafafa; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 6px;">总茶枯</div>
                    <div style="font-size: 20px; font-weight: 700; color: #795548;">${Utils.formatNumber(totalCake, 1)} kg</div>
                </div>
            </div>
        `;
    },

    renderYieldChart(records) {
        if (records.length === 0) {
            return '<div style="color: #999;">暂无数据</div>';
        }

        const maxRate = Math.max(...records.map(r => r.oilYieldRate || 0), 25);
        const bars = records.slice().reverse().map((r, i) => {
            const height = maxRate > 0 ? ((r.oilYieldRate || 0) / maxRate) * 100 : 0;
            return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                    <div style="font-size: 11px; color: #689f38; font-weight: 600; margin-bottom: 4px;">${Utils.formatNumber(r.oilYieldRate, 1)}%</div>
                    <div style="width: 24px; height: ${height}%; background: linear-gradient(180deg, #8bc34a 0%, #689f38 100%); border-radius: 4px 4px 0 0; min-height: 4px;"></div>
                    <div style="font-size: 11px; color: #999; margin-top: 6px;">${Utils.formatDate(r.createdAt, 'MM-DD')}</div>
                </div>
            `;
        }).join('');

        return `
            <div style="width: 100%; height: 100%; display: flex; align-items: flex-end; gap: 12px; padding: 0 20px 20px;">
                ${bars}
            </div>
        `;
    },

    getRoastLevelBadge(level) {
        const map = {
            '轻炒': { class: 'badge-info' },
            '中炒': { class: 'badge-warning' },
            '老炒': { class: 'badge-danger' }
        };
        const s = map[level] || { class: 'badge-secondary' };
        return `<span class="badge ${s.class}">${level || '-'}</span>`;
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

    getRoastingCount() {
        const records = Storage.get('roastingRecords') || [];
        return records.length;
    },

    getPressingCount() {
        const records = Storage.get('pressingRecords') || [];
        return records.length;
    },

    getTotalOil() {
        const records = Storage.get('pressingRecords') || [];
        return Utils.formatNumber(records.reduce((sum, r) => sum + (r.crudeOilWeight || 0), 0), 1);
    },

    getAvgOilYield() {
        const records = Storage.get('pressingRecords') || [];
        const totalKernel = records.reduce((sum, r) => sum + (r.kernelWeight || 0), 0);
        const totalOil = records.reduce((sum, r) => sum + (r.crudeOilWeight || 0), 0);
        const avg = totalKernel > 0 ? (totalOil / totalKernel) * 100 : 0;
        return Utils.formatNumber(avg, 2);
    },

    switchTab(tab) {
        this.currentTab = tab;
        this.refresh();
    },

    openAddModal() {
        if (this.currentTab === 'roasting') {
            this.openRoastingModal();
        } else if (this.currentTab === 'pressing') {
            this.openPressingModal();
        } else {
            Utils.toast('请切换到炒籽或压榨标签添加记录', 'warning');
        }
    },

    openRoastingModal() {
        const shellingList = (Storage.get('shellingRecords') || [])
            .filter(s => s.status === 'completed');
        const shellingOptions = shellingList.map(s => 
            `<option value="${s.id}" data-weight="${s.kernelWeight}">
                ${s.batchNo} - ${Utils.formatNumber(s.kernelWeight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="roastingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('CZ')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源剥壳批次</label>
                        <select id="shellingSelect" name="shellingId" onchange="PressingPage.onShellingChange()">
                            <option value="">直接炒制（无来源）</option>
                            ${shellingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>籽仁重量(kg) *</label>
                        <input type="number" id="roastingKernelWeight" name="kernelWeight" step="0.1" min="0" required>
                    </div>
                    <div class="form-group">
                        <label>炒制温度(°C) *</label>
                        <input type="number" id="roastingTemperature" name="temperature" min="0" max="200" value="120" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>炒制时间(分钟) *</label>
                        <input type="number" name="roastingTime" min="0" value="40" required>
                    </div>
                    <div class="form-group">
                        <label>炒制程度</label>
                        <select name="roastLevel">
                            <option value="轻炒">轻炒</option>
                            <option value="中炒" selected>中炒</option>
                            <option value="老炒">老炒</option>
                        </select>
                    </div>
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

        Utils.showModal('新增炒制记录', content);

        const form = document.getElementById('roastingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('roastingForm');

            const formData = new FormData(form);
            const kernelWeight = parseFloat(formData.get('kernelWeight')) || 0;
            const temperature = parseFloat(formData.get('temperature')) || 0;
            const roastingTime = parseFloat(formData.get('roastingTime')) || 0;

            const weightCheck = Utils.validate.positiveNumber(kernelWeight, '籽仁重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('roastingKernelWeight', weightCheck.message);
                return;
            }

            if (temperature <= 0 || temperature > 200) {
                Utils.showFieldError('roastingTemperature', '炒制温度应在 0-200°C 之间');
                return;
            }

            if (roastingTime <= 0) {
                Utils.toast('炒制时间必须大于0', 'error');
                return;
            }

            const data = {
                batchNo: formData.get('batchNo'),
                shellingId: formData.get('shellingId') || null,
                kernelWeight: kernelWeight,
                temperature: temperature,
                roastingTime: roastingTime,
                roastLevel: formData.get('roastLevel'),
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('roastingRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
        });
    },

    onShellingChange() {
        const select = document.getElementById('shellingSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('roastingKernelWeight');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
        }
    },

    viewRoasting(id) {
        const item = Storage.findById('roastingRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('roastingRecords', id);
        const shelling = chain.source;

        let sourceHtml = '';
        if (shelling) {
            sourceHtml = `
                <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('drying');">
                    <span style="color: #1976d2; font-weight: 600;">${shelling.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(shelling.kernelWeight || 0, 1)}kg</span>
                    <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源剥壳</span>
                </div>
            `;
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接炒制）</div>';
        }

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('pressing');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(t.crudeOilWeight || 0, 1)}kg 毛油</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 压榨</span>
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
                    <span class="label">籽仁重量</span>
                    <span class="value">${Utils.formatNumber(item.kernelWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">炒制温度</span>
                    <span class="value" style="color: #ff5722; font-weight: 700;">${item.temperature}°C</span>
                </div>
                <div class="info-item">
                    <span class="label">炒制时间</span>
                    <span class="value">${item.roastingTime} 分钟</span>
                </div>
                <div class="info-item">
                    <span class="label">炒制程度</span>
                    <span class="value">${this.getRoastLevelBadge(item.roastLevel)}</span>
                </div>
                <div class="info-item">
                    <span class="label">操作人</span>
                    <span class="value">${Utils.escapeHtml(item.operator || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">炒制时间</span>
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

        Utils.showModal('炒制详情', content);
    },

    editRoasting(id) {
        const record = Storage.findById('roastingRecords', id);
        if (!record) return;

        const shellingList = (Storage.get('shellingRecords') || [])
            .filter(s => s.status === 'completed' || s.id === record.shellingId);
        const shellingOptions = shellingList.map(s => 
            `<option value="${s.id}" ${s.id === record.shellingId ? 'selected' : ''}>
                ${s.batchNo} - ${Utils.formatNumber(s.kernelWeight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="roastingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${record.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源剥壳批次</label>
                        <select name="shellingId">
                            <option value="">直接炒制（无来源）</option>
                            ${shellingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>籽仁重量(kg) *</label>
                        <input type="number" id="roastingKernelWeight" name="kernelWeight" step="0.1" min="0" value="${record.kernelWeight}" required>
                    </div>
                    <div class="form-group">
                        <label>炒制温度(°C) *</label>
                        <input type="number" id="roastingTemperature" name="temperature" min="0" max="200" value="${record.temperature}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>炒制时间(分钟) *</label>
                        <input type="number" name="roastingTime" min="0" value="${record.roastingTime}" required>
                    </div>
                    <div class="form-group">
                        <label>炒制程度</label>
                        <select name="roastLevel">
                            <option value="轻炒" ${record.roastLevel === '轻炒' ? 'selected' : ''}>轻炒</option>
                            <option value="中炒" ${record.roastLevel === '中炒' ? 'selected' : ''}>中炒</option>
                            <option value="老炒" ${record.roastLevel === '老炒' ? 'selected' : ''}>老炒</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator" value="${Utils.escapeHtml(record.operator || '')}">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing" ${record.status === 'processing' ? 'selected' : ''}>进行中</option>
                            <option value="completed" ${record.status === 'completed' ? 'selected' : ''}>已完成</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="2">${Utils.escapeHtml(record.remark || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal('编辑炒制记录', content);

        const form = document.getElementById('roastingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('roastingForm');

            const formData = new FormData(form);
            const kernelWeight = parseFloat(formData.get('kernelWeight')) || 0;
            const temperature = parseFloat(formData.get('temperature')) || 0;

            const weightCheck = Utils.validate.positiveNumber(kernelWeight, '籽仁重量');
            if (!weightCheck.valid) {
                Utils.showFieldError('roastingKernelWeight', weightCheck.message);
                return;
            }

            if (temperature <= 0 || temperature > 200) {
                Utils.showFieldError('roastingTemperature', '炒制温度应在 0-200°C 之间');
                return;
            }

            const data = {
                shellingId: formData.get('shellingId') || null,
                kernelWeight: kernelWeight,
                temperature: temperature,
                roastingTime: parseFloat(formData.get('roastingTime')) || 0,
                roastLevel: formData.get('roastLevel'),
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('roastingRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
        });
    },

    deleteRoasting(id) {
        if (!Utils.confirm('确定要删除这条炒制记录吗？删除后无法恢复。')) return;
        Storage.delete('roastingRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
    },

    openPressingModal() {
        const roastingList = (Storage.get('roastingRecords') || [])
            .filter(r => r.status === 'completed');
        const roastingOptions = roastingList.map(r => 
            `<option value="${r.id}" data-weight="${r.kernelWeight}">
                ${r.batchNo} - ${Utils.formatNumber(r.kernelWeight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="pressingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${Utils.generateBatchNo('ZY')}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源炒制批次</label>
                        <select id="roastingSelect" name="roastingId" onchange="PressingPage.onRoastingChange()">
                            <option value="">直接压榨（无来源）</option>
                            ${roastingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>籽仁重量(kg) *</label>
                        <input type="number" id="pressingKernelWeight" name="kernelWeight" step="0.1" min="0" required oninput="PressingPage.calcYield()">
                    </div>
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" id="pressingCrudeOilWeight" name="crudeOilWeight" step="0.1" min="0" required oninput="PressingPage.calcYield()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶枯重量(kg)</label>
                        <input type="number" name="cakeWeight" step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label>出油率(%)</label>
                        <input type="text" id="pressingOilYieldRate" name="oilYieldRate" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>压榨压力(MPa)</label>
                        <input type="number" name="pressure" min="0" max="100" value="50">
                    </div>
                    <div class="form-group">
                        <label>压榨时间(分钟)</label>
                        <input type="number" name="pressingTime" min="0" value="120">
                    </div>
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

        Utils.showModal('新增压榨记录', content);

        const form = document.getElementById('pressingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('pressingForm');

            const formData = new FormData(form);
            const kernelWeight = parseFloat(formData.get('kernelWeight')) || 0;
            const crudeOilWeight = parseFloat(formData.get('crudeOilWeight')) || 0;
            const oilYieldRate = kernelWeight > 0 ? (crudeOilWeight / kernelWeight) * 100 : 0;

            const kernelCheck = Utils.validate.positiveNumber(kernelWeight, '籽仁重量');
            if (!kernelCheck.valid) {
                Utils.showFieldError('pressingKernelWeight', kernelCheck.message);
                return;
            }

            const oilCheck = Utils.validate.positiveNumber(crudeOilWeight, '毛油重量');
            if (!oilCheck.valid) {
                Utils.showFieldError('pressingCrudeOilWeight', oilCheck.message);
                return;
            }

            if (crudeOilWeight > kernelWeight) {
                Utils.showFieldError('pressingCrudeOilWeight', '毛油重量不能大于籽仁重量');
                return;
            }

            const yieldCheck = Utils.validate.oilYieldRate(oilYieldRate);
            if (!yieldCheck.valid) {
                Utils.showFieldError('pressingOilYieldRate', yieldCheck.message);
                return;
            }
            if (yieldCheck.warning) {
                Utils.showFieldError('pressingOilYieldRate', yieldCheck.warning, 'warning');
            }

            const data = {
                batchNo: formData.get('batchNo'),
                roastingId: formData.get('roastingId') || null,
                kernelWeight: kernelWeight,
                crudeOilWeight: crudeOilWeight,
                cakeWeight: parseFloat(formData.get('cakeWeight')) || 0,
                oilYieldRate: oilYieldRate,
                pressure: parseFloat(formData.get('pressure')) || 0,
                pressingTime: parseFloat(formData.get('pressingTime')) || 0,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.add('pressingRecords', data);
            Utils.hideModal();
            Utils.toast('保存成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    onRoastingChange() {
        const select = document.getElementById('roastingSelect');
        const option = select.options[select.selectedIndex];
        const weightInput = document.getElementById('pressingKernelWeight');
        if (option && option.dataset.weight) {
            weightInput.value = option.dataset.weight;
            this.calcYield();
        }
    },

    calcYield() {
        const form = document.getElementById('pressingForm');
        if (!form) return;
        const kernel = parseFloat(form.kernelWeight.value) || 0;
        const oil = parseFloat(form.crudeOilWeight.value) || 0;
        const rate = kernel > 0 ? ((oil / kernel) * 100).toFixed(2) : '0.00';
        if (form.oilYieldRate) {
            form.oilYieldRate.value = rate + '%';
        }
    },

    viewPressing(id) {
        const item = Storage.findById('pressingRecords', id);
        if (!item) return;

        const chain = Storage.getBatchChain('pressingRecords', id);
        const roasting = chain.source;

        let sourceHtml = '';
        if (roasting) {
            sourceHtml = `
                <div style="padding: 8px 12px; background: #e8f4fd; border-radius: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('pressing');">
                    <span style="color: #1976d2; font-weight: 600;">${roasting.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(roasting.kernelWeight || 0, 1)}kg</span>
                    <span style="color: #1976d2; font-size: 12px; margin-left: 8px;">← 来源炒制</span>
                </div>
            `;
        } else {
            sourceHtml = '<div style="color: #aaa; font-size: 13px;">无来源（直接压榨）</div>';
        }

        let targetHtml = '';
        if (chain.target && chain.target.length > 0) {
            targetHtml = chain.target.map(t => `
                <div style="padding: 8px 12px; background: #f0f9eb; border-radius: 6px; margin-bottom: 6px; cursor: pointer;"
                     onclick="Utils.hideModal(); App.switchPage('filtering');">
                    <span style="color: #689f38; font-weight: 600;">${t.batchNo}</span>
                    <span style="color: #888; margin-left: 8px;">${Utils.formatNumber(t.filteredOilWeight || 0, 1)}kg 净油</span>
                    <span style="color: #689f38; font-size: 12px; margin-left: 8px;">→ 过滤</span>
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
                    <span class="label">籽仁重量</span>
                    <span class="value">${Utils.formatNumber(item.kernelWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">毛油重量</span>
                    <span class="value" style="color: #ff9800; font-weight: 700;">${Utils.formatNumber(item.crudeOilWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">茶枯重量</span>
                    <span class="value">${Utils.formatNumber(item.cakeWeight, 1)} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">出油率</span>
                    <span class="value" style="color: #689f38; font-weight: 700;">${Utils.formatNumber(item.oilYieldRate, 2)}%</span>
                </div>
                <div class="info-item">
                    <span class="label">压榨压力</span>
                    <span class="value">${item.pressure} MPa</span>
                </div>
                <div class="info-item">
                    <span class="label">压榨时间</span>
                    <span class="value">${item.pressingTime} 分钟</span>
                </div>
                <div class="info-item">
                    <span class="label">操作人</span>
                    <span class="value">${Utils.escapeHtml(item.operator || '-')}</span>
                </div>
                <div class="info-item">
                    <span class="label">压榨时间</span>
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

        Utils.showModal('压榨详情', content);
    },

    editPressing(id) {
        const record = Storage.findById('pressingRecords', id);
        if (!record) return;

        const roastingList = (Storage.get('roastingRecords') || [])
            .filter(r => r.status === 'completed' || r.id === record.roastingId);
        const roastingOptions = roastingList.map(r => 
            `<option value="${r.id}" ${r.id === record.roastingId ? 'selected' : ''}>
                ${r.batchNo} - ${Utils.formatNumber(r.kernelWeight, 1)}kg
            </option>`
        ).join('');

        const content = `
            <form id="pressingForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>批次号</label>
                        <input type="text" name="batchNo" value="${record.batchNo}" readonly style="background: #f5f5f5;">
                    </div>
                    <div class="form-group">
                        <label>来源炒制批次</label>
                        <select name="roastingId">
                            <option value="">直接压榨（无来源）</option>
                            ${roastingOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>籽仁重量(kg) *</label>
                        <input type="number" id="pressingKernelWeight" name="kernelWeight" step="0.1" min="0" value="${record.kernelWeight}" required oninput="PressingPage.calcYield()">
                    </div>
                    <div class="form-group">
                        <label>毛油重量(kg) *</label>
                        <input type="number" id="pressingCrudeOilWeight" name="crudeOilWeight" step="0.1" min="0" value="${record.crudeOilWeight}" required oninput="PressingPage.calcYield()">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>茶枯重量(kg)</label>
                        <input type="number" name="cakeWeight" step="0.1" min="0" value="${record.cakeWeight}">
                    </div>
                    <div class="form-group">
                        <label>出油率(%)</label>
                        <input type="text" id="pressingOilYieldRate" name="oilYieldRate" value="${Utils.formatNumber(record.oilYieldRate, 2)}%" readonly style="background: #f5f5f5; color: #689f38; font-weight: 700;">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>压榨压力(MPa)</label>
                        <input type="number" name="pressure" min="0" max="100" value="${record.pressure}">
                    </div>
                    <div class="form-group">
                        <label>压榨时间(分钟)</label>
                        <input type="number" name="pressingTime" min="0" value="${record.pressingTime}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作人</label>
                        <input type="text" name="operator" value="${Utils.escapeHtml(record.operator || '')}">
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select name="status">
                            <option value="processing" ${record.status === 'processing' ? 'selected' : ''}>进行中</option>
                            <option value="completed" ${record.status === 'completed' ? 'selected' : ''}>已完成</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea name="remark" rows="2">${Utils.escapeHtml(record.remark || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="Utils.hideModal()">取消</button>
                    <button type="submit" class="btn btn-primary">确认保存</button>
                </div>
            </form>
        `;

        Utils.showModal('编辑压榨记录', content);

        const form = document.getElementById('pressingForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Utils.clearFieldErrors('pressingForm');

            const formData = new FormData(form);
            const kernelWeight = parseFloat(formData.get('kernelWeight')) || 0;
            const crudeOilWeight = parseFloat(formData.get('crudeOilWeight')) || 0;
            const oilYieldRate = kernelWeight > 0 ? (crudeOilWeight / kernelWeight) * 100 : 0;

            if (crudeOilWeight > kernelWeight) {
                Utils.showFieldError('pressingCrudeOilWeight', '毛油重量不能大于籽仁重量');
                return;
            }

            const yieldCheck = Utils.validate.oilYieldRate(oilYieldRate);
            if (!yieldCheck.valid) {
                Utils.showFieldError('pressingOilYieldRate', yieldCheck.message);
                return;
            }

            const data = {
                roastingId: formData.get('roastingId') || null,
                kernelWeight: kernelWeight,
                crudeOilWeight: crudeOilWeight,
                cakeWeight: parseFloat(formData.get('cakeWeight')) || 0,
                oilYieldRate: oilYieldRate,
                pressure: parseFloat(formData.get('pressure')) || 0,
                pressingTime: parseFloat(formData.get('pressingTime')) || 0,
                operator: formData.get('operator'),
                status: formData.get('status'),
                remark: formData.get('remark')
            };

            Storage.update('pressingRecords', id, data);
            Utils.hideModal();
            Utils.toast('更新成功', 'success');
            this.refresh();
            App.updateSidebarStats();
        });
    },

    deletePressing(id) {
        if (!Utils.confirm('确定要删除这条压榨记录吗？删除后无法恢复。')) return;
        Storage.delete('pressingRecords', id);
        Utils.toast('删除成功', 'success');
        this.refresh();
        App.updateSidebarStats();
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
