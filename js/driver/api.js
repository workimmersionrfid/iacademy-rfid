// ==========================================
// --- DRIVER API & DATA LOGIC ---
// ==========================================
const API_BASE = 'https://iacademy-rfid.onrender.com/api';

let allVehicles = [];
let allTasks = [];
let vehicleDeptMap = {}; 

async function initDriverData() {
    try {
        const [tasksRes, vehiclesRes, driversRes] = await Promise.all([
            fetch(`${API_BASE}/tasks`),
            fetch(`${API_BASE}/vehicles`),
            fetch(`${API_BASE}/drivers`)
        ]);
        
        allTasks = await tasksRes.json();
        allVehicles = await vehiclesRes.json();
        const allDrivers = await driversRes.json();

        const myName = localStorage.getItem('username');
        const myProfile = allDrivers.find(d => d.username === myName);
        
        if (myProfile) {
            const workDays = myProfile.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            document.getElementById('driverSchedule').innerHTML = allDays.map(day => {
                const isWorkDay = workDays.includes(day);
                const shortDay = day.substring(0, 3).toUpperCase();
                
                if (isWorkDay) {
                    return `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold px-2.5 py-1 rounded shadow-sm tracking-widest">${shortDay}</span>`;
                } else {
                    return `<span class="bg-slate-800/50 text-slate-500 border border-slate-700/50 text-[10px] font-medium px-2.5 py-1 rounded tracking-widest opacity-60">${shortDay}</span>`;
                }
            }).join('');
        }

        if(document.getElementById('fDate')) document.getElementById('fDate').valueAsDate = new Date();
        if(document.getElementById('tollDate')) document.getElementById('tollDate').valueAsDate = new Date();
        
        if (typeof renderMyTasks === 'function') renderMyTasks();
        if (typeof updateModalVehicleDropdown === 'function') {
            updateModalVehicleDropdown('fuel');
            updateModalVehicleDropdown('toll');
        }

    } catch (err) { console.error("Error loading data:", err); }
}

function getLiveLocation() {    
    return new Promise((resolve) => {        
        if ("geolocation" in navigator) {            
            navigator.geolocation.getCurrentPosition(                
                (pos) => resolve({ lat: pos.coords.latitude.toString(), lon: pos.coords.longitude.toString() }),                
                (err) => resolve({ lat: "N/A", lon: "N/A" }), 
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }            
            );        
        } else {
            resolve({ lat: "N/A", lon: "N/A" });
        }
    });
}

async function sendActionLog(payload, successMsg) {    
    const statusText = document.getElementById('status-text');
    if(statusText) {
        statusText.textContent = "STATUS: SAVING...";
        statusText.classList.replace('text-blue-600', 'text-gray-500');
        statusText.classList.replace('dark:text-blue-400', 'dark:text-gray-400');
    }
    
    try {        
        const response = await fetch(`${API_BASE}/action-logs`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
        });
        if (response.ok) { 
            if(statusText) {
                statusText.textContent = `STATUS: ${successMsg.toUpperCase()}`; 
                statusText.classList.replace('text-gray-500', 'text-blue-600');
                statusText.classList.replace('dark:text-gray-400', 'dark:text-blue-400');
            }
            return true; 
        } else throw new Error("Server Error");
    } catch (error) {         
        if(statusText) {
            statusText.textContent = "STATUS: ERROR";
            statusText.classList.replace('text-gray-500', 'text-red-500');         
            statusText.classList.replace('dark:text-gray-400', 'dark:text-red-400');    
        }     
        return false;    
    }
}