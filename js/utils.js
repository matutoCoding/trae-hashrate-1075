const Utils = {
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    formatDateTime(date) {
        return this.formatDate(date, 'YYYY-MM-DD HH:mm');
    },

    formatNumber(num, decimals = 2) {
        return Number(num).toLocaleString('zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    formatMoney(amount) {
        return '¥' + this.formatNumber(amount, 2);
    },

    generateBatchNo(prefix) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${year}${month}${day}${random}`;
    },

    toast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        setTimeout(() => {
            toast.className = 'toast';
        }, 2500);
    },

    showModal(title, contentHtml) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = title;
        modalBody.innerHTML = contentHtml;
        modal.classList.add('show');

        return modal;
    },

    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('show');
    },

    confirm(message) {
        return window.confirm(message);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    getTodayRange() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { start: today, end: tomorrow };
    },

    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    calculateOilYieldRate(oilWeight, seedWeight) {
        if (!seedWeight || seedWeight === 0) return 0;
        return (oilWeight / seedWeight) * 100;
    },

    calculateShellingRate(kernelWeight, seedWeight) {
        if (!seedWeight || seedWeight === 0) return 0;
        return (kernelWeight / seedWeight) * 100;
    },

    calculateRefiningRate(refinedWeight, crudeWeight) {
        if (!crudeWeight || crudeWeight === 0) return 0;
        return (refinedWeight / crudeWeight) * 100;
    }
};
