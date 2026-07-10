const Books = {
    async showHome() {
        const books = await API.getBooks();
        // 统计
        const total = books.length;
        const available = books.filter(b => b.status === 'available').length;
        const borrowed = total - available;
        const today = new Date().toISOString().split('T')[0];
        const records = await API.getActiveBorrows();
        const overdue = records.filter(r => r.due_date < today).length;
        // 分类计数
        const counts = {};
        Utils.categories.forEach(c => counts[c] = 0);
        let uncategorized = 0;
        books.forEach(b => {
            if (Utils.categories.includes(b.category)) counts[b.category]++;
            else uncategorized++;
        });
        let html = `
            <div class="stats-row">
                <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${total}</div><div class="stat-label">总藏书</div></div>
                <div class="stat-card"><div class="stat-icon">🟢</div><div class="stat-value">${available}</div><div class="stat-label">可借</div></div>
                <div class="stat-card"><div class="stat-icon">🟡</div><div class="stat-value">${borrowed}</div><div class="stat-label">借出</div></div>
                <div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-value">${overdue}</div><div class="stat-label">逾期</div></div>
            </div>
            <h3 style="margin-bottom:12px;color:#fff;">📂 图书分类</h3>
            <div class="category-grid">
        `;
        Utils.categories.forEach((c, i) => {
            html += `<div class="cat-card" style="background:${Utils.catColors[i]}" onclick="App.switchToBookList('${c}')">${c}<br><small>${counts[c]}本</small></div>`;
        });
        html += `<div class="cat-card" style="background:#b2bec3" onclick="App.switchToBookList('未分类')">未分类<br><small>${uncategorized}本</small></div>`;
        html += `</div>`;
        document.getElementById('dynamicContent').innerHTML = html;
    },

    async switchToBookList(category = null) {
        const books = await API.getBooks();
        this.renderBookList(books, '', category);
    },

    renderBookList(allBooks, searchTerm, selectedCategory) {
        let filtered = allBooks;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = allBooks.filter(b =>
                b.title.toLowerCase().includes(s) ||
                b.author.toLowerCase().includes(s) ||
                b.code.toLowerCase().includes(s) ||
                (b.publisher && b.publisher.toLowerCase().includes(s)) ||
                b.category.toLowerCase().includes(s)
            );
        }
        if (selectedCategory) {
            if (selectedCategory === '未分类') filtered = filtered.filter(b => !Utils.categories.includes(b.category));
            else filtered = filtered.filter(b => b.category === selectedCategory);
        }

        let html = '';
        if (!selectedCategory) {
            // 搜索框
            html += `<div class="search-box">
                <input type="text" id="searchTitle" placeholder="🔍 搜索书名、作者、编号..." onkeyup="if(event.key==='Enter') Books.search()">
                <button class="btn" onclick="Books.search()">搜索</button>
            </div>`;
            // 分类网格
            html += '<div class="category-grid">';
            Utils.categories.forEach((c, i) => {
                const cnt = allBooks.filter(b => b.category === c).length;
                html += `<div class="cat-card" style="background:${Utils.catColors[i]}" onclick="App.switchToBookList('${c}')">${c}<br><small>${cnt}本</small></div>`;
            });
            const uncatCnt = allBooks.filter(b => !Utils.categories.includes(b.category)).length;
            html += `<div class="cat-card" style="background:#b2bec3" onclick="App.switchToBookList('未分类')">未分类<br><small>${uncatCnt}本</small></div>`;
            html += '</div>';
        } else {
            html += `<div class="book-list-header">
                <span class="back-btn" onclick="App.switchToBookList()">← 返回全部</span>
                <h3 style="color:#fff;">${selectedCategory} (${filtered.length}本)</h3>
            </div>`;
        }

        // 显示图书：如果未选分类且没有搜索，则按分类显示；否则直接卡片列表
        if (!selectedCategory && !searchTerm) {
            // 按分类分组显示
            const grouped = {};
            Utils.categories.forEach(c => grouped[c] = []);
            let uncategorized = [];
            filtered.forEach(b => {
                if (Utils.categories.includes(b.category)) grouped[b.category].push(b);
                else uncategorized.push(b);
            });
            for (const cat of Utils.categories) {
                const items = grouped[cat];
                if (items.length === 0) continue;
                html += `<div class="category-section"><h3>${cat} (${items.length}本)</h3>`;
                items.forEach(b => {
                    html += Books.renderBookCard(b);
                });
                html += `</div>`;
            }
            if (uncategorized.length > 0) {
                html += `<div class="category-section"><h3>未分类 (${uncategorized.length}本)</h3>`;
                uncategorized.forEach(b => html += Books.renderBookCard(b));
                html += `</div>`;
            }
        } else {
            // 直接卡片列表
            if (filtered.length === 0) html += '<p style="color:#fff;">暂无图书</p>';
            else filtered.forEach(b => html += Books.renderBookCard(b));
        }
        document.getElementById('dynamicContent').innerHTML = html;
    },

    renderBookCard(book) {
        const coverUrl = book.cover_url || Utils.defaultCover();
        const statusBadge = book.status === 'available' 
            ? '<span class="badge badge-available">可借</span>' 
            : '<span class="badge badge-borrowed">借出</span>';
        return `
        <div class="book-card">
            <img class="cover" src="${coverUrl}" onerror="this.src='${Utils.defaultCover()}'">
            <div class="info">
                <strong>${Utils.esc(book.title)}</strong>
                <div class="meta">${Utils.esc(book.author)} · ${Utils.esc(book.category)}</div>
                <div style="margin-top:4px;">编号：${Utils.esc(book.code)}</div>
            </div>
            <div class="status">${statusBadge}</div>
        </div>`;
    },

    search() {
        const term = document.getElementById('searchTitle')?.value.trim() || '';
        API.getBooks().then(books => this.renderBookList(books, term, null));
    }
};