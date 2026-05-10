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

// --- MODALS ---
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

window.openAccountStatusModal = function(id, username, isSuspended) {
    document.getElementById('statusUserId').value = id;
    document.getElementById('statusUsername').innerText = username;
    document.getElementById('statusAction').value = isSuspended ? 'active' : 'suspended';
    window.toggleSuspendOptions();
    
    const modal = document.getElementById('accountStatusModal');
    const box = document.getElementById('accountStatusBox');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100'); }, 10);
};

window.closeAccountStatusModal = function() {
    const modal = document.getElementById('accountStatusModal');
    const box = document.getElementById('accountStatusBox');
    box.classList.remove('scale-100', 'opacity-100'); box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
    document.getElementById('accountStatusForm').reset();
};

window.toggleSuspendOptions = function() {
    const action = document.getElementById('statusAction').value;
    const options = document.getElementById('suspendOptions');
    if (action === 'suspended') {
        options.classList.remove('hidden');
    } else {
        options.classList.add('hidden');
    }
};

// --- TABLES ---
window.renderAdminTable = function(admins) {
    const tbody = document.getElementById('adminListBody');
    if (admins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No admins found.</td></tr>`;
        return;
    }

    tbody.innerHTML = admins.map(a => {
        const isVerified = a.isVerified 
            ? `<span class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 mr-1">Verified</span>`
            : `<span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-red-200 dark:border-red-800 mr-1">Unverified</span>`;
            
        const isSuspendedBadge = a.isSuspended ? `<span class="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-orange-200 dark:border-orange-800"><i class="fa-solid fa-ban mr-1"></i>Suspended</span>` : '';

        const verifyIcon = a.isVerified ? 'fa-user-xmark' : 'fa-user-check';
        const verifyColor = a.isVerified ? 'hover:text-orange-600' : 'hover:text-emerald-600';

        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="p-4"><div class="font-bold text-gray-800 dark:text-gray-200">${a.username}</div><div class="text-xs text-gray-500">${a.firstName} ${a.lastName}</div></td>
            <td class="p-4 text-xs font-medium text-gray-600 dark:text-gray-400">${a.email}</td>
            <td class="p-4">${isVerified} ${isSuspendedBadge}</td>
            <td class="p-4 text-right flex justify-end gap-2">
                <button onclick="toggleVerification('${a._id}', ${a.isVerified}, '${a.username}')" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 ${verifyColor} text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Toggle Verification"><i class="fa-solid ${verifyIcon}"></i></button>
                <button onclick="openForcePassModal('${a._id}', '${a.username}')" class="bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 hover:text-blue-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Force Password Reset"><i class="fa-solid fa-key"></i></button>
                <button onclick="openAccountStatusModal('${a._id}', '${a.username}', ${a.isSuspended || false})" class="bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 hover:text-orange-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Activate/Deactivate"><i class="fa-solid fa-user-slash"></i></button>
                <button onclick="deleteUser('${a._id}', '${a.username}')" class="bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-800 transition-colors" title="Delete User"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
};

window.renderSuperDriverTable = function(drivers) {
    const tbody = document.getElementById('driverListBody');
    if (drivers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No drivers found.</td></tr>`;
        return;
    }

    tbody.innerHTML = drivers.map(d => {
        const isVerified = d.isVerified 
            ? `<span class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 block mb-1 w-fit">Verified</span>`
            : `<span class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-red-200 dark:border-red-800 block mb-1 w-fit">Unverified</span>`;
            
        const isSuspendedBadge = d.isSuspended ? `<span class="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-orange-200 dark:border-orange-800 block w-fit"><i class="fa-solid fa-ban mr-1"></i>Suspended</span>` : '';

        const deptArray = Array.isArray(d.department) ? d.department : (d.department ? [d.department] : []);
        const isPending = deptArray.length === 0 || deptArray.includes('Pending Assignment');
        const deptBadge = isPending 
            ? `<span class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold px-2 py-1 rounded-md text-[10px] inline-block m-0.5 border border-gray-200 dark:border-gray-700 uppercase tracking-widest">Pending</span>`
            : deptArray.map(dept => `<span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-md text-[10px] inline-block m-0.5 border border-blue-100 dark:border-blue-800 uppercase tracking-widest">${dept}</span>`).join('');
        
        const driverWorkDays = d.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; 
        const scheduleBadges = driverWorkDays.map(day => `<span class="text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-0.5 rounded m-0.5 inline-block uppercase">${day.substring(0,3)}</span>`).join('');

        const verifyIcon = d.isVerified ? 'fa-user-xmark' : 'fa-user-check';
        const verifyColor = d.isVerified ? 'hover:text-orange-600' : 'hover:text-emerald-600';

        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
            <td class="p-4 align-middle">
                <div class="font-bold text-gray-800 dark:text-gray-200">${d.username}</div>
                <div class="text-xs text-gray-500">${d.firstName} ${d.lastName}</div>
            </td>
            <td class="p-4 align-middle max-w-[200px]">
                <div class="mb-1">${deptBadge}</div>
                <div>${scheduleBadges}</div>
            </td>
            <td class="p-4 align-middle">${isVerified} ${isSuspendedBadge}</td>
            <td class="p-4 text-right align-middle flex justify-end gap-2 flex-wrap max-w-[250px] ml-auto">
                <button onclick="openProfileModal('${d._id}')" class="bg-white dark:bg-gray-800 hover:bg-blue-100 hover:text-blue-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Edit Profile"><i class="fa-solid fa-pen"></i></button>
                <button onclick="toggleVerification('${d._id}', ${d.isVerified}, '${d.username}')" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 ${verifyColor} text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Toggle Verification"><i class="fa-solid ${verifyIcon}"></i></button>
                <button onclick="openForcePassModal('${d._id}', '${d.username}')" class="bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 hover:text-blue-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Force Password Reset"><i class="fa-solid fa-key"></i></button>
                <button onclick="openAccountStatusModal('${d._id}', '${d.username}', ${d.isSuspended || false})" class="bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 hover:text-orange-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-600 transition-colors" title="Activate/Deactivate"><i class="fa-solid fa-user-slash"></i></button>
                <button onclick="deleteUser('${d._id}', '${d.username}')" class="bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-800 transition-colors" title="Delete User"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
};

window.openProfileModal = function(driverId) {
    const driver = window.allSuperDrivers.find(d => d._id === driverId);
    if (!driver) return;
    document.getElementById('modalDriverName').innerText = driver.username;
    document.getElementById('modalDriverId').value = driver._id;
    const deptArray = Array.isArray(driver.department) ? driver.department : (driver.department ? [driver.department] : []);
    const driverWorkDays = driver.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const allModalDepts = ["SHS", "COLLEGE", "REGISTRAR", "ADMISSIONS", "OSAS", "LIBRARY", "CLINIC", "ADMIN", "FINANCE", "PURCHASING", "IT", "ELPD", "ADCOM", "GENERAL"];

    document.getElementById('modalDeptList').innerHTML = allModalDepts.map(dept => `
        <label class="flex items-center text-[10px] text-gray-700 dark:text-gray-300 font-bold tracking-wide uppercase cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <input type="checkbox" value="${dept}" class="modal-dept-cb mr-3 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" ${deptArray.includes(dept) ? 'checked' : ''}>
            <span class="truncate">${dept}</span>
        </label>`).join('');

    document.getElementById('modalScheduleList').innerHTML = daysOfWeek.map(day => `
        <label class="flex items-center text-xs text-gray-700 dark:text-gray-300 font-bold tracking-wide uppercase cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <input type="checkbox" value="${day}" class="modal-sched-cb mr-3 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" ${driverWorkDays.includes(day) ? 'checked' : ''}>
            ${day.substring(0,3)}
        </label>`).join('');

    const modal = document.getElementById('driverProfileModal');
    const box = document.getElementById('driverProfileBox');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100'); }, 10);
};

window.closeProfileModal = function() {
    const modal = document.getElementById('driverProfileModal');
    const box = document.getElementById('driverProfileBox');
    box.classList.remove('scale-100', 'opacity-100'); box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
};

// ==========================================
// --- MASS VERIFICATION MANAGER LOGIC ---
// ==========================================
window.openMassVerifyModal = function() {
    renderUnverifiedList();
    const modal = document.getElementById('massVerifyModal');
    const box = document.getElementById('massVerifyBox');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100'); }, 10);
};

window.closeMassVerifyModal = function() {
    const modal = document.getElementById('massVerifyModal');
    const box = document.getElementById('massVerifyBox');
    box.classList.remove('scale-100', 'opacity-100'); box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
};

window.renderUnverifiedList = function() {
    const container = document.getElementById('unverifiedUsersList');
    const countBadge = document.getElementById('pendingCountBadge');
    const btn = document.getElementById('btnVerifySelected');
    const selectAll = document.getElementById('selectAllVerify');
    
    selectAll.checked = false;
    btn.disabled = true;
    btn.innerText = 'VERIFY SELECTED';

    if (!window.unverifiedUsersCache || window.unverifiedUsersCache.length === 0) {
        countBadge.innerText = "0 PENDING";
        container.innerHTML = '<div class="text-center text-gray-500 text-sm py-12 italic"><i class="fa-solid fa-check-circle text-4xl text-emerald-400 mb-3 block"></i>All users are currently verified!</div>';
        selectAll.disabled = true;
        return;
    }

    selectAll.disabled = false;
    countBadge.innerText = `${window.unverifiedUsersCache.length} PENDING`;
    
    container.innerHTML = window.unverifiedUsersCache.map(u => `
        <label class="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors">
            <input type="checkbox" value="${u._id}" class="verify-cb mr-4 h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer" onchange="checkVerifySelection()">
            <div class="flex-1">
                <div class="font-bold text-gray-800 dark:text-white text-sm">${u.username} <span class="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-2">${u.role}</span></div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${u.email}</div>
            </div>
        </label>
    `).join('');
};

window.toggleAllVerifyCheckboxes = function(source) {
    const checkboxes = document.querySelectorAll('.verify-cb');
    checkboxes.forEach(cb => cb.checked = source.checked);
    checkVerifySelection();
};

window.checkVerifySelection = function() {
    const checkedCount = document.querySelectorAll('.verify-cb:checked').length;
    const btn = document.getElementById('btnVerifySelected');
    const selectAll = document.getElementById('selectAllVerify');
    const totalCount = document.querySelectorAll('.verify-cb').length;
    
    btn.disabled = checkedCount === 0;
    btn.innerText = checkedCount > 0 ? `VERIFY SELECTED (${checkedCount})` : 'VERIFY SELECTED';
    selectAll.checked = (checkedCount === totalCount && totalCount > 0);
};