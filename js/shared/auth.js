// ==========================================
// --- SHARED AUTH & THEME LOGIC ---
// ==========================================

function checkAuthAndRole(allowedRoles) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token || !role) {
        window.location.href = 'login.html';
        return false;
    }

    // Convert to an array if it's a single string (e.g., 'driver' becomes ['driver'])
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(role)) {
        alert("Unauthorized Access. You do not have permission to view this page.");
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function loadTheme() {
    tailwind.config = { 
        darkMode: 'class',
        theme: { 
            extend: { 
                fontFamily: { sans: ['Inter', 'sans-serif'] },
                colors: { brand: { blue: '#1e3a8a', bg: '#f8fafc' } } 
            } 
        } 
    };

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Execute Theme loader immediately
loadTheme();