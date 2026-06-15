const Storage = {
    PREFIX: 'oilmill_',

    get(key) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    add(key, item) {
        const list = this.get(key) || [];
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        list.unshift(item);
        this.set(key, list);
        return item;
    },

    update(key, id, updates) {
        const list = this.get(key) || [];
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
            const oldItem = list[index];
            list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(key, list);
            return { newItem: list[index], oldItem: oldItem };
        }
        return null;
    },

    delete(key, id) {
        const list = this.get(key) || [];
        const item = list.find(i => i.id === id);
        const filtered = list.filter(item => item.id !== id);
        this.set(key, filtered);
        return { success: filtered.length !== list.length, deletedItem: item };
    },

    findById(key, id) {
        const list = this.get(key) || [];
        return list.find(item => item.id === id) || null;
    },

    filter(key, conditions) {
        const list = this.get(key) || [];
        return list.filter(item => {
            for (const [field, condition] of Object.entries(conditions)) {
                if (condition === undefined || condition === null || condition === '') continue;
                
                const itemValue = item[field];
                
                if (typeof condition === 'function') {
                    if (!condition(itemValue, item)) return false;
                } else if (typeof condition === 'string' && condition.includes('*')) {
                    const pattern = condition.replace(/\*/g, '.*');
                    const regex = new RegExp(pattern, 'i');
                    if (!regex.test(String(itemValue || ''))) return false;
                } else {
                    if (itemValue != condition) return false;
                }
            }
            return true;
        });
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    getBatchChain(recordType, recordId) {
        const chain = { source: null, target: null };
        
        const typeMap = {
            purchases: { sourceKey: null, targetKey: 'purchaseId', targetType: 'dryingRecords' },
            dryingRecords: { sourceKey: 'purchaseId', sourceType: 'purchases', targetKey: 'dryingId', targetType: 'shellingRecords' },
            shellingRecords: { sourceKey: 'dryingId', sourceType: 'dryingRecords', targetKey: 'shellingId', targetType: 'roastingRecords' },
            roastingRecords: { sourceKey: 'shellingId', sourceType: 'shellingRecords', targetKey: 'roastingId', targetType: 'pressingRecords' },
            pressingRecords: { sourceKey: 'roastingId', sourceType: 'roastingRecords', targetKey: 'pressingId', targetType: 'filteringRecords' },
            filteringRecords: { sourceKey: 'pressingId', sourceType: 'pressingRecords', targetKey: 'filteringId', targetType: 'refiningRecords' },
            refiningRecords: { sourceKey: 'filteringId', sourceType: 'filteringRecords', targetKey: 'refiningId', targetType: 'bottlingRecords' },
            bottlingRecords: { sourceKey: 'refiningId', sourceType: 'refiningRecords', targetKey: null, targetType: null }
        };

        const current = this.findById(recordType, recordId);
        if (!current) return chain;

        const mapping = typeMap[recordType];
        if (mapping && mapping.sourceKey && mapping.sourceType) {
            const sourceId = current[mapping.sourceKey];
            if (sourceId) {
                chain.source = this.findById(mapping.sourceType, sourceId);
                chain.sourceType = mapping.sourceType;
            }
        }

        if (mapping && mapping.targetKey && mapping.targetType) {
            const targetList = this.filter(mapping.targetType, { [mapping.targetKey]: recordId });
            if (targetList && targetList.length > 0) {
                chain.target = targetList;
                chain.targetType = mapping.targetType;
            }
        }

        return chain;
    },

    getAvailableBatches(sourceType, sourceField, weightField) {
        const list = this.get(sourceType) || [];
        return list.filter(item => {
            if (item.status !== 'completed') return false;
            if (item._used) return false;
            return true;
        }).map(item => ({
            id: item.id,
            batchNo: item.batchNo || item.orderNo || item.id,
            weight: item[weightField] || 0,
            ...item
        }));
    },

    updateProductStock(productId, quantityChange, reason = '', extra = {}) {
        const product = this.findById('products', productId);
        if (!product) return { success: false, message: '产品不存在' };

        const newStock = (product.stock || 0) + quantityChange;
        if (newStock < 0) {
            return { 
                success: false, 
                message: `库存不足！当前库存 ${product.stock}，需要 ${Math.abs(quantityChange)}`,
                currentStock: product.stock
            };
        }

        const result = this.update('products', productId, { stock: newStock });
        if (result) {
            const stockLogs = this.get('stockLogs') || [];
            const logType = quantityChange > 0 ? 'in' : 'out';
            stockLogs.unshift({
                id: this.generateId(),
                productId: productId,
                productName: product.name,
                spec: product.spec || '',
                change: quantityChange,
                changeType: logType,
                stockBefore: product.stock || 0,
                stockAfter: newStock,
                reason: reason,
                operator: extra.operator || '',
                relatedId: extra.relatedId || '',
                createdAt: new Date().toISOString()
            });
            this.set('stockLogs', stockLogs);
            return { success: true, stock: newStock };
        }
        return { success: false, message: '更新失败' };
    },

    adjustProductStock(productId, newStockValue, reason = '', operator = '') {
        const product = this.findById('products', productId);
        if (!product) return { success: false, message: '产品不存在' };
        if (newStockValue < 0) return { success: false, message: '库存不能为负数' };

        const oldStock = product.stock || 0;
        const change = newStockValue - oldStock;

        if (change === 0) {
            return { success: true, stock: oldStock, unchanged: true };
        }

        const result = this.update('products', productId, { stock: newStockValue });
        if (result) {
            const stockLogs = this.get('stockLogs') || [];
            stockLogs.unshift({
                id: this.generateId(),
                productId: productId,
                productName: product.name,
                spec: product.spec || '',
                change: change,
                changeType: 'adjust',
                stockBefore: oldStock,
                stockAfter: newStockValue,
                reason: reason || '手工调整库存',
                operator: operator,
                relatedId: '',
                createdAt: new Date().toISOString()
            });
            this.set('stockLogs', stockLogs);
            return { success: true, stock: newStockValue, change: change };
        }
        return { success: false, message: '更新失败' };
    },

    getStockLogs(filters = {}) {
        const logs = this.get('stockLogs') || [];
        return logs.filter(log => {
            if (filters.productId && log.productId !== filters.productId) return false;
            if (filters.changeType && log.changeType !== filters.changeType) return false;
            if (filters.dateStart) {
                if (new Date(log.createdAt) < new Date(filters.dateStart)) return false;
            }
            if (filters.dateEnd) {
                const end = new Date(filters.dateEnd);
                end.setHours(23, 59, 59, 999);
                if (new Date(log.createdAt) > end) return false;
            }
            return true;
        });
    },

    getFullBatchChainFromBottling(bottlingId) {
        const chain = [];
        let current = this.findById('bottlingRecords', bottlingId);
        if (!current) return chain;

        const steps = [
            { key: 'bottlingRecords', label: '灌装', batchField: 'bottlingId' },
            { key: 'refiningRecords', label: '精炼', batchField: 'refiningId', linkField: 'refiningId' },
            { key: 'filteringRecords', label: '过滤', batchField: 'filteringId', linkField: 'filteringId' },
            { key: 'pressingRecords', label: '压榨', batchField: 'pressingId', linkField: 'pressingId' },
            { key: 'roastingRecords', label: '炒制', batchField: 'roastingId', linkField: 'roastingId' },
            { key: 'shellingRecords', label: '剥壳', batchField: 'shellingId', linkField: 'shellingId' },
            { key: 'dryingRecords', label: '晾晒', batchField: 'dryingId', linkField: 'dryingId' },
            { key: 'purchases', label: '收购', batchField: 'purchaseId', linkField: 'purchaseId' }
        ];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (current) {
                chain.push({
                    type: step.key,
                    label: step.label,
                    id: current.id,
                    batchNo: current.batchNo || current.orderNo || '',
                    status: current.status || '',
                    data: current
                });
            }
            if (i < steps.length - 1 && current) {
                const nextStep = steps[i + 1];
                const linkId = current[nextStep.linkField];
                if (linkId) {
                    current = this.findById(nextStep.key, linkId);
                } else {
                    current = null;
                }
            }
        }
        return chain;
    },

    getFullBatchChainFromSale(saleId) {
        const sale = this.findById('salesRecords', saleId);
        if (!sale) return { sale: null, chain: [], bottling: null };
        
        const bottlingRecords = this.get('bottlingRecords') || [];
        let bottling = null;
        if (sale.bottlingId) {
            bottling = this.findById('bottlingRecords', sale.bottlingId);
        } else if (sale.productId) {
            bottling = bottlingRecords.find(b => b.productId === sale.productId && b.status === 'completed');
        }
        
        const chain = bottling ? this.getFullBatchChainFromBottling(bottling.id) : [];
        return { sale: sale, chain: chain, bottling: bottling };
    },

    initMockData() {
        if (!this.get('purchases')) {
            const mockPurchases = [
                {
                    id: 'purchase_001',
                    type: 'buy',
                    farmerName: '张三',
                    farmerPhone: '13800138001',
                    village: '东风村',
                    seedType: '普通油茶籽',
                    weight: 520,
                    moisture: 12.5,
                    price: 8.5,
                    totalAmount: 4420,
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                    remark: '一级籽'
                },
                {
                    id: 'purchase_002',
                    type: 'process',
                    farmerName: '李四',
                    farmerPhone: '13800138002',
                    village: '红旗村',
                    seedType: '红花油茶籽',
                    weight: 300,
                    moisture: 15.2,
                    price: 0,
                    totalAmount: 0,
                    processFee: 150,
                    status: 'processing',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: '来料代榨'
                },
                {
                    id: 'purchase_003',
                    type: 'buy',
                    farmerName: '王五',
                    farmerPhone: '13800138003',
                    village: '胜利村',
                    seedType: '小果油茶籽',
                    weight: 200,
                    moisture: 10.8,
                    price: 9.2,
                    totalAmount: 1840,
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
                    remark: '今天刚收的'
                }
            ];
            this.set('purchases', mockPurchases);
        }

        if (!this.get('dryingRecords')) {
            const mockDrying = [
                {
                    id: 'drying_001',
                    batchNo: 'GZ202401001',
                    purchaseId: 'purchase_001',
                    seedWeight: 520,
                    initialMoisture: 12.5,
                    targetMoisture: 8,
                    currentMoisture: 7.8,
                    dryingMethod: '自然晾晒',
                    status: 'completed',
                    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
                    remark: '晾晒完成'
                },
                {
                    id: 'drying_002',
                    batchNo: 'GZ202401002',
                    purchaseId: 'purchase_003',
                    seedWeight: 200,
                    initialMoisture: 10.8,
                    targetMoisture: 8,
                    currentMoisture: 9.5,
                    dryingMethod: '烘干房',
                    status: 'drying',
                    startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
                    remark: '烘干中'
                }
            ];
            this.set('dryingRecords', mockDrying);
        }

        if (!this.get('shellingRecords')) {
            const mockShelling = [
                {
                    id: 'shelling_001',
                    batchNo: 'BK202401001',
                    dryingId: 'drying_001',
                    seedWeight: 495,
                    shellWeight: 185,
                    kernelWeight: 310,
                    shellingRate: 62.6,
                    impurityRate: 1.2,
                    operator: '王师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: ''
                }
            ];
            this.set('shellingRecords', mockShelling);
        }

        if (!this.get('roastingRecords')) {
            const mockRoasting = [
                {
                    id: 'roasting_001',
                    batchNo: 'CZ202401001',
                    shellingId: 'shelling_001',
                    kernelWeight: 310,
                    temperature: 120,
                    roastingTime: 45,
                    roastLevel: '中炒',
                    operator: '李师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: '火候适中'
                }
            ];
            this.set('roastingRecords', mockRoasting);
        }

        if (!this.get('pressingRecords')) {
            const mockPressing = [
                {
                    id: 'pressing_001',
                    batchNo: 'ZY202401001',
                    roastingId: 'roasting_001',
                    kernelWeight: 305,
                    crudeOilWeight: 68,
                    cakeWeight: 225,
                    oilYieldRate: 22.3,
                    pressure: 50,
                    pressingTime: 120,
                    operator: '张师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: ''
                },
                {
                    id: 'pressing_002',
                    batchNo: 'ZY202401002',
                    roastingId: null,
                    kernelWeight: 150,
                    crudeOilWeight: 33,
                    cakeWeight: 110,
                    oilYieldRate: 22.0,
                    pressure: 55,
                    pressingTime: 100,
                    operator: '张师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                    remark: '小批次'
                }
            ];
            this.set('pressingRecords', mockPressing);
        }

        if (!this.get('filteringRecords')) {
            const mockFiltering = [
                {
                    id: 'filtering_001',
                    batchNo: 'GL202401001',
                    pressingId: 'pressing_001',
                    crudeOilWeight: 68,
                    filteredOilWeight: 64.5,
                    filterMethod: '板框过滤',
                    sedimentWeight: 3,
                    filterTime: 180,
                    operator: '王师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 43200000).toISOString(),
                    remark: ''
                }
            ];
            this.set('filteringRecords', mockFiltering);
        }

        if (!this.get('refiningRecords')) {
            const mockRefining = [
                {
                    id: 'refining_001',
                    batchNo: 'JL202401001',
                    filteringId: 'filtering_001',
                    crudeOilWeight: 64.5,
                    refinedOilWeight: 60,
                    degumming: true,
                    deacidification: true,
                    decolorization: false,
                    deodorization: false,
                    refiningRate: 93.02,
                    operator: '李师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 21600000).toISOString(),
                    remark: '一级精炼'
                }
            ];
            this.set('refiningRecords', mockRefining);
        }

        if (!this.get('bottlingRecords')) {
            const mockBottling = [
                {
                    id: 'bottling_001',
                    batchNo: 'GZ202401001',
                    refiningId: 'refining_001',
                    oilWeight: 60,
                    bottleSpec: '500ml',
                    bottleCount: 110,
                    _soldCount: 20,
                    labelType: '精品山茶油',
                    productId: 'prod_001',
                    operator: '王大姐',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                    remark: ''
                },
                {
                    id: 'bottling_002',
                    batchNo: 'GZ202401002',
                    refiningId: 'refining_001',
                    oilWeight: 45,
                    bottleSpec: '1L',
                    bottleCount: 45,
                    _soldCount: 5,
                    labelType: '一级山茶油',
                    productId: 'prod_002',
                    operator: '王大姐',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
                    remark: ''
                },
                {
                    id: 'bottling_003',
                    batchNo: 'GZ202401003',
                    refiningId: 'refining_002',
                    oilWeight: 50,
                    bottleSpec: '2.5L',
                    bottleCount: 20,
                    _soldCount: 0,
                    labelType: '农家山茶油',
                    productId: 'prod_003',
                    operator: '李师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
                    remark: '第二批灌装'
                },
                {
                    id: 'bottling_004',
                    batchNo: 'GZ202401004',
                    refiningId: 'refining_001',
                    oilWeight: 55,
                    bottleSpec: '500ml',
                    bottleCount: 100,
                    _soldCount: 0,
                    labelType: '精品山茶油',
                    productId: 'prod_001',
                    operator: '李师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
                    remark: '新批次灌装，同产品500ml'
                }
            ];
            this.set('bottlingRecords', mockBottling);
        }

        if (!this.get('cakeRecords')) {
            const mockCake = [
                {
                    id: 'cake_produce_001',
                    type: 'produce',
                    batchNo: 'CK202401001',
                    pressingId: 'pressing_001',
                    cakeWeight: 225,
                    cakeCount: 23,
                    status: 'instock',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: ''
                },
                {
                    id: 'cake_sell_001',
                    type: 'sell',
                    customerName: '赵老板',
                    customerPhone: '13900139001',
                    cakeWeight: 100,
                    cakeCount: 10,
                    price: 2.5,
                    totalAmount: 250,
                    status: 'completed',
                    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
                    remark: ''
                }
            ];
            this.set('cakeRecords', mockCake);
        }

        if (!this.get('salesRecords')) {
            const mockSales = [
                {
                    id: 'sale_001',
                    orderNo: 'XS202401001',
                    customerName: '陈女士',
                    customerPhone: '13700137001',
                    productId: 'prod_001',
                    bottlingId: 'bottling_001',
                    productName: '精品山茶油',
                    spec: '500ml',
                    quantity: 20,
                    unitPrice: 128,
                    totalAmount: 2560,
                    paymentMethod: '微信',
                    status: 'completed',
                    stockDeducted: true,
                    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
                    remark: '老客户'
                },
                {
                    id: 'sale_002',
                    orderNo: 'XS202401002',
                    customerName: '刘先生',
                    customerPhone: '13600136002',
                    productId: 'prod_002',
                    bottlingId: 'bottling_002',
                    productName: '一级山茶油',
                    spec: '1L',
                    quantity: 5,
                    unitPrice: 238,
                    totalAmount: 1190,
                    paymentMethod: '现金',
                    status: 'completed',
                    stockDeducted: true,
                    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                    remark: ''
                }
            ];
            this.set('salesRecords', mockSales);
        }

        if (!this.get('products')) {
            const mockProducts = [
                { id: 'prod_001', name: '精品山茶油', spec: '500ml', price: 128, stock: 90 },
                { id: 'prod_002', name: '一级山茶油', spec: '1L', price: 238, stock: 45 },
                { id: 'prod_003', name: '农家山茶油', spec: '2.5L', price: 398, stock: 30 }
            ];
            this.set('products', mockProducts);
        }

        if (!this.get('stockLogs')) {
            this.set('stockLogs', []);
        }
    }
};
