// ==========================================
// --- SUPER ADMIN UI & RENDER LOGIC ---
// ==========================================

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-blue-800', 'text-blue-800', 'dark:border-blue-400', 'dark:text-blue-400');
        btn.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    });
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    activeBtn.classList.add('border-blue-800', 'text-blue-800', 'dark:border-blue-400', 'dark:text-blue-400');
};

window.openCreateAdminModal = function() { document.getElementById('createAdminModal').classList.replace('hidden', 'flex'); };
window.closeCreateAdminModal = function() { document.getElementById('createAdminModal').classList.replace('flex', 'hidden'); document.getElementById('createAdminForm').reset(); };

window.openForcePassModal = function(id, username) { 
    document.getElementById('fpUserId').value = id;
    document.getElementById('fpUsername').innerText = username;
    document.getElementById('forcePassModal').classList.replace('hidden', 'flex'); 
};

window.closeForcePassModal = function() { 
    document.getElementById('forcePassModal').classList.replace('flex', 'hidden'); 
    document.getElementById('forcePassForm').reset(); 
};

window.renderAdminTable = function(admins) {
    const tbody = document.getElementById('adminListBody');
    if (admins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No admins found.</td></tr>`;
        return;
    }

    tbody.innerHTML = admins.map(a => {
        const isVerified = a.isVerified 
            ? `<span class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">Verified</span>`
            : `<span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-red-200 dark:border-red-800">Unverified</span>`;

        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="p-4"><div class="font-bold text-gray-800 dark:text-gray-200">${a.username}</div><div class="text-xs text-gray-500">${a.firstName} ${a.lastName}</div></td>
            <td class="p-4 text-xs font-medium text-gray-600 dark:text-gray-400">${a.email}</td>
            <td class="p-4">${isVerified}</td>
            <td class="p-4 text-right flex justify-end gap-2">
                <button onclick="openForcePassModal('${a._id}', '${a.username}')" class="bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 hover:text-blue-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors"><i class="fa-solid fa-key mr-1"></i> Pass</button>
                <button onclick="deleteUser('${a._id}', '${a.username}')" class="bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-800 transition-colors"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
};