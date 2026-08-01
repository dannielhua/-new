const Borrow = {
    async showBookDetail(code) {
        document.getElementById('dynamicContent').parentElement.classList.add('card-white');
        const book = await API.getBookByCode(code);
        if (!book) { Utils.toast('图书不存在','error'); return; }
        let html = `<div class="back-btn" onclick="Books.showHome()" style="margin-bottom:12px; display:block;">← 返回首页</div>`;
        html += `<h2 style="color:#333;">📖 ${Utils.esc(book.title)}</h2>`;
        html += `<p style="color:#555;">编号：${Utils.esc(book.code)} | 作者：${Utils.esc(book.author)} | 分类：${Utils.esc(book.category)}</p>`;
        const today = new Date().toISOString().split('T')[0];
        const due = new Date(); due.setDate(due.getDate() + Utils.daysToDue);
        const dueDate = due.toISOString().split('T')[0];
        if (book.status === 'available') {
            html += `<span class="badge badge-available">✅ 可借</span>`;
            html += `<div class="form-group" style="margin-top:16px;"><label style="color:#333;">您的姓名</label><input type="text" id="borrowName" placeholder="姓名"><label style="color:#333;">借书日期</label><input type="text" value="${today}" disabled><label style="color:#333;">应还日期</label><input type="text" value="${dueDate}" disabled></div>`;
            html += `<button class="btn btn-borrow" onclick="Borrow.doBorrow('${book.code}')">📤 借出</button>`;
        } else {
            html += `<span class="badge badge-borrowed">📖 已借出</span>`;
            html += `<div class="form-group" style="margin-top:16px;"><label style="color:#333;">您的姓名</label><input type="text" id="returnName" placeholder="姓名"><label style="color:#333;">归还日期</label><input type="text" value="${today}" disabled></div>`;
            html += `<button class="btn btn-return" onclick="Borrow.doReturn('${book.code}')">📥 还书</button>`;
        }
        document.getElementById('dynamicContent').innerHTML = html;
    },
    async doBorrow(code) {
        const name = document.getElementById('borrowName').value.trim();
        if (!name) { Utils.toast('请填写姓名','error'); return; }
        const today = new Date().toISOString().split('T')[0];
        const due = new Date(); due.setDate(due.getDate() + Utils.daysToDue);
        const dueDate = due.toISOString().split('T')[0];
        try {
            await API.borrowBook(code, name, today, dueDate);
            Utils.toast(`借书成功！应还日期：${dueDate}`, 'success');
            // 检查即将到期
            const active = await API.getActiveBorrows();
            const myOther = active.filter(r => r.borrower_name === name && r.book_code !== code);
            const soon = myOther.filter(r => {
                const diff = Math.ceil((new Date(r.due_date) - new Date()) / (1000*60*60*24));
                return diff >= 0 && diff <= 3;
            });
            if (soon.length > 0) {
                let msg = '⚠️ 您还有以下图书即将到期：\n';
                soon.forEach(r => msg += `- ${r.book_name || r.book_code}（${r.due_date}）\n`);
                msg += '请及时归还。';
                alert(msg);
            }
            this.showBookDetail(code);
        } catch (e) { Utils.toast('借书失败','error'); }
    },
    async doReturn(code) {
        const name = document.getElementById('returnName').value.trim();
        if (!name) { Utils.toast('请填写姓名','error'); return; }
        const today = new Date().toISOString().split('T')[0];
        try {
            await API.returnBook(code, today);
            Utils.toast('还书成功！','success');
            this.showBookDetail(code);
        } catch (e) { Utils.toast('还书失败','error'); }
    }
};
