function renderNavigation(activePageId) {
    const navContainer = document.getElementById('shared-nav');
    if (!navContainer) return;

    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username') || '';

    // 1. DYNAMIC NAVIGATION BASED ON ROLE
    let navItems = [];
    
    if (role === 'admin') {
        navItems = [
            { id: 'dashboard', name: 'Control Center', href: 'dashboard.html' },
            { id: 'reports', name: 'Reports & Analytics', href: 'reports.html' },
            { id: 'fuel-log', name: 'Fuel & Mileage Logs', href: 'fuel-log.html' },
            { id: 'calculator', name: 'Trip Calculator', href: 'calculator.html' },
            { id: 'travel-map', name: 'Fleet Map & Routing', href: 'travel-map.html' },
        ];
    } else if (role === 'driver') {
        navItems = [
            { id: 'dashboard', name: 'My Tasks', href: 'driver-dashboard.html' },
            { id: 'fuel-log', name: 'My Fuel Logs', href: 'fuel-log.html' },
            { id: 'calculator', name: 'Budget Calculator', href: 'calculator.html' },
            { id: 'travel-map', name: 'My Itinerary & Map', href: 'travel-map.html' },
        ];
    }

    const linksHTML = navItems.map(item => {
        const isActive = item.id === activePageId;
        const activeClasses = isActive 
            ? "text-blue-800 border-blue-800" 
            : "text-gray-500 hover:text-blue-800 border-transparent";

        return `
            <a href="${item.href}" class="py-7 relative font-medium transition-colors border-b-2 ${activeClasses}">
                ${item.name}
            </a>
        `;
    }).join('');

    // 2. DYNAMIC PROFILE & AUTH BUTTONS
    const authButtonHTML = token 
        ? `<button onclick="globalLogout()" class="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
                <i class="fa-solid fa-right-from-bracket text-lg"></i>
                <span class="hidden md:inline">Log Out</span>
           </button>`
        : `<button onclick="window.location.href='login.html'" class="flex items-center gap-2 text-sm font-bold text-blue-800 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                <i class="fa-solid fa-right-to-bracket text-lg"></i>
                <span class="hidden md:inline">Log In</span>
           </button>`;

    const userProfileHTML = token 
        ? `<div class="flex items-center gap-2 text-sm font-bold text-gray-800 mr-2" title="Logged in as ${username}">
                <i class="fa-regular fa-circle-user text-xl text-blue-800"></i>
                <span class="hidden lg:inline">${username}</span>
                <span class="hidden lg:inline text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2 py-0.5 rounded ml-1">${role}</span>
           </div>`
        : `<button onclick="window.location.href='login.html'" class="text-xl text-gray-400 hover:text-blue-800 transition-colors mr-2" title="Sign In">
                <i class="fa-regular fa-circle-user"></i>
           </button>`;

    navContainer.innerHTML = `
        <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div class="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                
                <div class="flex items-center gap-3 py-4">
                    <i class="fa-solid fa-building-shield text-blue-800 text-3xl"></i>
                    <span class="font-black text-xl md:text-2xl tracking-tight text-gray-800 hidden sm:block">iACADEMY <span class="text-blue-800 font-light">RFID</span></span>
                </div>

                <nav class="hidden md:flex items-center gap-4 lg:gap-8 text-[13px] lg:text-[15px]">
                    ${linksHTML}
                </nav>

                <div class="flex items-center gap-2 lg:gap-4">
                    ${role === 'admin' ? `
                    <button onclick="triggerGlobalSearch()" class="text-xl text-gray-400 hover:text-blue-800 transition-colors mr-2" title="Search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>` : ''}
                    
                    ${userProfileHTML}
                    ${authButtonHTML}
                </div>
            </div>
        </header>
    `;
}

// --- GLOBAL FUNCTIONS ---
window.globalLogout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
};

window.triggerGlobalSearch = function() {
    const query = prompt("Search for a Driver, Vehicle, or Task:");
    if (query) {
        alert("Search initiated for: " + query + "\n\n(Table filtering logic can be attached here)");
    }
};