const Utils = {
    toast(msg, type='info') {
        const t = document.createElement('div');
        t.className = 'toast';
        t.style.background = type==='error'?'#ef4444':type==='success'?'#10b981':'#333';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },
    esc(s) {
        const d = document.createElement('div');
        d.textContent = s || '';
        return d.innerHTML;
    },
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
        const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
        return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('') + ':' + hash;
    },
    async verifyPassword(password, hashed) {
        const encoder = new TextEncoder();
        const [saltHex, hashHex] = hashed.split(':');
        const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
        const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
        const newHash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
        return newHash === hashHex;
    },
    defaultCover() { return 'images/default-cover.png'; },
    categories: ['圣经研究', '灵修', '婚姻家庭', '儿童', '教会历史', '神学', '生活实践', '其他'],
    catColors: ['#ff7675','#fdcb6e','#55efc4','#74b9ff','#a29bfe','#fd79a8','#00b894','#6c5ce7','#b2bec3'],
    daysToDue: 90
};
