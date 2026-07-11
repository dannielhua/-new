const Admin = {
    async showDashboard() {
        const books = await API.getBooks();
        const total = books.length;
        const available = books.filter(b => b.status === 'available').length;
        const borrowed = total - available;
        const today = new Date().toISOString().split('T')[0];
        const active = await API.getActiveBorrows();
        const overdue = active.filter(r => r.due_date < today).length;
        document.getElementById('adminContent').innerHTML = `
            <div class="stats-row">
                <div class="stat-card dashboard"><div class="stat-icon">📚</div><div class="stat-value">${total}</div><div class="stat-label">总藏书</div></div>
                <div class="stat-card dashboard"><div class="stat-icon">🟢</div><div class="stat-value">${available}</div><div class="stat-label">可借</div></div>
                <div class="stat-card dashboard"><div class="stat-icon">🟡</div><div class="stat-value">${borrowed}</div><div class="stat-label">借出</div></div>
                <div class="stat-card dashboard"><div class="stat-icon">⚠️</div><div class="stat-value">${overdue}</div><div class="stat-label">逾期</div></div>
            </div>
            <p>欢迎进入管理员后台。</p>`;
    },
    async loadBooksAdmin() {
        const books = await API.getBooks();
        const active = await API.getActiveBorrows();
        const map = {};
        active.forEach(r => { map[r.book_code] = r; });
        let html = `<button class="btn" onclick="Admin.showAddForm()">➕ 新增图书</button>
        <table style="margin-top:12px;"><thead><tr><th>编号</th><th>书名</th><th>作者</th><th>分类</th><th>状态</th><th>借阅人</th><th>操作</th></tr></thead><tbody>`;
        books.forEach(b => {
            const br = map[b.code] || {};
            html += `<tr>
                <td>${Utils.esc(b.code)}</td><td>${Utils.esc(b.title)}</td><td>${Utils.esc(b.author)}</td>
                <td>${Utils.esc(b.category)}</td>
                <td>${b.status==='available'?'<span class="badge badge-available">在馆</span>':'<span class="badge badge-borrowed">借出</span>'}</td>
                <td>${Utils.esc(br.borrower_name)}</td>
                <td><button class="btn btn-outline" onclick="Admin.editBook('${b.code}')">✏️</button> <button class="btn btn-danger" onclick="Admin.deleteBook('${b.code}')">🗑</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        document.getElementById('adminContent').innerHTML = html;
    },
    // 替换 admin.js 中的 showAddForm 函数
showAddForm(book = null) {
    const isEdit = !!book;
    let html = `<h3>${isEdit ? '编辑' : '新增'}图书</h3>
    <div class="form-group"><input id="editCode" placeholder="图书编号 (如 BK001)" value="${isEdit ? book.code : ''}" ${isEdit ? 'disabled' : ''}></div>
    <div class="form-group"><input id="editTitle" placeholder="书名" value="${isEdit ? book.title : ''}"></div>
    <div class="form-group"><input id="editAuthor" placeholder="作者" value="${isEdit ? (book.author || '') : ''}"></div>
    <div class="form-group"><select id="editCategory">${Utils.categories.map(c => `<option ${(book && book.category === c) ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="form-group"><input id="editCover" placeholder="封面图片URL (可留空)" value="${isEdit ? (book.cover_url || '') : ''}"></div>
    <div class="form-group">
        <label>上传封面图片 (可选)</label>
        <input type="file" id="editCoverFile" accept="image/*" onchange="Admin.uploadCover()">
    </div>
    <button class="btn" onclick="Admin.saveBook('${isEdit ? book.code : ''}')">保存</button>`;
    document.getElementById('adminContent').innerHTML = html;
},

// 在 admin.js 末尾新增 uploadCover 函数
async uploadCover() {
    const fileInput = document.getElementById('editCoverFile');
    const file = fileInput.files[0];
    if (!file) return;

    // 优先使用已填写的编号，若没有则使用时间戳
    let code = document.getElementById('editCode')?.value.trim();
    if (!code) {
        code = 'temp_' + Date.now();
    }
    const ext = file.name.split('.').pop();
    const fileName = `${code}.${ext}`;

    try {
        Utils.toast('正在上传封面...', 'info');
        const { data, error } = await mySupabase.storage
            .from('book-covers')          // 确保 Supabase 中有这个桶，且公开
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // 获取公开访问 URL
        const { data: publicUrlData } = mySupabase.storage
            .from('book-covers')
            .getPublicUrl(fileName);

        document.getElementById('editCover').value = publicUrlData.publicUrl;
        Utils.toast('封面上传成功！', 'success');
    } catch (err) {
        console.error('上传封面失败:', err);
        Utils.toast('上传封面失败: ' + err.message, 'error');
    }
},
    editBook(code) {
        API.getBookByCode(code).then(book => this.showAddForm(book));
    },
    async saveBook(originalCode) {
        const code = document.getElementById('editCode').value.trim();
        const data = {
            title: document.getElementById('editTitle').value.trim(),
            author: document.getElementById('editAuthor').value.trim(),
            category: document.getElementById('editCategory').value,
            cover_url: document.getElementById('editCover').value.trim()
        };
        if (originalCode) {
            await API.updateBook(originalCode, data);
        } else {
            data.code = code;
            await API.insertBook(data);
        }
        Utils.toast('保存成功', 'success');
        this.loadBooksAdmin();
    },
    async deleteBook(code) {
        if (!confirm(`删除 ${code} ？`)) return;
        await API.deleteBook(code);
        Utils.toast('已删除', 'success');
        this.loadBooksAdmin();
    },
    async loadRecords() {
        const records = await API.getAllRecords();
        let html = `<table><thead><tr><th>编号</th><th>书名</th><th>借阅人</th><th>借书日期</th><th>应还日期</th><th>归还日期</th><th>操作</th></tr></thead><tbody>`;
        records.forEach(r => {
            html += `<tr>
                <td>${Utils.esc(r.book_code)}</td><td>${Utils.esc(r.book_name || '')}</td>
                <td>${Utils.esc(r.borrower_name)}</td><td>${r.borrow_date}</td>
                <td>${r.due_date}</td><td>${r.return_date || '未还'}</td>
                <td><button class="btn btn-danger" onclick="Admin.deleteRecord(${r.id})">🗑 删除</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        document.getElementById('adminContent').innerHTML = html;
    },
    async deleteRecord(id) {
        if (!confirm('删除这条记录？')) return;
        await API.deleteRecord(id);
        Utils.toast('已删除', 'success');
        this.loadRecords();
    },
    async loadOverdue() {
        const today = new Date().toISOString().split('T')[0];
        const active = await API.getActiveBorrows();
        const overdue = active.filter(r => r.due_date < today);
        let html = `<h3>逾期未还 (${overdue.length})</h3>`;
        if (overdue.length === 0) html += '<p>无逾期</p>';
        else {
            html += '<table><tr><th>编号</th><th>书名</th><th>借阅人</th><th>应还日期</th></tr>';
            overdue.forEach(r => {
                html += `<tr><td>${Utils.esc(r.book_code)}</td><td>${Utils.esc(r.book_name || '')}</td><td>${Utils.esc(r.borrower_name)}</td><td>${r.due_date}</td></tr>`;
            });
            html += '</table>';
        }
        document.getElementById('adminContent').innerHTML = html;
    },
    showImport() {
        document.getElementById('adminContent').innerHTML = `
            <h3>📤 导入 Excel / CSV</h3>
            <input type="file" id="importFile" accept=".csv,.xlsx" style="margin-bottom:12px;">
            <button class="btn" onclick="Admin.doImport()">开始导入</button>
            <div id="importResult"></div>`;
    },
    async doImport() {
        const file = document.getElementById('importFile').files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);
            let ok = 0, skip = 0;
            for (const row of rows) {
                const code = (row.code || row['编号'] || '').toString().trim();
                const title = (row.title || row.book_name || row['书名'] || '').toString().trim();
                if (!code || !title) { skip++; continue; }
                let category = row.category || row['分类'] || '';
                if (!Utils.categories.includes(category)) category = '未分类';
                const exist = await API.getBookByCode(code);
                if (exist) {
                    await API.updateBook(code, { title, author: row.author || '', category });
                } else {
                    await API.insertBook({ code, title, author: row.author || '', category });
                }
                ok++;
            }
            document.getElementById('importResult').innerHTML = `<p>成功 ${ok} 条，跳过 ${skip} 条</p>`;
            Utils.toast('导入完成', 'success');
        };
        reader.readAsArrayBuffer(file);
    },
    showExport() {
        document.getElementById('adminContent').innerHTML = `<h3>📥 导出图书库存</h3><button class="btn" onclick="Admin.doExport()">下载 Excel</button>`;
    },
    async doExport() {
        const books = await API.getBooks();
        const active = await API.getActiveBorrows();
        const map = {};
        active.forEach(r => { map[r.book_code] = r; });
        const ws_data = [['编号', '书名', '作者', '分类', '状态', '借阅人', '借书日期', '应还日期']];
        books.forEach(b => {
            const br = map[b.code] || {};
            ws_data.push([b.code, b.title, b.author, b.category, b.status === 'available' ? '在馆' : '借出', br.borrower_name || '', br.borrow_date || '', br.due_date || '']);
        });
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '图书库存');
        XLSX.writeFile(wb, '图书库存.xlsx');
    },
    showQRCode() {
        const savedUrl = localStorage.getItem('qrBaseUrl') || window.location.origin + '/?code=';
        document.getElementById('adminContent').innerHTML = `
            <h3>📱 生成图书二维码</h3>
            <label><input type="checkbox" id="includeUrl" checked> 包含访问网址</label>
            <input type="text" id="baseUrl" value="${savedUrl}" style="width:100%;margin:8px 0; padding:12px; border-radius:12px;">
            <button class="btn" onclick="Admin.generateQRCodes()">生成全部</button>
            <button class="btn" onclick="Admin.printAllQRCodes()">🖨️ 打印全部</button>
            <div class="qr-container" id="qrContainer" style="margin-top:16px;"></div>`;
    },
    async generateQRCodes() {
        const includeUrl = document.getElementById('includeUrl').checked;
        const baseUrl = document.getElementById('baseUrl').value.trim();
        if (baseUrl) localStorage.setItem('qrBaseUrl', baseUrl);
        const books = await API.getBooks();
        const container = document.getElementById('qrContainer');
        container.innerHTML = '';
        books.forEach(b => {
            const content = includeUrl ? baseUrl + b.code : b.code;
            const div = document.createElement('div'); div.className = 'qr-item';
            div.style.background = '#fff'; div.style.padding = '8px'; div.style.borderRadius = '8px'; div.style.textAlign = 'center';
            div.innerHTML = `<p>${Utils.esc(b.code)}<br>${Utils.esc(b.title)}</p>`;
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, content, { width: 120, margin: 1 }, err => { if (err) console.warn(err); });
            canvas.style.background = '#fff';
            div.appendChild(canvas);
            container.appendChild(div);
        });
    },
    printAllQRCodes() {
        const container = document.getElementById('qrContainer');
        if (!container || container.children.length === 0) {
            Utils.toast('请先生成二维码', 'error');
            return;
        }
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        let html = '<html><head><title>图书二维码</title><style>body{font-family:sans-serif;} .qr-item{display:inline-block; margin:10px; text-align:center; page-break-inside:avoid;} img{width:120px;height:120px;} @media print{body{margin:0;}}</style></head><body>';
        html += '<h2>图书二维码</h2><div style="display:flex;flex-wrap:wrap;">';
        const items = container.querySelectorAll('.qr-item');
        items.forEach(item => {
            const canvas = item.querySelector('canvas');
            if (canvas) {
                const imgSrc = canvas.toDataURL('image/png');
                html += `<div class="qr-item">${item.innerHTML.replace(/<canvas.*<\/canvas>/, '')}<img src="${imgSrc}"></div>`;
            }
        });
        html += '</div></body></html>';
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    },
    showSettings() {
        document.getElementById('adminContent').innerHTML = `
            <h3>⚙️ 修改管理员密码</h3>
            <div class="form-group"><label>旧密码</label><input type="password" id="oldPwd"></div>
            <div class="form-group"><label>新密码</label><input type="password" id="newPwd"></div>
            <div class="form-group"><label>确认新密码</label><input type="password" id="confirmPwd"></div>
            <button class="btn" onclick="Admin.changePwd()">修改密码</button>`;
    },
    async changePwd() {
        const old = document.getElementById('oldPwd').value;
        const newPwd = document.getElementById('newPwd').value;
        const confirmPwd = document.getElementById('confirmPwd').value;
        if (!old || !newPwd) return Utils.toast('请填写完整', 'error');
        if (newPwd !== confirmPwd) return Utils.toast('两次不一致', 'error');
        const hash = await API.getAdminPasswordHash();
        if (!hash || !(await Utils.verifyPassword(old, hash))) return Utils.toast('旧密码错误', 'error');
        const newHash = await Utils.hashPassword(newPwd);
        await API.setAdminPasswordHash(newHash);
        Utils.toast('密码修改成功', 'success');
        App.adminLogout();
    }
};
