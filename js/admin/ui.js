// ==========================================
// --- ADMIN UI & RENDER LOGIC ---
// ==========================================

const departmentsList = [
    "SHS", "COLLEGE", "REGISTRAR", "ADMISSIONS", "OSAS", "LIBRARY", "CLINIC", 
    "ADMIN", "FINANCE", "PURCHASING", "IT", "ELPD", "ADCOM", "GENERAL"
];

const deptIcons = {
    "SHS": "fa-school", "COLLEGE": "fa-graduation-cap", "REGISTRAR": "fa-folder-open",
    "ADMISSIONS": "fa-id-card", "OSAS": "fa-users", "LIBRARY": "fa-book",
    "CLINIC": "fa-notes-medical", "ADMIN": "fa-building", "FINANCE": "fa-coins",
    "PURCHASING": "fa-cart-shopping", "IT": "fa-computer", "ELPD": "fa-chalkboard-user",
    "ADCOM": "fa-bullhorn", "GENERAL": "fa-box-open"
};

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-blue-800', 'text-blue-800', 'font-bold', 'dark:border-blue-400', 'dark:text-blue-400');
        btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-300', 'dark:hover:border-gray-600');
    });
    
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-300', 'dark:hover:border-gray-600');
    activeBtn.classList.add('border-blue-800', 'text-blue-800', 'font-bold', 'dark:border-blue-400', 'dark:text-blue-400');
};

window.renderDeptCards = function() {
    const container = document.getElementById('deptCardsContainer');
    container.innerHTML = departmentsList.map(dept => `
        <div onclick="openDispatchModal('${dept}')" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col items-center justify-center text-center">
            <div class="w-12 h-12 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <i class="fa-solid ${deptIcons[dept]} text-xl"></i>
            </div>
            <span class="font-bold text-blue-900 dark:text-white text-xs tracking-wide">${dept}</span>
        </div>
    `).join('');
};

window.renderLiveBoard = function() {
    const tBoard = document.getElementById('taskBoard');
    const deptFilter = document.getElementById('dispatchDeptFilter').value;
    const driverFilter = document.getElementById('dispatchDriverFilter').value;
    const taskFilter = document.getElementById('dispatchTaskFilter').value;
    const statusFilter = document.getElementById('dispatchStatusFilter').value; 
    
    const isDateSelected = $('#dispatchDateRange').val() !== '';
    let startBoundary = null, endBoundary = null;
    if (isDateSelected) {
        const datePicker = $('#dispatchDateRange').data('daterangepicker');
        startBoundary = datePicker.startDate.toDate();
        endBoundary = datePicker.endDate.toDate();
        startBoundary.setHours(0, 0, 0, 0); endBoundary.setHours(23, 59, 59, 999);
    }

    let filteredTasks = allTasks.filter(t => {
        if (deptFilter !== 'All' && t.department !== deptFilter) return false;
        if (driverFilter !== 'All' && t.driver !== driverFilter) return false;
        if (taskFilter !== 'All' && t.taskType !== taskFilter) return false;
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (startBoundary && endBoundary) {
            const taskDateObj = new Date(t.date);
            if (taskDateObj < startBoundary || taskDateObj > endBoundary) return false;
        }
        return true;
    });

    if (filteredTasks.length === 0) {
        tBoard.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No tasks match your search criteria.</td></tr>`;
    } else {
        tBoard.innerHTML = filteredTasks.map(t => {
            const isDone = t.status === 'Completed';
            const isRebook = t.status === 'Rebook';
            
            let statusHtml = isDone ? `<span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-3 py-1.5 rounded-md text-[10px] border border-blue-100 dark:border-blue-800 uppercase tracking-widest shadow-sm">Completed</span>`
                           : (isRebook ? `<button onclick="openRebookModal('${t._id}', false)" class="bg-red-50 dark:bg-red-900/30 hover:bg-red-600 dark:hover:bg-red-700 hover:text-white text-red-700 dark:text-red-400 font-bold px-3 py-1.5 rounded-md text-[10px] border border-red-200 dark:border-red-800 uppercase tracking-widest transition-all cursor-pointer shadow-sm group"><i class="fa-solid fa-rotate-right mr-1 group-hover:animate-spin"></i> Rebook</button>`
                           : `<div class="flex flex-col gap-2 items-start">
                                <span class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 rounded-md text-[10px] border border-gray-200 dark:border-gray-700 uppercase tracking-widest shadow-sm">Pending</span>
                                <button onclick="openRebookModal('${t._id}', true)" class="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest flex items-center gap-1"><i class="fa-solid fa-calendar-day"></i> Edit Date</button>
                              </div>`);

            return `
            <tr class="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-4 align-top w-28">${statusHtml}</td>
                <td class="p-4 align-top w-40">
                    <div class="font-medium text-gray-800 dark:text-gray-200">${t.date}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${t.driver} <br><span class="font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase">${t.department || 'N/A'}</span></div>
                </td>
                <td class="p-4 align-top text-gray-600 dark:text-gray-400 font-medium">${t.vehicle}</td>
                <td class="p-4 align-top">
                    <div class="font-bold text-blue-900 dark:text-white">${t.destination}</div>
                    <div class="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mt-1">${t.taskType || 'Standard Task'}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 max-w-[300px] mt-0.5" title="${t.description}">${t.description}</div>
                </td>
            </tr>`
        }).join('');
    }
};

window.renderLogsList = function() {
    const lList = document.getElementById('logsList');
    const deptFilter = document.getElementById('logDeptFilter').value;
    const driverFilter = document.getElementById('logDriverFilter').value;
    
    const isDateSelected = $('#dashDateRangePicker').val() !== '';
    let startBoundary = null, endBoundary = null;

    if (isDateSelected) {
        const datePicker = $('#dashDateRangePicker').data('daterangepicker');
        startBoundary = datePicker.startDate.toDate();
        endBoundary = datePicker.endDate.toDate();
        startBoundary.setHours(0, 0, 0, 0); endBoundary.setHours(23, 59, 59, 999);
    }

    let filteredLogs = allCombinedLogs.filter(l => {
        if (driverFilter !== 'All' && l.driver !== driverFilter) return false;
        if (deptFilter !== 'All' && l.department !== deptFilter) return false;
        if (startBoundary && endBoundary) {
            const logDateObj = new Date(l.timestamp);
            if (logDateObj < startBoundary || logDateObj > endBoundary) return false;
        }
        return true;
    });

    const filteredSpent = filteredLogs.reduce((sum, log) => sum + (log.total || log.amount || 0), 0);
    document.getElementById('filteredTotal').innerText = `₱${filteredSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    if (filteredLogs.length === 0) {
        lList.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No logs found for the selected criteria.</td></tr>`;
    } else {
        lList.innerHTML = filteredLogs.map(l => {
            const isFuel = l.logType === 'Fuel';
            const icon = isFuel ? '<i class="fa-solid fa-gas-pump text-blue-500 dark:text-blue-400"></i>' : '<i class="fa-solid fa-ticket text-orange-500 dark:text-orange-400"></i>';
            const badgeClass = isFuel ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            const typeLabel = isFuel ? 'FUEL' : 'TOLL';
            
            let detailHTML = '';
            if (isFuel) {
                const odoText = l.odo ? `ODO: ${l.odo.toLocaleString()} km` : 'ODO: N/A';
                detailHTML = `
                    <div class="text-gray-800 dark:text-gray-200 font-bold flex items-center">${l.vehicle} ${l.notes ? `<i class="fa-solid fa-message text-blue-300 ml-2" title="${l.notes}"></i>` : ''}</div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        <i class="fa-solid fa-gauge-high mr-1 text-gray-400"></i> ${odoText} &bull; <span class="text-blue-700 dark:text-blue-400">${l.liters}L ${l.fuelType || ''}</span>
                    </div>`;
            } else {
                detailHTML = `
                    <div class="text-gray-800 dark:text-gray-200 font-bold flex items-center">${l.vehicle} ${l.notes ? `<i class="fa-solid fa-message text-orange-300 ml-2" title="${l.notes}"></i>` : ''}</div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                        <i class="fa-solid fa-road mr-1 text-gray-400"></i> ${l.expressway || 'Toll Road'}
                    </div>`;
            }

            const cost = isFuel ? (l.total || 0) : (l.amount || 0);

            return `
            <tr class="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-4 text-gray-500 dark:text-gray-400 text-xs font-medium whitespace-nowrap">${l.date}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2 mb-1"><span class="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${badgeClass}">${icon} ${typeLabel}</span></div>
                    <span class="text-xs font-bold text-gray-800 dark:text-gray-200">${l.driver} <span class="text-gray-400 dark:text-gray-500 font-normal ml-1">(${l.department})</span></span>
                </td>
                <td class="p-4">${detailHTML}</td>
                <td class="p-4 text-right font-bold text-blue-900 dark:text-white">₱${cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>`
        }).join('');
    }
};

window.renderVehicleList = function() {
    const vList = document.getElementById('vehicleList');
    if (allVehicles.length === 0) vList.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-400">No vehicles registered yet.</td></tr>`;
    else vList.innerHTML = allVehicles.map(v => `
            <tr class="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-4"><span class="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-bold px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-800 tracking-wider">${v.plateNumber}</span></td>
                <td class="p-4 text-gray-800 dark:text-gray-200 font-medium">${v.year} ${v.model} <br><span class="text-xs text-gray-500 dark:text-gray-400 font-normal">${v.efficiency} km/L • ${v.fuelType}</span></td>
                <td class="p-4 text-right"><button onclick="deleteVehicle('${v._id}')" class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"><i class="fa-solid fa-trash-can text-lg"></i></button></td>
            </tr>`).join('');
};

window.renderAdminDriverList = function() {
    const dList = document.getElementById('adminDriverList');
    if (allDrivers.length === 0) {
        dList.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No drivers registered yet.</td></tr>`;
    } else {
        dList.innerHTML = allDrivers.map(d => {
            const deptArray = Array.isArray(d.department) ? d.department : (d.department ? [d.department] : []);
            const isPending = deptArray.length === 0 || deptArray.includes('Pending Assignment');
            const deptBadge = isPending 
                ? `<span class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold px-2 py-1 rounded-md text-[10px] inline-block m-0.5 border border-gray-200 dark:border-gray-700 uppercase tracking-widest">Pending</span>`
                : deptArray.map(dept => `<span class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-md text-[10px] inline-block m-0.5 border border-blue-100 dark:border-blue-800 uppercase tracking-widest">${dept}</span>`).join('');
            
            const driverWorkDays = d.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']; 
            const scheduleBadges = driverWorkDays.map(day => `<span class="text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-0.5 rounded m-0.5 inline-block uppercase">${day.substring(0,3)}</span>`).join('');

            return `
            <tr class="hover:bg-blue-50/30 dark:hover:bg-gray-700/50 transition-colors group">
                <td class="p-4 align-middle">
                    <button onclick="openProfileModal('${d._id}')" class="font-bold text-blue-800 dark:text-blue-400 underline decoration-blue-200 dark:decoration-blue-800 underline-offset-4 hover:text-blue-900 dark:hover:text-blue-300 text-left transition-colors cursor-pointer">
                        ${d.username}
                    </button>
                </td>
                <td class="p-4 align-middle max-w-[200px]">${deptBadge}</td>
                <td class="p-4 align-middle max-w-[200px]">${scheduleBadges}</td>
                <td class="p-4 text-right align-middle">
                    <button onclick="openProfileModal('${d._id}')" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold shadow-sm">
                        <i class="fa-solid fa-pen text-[10px] mr-1"></i> Edit
                    </button>
                </td>
            </tr>`;
        }).join('');
    }
};

window.openDispatchModal = function(dept) {
    currentDispatchDept = dept;
    document.getElementById('modalDispatchDeptLabel').innerText = `Charging to: ${dept}`;
    
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('advancedTaskForm').reset();
    document.getElementById('dDate').value = todayStr;
    document.getElementById('dOrigin').value = "iACADEMY Nexus (Yakal St.)";
    document.getElementById('dTollSegments').innerHTML = '';
    document.getElementById('tDestinationCustom').classList.add('hidden');
    
    const summary = document.getElementById('dispatchSummary');
    summary.classList.add('hidden');
    summary.classList.remove('translate-y-0', 'opacity-100');
    summary.classList.add('translate-y-4', 'opacity-0');
    
    if (typeof dirRenderer !== 'undefined') dirRenderer.setDirections({routes: []});

    updateModalDropdowns();

    const modal = document.getElementById('dispatchPlannerModal');
    const box = document.getElementById('dispatchPlannerBox');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => {
        box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100');
        if (typeof dispatchMap !== 'undefined') {
            google.maps.event.trigger(dispatchMap, 'resize');
            dispatchMap.setCenter({ lat: 14.5632, lng: 121.0142 });
        }
    }, 10);
};

window.closeDispatchModal = function() {
    const modal = document.getElementById('dispatchPlannerModal');
    const box = document.getElementById('dispatchPlannerBox');
    box.classList.remove('scale-100', 'opacity-100'); box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
};

window.updateModalDropdowns = function() {
    const dateInput = document.getElementById('dDate').value;
    if (!dateInput) return;

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(dateInput).getDay()];
    const dDriverSelect = document.getElementById('dDriver');
    dDriverSelect.innerHTML = '<option value="" disabled selected>Select available driver...</option>';
    
    let availableDrivers = allDrivers.filter(d => !d.workDays || d.workDays.includes(dayName));
    if (currentDispatchDept) {
        availableDrivers = availableDrivers.filter(d => {
            const deptArray = Array.isArray(d.department) ? d.department : (d.department ? [d.department] : []);
            return deptArray.includes(currentDispatchDept);
        });
    }
    
    if (availableDrivers.length === 0) dDriverSelect.innerHTML = `<option value="" disabled selected>No drivers in ${currentDispatchDept} scheduled for ${dayName}</option>`;
    else availableDrivers.forEach(d => dDriverSelect.innerHTML += `<option value="${d.username}">${d.username}</option>`);

    updateVehicleDropdown();
};

window.updateVehicleDropdown = function() {
    const dateInput = document.getElementById('dDate').value;
    const selectedDriver = document.getElementById('dDriver').value;
    const dVehicleSelect = document.getElementById('dVehicle');

    if (!dateInput) return;
    const dayIndex = new Date(dateInput).getDay();

    const vehicleAssignments = {};
    allTasks.filter(t => t.date === dateInput).forEach(t => {
        if (t.vehicle && t.driver) vehicleAssignments[t.vehicle] = t.driver;
    });

    let codingDigits = dayIndex === 1 ? ['1', '2'] : dayIndex === 2 ? ['3', '4'] : dayIndex === 3 ? ['5', '6'] : dayIndex === 4 ? ['7', '8'] : dayIndex === 5 ? ['9', '0'] : []; 

    dVehicleSelect.innerHTML = '<option value="" disabled selected>Select available vehicle...</option>';
    let availableCount = 0; let autoSelectPlate = null;

    allVehicles.forEach(v => {
        const plate = v.plateNumber.trim();
        const assignedTo = vehicleAssignments[plate];
        const isCoded = codingDigits.includes(plate.charAt(plate.length - 1));

        if (assignedTo && assignedTo !== selectedDriver) {
            dVehicleSelect.innerHTML += `<option value="${v.plateNumber}" disabled class="text-orange-500 bg-orange-50">⚠️ ${v.plateNumber} - USED BY ${assignedTo}</option>`;
        } else if (assignedTo === selectedDriver) {
            dVehicleSelect.innerHTML += `<option value="${v.plateNumber}" class="text-emerald-600 bg-emerald-50 font-bold">✅ ${v.plateNumber} (Assigned to ${selectedDriver})</option>`;
            autoSelectPlate = v.plateNumber; availableCount++;
        } else if (isCoded) {
            dVehicleSelect.innerHTML += `<option value="${v.plateNumber}" disabled class="text-red-500 bg-red-50">❌ ${v.plateNumber} - CODING</option>`;
        } else {
            dVehicleSelect.innerHTML += `<option value="${v.plateNumber}">✅ ${v.plateNumber} (${v.model})</option>`;
            availableCount++;
        }
    });

    if (availableCount === 0) dVehicleSelect.innerHTML = `<option value="" disabled selected>No available vehicles</option>`;
    else if (autoSelectPlate) dVehicleSelect.value = autoSelectPlate;
};

window.toggleCustomDestination = function() {
    const select = document.getElementById('tDestinationSelect');
    const customInput = document.getElementById('tDestinationCustom');
    if (select.value === 'Other') {
        customInput.classList.remove('hidden'); customInput.required = true;
    } else {
        customInput.classList.add('hidden'); customInput.required = false; customInput.value = '';
    }
};

window.openProfileModal = function(driverId) {
    const driver = allDrivers.find(d => d._id === driverId);
    if (!driver) return;

    document.getElementById('modalDriverName').innerText = driver.username;
    document.getElementById('modalDriverId').value = driver._id;

    const deptArray = Array.isArray(driver.department) ? driver.department : (driver.department ? [driver.department] : []);
    const driverWorkDays = driver.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // 🚨 FIX: Removed "Pending Assignment" to prevent accidental manual assignment
    document.getElementById('modalDeptList').innerHTML = departmentsList.map(dept => `
        <label class="flex items-center text-[10px] text-gray-700 dark:text-gray-300 font-bold tracking-wide uppercase cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <input type="checkbox" value="${dept}" class="modal-dept-cb mr-3 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" ${deptArray.includes(dept) ? 'checked' : ''}>
            <span class="truncate">${dept}</span>
        </label>
    `).join('');

    document.getElementById('modalScheduleList').innerHTML = daysOfWeek.map(day => `
        <label class="flex items-center text-xs text-gray-700 dark:text-gray-300 font-bold tracking-wide uppercase cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
            <input type="checkbox" value="${day}" class="modal-sched-cb mr-3 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" ${driverWorkDays.includes(day) ? 'checked' : ''}>
            ${day.substring(0,3)}
        </label>
    `).join('');

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

window.openRebookModal = function(taskId, isEdit = false) {
    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;

    document.getElementById('rTaskId').value = task._id;
    document.getElementById('rTaskDept').value = task.department || 'GENERAL';
    document.getElementById('rTaskDesc').innerText = `${task.destination} — ${task.description}`;
    
    document.getElementById('rDate').value = "";
    document.getElementById('rDriver').innerHTML = '<option value="" disabled selected>Select new date first...</option>';
    document.getElementById('rVehicle').innerHTML = '<option value="" disabled selected>Select driver first...</option>';

    const header = document.getElementById('rebookModalHeader');
    const title = document.getElementById('rebookModalTitle');
    const btn = document.getElementById('btnSubmitRebook');

    if (isEdit) {
        header.className = "p-5 bg-blue-800 dark:bg-blue-900 flex justify-between items-center border-b transition-colors";
        title.innerHTML = `<i class="fa-solid fa-calendar-day mr-2"></i> Edit Dispatch Date`;
        btn.innerHTML = `Save Changes`;
        btn.className = "w-2/3 bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors text-sm";
    } else {
        header.className = "p-5 bg-red-800 dark:bg-red-900 flex justify-between items-center border-b transition-colors";
        title.innerHTML = `<i class="fa-solid fa-rotate-right mr-2"></i> Rebook Task`;
        btn.innerHTML = `Confirm Rebook`;
        btn.className = "w-2/3 bg-red-700 dark:bg-red-600 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors text-sm";
    }

    const modal = document.getElementById('rebookModal');
    const box = document.getElementById('rebookBox');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { box.classList.remove('scale-95', 'opacity-0'); box.classList.add('scale-100', 'opacity-100'); }, 10);
};

window.closeRebookModal = function() {
    const modal = document.getElementById('rebookModal');
    const box = document.getElementById('rebookBox');
    box.classList.remove('scale-100', 'opacity-100'); box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
};

window.updateRebookDropdowns = function() {
    const dateInput = document.getElementById('rDate').value;
    if (!dateInput) return;

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(dateInput).getDay()];
    const rDriverSelect = document.getElementById('rDriver');
    const dept = document.getElementById('rTaskDept').value;
    
    rDriverSelect.innerHTML = '<option value="" disabled selected>Select available driver...</option>';
    let availableDrivers = allDrivers.filter(d => !d.workDays || d.workDays.includes(dayName));

    if (dept && dept !== 'GENERAL') {
        availableDrivers = availableDrivers.filter(d => {
            const deptArray = Array.isArray(d.department) ? d.department : (d.department ? [d.department] : []);
            return deptArray.includes(dept);
        });
    }
    
    if (availableDrivers.length === 0) rDriverSelect.innerHTML = `<option value="" disabled selected>No drivers in ${dept} scheduled for ${dayName}</option>`;
    else availableDrivers.forEach(d => rDriverSelect.innerHTML += `<option value="${d.username}">${d.username}</option>`);

    updateRebookVehicleDropdown();
};

window.updateRebookVehicleDropdown = function() {
    const dateInput = document.getElementById('rDate').value;
    const selectedDriver = document.getElementById('rDriver').value;
    const rVehicleSelect = document.getElementById('rVehicle');

    if (!dateInput) return;
    const vehicleAssignments = {};
    allTasks.filter(t => t.date === dateInput).forEach(t => {
        if (t.vehicle && t.driver) vehicleAssignments[t.vehicle] = t.driver;
    });

    const dayIndex = new Date(dateInput).getDay();
    let codingDigits = dayIndex === 1 ? ['1', '2'] : dayIndex === 2 ? ['3', '4'] : dayIndex === 3 ? ['5', '6'] : dayIndex === 4 ? ['7', '8'] : dayIndex === 5 ? ['9', '0'] : []; 

    rVehicleSelect.innerHTML = '<option value="" disabled selected>Select available vehicle...</option>';
    let availableCount = 0; let autoSelectPlate = null;

    allVehicles.forEach(v => {
        const plate = v.plateNumber.trim();
        const assignedTo = vehicleAssignments[plate];
        const lastDigit = plate.charAt(plate.length - 1);

        if (assignedTo && assignedTo !== selectedDriver) {
            rVehicleSelect.innerHTML += `<option value="${v.plateNumber}" disabled class="text-orange-500 bg-orange-50">⚠️ ${v.plateNumber} - USED BY ${assignedTo}</option>`;
        } else if (assignedTo === selectedDriver) {
            rVehicleSelect.innerHTML += `<option value="${v.plateNumber}" class="text-emerald-600 bg-emerald-50 font-bold">✅ ${v.plateNumber} (Assigned to ${selectedDriver})</option>`;
            autoSelectPlate = v.plateNumber; availableCount++;
        } else if (codingDigits.includes(lastDigit)) {
            rVehicleSelect.innerHTML += `<option value="${v.plateNumber}" disabled class="text-red-500 bg-red-50">❌ ${v.plateNumber} - CODING</option>`;
        } else {
            rVehicleSelect.innerHTML += `<option value="${v.plateNumber}">✅ ${v.plateNumber} (${v.model})</option>`;
            availableCount++;
        }
    });

    if (availableCount === 0) rVehicleSelect.innerHTML = `<option value="" disabled selected>No available vehicles</option>`;
    else if (autoSelectPlate) rVehicleSelect.value = autoSelectPlate;
};

// --- VEHICLE MASTER DATABASE ---
const masterVehicleDatabase = {
    "Toyota Vios": { fuel: "Ron95", eff: 14.5 },
    "Toyota Fortuner": { fuel: "Diesel", eff: 10.2 },
    "Toyota Hi-Ace": { fuel: "Diesel", eff: 9.5 },
    "Mitsubishi Xpander": { fuel: "Ron91", eff: 13.0 },
    "Mitsubishi Montero": { fuel: "Diesel", eff: 11.0 },
    "Honda Beat": { fuel: "Gasoline", eff: 45.0 },
    "Honda City": { fuel: "Ron95", eff: 15.2 },
    "Suzuki Carry": { fuel: "Gasoline", eff: 12.5 },
    "Ford Ranger": { fuel: "Diesel", eff: 11.5 },
    "Hyundai Tucson": { fuel: "Ron95", eff: 10.8 },
    "Kia Picanto": { fuel: "Ron91", eff: 18.0 },
    "Geely Coolray": { fuel: "Ron95", eff: 12.0 },
    "Suzuki Ertiga": { fuel: "Ron91", eff: 14.0 },
    "Yamaha Mio": { fuel: "Gasoline", eff: 42.0 },
    "Isuzu D-Max": { fuel: "Diesel", eff: 12.5 }
};

window.autoFillSpecs = function() {
    const modelSelect = document.getElementById('vModel').value;
    const fuelSelect = document.getElementById('vFuel');
    const effInput = document.getElementById('vEfficiency');
    const customModelGroup = document.getElementById('customModelGroup');
    const customModelInput = document.getElementById('vModelCustom');

    if (modelSelect === 'Other') {
        customModelGroup.classList.remove('hidden');
        customModelInput.required = true;
        fuelSelect.disabled = false; effInput.disabled = false;
        fuelSelect.value = ""; effInput.value = "";
    } else if (masterVehicleDatabase[modelSelect]) {
        customModelGroup.classList.add('hidden');
        customModelInput.required = false;
        fuelSelect.value = masterVehicleDatabase[modelSelect].fuel;
        effInput.value = masterVehicleDatabase[modelSelect].eff;
        fuelSelect.disabled = true; effInput.disabled = true;
    }
};
// Event Listeners for boot sequence
document.addEventListener("DOMContentLoaded", () => {
    if(typeof renderNavigation === 'function') renderNavigation('dashboard');
    renderDeptCards();
    if(typeof loadGoogleMaps === 'function') loadGoogleMaps();
    if(typeof loadDashboardData === 'function') loadDashboardData();
    
    if(document.getElementById('dDate')) {
        document.getElementById('dDate').addEventListener('change', updateModalDropdowns);
    }

    if($('#dashDateRangePicker').length) {
        $('#dashDateRangePicker').daterangepicker({
            opens: 'right', autoUpdateInput: false, locale: { format: 'MM/DD/YYYY', cancelLabel: 'Clear' },
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Month to date': [moment().startOf('month'), moment()],
                'Last week': [moment().subtract(1, 'week').startOf('isoWeek'), moment().subtract(1, 'week').endOf('isoWeek')],
                'Last month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        });
        $('#dashDateRangePicker').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
            renderLogsList(); 
        });
        $('#dashDateRangePicker').on('cancel.daterangepicker', function(ev, picker) { $(this).val(''); renderLogsList(); });
    }

    if($('#dispatchDateRange').length) {
        $('#dispatchDateRange').daterangepicker({
            opens: 'right', autoUpdateInput: false, locale: { format: 'MM/DD/YYYY', cancelLabel: 'Clear' },
            ranges: {
                'Today': [moment(), moment()],
                'Tomorrow': [moment().add(1, 'days'), moment().add(1, 'days')],
                'Next 7 Days': [moment(), moment().add(6, 'days')],
                'This Month': [moment().startOf('month'), moment().endOf('month')]
            }
        });
        $('#dispatchDateRange').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
            renderLiveBoard(); 
        });
        $('#dispatchDateRange').on('cancel.daterangepicker', function(ev, picker) { $(this).val(''); renderLiveBoard(); });
    }

    // Vehicle Form Submission
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`; btn.disabled = true;

            const finalModel = document.getElementById('vModel').value === 'Other' ? document.getElementById('vModelCustom').value : document.getElementById('vModel').value;
            const vehicleData = {
                model: finalModel, plateNumber: document.getElementById('vPlate').value.toUpperCase(),
                year: document.getElementById('vYear').value, fuelType: document.getElementById('vFuel').value,
                efficiency: parseFloat(document.getElementById('vEfficiency').value)
            };

            try {
                const res = await fetch(`${API_BASE}/vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicleData) });
                if (res.ok) { document.getElementById('vehicleForm').reset(); autoFillSpecs(); loadDashboardData(); }
            } catch (err) { console.error('Error saving vehicle:', err); } 
            finally { btn.innerHTML = `Register Fleet Vehicle`; btn.disabled = false; }
        });
    }
});