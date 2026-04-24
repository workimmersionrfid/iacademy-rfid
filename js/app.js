// js/app.js

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
            ? "text-[#3674FF] border-[#3674FF]" 
            : "text-[#666666] hover:text-[#3674FF] border-transparent";

        return `
            <a href="${item.href}" class="py-7 relative font-medium transition-colors border-b-2 ${activeClasses}">
                ${item.name}
            </a>
        `;
    }).join('');

    // 2. DYNAMIC PROFILE & AUTH BUTTONS
    const authButtonHTML = token 
        ? `<button onclick="globalLogout()" class="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                <i class="fa-solid fa-right-from-bracket text-lg"></i>
                <span class="hidden md:inline">Log Out</span>
           </button>`
        : `<button onclick="window.location.href='login.html'" class="flex items-center gap-2 text-sm font-bold text-[#3674FF] hover:text-[#1349CC] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                <i class="fa-solid fa-right-to-bracket text-lg"></i>
                <span class="hidden md:inline">Log In</span>
           </button>`;

    const userProfileHTML = token 
        ? `<div class="flex items-center gap-2 text-sm font-bold text-gray-700 mr-2" title="Logged in as ${username}">
                <i class="fa-regular fa-user text-xl"></i>
                <span class="hidden lg:inline">${username}</span>
                <span class="hidden lg:inline text-xs font-normal text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded ml-1">${role}</span>
           </div>`
        : `<button onclick="window.location.href='login.html'" class="text-xl hover:text-[#3674FF] transition-colors mr-2" title="Sign In">
                <i class="fa-regular fa-user"></i>
           </button>`;

    navContainer.innerHTML = `
        <header class="bg-white border-b border-[#e5e7eb] shadow-sm">
            <div class="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                
                <div class="flex items-center gap-3 py-4">
                    <i class="fa-solid fa-building text-[#3674FF] text-3xl"></i>
                    <span class="font-bold text-xl md:text-2xl tracking-tight text-[#333333] hidden sm:block">iACADEMY RFID</span>
                </div>

                <nav class="hidden md:flex items-center gap-4 lg:gap-8 text-[13px] lg:text-[15px]">
                    ${linksHTML}
                </nav>

                <div class="flex items-center gap-2 lg:gap-4 text-[#666666]">
                    ${role === 'admin' ? `
                    <button onclick="triggerGlobalSearch()" class="text-xl hover:text-[#3674FF] transition-colors" title="Search">
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