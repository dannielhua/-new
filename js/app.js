const App = {
    init() {
        API.getAdminPasswordHash().then(async (hash) => {
            if (!hash) await API.setAdminPasswordHash(await Utils.hashPassword('admin123'));
        });
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) Borrow.showBookDetail(code);
        else Books.showHome();
    },
    showNotice() {
        document.getElementById('noticeModal').classList.remove('hidden');
    },
    switchToBookList(category) {
        Books.switchToBookList(category);
    },
    openAdmin() {
        if (localStorage.getItem('adminToken')) this.showAdminPanel();
        else document.getElementById('loginModal').classList.remove('hidden');
    },
    async adminLogin() {
        const pwd = document.getElementById('loginPassword').value;
        const hash = await API.getAdminPasswordHash();
        if (!hash) return Utils.toast('系统错误','error');
        const valid = await Utils.verifyPassword(pwd, hash);
        if (!valid) return Utils.toast('密码错误','error');
        localStorage.setItem('adminToken', 'true');
        document.getElementById('loginModal').classList.add('hidden');
        this.showAdminPanel();
    },
    adminLogout() {
        localStorage.removeItem('adminToken');
        document.getElementById('adminView').classList.add('hidden');
        Utils.toast('已退出','info');
    },
    showAdminPanel() {
        document.getElementById('adminView').classList.remove('hidden');
        this.switchAdminTab('dashboard');
    },
    switchAdminTab(tab) {
        document.querySelectorAll('#adminView .tab-nav button').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`#adminView .tab-nav button[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');
        switch(tab) {
            case 'dashboard': Admin.showDashboard(); break;
            case 'books': Admin.loadBooksAdmin(); break;
            case 'records': Admin.loadRecords(); break;
            case 'overdue': Admin.loadOverdue(); break;
            case 'import': Admin.showImport(); break;
            case 'export': Admin.showExport(); break;
            case 'qrcode': Admin.showQRCode(); break;
            case 'settings': Admin.showSettings(); break;
        }
    }
};

document.querySelector('#adminView .tab-nav').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') App.switchAdminTab(e.target.dataset.tab);
});

document.addEventListener('DOMContentLoaded', () => App.init());
