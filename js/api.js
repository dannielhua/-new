const API = {
    // 图书
    async getBooks() {
        const { data, error } = await mySupabase.from('books').select('*').order('code');
        if (error) throw error;
        return data;
    },
    async getBookByCode(code) {
        const { data, error } = await mySupabase.from('books').select('*').eq('code', code).single();
        if (error) return null;
        return data;
    },
    async insertBook(bookData) {
        const { data, error } = await mySupabase.from('books').insert(bookData).select();
        if (error) throw error;
        return data[0];
    },
    async updateBook(code, updates) {
        const { error } = await mySupabase.from('books').update(updates).eq('code', code);
        if (error) throw error;
    },
    async deleteBook(code) {
        const { error } = await mySupabase.from('books').delete().eq('code', code);
        if (error) throw error;
    },
    // 借阅记录
    async getActiveBorrows() {
        const { data, error } = await mySupabase.from('borrow_records').select('*').is('return_date', null);
        if (error) throw error;
        return data;
    },
    async getAllRecords() {
        const { data, error } = await mySupabase.from('borrow_records').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async deleteRecord(id) {
        const { error } = await mySupabase.from('borrow_records').delete().eq('id', id);
        if (error) throw error;
    },
    async borrowBook(code, bookName, borrowerName, borrowDate, dueDate) {
        // 更新图书状态
        await mySupabase.from('books').update({ status: 'borrowed' }).eq('code', code);
        // 插入记录
        await mySupabase.from('borrow_records').insert({
            book_code: code,
            book_name: bookName,
            borrower_name: borrowerName,
            borrower_phone: '',
            borrow_date: borrowDate,
            due_date: dueDate
        });
    },
    async returnBook(code, returnDate) {
        await mySupabase.from('books').update({ status: 'available' }).eq('code', code);
        await mySupabase.from('borrow_records').update({ return_date: returnDate }).eq('book_code', code).is('return_date', null);
    },
    // 管理员密码
    async getAdminPasswordHash() {
        const { data, error } = await mySupabase.from('settings').select('value').eq('key', 'admin_password').single();
        if (error || !data) return null;
        return data.value;
    },
    async setAdminPasswordHash(hash) {
        await mySupabase.from('settings').upsert({ key: 'admin_password', value: hash }, { onConflict: 'key' });
    },
    // 导入导出等其余复杂操作可保留在 admin.js 中，但这里提供基础
};