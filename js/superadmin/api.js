// ==========================================
// --- SUPER ADMIN API & DANGER ZONE ---
// ==========================================
const API_BASE = 'https://iacademy-rfid.onrender.com/api';

window.allSuperDrivers = []; 

window.fetchSystemData = async function() {
    const startTime = Date.now(); // Start timer for ping
    try {
        const [driversRes, adminsRes, fleetRes] = await Promise.all([
            fetch(`${API_BASE}/drivers`),
            fetch(`${API_BASE}/admins`),
            fetch(`${API_BASE}/vehicles`)
        ]);
        
        window.allSuperDrivers = await driversRes.json();
        const admins = await adminsRes.json();
        const fleet = await fleetRes.json();
        
        // 1. Base Totals
        document.getElementById('statDrivers').innerText = window.allSuperDrivers.length;
        document.getElementById('statAdmins').innerText = admins.length;
        document.getElementById('statFleet').innerText = fleet.length;

        // 2. Breakdowns
        if (document.getElementById('driverBreakdown')) {
            const verifiedDr = window.allSuperDrivers.filter(d => d.isVerified).length;
            document.getElementById('driverBreakdown').innerHTML = `<span class="text-emerald-500">Verified: ${verifiedDr}</span> <span class="text-orange-400">Pending: ${window.allSuperDrivers.length - verifiedDr}</span>`;
        }
        if (document.getElementById('adminBreakdown')) {
            const superAd = admins.filter(a => a.role === 'superadmin').length;
            document.getElementById('adminBreakdown').innerHTML = `<span>Super: ${superAd}</span> <span>Standard: ${admins.length - superAd}</span>`;
        }
        if (document.getElementById('fleetBreakdown')) {
            const gas = fleet.filter(v => ['Gasoline', 'Ron91', 'Ron95'].includes(v.fuelType)).length;
            document.getElementById('fleetBreakdown').innerHTML = `<span>Gas: ${gas}</span> <span>Diesel: ${fleet.length - gas}</span>`;
        }

        // 3. System Health (Ping)
        if (document.getElementById('sysHealthStatus')) {
            const ping = Date.now() - startTime;
            document.getElementById('sysHealthStatus').innerText = "Online";
            document.getElementById('sysHealthStatus').className = "text-xl font-black text-emerald-500 dark:text-emerald-400 mt-1 mb-3";
            document.getElementById('sysHealthPing').innerText = `Ping: ${ping} ms`;
            document.getElementById('healthIcon').className = "fa-solid fa-heart-pulse text-emerald-100 dark:text-emerald-900/30 text-3xl";
        }

        // 4. Populate Chat Users
        const chatSelect = document.getElementById('saChatUserSelect');
        if (chatSelect) {
            chatSelect.innerHTML = '<option value="" disabled selected>Select user to message...</option>';
            const allUsers = [...admins, ...window.allSuperDrivers];
            allUsers.forEach(u => {
                if (u.username !== localStorage.getItem('username')) {
                    chatSelect.innerHTML += `<option value="${u.username}">${u.role === 'driver' ? '🚗' : '👔'} ${u.username}</option>`;
                }
            });
        }
        
        renderAdminTable(admins);
        renderSuperDriverTable(window.allSuperDrivers);
    } catch (e) { 
        console.error("Error fetching data", e); 
        if (document.getElementById('sysHealthStatus')) {
            document.getElementById('sysHealthStatus').innerText = "Offline";
            document.getElementById('sysHealthStatus').className = "text-xl font-black text-red-500 dark:text-red-400 mt-1 mb-3";
            document.getElementById('sysHealthPing').innerText = `API Unreachable`;
            document.getElementById('healthIcon').className = "fa-solid fa-heart-crack text-red-100 dark:text-red-900/30 text-3xl";
        }
    }
};

window.deleteUser = async function(id, username) {
    if (confirm(`CRITICAL WARNING:\nAre you sure you want to permanently delete ${username}? This cannot be undone.`)) {
        try {
            const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchSystemData();
            else alert('Failed to delete user.');
        } catch (err) { alert('Network Error'); }
    }
};

window.toggleVerification = async function(id, currentStatus, username) {
    const actionText = currentStatus ? "UNVERIFY" : "VERIFY";
    if (confirm(`Are you sure you want to manually ${actionText} the account for ${username}?`)) {
        try {
            const res = await fetch(`${API_BASE}/users/${id}/verify`, { method: 'PUT' });
            if (res.ok) fetchSystemData();
            else alert('Failed to update verification status.');
        } catch (err) { alert('Network Error'); }
    }
};

window.forceVerifyAll = async function() {
    if (confirm(`Are you sure you want to bypass email verification for all currently pending accounts?`)) {
        try {
            const res = await fetch(`${API_BASE}/users/force-verify-all`, { method: 'PUT' });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchSystemData();
            } else alert('Failed to verify accounts.');
        } catch (err) { alert('Network Error'); }
    }
};

window.saveProfileFromModal = async function() {
    const driverId = document.getElementById('modalDriverId').value;
    const deptElements = document.querySelectorAll('.modal-dept-cb:checked');
    const schedElements = document.querySelectorAll('.modal-sched-cb:checked');
    
    const selectedDepartments = Array.from(deptElements).map(cb => cb.value);
    const selectedWorkDays = Array.from(schedElements).map(cb => cb.value);

    if (selectedDepartments.length === 0) selectedDepartments.push("Pending Assignment");
    if (selectedWorkDays.length === 0) return alert("Please assign at least one work day.");

    const btn = document.getElementById('btnSaveModal');
    const origText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/drivers/${driverId}/profile`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department: selectedDepartments, workDays: selectedWorkDays }) 
        });
        if (res.ok) { closeProfileModal(); fetchSystemData(); } 
        else alert("Failed to update driver profile.");
    } catch (err) { alert("Network error."); } 
    finally { btn.innerHTML = origText; btn.disabled = false; }
};

// --- CHAT API LOGIC ---
window.fetchSaMessages = async function() {
    const selectedUser = document.getElementById('saChatUserSelect').value;
    const msgBox = document.getElementById('saChatMessages');
    const myName = localStorage.getItem('username');

    try {
        const res = await fetch(`${API_BASE}/messages/${selectedUser}`);
        const messages = await res.json();
        
        msgBox.innerHTML = '';
        if (messages.length === 0) {
            msgBox.innerHTML = '<div class="text-center text-xs text-gray-400 italic my-auto">No messages yet. Say hi!</div>';
            return;
        }

        messages.forEach(m => {
            const isMe = m.sender === 'Admin' || m.sender === myName;
            const align = isMe ? 'self-end bg-blue-600 text-white' : 'self-start bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
            const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            msgBox.innerHTML += `
                <div class="${align} max-w-[80%] rounded-xl px-3 py-2 text-xs shadow-sm">
                    <div>${m.text}</div>
                    <div class="text-[9px] opacity-70 mt-1 text-right">${time}</div>
                </div>
            `;
        });
        msgBox.scrollTop = msgBox.scrollHeight;

        await fetch(`${API_BASE}/messages/mark-read`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: selectedUser, role: 'superadmin' })
        });
    } catch (err) { console.error("Chat Error", err); }
};

window.sendSaMessage = async function(e) {
    e.preventDefault();
    const selectedUser = document.getElementById('saChatUserSelect').value;
    const input = document.getElementById('saChatInput');
    const text = input.value.trim();
    if (!text || !selectedUser) return;

    try {
        await fetch(`${API_BASE}/messages`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: 'Admin', receiver: selectedUser, text: text })
        });
        input.value = '';
        fetchSaMessages();
    } catch (err) { alert("Failed to send message."); }
};

document.addEventListener("DOMContentLoaded", () => {
    const createForm = document.getElementById('createAdminForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const origHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Registering...`;
            btn.disabled = true;

            const payload = {
                username: document.getElementById('aUsername').value,
                firstName: document.getElementById('aFirst').value,
                lastName: document.getElementById('aLast').value,
                email: document.getElementById('aEmail').value,
                password: document.getElementById('aPassword').value,
                role: 'admin', 
                department: ['All Access']
            };

            try {
                const res = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Admin created successfully! Verification email sent.');
                    closeCreateAdminModal();
                    fetchSystemData();
                } else alert(data.message || 'Registration failed.');
            } catch (err) { alert('Network Error'); }
            finally { btn.innerHTML = origHTML; btn.disabled = false; }
        });
    }

    const passForm = document.getElementById('forcePassForm');
    if (passForm) {
        passForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const origHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Overriding...`;
            btn.disabled = true;

            const id = document.getElementById('fpUserId').value;
            const newPassword = document.getElementById('fpPassword').value;
            
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!passRegex.test(newPassword)) {
                alert("Password does not meet standard format requirements.");
                btn.innerHTML = origHTML; btn.disabled = false;
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/users/${id}/force-password`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword })
                });
                if (res.ok) {
                    alert('Password has been forcefully overridden!');
                    closeForcePassModal();
                } else alert('Failed to override password.');
            } catch (err) { alert('Network Error'); }
            finally { btn.innerHTML = origHTML; btn.disabled = false; }
        });
    }
});