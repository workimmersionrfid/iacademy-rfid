// ==========================================
// --- ADMIN API & DATA FETCHING ---
// ==========================================
const API_BASE = 'https://iacademy-rfid.onrender.com/api';

// We use 'var' here so these variables can be accessed by the other files
var allVehicles = [];
var allDrivers = [];
var allTasks = []; 
var allCombinedLogs = []; 
var currentDispatchDept = ""; 

window.loadDashboardData = async function() {
    try {
        allVehicles = await (await fetch(`${API_BASE}/vehicles`)).json();
        allDrivers = await (await fetch(`${API_BASE}/drivers`)).json();   

        const [tasksRes, logsRes, tollsRes] = await Promise.all([
            fetch(`${API_BASE}/tasks`),
            fetch(`${API_BASE}/logs`),
            fetch(`${API_BASE}/tolls`)
        ]);
        
        allTasks = await tasksRes.json();
        const fLogs = await logsRes.json();
        const tLogs = await tollsRes.json();

        const formattedFuel = fLogs.map(l => ({...l, logType: 'Fuel', timestamp: l.date}));
        const formattedToll = tLogs.map(l => ({...l, logType: 'Toll', timestamp: l.date}));
        allCombinedLogs = [...formattedFuel, ...formattedToll].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Update UI Dropdowns
        const deptSelect = document.getElementById('logDeptFilter');
        const driverSelect = document.getElementById('logDriverFilter');
        const dDeptSelect = document.getElementById('dispatchDeptFilter');
        const dDriverSelect = document.getElementById('dispatchDriverFilter');
        
        deptSelect.innerHTML = '<option value="All">All Departments</option>';
        driverSelect.innerHTML = '<option value="All">All Drivers</option>';
        dDeptSelect.innerHTML = '<option value="All">All Departments</option>';
        dDriverSelect.innerHTML = '<option value="All">All Drivers</option>';

        departmentsList.forEach(dept => {
            deptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
            dDeptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
        });
        
        allDrivers.forEach(d => {
            driverSelect.innerHTML += `<option value="${d.username}">${d.username}</option>`;
            dDriverSelect.innerHTML += `<option value="${d.username}">${d.username}</option>`;
        });

    } catch(e) { console.error("Could not load dashboard data", e); }

    // Update Top Stat Cards
    document.getElementById('statVehicles').innerText = allVehicles.length;
    document.getElementById('statTasks').innerText = allTasks.length; 
    document.getElementById('statLogs').innerText = allCombinedLogs.length;
    
    const totalSpent = allCombinedLogs.reduce((sum, log) => sum + (log.total || log.amount || 0), 0);
    document.getElementById('statSpent').innerText = `₱${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    // Re-render UI Tables
    renderLiveBoard();
    renderVehicleList();
    renderLogsList(); 
    renderAdminDriverList();
};

window.refreshDashboard = async function() {
    const btn = document.getElementById('btnRefreshBoard');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Refreshing...`;
    btn.disabled = true;
    
    await loadDashboardData();
    
    btn.innerHTML = originalHTML;
    btn.disabled = false;
};

window.deleteVehicle = async function(id) {
    if (confirm("Are you sure you want to permanently delete this vehicle?")) {
        try {
            const res = await fetch(`${API_BASE}/vehicles/${id}`, { method: 'DELETE' });
            if (res.ok) loadDashboardData(); 
        } catch (err) { console.error("Error deleting vehicle:", err); }
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
        if (res.ok) { closeProfileModal(); loadDashboardData(); } 
        else alert("Failed to update driver profile.");
    } catch (err) { alert("Network error."); } 
    finally { btn.innerHTML = origText; btn.disabled = false; }
};

window.finalizeDispatchTask = async function(isContinuing = false) {
    const btnConfirm = document.getElementById('btnConfirmDispatch');
    btnConfirm.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    btnConfirm.disabled = true;

    const baseDesc = document.getElementById('dDescription').value;
    const origin = document.getElementById('dOrigin').value;
    
    let dest = document.getElementById('tDestinationSelect').value;
    if (dest === 'Other') dest = document.getElementById('tDestinationCustom').value;
    
    const enrichedDesc = `[Est. Budget: ₱${calculatedBudget.toFixed(2)} | Dist: ${calculatedDistance}] From ${origin}. Instructions: ${baseDesc}`;

    const taskData = {
        driver: document.getElementById('dDriver').value,
        vehicle: document.getElementById('dVehicle').value,
        department: currentDispatchDept,
        taskType: document.getElementById('dType').value,
        destination: dest,
        description: enrichedDesc,
        date: document.getElementById('dDate').value,
        status: 'Pending'
    };

    try {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData)
        });
        
        if (res.ok) {
            alert('Task dispatched successfully!');
            if (isContinuing) {
                document.getElementById('dOrigin').value = dest;
                document.getElementById('tDestinationSelect').value = "";
                document.getElementById('tDestinationCustom').value = "";
                document.getElementById('tDestinationCustom').classList.add('hidden');
                document.getElementById('dDescription').value = "";
                document.getElementById('dTollSegments').innerHTML = '';
                tollCounter = 0;
                if (dirRenderer) dirRenderer.setDirections({routes: []});
                
                const summary = document.getElementById('dispatchSummary');
                summary.classList.add('hidden');
                summary.classList.remove('translate-y-0', 'opacity-100');
                summary.classList.add('translate-y-4', 'opacity-0');
                
                await loadDashboardData(); // Refresh tasks so the vehicle shows as used

            } else {
                closeDispatchModal();
                loadDashboardData();
            }
        }
    } catch (err) { alert('Failed to dispatch task.'); }
    finally { btnConfirm.innerHTML = `Confirm & Close`; btnConfirm.disabled = false; }
};

window.submitRebook = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitRebook');
    const origText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    btn.disabled = true;

    const taskId = document.getElementById('rTaskId').value;

    try {
        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                date: document.getElementById('rDate').value,
                driver: document.getElementById('rDriver').value,
                vehicle: document.getElementById('rVehicle').value,
                status: 'Pending'
            })
        });

        if (res.ok) {
            closeRebookModal();
            loadDashboardData(); 
        } else alert("Failed to rebook task.");
    } catch (err) { alert("Network error."); } 
    finally { btn.innerHTML = origText; btn.disabled = false; }
};