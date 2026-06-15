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
            list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(key, list);
            return list[index];
        }
        return null;
    },

    delete(key, id) {
        const list = this.get(key) || [];
        const filtered = list.filter(item => item.id !== id);
        this.set(key, filtered);
        return filtered.length !== list.length;
    },

    findById(key, id) {
        const list = this.get(key) || [];
        return list.find(item => item.id === id) || null;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    initMockData() {
        if (!this.get('purchases')) {
            const mockPurchases = [
                {
                    id: this.generateId(),
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
                    id: this.generateId(),
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
                }
            ];
            this.set('purchases', mockPurchases);
        }

        if (!this.get('dryingRecords')) {
            const mockDrying = [
                {
                    id: this.generateId(),
                    batchNo: 'GZ202401001',
                    purchaseId: null,
                    seedWeight: 520,
                    initialMoisture: 12.5,
                    targetMoisture: 8,
                    currentMoisture: 9.8,
                    dryingMethod: '自然晾晒',
                    status: 'drying',
                    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
                    remark: '晾晒中'
                }
            ];
            this.set('dryingRecords', mockDrying);
        }

        if (!this.get('shellingRecords')) {
            const mockShelling = [
                {
                    id: this.generateId(),
                    batchNo: 'BK202401001',
                    dryingId: null,
                    seedWeight: 480,
                    shellWeight: 180,
                    kernelWeight: 300,
                    shellingRate: 62.5,
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
                    id: this.generateId(),
                    batchNo: 'CZ202401001',
                    kernelWeight: 300,
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
                    id: this.generateId(),
                    batchNo: 'ZY202401001',
                    roastingId: null,
                    kernelWeight: 295,
                    crudeOilWeight: 65,
                    cakeWeight: 220,
                    oilYieldRate: 22.03,
                    pressure: 50,
                    pressingTime: 120,
                    operator: '张师傅',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: ''
                }
            ];
            this.set('pressingRecords', mockPressing);
        }

        if (!this.get('filteringRecords')) {
            const mockFiltering = [
                {
                    id: this.generateId(),
                    batchNo: 'GL202401001',
                    pressingId: null,
                    crudeOilWeight: 65,
                    filteredOilWeight: 62,
                    filterMethod: '板框过滤',
                    sedimentWeight: 2.5,
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
                    id: this.generateId(),
                    batchNo: 'JL202401001',
                    filteringId: null,
                    crudeOilWeight: 62,
                    refinedOilWeight: 58,
                    degumming: true,
                    deacidification: true,
                    decolorization: false,
                    deodorization: false,
                    refiningRate: 93.55,
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
                    id: this.generateId(),
                    batchNo: 'GZ202401001',
                    refiningId: null,
                    oilWeight: 58,
                    bottleSpec: '500ml',
                    bottleCount: 100,
                    labelType: '精品山茶油',
                    operator: '王大姐',
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    remark: ''
                }
            ];
            this.set('bottlingRecords', mockBottling);
        }

        if (!this.get('cakeRecords')) {
            const mockCake = [
                {
                    id: this.generateId(),
                    type: 'produce',
                    batchNo: 'CK202401001',
                    pressingId: null,
                    cakeWeight: 220,
                    cakeCount: 22,
                    status: 'instock',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    remark: ''
                },
                {
                    id: this.generateId(),
                    type: 'sell',
                    customerName: '赵老板',
                    customerPhone: '13900139001',
                    cakeWeight: 100,
                    cakeCount: 10,
                    price: 2.5,
                    totalAmount: 250,
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    remark: ''
                }
            ];
            this.set('cakeRecords', mockCake);
        }

        if (!this.get('salesRecords')) {
            const mockSales = [
                {
                    id: this.generateId(),
                    orderNo: 'XS202401001',
                    customerName: '陈女士',
                    customerPhone: '13700137001',
                    productName: '精品山茶油',
                    spec: '500ml',
                    quantity: 20,
                    unitPrice: 128,
                    totalAmount: 2560,
                    paymentMethod: '微信',
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    remark: '老客户'
                }
            ];
            this.set('salesRecords', mockSales);
        }

        if (!this.get('farmers')) {
            const mockFarmers = [
                { id: this.generateId(), name: '张三', phone: '13800138001', village: '东风村' },
                { id: this.generateId(), name: '李四', phone: '13800138002', village: '红旗村' },
                { id: this.generateId(), name: '王五', phone: '13800138003', village: '胜利村' }
            ];
            this.set('farmers', mockFarmers);
        }

        if (!this.get('products')) {
            const mockProducts = [
                { id: this.generateId(), name: '精品山茶油', spec: '500ml', price: 128, stock: 80 },
                { id: this.generateId(), name: '一级山茶油', spec: '1L', price: 238, stock: 50 },
                { id: this.generateId(), name: '农家山茶油', spec: '2.5L', price: 398, stock: 30 }
            ];
            this.set('products', mockProducts);
        }
    }
};
