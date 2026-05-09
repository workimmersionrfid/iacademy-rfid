// ==========================================
// --- SUPER ADMIN API & DANGER ZONE ---
// ==========================================
const API_BASE = 'https://iacademy-rfid.onrender.com/api';

window.fetchSystemData = async function() {
    try {
        const [driversRes, adminsRes, fleetRes] = await Promise.all([
            fetch(`${API_BASE}/drivers`),
            fetch(`${API_BASE}/admins`),
            fetch(`${API_BASE}/vehicles`)
        ]);
        
        const drivers = await driversRes.json();
        const admins = await adminsRes.json();
        const fleet = await fleetRes.json();
        
        document.getElementById('statDrivers').innerText = drivers.length;
        document.getElementById('statAdmins').innerText = admins.length;
        document.getElementById('statFleet').innerText = fleet.length;
        
        renderAdminTable(admins);
    } catch (e) { console.error("Error fetching data", e); }
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

// Event Listeners for Forms
document.addEventListener("DOMContentLoaded", () => {
    
    // Create Admin Form
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

    // Force Password Reset Form
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