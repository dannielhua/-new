const App = {
    currentView: 'home',
    init() {
        // 初始化时不再操作 coverSwitch（已移至管理员后台）
        API.getAdminPasswordHash().then(async (hash) => {
            if (!hash) await API.setAdminPasswordHash(await Utils.hashPassword('admin123'));
        });
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) Borrow.showBookDetail(code);
        else Books.showHome();
    },
    showNotice() { document.getElementById('noticeModal').classList.remove('hidden'); },
    showMyBorrows() {
        document.getElementById('myBorrowsModal').classList.remove('hidden');
        document.getElementById('searchBorrowerName').value = '';
        document.getElementById('myBorrowsResult').innerHTML = '';
    },
    async lookupMyBorrows() {
        const name = document.getElementById('searchBorrowerName').value.trim();
        if (!name) return Utils.toast('请输入姓名','error');
        const active = await API.getActiveBorrows();
        const mine = active.filter(r => r.borrower_name === name);
        const resultDiv = document.getElementById('myBorrowsResult');
        if (mine.length === 0) { resultDiv.innerHTML = '<p>没有找到借阅记录。</p>'; return; }
        const books = await API.getBooks(); const map = {}; books.forEach(b => { map[b.code] = b; });
        let html = `<table><thead><tr><th>书名</th><th>编号</th><th>借书日期</th><th>应还日期</th><th>状态</th></tr></thead><tbody>`;
        mine.forEach(r => {
            const b = map[r.book_code] || {};
            const overdue = r.due_date < new Date().toISOString().split('T')[0];
            html += `<tr><td>${Utils.esc(b.title||r.book_name)}</td><td>${Utils.esc(r.book_code)}</td><td>${r.borrow_date}</td><td>${r.due_date}</td><td>${overdue?'⚠️ 逾期':'📖 借阅中'}</td></tr>`;
        });
        html += '</tbody></table>';
        resultDiv.innerHTML = html;
    },
    switchToBookList(category) { Books.switchToBookList(category); },
    openAdmin() {
        if (localStorage.getItem('adminToken')) this.showAdminPanel();
        else document.getElementById('loginModal').classList.remove('hidden');
    },
    async adminLogin() {
        const pwd = document.getElementById('loginPassword').value;
        const hash = await API.getAdminPasswordHash();
        if (!hash || !(await Utils.verifyPassword(pwd, hash))) return Utils.toast('密码错误','error');
        localStorage.setItem('adminToken', 'true');
        document.getElementById('loginModal').classList.add('hidden');
        this.showAdminPanel();
    },
    adminLogout() {
        localStorage.removeItem('adminToken');
        document.getElementById('adminView').classList.add('hidden');
        Utils.toast('已退出','info');
    },
    showAdminPanel() { document.getElementById('adminView').classList.remove('hidden'); this.switchAdminTab('dashboard'); },
    switchAdminTab(tab) {
        document.querySelectorAll('#adminView .tab-nav button').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`#adminView .tab-nav button[data-tab="${tab}"]`);
        if (btn) btn.classList.add('active');
        switch(tab) {
            case 'dashboard': Admin.showDashboard(); break;
            case 'books': Admin.loadBooksAdmin(); break;
            case 'current': Admin.showCurrentBorrows(); break;
            case 'records': Admin.loadRecords(); break;
            case 'overdue': Admin.loadOverdue(); break;
            case 'import': Admin.showImport(); break;
            case 'export': Admin.showExport(); break;
            case 'batchcover': Admin.showBatchCover(); break;
            case 'categories': Admin.showCategories(); break;
            case 'qrcode': Admin.showQRCode(); break;
            case 'settings': Admin.showSettings(); break;
        }
    }
};

document.querySelector('#adminView .tab-nav').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') App.switchAdminTab(e.target.dataset.tab);
});
document.addEventListener('DOMContentLoaded', () => App.init());
