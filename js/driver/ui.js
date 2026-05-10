// ==========================================
// --- DRIVER UI & DOM LOGIC ---
// ==========================================

let currentActiveTaskId = null;
let currentActiveVehicle = "N/A";
let currentActiveTaskName = "N/A";
let currentActiveTaskDest = "N/A";
let currentActiveTaskDept = "GENERAL"; 
let currentCompletedTaskId = null;
let activeLogIdForReopen = null;

// --- MODAL CONTROLS ---
window.openFuelModal = function() {
    const m = document.getElementById('fuelModal');
    m.classList.remove('hidden'); m.classList.add('flex');
    updateModalVehicleDropdown('fuel'); 
};
window.closeFuelModal = function() {
    const m = document.getElementById('fuelModal');
    m.classList.remove('flex'); m.classList.add('hidden');
};

window.openTollModal = function() {
    const m = document.getElementById('tollModal');
    m.classList.remove('hidden'); m.classList.add('flex');
    updateModalVehicleDropdown('toll'); 
};
window.closeTollModal = function() {
    const m = document.getElementById('tollModal');
    m.classList.remove('flex'); m.classList.add('hidden');
};

window.closeExecutionModal = function() {
    const modal = document.getElementById('executionModal');
    const box = document.getElementById('executionModalBox');
    box.classList.remove('scale-100', 'opacity-100'); 
    box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
};

window.closeCompletedModal = function() {
    const modal = document.getElementById('completedModal');
    const box = document.getElementById('completedModalBox');
    box.classList.remove('scale-100', 'opacity-100'); box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
};

// --- DROPDOWN LOGIC ---
window.updateModalVehicleDropdown = function(type) {
    const dateInputId = type === 'fuel' ? 'fDate' : 'tollDate';
    const selectId = type === 'fuel' ? 'fVehicle' : 'tollVehicle';
    const deptId = type === 'fuel' ? 'fLogDept' : 'tollLogDept';
    
    const dateInput = document.getElementById(dateInputId).value;
    const selectEl = document.getElementById(selectId);
    const deptEl = document.getElementById(deptId);
    const myName = localStorage.getItem('username');

    if (!dateInput || allVehicles.length === 0) return;

    const myDailyTasks = allTasks.filter(t => t.date === dateInput && t.driver === myName);
    
    vehicleDeptMap = {};
    myDailyTasks.forEach(t => {
        if (t.vehicle) {
            if (!vehicleDeptMap[t.vehicle]) vehicleDeptMap[t.vehicle] = new Set();
            vehicleDeptMap[t.vehicle].add(t.department || 'GENERAL');
        }
    });

    const myAssignedPlates = [...new Set(myDailyTasks.map(t => t.vehicle).filter(v => v))];

    selectEl.innerHTML = '';
    deptEl.innerHTML = '<option value="" disabled selected>Select a vehicle first...</option>';

    if (myAssignedPlates.length === 0) {
        selectEl.innerHTML = `<option value="" disabled selected>❌ No vehicle assigned to you</option>`;
    } else {
        selectEl.innerHTML = '<option value="" disabled selected>Select assigned vehicle...</option>';
        let autoSelectPlate = null;

        myAssignedPlates.forEach(plate => {
            const vObj = allVehicles.find(v => v.plateNumber === plate);
            const modelName = vObj ? vObj.model : 'Unknown Model';
            selectEl.innerHTML += `<option value="${plate}" class="text-emerald-700 font-bold dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30">✅ ${plate} (${modelName})</option>`;
            autoSelectPlate = plate;
        });

        if (myAssignedPlates.length === 1 && autoSelectPlate) {
            selectEl.value = autoSelectPlate;
            onVehicleSelect(type);
        }
    }
};

window.onVehicleSelect = function(type) {
    const plateId = type === 'fuel' ? 'fVehicle' : 'tollVehicle';
    const deptId = type === 'fuel' ? 'fLogDept' : 'tollLogDept';
    const plate = document.getElementById(plateId).value;
    const deptSelect = document.getElementById(deptId);

    if (!plate || !vehicleDeptMap[plate]) {
        deptSelect.innerHTML = '<option value="" disabled selected>Select a vehicle first...</option>';
    } else {
        const depts = Array.from(vehicleDeptMap[plate]);
        deptSelect.innerHTML = '<option value="" disabled selected>Select department to charge...</option>';
        depts.forEach(d => deptSelect.innerHTML += `<option value="${d}">${d}</option>`);
        if (depts.length === 1) deptSelect.value = depts[0];
    }

    if (type === 'fuel') {
        const fuelInput = document.getElementById('fFuelType');
        const vObj = allVehicles.find(v => v.plateNumber === plate);
        fuelInput.value = vObj && vObj.fuelType ? vObj.fuelType : "Unknown";
    }
};

// --- RENDER ASSIGNED TASKS ---
window.renderMyTasks = function() {
    const myName = localStorage.getItem('username');
    const todayStr = new Date().toISOString().split('T')[0]; 
    const archivedTasks = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
    let myTasks = allTasks.filter(t => t.driver === myName && !archivedTasks.includes(t._id));
    
    myTasks.sort((a, b) => {
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return 0;
    });

    const list = document.getElementById('taskList');
    if(myTasks.length === 0) {
        list.innerHTML = `<div class="col-span-full text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-50 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">No active tasks assigned.</div>`;
        return;
    }

    list.innerHTML = myTasks.map(t => {
        const isDone = t.status === 'Completed';
        const isRebook = t.status === 'Rebook';
        const isFuture = t.date > todayStr && !isDone && !isRebook;
        
        let bgClass, statusBadge, clickAction;

        if (isDone) {
            bgClass = 'bg-gray-50 dark:bg-gray-800 opacity-80 border-gray-200 dark:border-gray-700 cursor-pointer shadow-sm hover:shadow-md';
            statusBadge = '<span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded tracking-widest border border-emerald-200 dark:border-emerald-800">DONE (TAP TO VIEW)</span>';
            clickAction = `onclick="openCompletedTask('${t._id}', '${t.taskType || 'Standard Dispatch'}', '${t.description.replace(/'/g, "\\'")}', '${t.destination.replace(/'/g, "\\'")}')"`;
        } else if (isRebook) {
            bgClass = 'bg-red-50/30 dark:bg-red-900/20 opacity-70 border-red-100 dark:border-red-900/50';
            statusBadge = '<span class="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded tracking-widest border border-red-200 dark:border-red-800">REBOOK</span>';
            clickAction = '';
        } else if (isFuture) {
            bgClass = 'bg-gray-50 dark:bg-gray-800 opacity-80 cursor-not-allowed border-gray-200 dark:border-gray-700';
            statusBadge = '<span class="text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded tracking-widest border border-orange-200 dark:border-orange-800"><i class="fa-solid fa-lock mr-1"></i> FUTURE</span>';
            clickAction = `onclick="alert('🔒 Locked: Future Dispatch')"`;
        } else {
            bgClass = 'bg-white dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-gray-700 cursor-pointer shadow-sm hover:shadow-md border-blue-100 dark:border-gray-600';
            statusBadge = '<span class="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded tracking-widest border border-blue-200 dark:border-blue-800">PENDING</span>';
            clickAction = `onclick="startAssignedTask('${t._id}', '${t.taskType || 'Standard Dispatch'}', '${t.description.replace(/'/g, "\\'")}', '${t.destination.replace(/'/g, "\\'")}', '${t.vehicle}', '${t.department || 'GENERAL'}')"`;
        }

        return `
        <button type="button" ${clickAction} class="${bgClass} w-full text-left p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4">
            ${(!isDone && !isRebook && !isFuture) ? '<div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>' : ''}
            <div class="flex justify-between items-start mb-2 w-full">
                <div class="flex gap-1.5 flex-wrap">
                    <span class="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 tracking-widest">${t.vehicle}</span>
                    <span class="text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 tracking-widest">${t.date}</span>
                </div>
                ${statusBadge}
            </div>
            <h3 class="font-bold text-blue-900 dark:text-white text-lg leading-tight mb-1 w-full truncate">${t.description}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium w-full truncate"><i class="fa-solid fa-location-dot text-blue-400 mr-1"></i> ${t.destination}</p>
        </button>`;
    }).join('');
};

window.refreshTasksWithUI = async function(btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Syncing...`;
    btn.disabled = true;
    await initDriverData();
    btn.innerHTML = originalText;
    btn.disabled = false;
};

// --- COMPLETED / ARCHIVED TASKS ---
window.openCompletedTask = async function(taskId, taskType, taskDesc, destName) {
    currentCompletedTaskId = taskId;
    activeLogIdForReopen = null; 
    
    document.getElementById('comp-task-desc').innerText = taskDesc;
    document.getElementById('comp-task-dest').innerHTML = `<i class="fa-solid fa-location-dot mr-1 text-emerald-500"></i> ${destName}`;

    const modal = document.getElementById('completedModal');
    const box = document.getElementById('completedModalBox');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');
    }, 10);

    const detailsContainer = document.getElementById('comp-log-details');
    detailsContainer.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Fetching your submission...';

    try {
        const res = await fetch(`${API_BASE}/action-logs`);
        const logs = await res.json();
        const myName = localStorage.getItem('username');
        
        const exactTaskString = `${taskType}: ${taskDesc}`;
        const myHandoverLogs = logs.filter(l =>
            l.driver_name === myName &&
            (l.action === "Final Task Handover" || l.action === "Revised Task Handover") &&
            l.task === exactTaskString
        );

        myHandoverLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (myHandoverLogs.length > 0) {
            const log = myHandoverLogs[0];
            activeLogIdForReopen = log._id; 
            
            detailsContainer.innerHTML = `
                <div class="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                    <span class="font-bold text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest">Status:</span>
                    <span class="${log.delivery_status === 'Successful' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} font-black text-sm uppercase tracking-wide bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-100 dark:border-gray-700">${log.delivery_status}</span>
                </div>
                <div class="flex flex-col mt-3">
                    <span class="font-bold text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Reasons/Remarks:</span>
                    <span class="font-medium bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">${log.incomplete_reasons || 'None provided'}</span>
                </div>
                <div class="flex flex-col mt-3">
                    <span class="font-bold text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Comments:</span>
                    <span class="font-medium bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm italic text-gray-600 dark:text-gray-400">"${log.comments || 'No comments'}"</span>
                </div>
            `;
        } else {
            detailsContainer.innerHTML = "No submission data found.";
        }
    } catch (e) {
        detailsContainer.innerHTML = "Failed to load submission data.";
    }
};

window.archiveCompletedTask = function() {
    if (!currentCompletedTaskId) return;
    let archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
    if (!archived.includes(currentCompletedTaskId)) {
        archived.push(currentCompletedTaskId);
        localStorage.setItem('archivedTasks', JSON.stringify(archived));
    }
    closeCompletedModal();
    renderMyTasks(); 
};

window.reopenCompletedTask = async function() {
    if (!currentCompletedTaskId) return;
    if (confirm("Are you sure you want to edit this task? \n\nFor auditing purposes, this will pull the task back into your 'Pending' list so you can submit a completely fresh, corrected Handover Log.")) {
        try {
            if (activeLogIdForReopen) {
                localStorage.setItem(`revision_for_${currentCompletedTaskId}`, activeLogIdForReopen);
            }

            await fetch(`${API_BASE}/tasks/${currentCompletedTaskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Pending' })
            });

            let archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
            archived = archived.filter(id => id !== currentCompletedTaskId);
            localStorage.setItem('archivedTasks', JSON.stringify(archived));

            closeCompletedModal();
            alert("Task has been re-opened! It is now back in your Pending queue.");
            await initDriverData(); 
        } catch (err) { alert("Failed to re-open task."); }
    }
};

// --- FUEL LOGGING ---
function calculateTotalFuelCost() {
    const price = parseFloat(document.getElementById('fPrice').value) || 0;
    const liters = parseFloat(document.getElementById('fLiters').value) || 0;
    const total = price * liters;
    document.getElementById('fTotalCostDisplay').innerText = `₱${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}
if(document.getElementById('fPrice')) document.getElementById('fPrice').addEventListener('input', calculateTotalFuelCost);
if(document.getElementById('fLiters')) document.getElementById('fLiters').addEventListener('input', calculateTotalFuelCost);

window.submitFuel = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...'; 
    btn.disabled = true;

    const vehiclePlate = document.getElementById('fVehicle').value;
    const vObj = allVehicles.find(v => v.plateNumber === vehiclePlate);
    const actualFuelType = vObj ? vObj.fuelType : "Unknown";
    const specificDept = document.getElementById('fLogDept').value; 

    const coords = await getLiveLocation(); 

    const logData = {
        vehicle: vehiclePlate,
        driver: localStorage.getItem('username'),
        department: specificDept, 
        date: document.getElementById('fDate').value,
        fuelType: actualFuelType, 
        liters: parseFloat(document.getElementById('fLiters').value),
        price: parseFloat(document.getElementById('fPrice').value),
        total: parseFloat(document.getElementById('fLiters').value) * parseFloat(document.getElementById('fPrice').value),
        odo: document.getElementById('fOdo').value ? parseFloat(document.getElementById('fOdo').value) : null,
        station: document.getElementById('fStation').value || 'N/A',
        notes: document.getElementById('fNotes').value || '',
        latitude: coords.lat,
        longitude: coords.lon
    };

    try {
        const res = await fetch(`${API_BASE}/logs`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logData)
        });
        
        if (res.ok) {
            alert('Fuel log saved successfully!');
            closeFuelModal();
            e.target.reset();
            document.getElementById('fTotalCostDisplay').innerText = '₱0.00';
            document.getElementById('fDate').valueAsDate = new Date();
            updateModalVehicleDropdown('fuel'); 
        }
    } catch (err) { alert('Server error saving fuel log.'); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
};

// --- TOLL & OCR LOGIC ---
window.switchTollTab = function(tabName) {
    const btnOcr = document.getElementById('tab-ocr-btn');
    const btnManual = document.getElementById('tab-manual-btn');
    const secOcr = document.getElementById('toll-ocr-section');
    const secManual = document.getElementById('tollForm');

    if (tabName === 'ocr') {
        btnOcr.classList.replace('text-gray-500', 'text-blue-800');
        btnOcr.classList.replace('dark:text-gray-400', 'dark:text-blue-400');
        btnOcr.classList.replace('border-transparent', 'border-blue-800');
        btnOcr.classList.replace('dark:border-transparent', 'dark:border-blue-400');
        btnOcr.classList.replace('font-bold', 'font-black');
        
        btnManual.classList.replace('text-blue-800', 'text-gray-500');
        btnManual.classList.replace('dark:text-blue-400', 'dark:text-gray-400');
        btnManual.classList.replace('border-blue-800', 'border-transparent');
        btnManual.classList.replace('dark:border-blue-400', 'dark:border-transparent');
        btnManual.classList.replace('font-black', 'font-bold');
        
        secOcr.classList.remove('hidden'); secManual.classList.add('hidden');
    } else {
        btnManual.classList.replace('text-gray-500', 'text-blue-800');
        btnManual.classList.replace('dark:text-gray-400', 'dark:text-blue-400');
        btnManual.classList.replace('border-transparent', 'border-blue-800');
        btnManual.classList.replace('dark:border-transparent', 'dark:border-blue-400');
        btnManual.classList.replace('font-bold', 'font-black');
        
        btnOcr.classList.replace('text-blue-800', 'text-gray-500');
        btnOcr.classList.replace('dark:text-blue-400', 'dark:text-gray-400');
        btnOcr.classList.replace('border-blue-800', 'border-transparent');
        btnOcr.classList.replace('dark:border-blue-400', 'dark:border-transparent');
        btnOcr.classList.replace('font-black', 'font-bold');
        
        secManual.classList.remove('hidden'); secOcr.classList.add('hidden');
    }
};

let currentOcrImage = null;
if(document.getElementById('ocr-upload')) {
    document.getElementById('ocr-upload').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            document.getElementById('ocr-file-name').innerText = file.name;
            const reader = new FileReader();
            reader.onload = function(event) {
                currentOcrImage = event.target.result;
                document.getElementById('ocr-preview-img').src = currentOcrImage;
                document.getElementById('ocr-preview-container').classList.remove('hidden');
                document.getElementById('btn-run-ocr').disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });
}

window.processTollOCR = async function() {
    const btn = document.getElementById('btn-run-ocr');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Scanning Receipt...`;
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/scan-receipt`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: currentOcrImage })
        });
        if (!response.ok) throw new Error("Backend failed to process image.");
        const extractedData = await response.json();

        if (extractedData.amount) {
            document.getElementById('tollAmount').value = extractedData.amount;
            if (extractedData.expressway) {
                const expDropdown = document.getElementById('tollExpressway');
                const optionExists = Array.from(expDropdown.options).some(opt => opt.value === extractedData.expressway);
                if (optionExists) expDropdown.value = extractedData.expressway;
            }
            document.getElementById('ocr-success-banner').classList.remove('hidden');
        } else { alert("Could not clearly read the amount. Please enter it manually."); }
    } catch (error) {
        console.error("OCR API Error:", error);
        alert("OCR Scanner failed or is offline. Please enter the details manually.");
    } finally {
        switchTollTab('manual');
        btn.innerHTML = originalHTML; btn.disabled = false;
    }
};

window.submitToll = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...'; 
    btn.disabled = true;

    const vehiclePlate = document.getElementById('tollVehicle').value;
    const specificDept = document.getElementById('tollLogDept').value; 
    const coords = await getLiveLocation(); 

    const tollData = {
        vehicle: vehiclePlate,
        driver: localStorage.getItem('username'),
        department: specificDept, 
        date: document.getElementById('tollDate').value,
        expressway: document.getElementById('tollExpressway').value,
        amount: parseFloat(document.getElementById('tollAmount').value),
        notes: document.getElementById('tollNotes').value || '',
        latitude: coords.lat,
        longitude: coords.lon
    };

    try {
        const res = await fetch(`${API_BASE}/tolls`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tollData)
        });
        if (res.ok) {
            alert('Toll log saved successfully!');
            closeTollModal();
            e.target.reset();
            document.getElementById('ocr-preview-container').classList.add('hidden');
            document.getElementById('ocr-file-name').innerText = "Tap to Open Camera";
            document.getElementById('ocr-success-banner').classList.add('hidden');
            switchTollTab('ocr');
            currentOcrImage = null;
            document.getElementById('tollDate').valueAsDate = new Date();
            updateModalVehicleDropdown('toll'); 
        } else { alert('Failed to save toll log.'); }
    } catch (err) { alert('Server error saving toll log.'); } 
    finally { btn.innerHTML = originalText; btn.disabled = false; }
};

// --- EXECUTION LOGIC ---
window.startAssignedTask = function(taskId, taskType, taskDesc, destName, assignedVehicle, taskDept) {
    currentActiveTaskId = taskId; 
    currentActiveVehicle = assignedVehicle || "N/A";
    currentActiveTaskName = `${taskType}: ${taskDesc}`; 
    currentActiveTaskDest = destName; 
    currentActiveTaskDept = taskDept || "GENERAL"; 
    
    document.getElementById('display-task-desc').innerText = taskDesc;
    document.getElementById('display-task-dest').innerText = destName;
    document.getElementById('display-task-type').innerText = taskType;
    document.getElementById('display-task-vehicle').innerText = currentActiveVehicle;
    
    document.getElementById('active-task-info').classList.remove('hidden');
    document.getElementById('no-task-placeholder').classList.add('hidden');
    
    document.getElementById('start-execution-section').classList.remove('hidden');
    document.getElementById('task-action-controls').classList.add('hidden');

    const statusText = document.getElementById('status-text');
    statusText.textContent = `STATUS: READY FOR TRANSIT`;
    statusText.classList.replace('text-gray-500', 'text-blue-600');
    statusText.classList.replace('dark:text-gray-400', 'dark:text-blue-400');
    
    const modal = document.getElementById('executionModal');
    const box = document.getElementById('executionModalBox');
    modal.classList.remove('hidden'); 
    modal.classList.add('flex');
    setTimeout(() => { 
        box.classList.remove('scale-95', 'opacity-0'); 
        box.classList.add('scale-100', 'opacity-100'); 
    }, 10);
};

if(document.getElementById('btn-start-execution')) {
    document.getElementById('btn-start-execution').addEventListener('click', async () => {
        const btn = document.getElementById('btn-start-execution');
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Locking GPS...`;
        btn.disabled = true;

        await getLiveLocation();

        document.getElementById('start-execution-section').classList.add('hidden');
        document.getElementById('task-action-controls').classList.remove('hidden');

        btn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Start Execution`;
        btn.disabled = false;
    });
}

function getFinalTaskAndLocation() { return { finalTask: currentActiveTaskName, finalLoc: currentActiveTaskDest }; }

let uploadedImagesData = [];
if(document.getElementById('file-upload')) {
    document.getElementById('file-upload').addEventListener('change', async (e) => {    
        const fileNameDisplay = document.getElementById('file-name');
        const previewContainer = document.getElementById('previewContainer');
        if (e.target.files.length > 0) {        
            fileNameDisplay.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...`;        
            uploadedImagesData = []; previewContainer.innerHTML = ''; 
            
            for (let i = 0; i < e.target.files.length; i++) {
                const compressed = await compressImage(e.target.files[i]);
                uploadedImagesData.push(compressed);
                
                const img = document.createElement('img');
                img.src = compressed; img.className = 'w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm';
                previewContainer.appendChild(img);
            }
            fileNameDisplay.innerHTML = `<i class="fa-solid fa-check text-emerald-500 mr-2"></i> ${uploadedImagesData.length} Photo(s) Attached`;        
        }
    });
}

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                const MAX_SIZE = 1000; 
                if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

// --- SHIFT CONTROLS ---
if(document.getElementById('btn-clock-in')) {
    document.getElementById('btn-clock-in').addEventListener('click', async () => {    
        const coords = await getLiveLocation();
        
        const success = await sendActionLog({ 
            driver_name: localStorage.getItem('username'), 
            plate_number: "N/A", 
            department: "N/A", 
            action: "Driver Shift Clock-In", 
            task: "N/A", 
            location: "N/A", 
            delivery_status: "N/A", 
            document_attached: "None", 
            latitude: coords.lat, 
            longitude: coords.lon 
        }, "Shift Started");
        
        if (success) {
            showSuccessPopup('Clocked In!', 'Your shift has officially started. Drive safely!');
        }
    });
}

if(document.getElementById('btn-clock-out')) {
    document.getElementById('btn-clock-out').addEventListener('click', async () => {    
        const coords = await getLiveLocation();    
        
        const success = await sendActionLog({ 
            driver_name: localStorage.getItem('username'), 
            plate_number: "N/A", 
            department: "N/A", 
            action: "Driver Shift Clock-Out", 
            task: "N/A", 
            location: "N/A", 
            delivery_status: "N/A", 
            document_attached: "None", 
            latitude: coords.lat, 
            longitude: coords.lon 
        }, "Shift Ended");
        
        if (success) {
            showSuccessPopup('Clocked Out!', 'Your shift has ended. Great work today!');
        }
    });
}

// --- TRAVEL UPDATES ---
if(document.getElementById('transit-dropdown')) {
    const transitStatus = document.getElementById('transit-dropdown');
    const uiTransit = document.getElementById('ui-transit');
    const btnLogTravel = document.getElementById('btn-log-travel');

    transitStatus.addEventListener('change', (e) => {    
        uiTransit.classList.add('hidden');
        if (e.target.value === "Delayed") uiTransit.classList.remove('hidden');
        btnLogTravel.innerHTML = 'Log Travel Update';    
        btnLogTravel.classList.replace('bg-blue-800', 'bg-blue-100'); btnLogTravel.classList.replace('text-white', 'text-blue-800');
        btnLogTravel.classList.replace('dark:bg-blue-700', 'dark:bg-blue-900/30'); btnLogTravel.classList.replace('dark:text-white', 'dark:text-blue-400');
    });

    btnLogTravel.addEventListener('click', async () => {    
        if(!transitStatus.value) { alert("Please select a travel status first."); return; }        
        
        let travelStatus = transitStatus.options[transitStatus.selectedIndex].text;
        let selectedReasons = [];    
        
        document.querySelectorAll('.transit-reason:checked').forEach(cb => { 
            if (!cb.closest('div').classList.contains('hidden')) selectedReasons.push(cb.value); 
        });
        
        // NEW: Keep reasons separate instead of merging them!
        let reasonsStr = selectedReasons.length > 0 ? selectedReasons.join(", ") : "N/A";    
        
        const coords = await getLiveLocation();
        const { finalTask, finalLoc } = getFinalTaskAndLocation(); 
        
        const payload = {        
            driver_name: localStorage.getItem('username'), 
            plate_number: currentActiveVehicle, 
            action: "Travel Update",        
            department: currentActiveTaskDept, 
            task: finalTask, 
            location: finalLoc, 
            delivery_status: travelStatus, 
            incomplete_reasons: reasonsStr, 
            next_steps: "N/A",
            comments: document.getElementById('comments').value || "None",        
            document_attached: "None", 
            latitude: coords.lat, 
            longitude: coords.lon    
        };
        
        const success = await sendActionLog(payload, "Update Logged");    
        if(success) {         
            btnLogTravel.innerHTML = 'Logged Successfully';        
            btnLogTravel.classList.replace('bg-blue-100', 'bg-blue-800'); btnLogTravel.classList.replace('text-blue-800', 'text-white');
            btnLogTravel.classList.replace('dark:bg-blue-900/30', 'dark:bg-blue-700'); btnLogTravel.classList.replace('dark:text-blue-400', 'dark:text-white');
        }
    });
}

// --- HANDOVER & SIGNATURE LOGIC ---
if(document.getElementById('completion-status')) {
    const completionStatus = document.getElementById('completion-status');
    const uiSuccessful = document.getElementById('ui-successful');
    const uiFailed = document.getElementById('ui-failed');
    const btnSubmitHandover = document.getElementById('btn-submit-handover');

    completionStatus.addEventListener('change', (e) => {    
        uiSuccessful.classList.add('hidden'); uiFailed.classList.add('hidden'); btnSubmitHandover.classList.add('hidden');        
        if (e.target.value === "Successful") { uiSuccessful.classList.remove('hidden'); btnSubmitHandover.classList.remove('hidden'); } 
        else if (e.target.value === "Failed") { uiFailed.classList.remove('hidden'); btnSubmitHandover.classList.remove('hidden'); }
    });

    const canvas = document.getElementById('signature-pad');
    const ctx = canvas.getContext('2d');
    let isDrawing = false, signatureEmpty = true;
    
    function getCoordinates(e) {    
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;    
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }
    function startDrawing(e) { isDrawing = true; signatureEmpty = false; const { x, y } = getCoordinates(e); ctx.beginPath(); ctx.moveTo(x, y); if (e.touches) e.preventDefault(); }
    function draw(e) { if (!isDrawing) return; const { x, y } = getCoordinates(e); ctx.lineTo(x, y); ctx.stroke(); if (e.touches) e.preventDefault(); }
    function stopDrawing() { isDrawing = false; ctx.closePath(); }

    canvas.addEventListener('mousedown', startDrawing); canvas.addEventListener('mousemove', draw); 
    canvas.addEventListener('mouseup', stopDrawing); canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false }); canvas.addEventListener('touchend', stopDrawing);
    document.getElementById('clear-signature').addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); signatureEmpty = true; });

    btnSubmitHandover.addEventListener('click', async () => {    
        const compType = completionStatus.value;    
        let failReasonsStr = "N/A", sigData = "None", nextStepsStr = "N/A";    
        let finalStatusStr = completionStatus.options[completionStatus.selectedIndex].text;    
        let dbCompletionType = "Failed"; 
        
        if (compType === "Successful") {        
            if (uploadedImagesData.length === 0) return alert("Please attach at least one photo proof."); 
            if (signatureEmpty) return alert("Please provide recipient e-signature."); 
            sigData = canvas.toDataURL("image/png");  
            
            const remarks = document.querySelectorAll('.remark-reason:checked');            
            if (remarks.length > 0) {
                // Separated cleanly by commas
                failReasonsStr = Array.from(remarks).map(cb => cb.value).join(", ");         
                dbCompletionType = "Completed_Remarks";
            } else { dbCompletionType = "Completed"; }
        }   
        if (compType === "Failed") {        
            const checkboxes = document.querySelectorAll('.fail-reason:checked');
            if (checkboxes.length === 0) return alert("Please select a failure reason."); 
            const nextStep = document.querySelector('.fail-next-step:checked');
            if (!nextStep) return alert("Please select a Next Step.");
            
            // NEW: Keep reasons and next steps separate!
            failReasonsStr = Array.from(checkboxes).map(cb => cb.value).join(", ");
            nextStepsStr = nextStep.value;  
        }    
        
        const coords = await getLiveLocation();
        const { finalTask, finalLoc } = getFinalTaskAndLocation(); 

        const revisionOfLogId = localStorage.getItem(`revision_for_${currentActiveTaskId}`);
        let finalActionName = "Final Task Handover";
        let finalComments = document.getElementById('comments').value || "None";
        
        if (revisionOfLogId) {
            finalActionName = "Revised Task Handover";
            finalComments = `[REVISION OF LOG ID: ${revisionOfLogId}] ` + finalComments;
        }

        const payload = {        
            driver_name: localStorage.getItem('username'), 
            plate_number: currentActiveVehicle, 
            action: finalActionName,        
            department: currentActiveTaskDept, 
            task: finalTask, 
            location: finalLoc, 
            delivery_status: finalStatusStr,        
            comments: finalComments,        
            document_attached: uploadedImagesData.length > 0 ? JSON.stringify(uploadedImagesData) : "None", 
            latitude: coords.lat, 
            longitude: coords.lon,        
            completion_type: dbCompletionType, 
            incomplete_reasons: failReasonsStr, 
            next_steps: nextStepsStr, // Added explicitly to payload!
            signature: sigData,
            original_log_id: revisionOfLogId || "N/A"
        };
        
        const success = await sendActionLog(payload, "Handover Complete");    
        
        if (success) {        
            if (currentActiveTaskId) {
                const isNeedsRebook = (compType === "Failed" && document.getElementById('check-reschedule').checked);
                const shouldKeepTaskPending = (compType === "Failed" && document.getElementById('check-later').checked);
                const updateStatus = isNeedsRebook ? 'Rebook' : (shouldKeepTaskPending ? 'Pending' : 'Completed');
                
                if (updateStatus !== 'Pending') {
                    await fetch(`${API_BASE}/tasks/${currentActiveTaskId}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: updateStatus })
                    });
                    alert(updateStatus === 'Rebook' ? "Task flagged for Rebooking by Admin." : "Task completed and removed from pending list!");
                } else { alert("Task attempt logged. It remains on your pending list for later."); }
                
                if (revisionOfLogId) localStorage.removeItem(`revision_for_${currentActiveTaskId}`);
                currentActiveTaskId = null; currentActiveVehicle = "N/A"; currentActiveTaskDept = "GENERAL"; 
            }

            const transitStatus = document.getElementById('transit-dropdown');
            const btnLogTravel = document.getElementById('btn-log-travel');
            const uiTransit = document.getElementById('ui-transit');

            transitStatus.value = ""; btnLogTravel.innerHTML = 'Log Travel Update';        
            btnLogTravel.classList.replace('bg-blue-800', 'bg-blue-100'); btnLogTravel.classList.replace('text-white', 'text-blue-800');         
            btnLogTravel.classList.replace('dark:bg-blue-700', 'dark:bg-blue-900/30'); btnLogTravel.classList.replace('dark:text-white', 'dark:text-blue-400');
            
            uiTransit.classList.add('hidden'); completionStatus.value = "";         
            uiSuccessful.classList.add('hidden'); uiFailed.classList.add('hidden'); btnSubmitHandover.classList.add('hidden');                
            
            document.getElementById('task-action-controls').classList.add('hidden');
            document.getElementById('no-task-placeholder').classList.remove('hidden');
            document.getElementById('start-execution-section').classList.add('hidden');

            ctx.clearRect(0, 0, canvas.width, canvas.height); signatureEmpty = true;        
            document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(el => el.checked = false);        
            
            uploadedImagesData = []; document.getElementById('file-name').innerHTML = `<i class="fa-solid fa-images text-blue-600 dark:text-blue-400 mr-2"></i> Attach Photo(s)`;
            document.getElementById('previewContainer').innerHTML = ''; document.getElementById('comments').value = "";
            
            document.getElementById('active-task-info').classList.add('hidden');
            document.getElementById('display-task-desc').innerText = "No task selected";
            document.getElementById('display-task-dest').innerText = "N/A";
            document.getElementById('display-task-type').innerText = "N/A";
            document.getElementById('display-task-vehicle').innerText = "VEHICLE";
            
            closeExecutionModal();
            initDriverData();
        }
    });
}

// ==========================================
// --- SUCCESS POPUP NOTIFICATION ---
// ==========================================
window.showSuccessPopup = function(title, message) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-gray-900/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm opacity-0 transition-opacity duration-300';
    
    const box = document.createElement('div');
    box.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-90 transition-all duration-300 border border-emerald-100 dark:border-gray-700';
    
    box.innerHTML = `
        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <i class="fa-solid fa-check text-4xl"></i>
        </div>
        <h2 class="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">${title}</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6">${message}</p>
        <button class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md uppercase tracking-wider text-sm" onclick="this.closest('.fixed').remove()">
            Got it
        </button>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        box.classList.remove('scale-90');
    });
    
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.classList.add('opacity-0');
            box.classList.add('scale-90');
            setTimeout(() => overlay.remove(), 300);
        }
    }, 3500);
};