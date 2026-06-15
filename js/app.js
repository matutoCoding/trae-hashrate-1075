const App = {
    currentPage: 'purchase',

    pages: {
        purchase: {
            title: '茶籽收购',
            subtitle: '油茶籽过磅收购与农户来料代榨管理',
            instance: null
        },
        drying: {
            title: '晾晒去壳',
            subtitle: '含水率晾晒与剥壳去杂管理',
            instance: null
        },
        pressing: {
            title: '炒籽压榨',
            subtitle: '炒籽火候控制、液压榨油出油与出油率统计',
            instance: null
        },
        filtering: {
            title: '毛油过滤',
            subtitle: '毛油沉淀过滤管理',
            instance: null
        },
        refining: {
            title: '精炼灌装',
            subtitle: '精炼脱胶脱酸与茶油灌装贴标管理',
            instance: null
        },
        cake: {
            title: '茶枯处理',
            subtitle: '茶枯饼回收与销售管理',
            instance: null
        },
        sales: {
            title: '销售台账',
            subtitle: '山茶油销售台账管理',
            instance: null
        }
    },

    init() {
        Storage.initMockData();
        this.initNavigation();
        this.initModal();
        this.updateCurrentDate();
        this.loadPage(this.currentPage);
        this.updateSidebarStats();
    },

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page && this.pages[page]) {
                    this.switchPage(page);
                }
            });
        });
    },

    initModal() {
        const modalClose = document.getElementById('modalClose');
        const modal = document.getElementById('modal');

        modalClose.addEventListener('click', () => {
            Utils.hideModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                Utils.hideModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                Utils.hideModal();
            }
        });
    },

    updateCurrentDate() {
        const dateEl = document.getElementById('currentDate');
        const now = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
        dateEl.textContent = dateStr;
    },

    switchPage(pageName) {
        if (this.currentPage === pageName) return;

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });

        this.currentPage = pageName;
        this.loadPage(pageName);
    },

    loadPage(pageName) {
        const pageConfig = this.pages[pageName];
        if (!pageConfig) return;

        document.getElementById('pageTitle').textContent = pageConfig.title;
        document.getElementById('pageSubtitle').textContent = pageConfig.subtitle;

        let pageInstance;
        switch (pageName) {
            case 'purchase':
                pageInstance = PurchasePage;
                break;
            case 'drying':
                pageInstance = DryingPage;
                break;
            case 'pressing':
                pageInstance = PressingPage;
                break;
            case 'filtering':
                pageInstance = FilteringPage;
                break;
            case 'refining':
                pageInstance = RefiningPage;
                break;
            case 'cake':
                pageInstance = CakePage;
                break;
            case 'sales':
                pageInstance = SalesPage;
                break;
            default:
                return;
        }

        pageConfig.instance = pageInstance;
        pageInstance.init();
    },

    updateSidebarStats() {
        const purchases = Storage.get('purchases') || [];
        const pressing = Storage.get('pressingRecords') || [];
        
        const today = new Date();
        const todayStr = today.toDateString();

        const todayPurchaseWeight = purchases
            .filter(p => new Date(p.createdAt).toDateString() === todayStr && p.type === 'buy')
            .reduce((sum, p) => sum + (p.weight || 0), 0);

        const todayOilWeight = pressing
            .filter(p => new Date(p.createdAt).toDateString() === todayStr)
            .reduce((sum, p) => sum + (p.crudeOilWeight || 0), 0);

        document.getElementById('todayPurchase').textContent = Utils.formatNumber(todayPurchaseWeight, 1) + ' kg';
        document.getElementById('todayOil').textContent = Utils.formatNumber(todayOilWeight, 1) + ' kg';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
