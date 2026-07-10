const API = {
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
        const { error } = await mySupabase.from('books').insert(bookData);
        if (error) throw error;
    },
    async updateBook(code, updates) {
        const { error } = await mySupabase.from('books').update(updates).eq('code', code);
        if (error) throw error;
    },
    async deleteBook(code) {
        const { error } = await mySupabase.from('books').delete().eq('code', code);
        if (error) throw error;
    },
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
    async borrowBook(code, name, date, dueDate) {
        await mySupabase.from('books').update({ status: 'borrowed' }).eq('code', code);
        await mySupabase.from('borrow_records').insert({
            book_code: code, book_name: '',
            borrower_name: name, borrower_phone: '',
            borrow_date: date, due_date: dueDate
        });
    },
    async returnBook(code, date) {
        await mySupabase.from('books').update({ status: 'available' }).eq('code', code);
        await mySupabase.from('borrow_records').update({ return_date: date }).eq('book_code', code).is('return_date', null);
    },
    async getAdminPasswordHash() {
        const { data } = await mySupabase.from('settings').select('value').eq('key', 'admin_password').single();
        return data ? data.value : null;
    },
    async setAdminPasswordHash(hash) {
        await mySupabase.from('settings').upsert({ key: 'admin_password', value: hash }, { onConflict: 'key' });
    }
};
