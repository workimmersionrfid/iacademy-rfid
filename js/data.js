// js/data.js

// 1. INITIALIZE DATABASE
// This checks if data exists. If not, it creates standard starting data.
function initializeStore() {
    if (!localStorage.getItem('rfid_vehicles')) {
        const defaultVehicles = [
            { id: 'v_vios', name: 'Toyota Vios (2026)', efficiency: 14, fuelType: 'Ron95', isPreset: true, isActive: true },
            { id: 'v_beat', name: 'Honda Beat', efficiency: 50, fuelType: 'Ron95', isPreset: true, isActive: false }
        ];
        localStorage.setItem('rfid_vehicles', JSON.stringify(defaultVehicles));
    }
    
    if (!localStorage.getItem('rfid_logs')) {
        // Start with an empty array for fuel logs
        localStorage.setItem('rfid_logs', JSON.stringify([]));
    }
}

// Run initialization immediately
initializeStore();


// 2. VEHICLE FUNCTIONS
function getVehicles() {
    return JSON.parse(localStorage.getItem('rfid_vehicles')) || [];
}

function getActiveVehicle() {
    const vehicles = getVehicles();
    return vehicles.find(v => v.isActive) || vehicles[0];
}


// 3. FUEL LOG FUNCTIONS
function getLogs() {
    return JSON.parse(localStorage.getItem('rfid_logs')) || [];
}

function addLog(logData) {
    const logs = getLogs();
    
    // Attach a unique ID based on the current timestamp
    const newLog = { 
        id: Date.now().toString(), 
        ...logData 
    };
    
    // Add the new log to the VERY TOP of the list (newest first)
    logs.unshift(newLog);
    
    // Save it back to the browser's memory
    localStorage.setItem('rfid_logs', JSON.stringify(logs));
    
    return newLog;
}