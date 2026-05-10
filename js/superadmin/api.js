// ==========================================
// --- SUPER ADMIN API & DANGER ZONE ---
// ==========================================
const API_BASE = 'https://iacademy-rfid.onrender.com/api';

window.allSuperDrivers = []; 
window.unverifiedUsersCache = [];

window.fetchSystemData = async function() {
    const startTime = Date.now();
    try {
        const [driversRes, adminsRes, fleetRes] = await Promise.all([
            fetch(`${API_BASE}/drivers`),
            fetch(`${API_BASE}/admins`),
            fetch(`${API_BASE}/vehicles`)
        ]);
        
        window.allSuperDrivers = await driversRes.json();
        const admins = await adminsRes.json();
        const fleet = await fleetRes.json();
        
        // Cache unverified users for the Danger Zone Modal
        window.unverifiedUsersCache = [...admins, ...window.allSuperDrivers].filter(u => !u.isVerified);

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

window.verifySelectedUsers = async function() {
    const checkboxes = document.querySelectorAll('.verify-cb:checked');
    const idsToVerify = Array.from(checkboxes).map(cb => cb.value);
    if (idsToVerify.length === 0) return;
    if (!confirm(`Are you sure you want to verify these ${idsToVerify.length} selected accounts?`)) return;

    const btn = document.getElementById('btnVerifySelected');
    const origText = btn.innerText;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
    btn.disabled = true;

    try {
        await Promise.all(idsToVerify.map(id => fetch(`${API_BASE}/users/${id}/verify`, { method: 'PUT' })));
        alert(`Successfully verified ${idsToVerify.length} accounts!`);
        closeMassVerifyModal();
        fetchSystemData();
    } catch (err) { alert("An error occurred while verifying users."); } 
    finally { btn.innerHTML = origText; btn.disabled = false; }
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

document.addEventListener("DOMContentLoaded", () => {
    // Register Admin Form
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

    // Force Password Form
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

    // Account Status (Suspend/Activate) Form
    const statusForm = document.getElementById('accountStatusForm');
    if (statusForm) {
        statusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitStatus');
            const origHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;
            btn.disabled = true;

            const id = document.getElementById('statusUserId').value;
            const action = document.getElementById('statusAction').value; // 'active' or 'suspended'
            const duration = document.getElementById('suspendDuration').value;

            try {
                // Sends status to backend. (Backend needs to update user.isSuspended based on this payload)
                const res = await fetch(`${API_BASE}/users/${id}/status`, {
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ status: action, duration: action === 'suspended' ? duration : null })
                });
                
                if (res.ok) {
                    alert(`Account status updated to: ${action.toUpperCase()}`);
                    closeAccountStatusModal();
                    fetchSystemData(); // Refresh UI
                } else alert('Failed to update account status.');
            } catch (err) { alert('Network Error'); }
            finally { btn.innerHTML = origHTML; btn.disabled = false; }
        });
    }
});