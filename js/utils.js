const Utils = {
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
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
        const n = Number(num);
        if (isNaN(n)) return '0';
        return n.toLocaleString('zh-CN', {
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
        if (!date) return false;
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    },

    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.toDateString() === d2.toDateString();
    },

    isDateInRange(date, startDate, endDate) {
        if (!date) return false;
        const d = new Date(date);
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (d < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
        }
        return true;
    },

    escapeHtml(text) {
        if (!text) return '';
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
    },

    validate: {
        oilYieldRate(rate) {
            if (rate <= 0) return { valid: false, message: '出油率必须大于0' };
            if (rate > 40) return { valid: false, message: '出油率过高，正常范围约 15%-35%，请检查数据' };
            if (rate < 10) return { valid: true, message: '', warning: '出油率偏低，建议核实数据' };
            return { valid: true, message: '' };
        },

        filteredOil(filteredWeight, crudeWeight) {
            if (filteredWeight <= 0) return { valid: false, message: '净油重量必须大于0' };
            if (crudeWeight <= 0) return { valid: false, message: '毛油重量必须大于0' };
            if (filteredWeight > crudeWeight) return { valid: false, message: '净油重量不能大于毛油重量' };
            const rate = (filteredWeight / crudeWeight) * 100;
            if (rate < 80) return { valid: true, message: '', warning: '过滤得率偏低，请检查数据' };
            return { valid: true, message: '' };
        },

        refinedOil(refinedWeight, crudeWeight) {
            if (refinedWeight <= 0) return { valid: false, message: '精炼油重量必须大于0' };
            if (crudeWeight <= 0) return { valid: false, message: '毛油重量必须大于0' };
            if (refinedWeight > crudeWeight) return { valid: false, message: '精炼油重量不能大于毛油重量' };
            const rate = (refinedWeight / crudeWeight) * 100;
            if (rate < 85) return { valid: true, message: '', warning: '精炼得率偏低，请检查数据' };
            return { valid: true, message: '' };
        },

        shelling(kernelWeight, seedWeight) {
            if (kernelWeight <= 0) return { valid: false, message: '仁重必须大于0' };
            if (seedWeight <= 0) return { valid: false, message: '籽重必须大于0' };
            if (kernelWeight > seedWeight) return { valid: false, message: '仁重不能大于籽重' };
            const rate = (kernelWeight / seedWeight) * 100;
            if (rate < 40 || rate > 75) return { valid: false, message: '出仁率不合理，正常范围约 50%-70%' };
            return { valid: true, message: '' };
        },

        moisture(value) {
            if (value < 0) return { valid: false, message: '含水率不能为负数' };
            if (value > 50) return { valid: false, message: '含水率过高，一般油茶籽含水率不超过 30%' };
            if (value > 20) return { valid: true, message: '', warning: '含水率偏高，建议延长晾晒时间' };
            return { valid: true, message: '' };
        },

        positiveNumber(value, label = '数值') {
            if (isNaN(Number(value))) return { valid: false, message: `${label}必须是数字` };
            if (Number(value) <= 0) return { valid: false, message: `${label}必须大于0` };
            return { valid: true, message: '' };
        },

        notEmpty(value, label = '内容') {
            if (!value || String(value).trim() === '') return { valid: false, message: `${label}不能为空` };
            return { valid: true, message: '' };
        },

        phone(value) {
            if (!value) return { valid: true, message: '' };
            const phoneReg = /^1[3-9]\d{9}$/;
            if (!phoneReg.test(value)) return { valid: false, message: '手机号格式不正确' };
            return { valid: true, message: '' };
        }
    },

    showFieldError(fieldId, message, type = 'error') {
        const field = document.getElementById(fieldId);
        if (!field) return;

        let errorEl = field.parentNode.querySelector('.field-error');
        if (!message) {
            if (errorEl) errorEl.remove();
            field.style.borderColor = '';
            return;
        }

        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.style.color = type === 'warning' ? '#ff9800' : '#f44336';
        errorEl.style.fontSize = '12px';
        errorEl.style.marginTop = '4px';
        field.style.borderColor = type === 'warning' ? '#ff9800' : '#f44336';
    },

    clearFieldErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        const errors = form.querySelectorAll('.field-error');
        errors.forEach(el => el.remove());
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(el => el.style.borderColor = '');
    }
};
