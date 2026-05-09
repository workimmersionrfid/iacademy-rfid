// ==========================================
// --- SHARED AUTH & THEME LOGIC ---
// ==========================================

function checkAuthAndRole(requiredRole) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== requiredRole) {
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