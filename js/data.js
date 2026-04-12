// js/data.js
// This file now acts as your central database bridge!

const API_BASE_URL = 'http://localhost:5000/api';

// 1. VEHICLE FUNCTIONS
async function getVehicles() {
    try {
        const res = await fetch(`${API_BASE_URL}/vehicles`);
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        return await res.json();
    } catch (err) {
        console.error("Database Error:", err);
        return [];
    }
}

// 2. FUEL LOG FUNCTIONS
async function getLogs() {
    try {
        const res = await fetch(`${API_BASE_URL}/logs`);
        if (!res.ok) throw new Error("Failed to fetch logs");
        return await res.json();
    } catch (err) {
        console.error("Database Error:", err);
        return [];
    }
}

async function addLog(logData) {
    try {
        const res = await fetch(`${API_BASE_URL}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        });
        if (!res.ok) throw new Error("Failed to save log");
        return await res.json();
    } catch (err) {
        console.error("Database Error:", err);
        throw err;
    }
}