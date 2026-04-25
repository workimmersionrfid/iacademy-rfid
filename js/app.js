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

    // DESKTOP LINKS
    const desktopLinksHTML = navItems.map(item => {
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

    // MOBILE LINKS
    const mobileLinksHTML = navItems.map(item => {
        const isActive = item.id === activePageId;
        const activeClasses = isActive 
            ? "text-blue-800 font-bold bg-blue-50 border-l-4 border-blue-800" 
            : "text-gray-600 font-medium hover:bg-gray-50 border-l-4 border-transparent";

        return `
            <a href="${item.href}" class="block px-4 py-3 rounded-r-lg transition-colors ${activeClasses}">
                ${item.name}
            </a>
        `;
    }).join('');

    // 2. DYNAMIC PROFILE & AUTH BUTTONS
    const authButtonHTML = token 
        ? `<button onclick="globalLogout()" class="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors shadow-sm">
                <i class="fa-solid fa-right-from-bracket text-lg"></i>
                <span class="hidden md:inline">Log Out</span>
           </button>`
        : `<button onclick="window.location.href='login.html'" class="flex items-center gap-2 text-sm font-bold text-blue-800 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors shadow-sm">
                <i class="fa-solid fa-right-to-bracket text-lg"></i>
                <span class="hidden md:inline">Log In</span>
           </button>`;

    const userProfileHTML = token 
        ? `<div class="flex items-center gap-2 text-sm font-bold text-gray-800 mr-2" title="Logged in as ${username}">
                <i class="fa-regular fa-circle-user text-2xl text-blue-800"></i>
                <div class="hidden lg:flex flex-col leading-tight">
                    <span>${username}</span>
                    <span class="text-[9px] font-bold text-blue-600 uppercase tracking-widest">${role}</span>
                </div>
           </div>`
        : `<button onclick="window.location.href='login.html'" class="text-2xl text-gray-400 hover:text-blue-800 transition-colors mr-2" title="Sign In">
                <i class="fa-regular fa-circle-user"></i>
           </button>`;

    // 3. RENDER FULL NAVIGATION
    navContainer.innerHTML = `
        <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div class="max-w-[1500px] mx-auto px-6 flex items-center justify-between gap-8 h-20 lg:h-auto">
                
                <div class="flex items-center gap-3 shrink-0">
                    <div class="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center text-white shadow-md">
                        <i class="fa-solid fa-building-shield text-xl"></i>
                    </div>
                    <span class="font-black text-xl md:text-2xl tracking-tight text-gray-800 hidden sm:block">iACADEMY <span class="text-blue-800 font-light">RFID</span></span>
                </div>

                <nav class="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-8 text-[13px] xl:text-[14px] whitespace-nowrap">
                    ${desktopLinksHTML}
                </nav>

                <div class="hidden lg:flex items-center gap-3 shrink-0 py-4">
                    ${role === 'admin' ? `
                    <button onclick="triggerGlobalSearch()" class="text-xl text-gray-400 hover:text-blue-800 transition-colors bg-gray-50 p-2 rounded-lg" title="Search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                    <div class="w-px h-6 bg-gray-200 mx-1"></div>
                    ` : ''}
                    
                    ${userProfileHTML}
                    ${authButtonHTML}
                </div>

                <div class="flex lg:hidden items-center gap-3 shrink-0">
                    ${userProfileHTML}
                    <button id="mobile-menu-btn" class="text-blue-900 hover:text-blue-600 focus:outline-none p-2.5 bg-blue-50 rounded-xl border border-blue-100 transition-colors">
                        <i class="fa-solid fa-bars text-xl"></i>
                    </button>
                </div>
            </div>

            <div id="mobile-menu" class="hidden lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-2xl">
                <div class="px-4 py-4 flex flex-col space-y-1">
                    ${mobileLinksHTML}
                    
                    <hr class="border-gray-100 my-3">
                    
                    ${token ? `
                    <button onclick="globalLogout()" class="mt-2 w-full text-left flex items-center justify-between px-4 py-3 bg-red-50 text-red-600 font-bold rounded-lg border border-red-100">
                        <span>Log Out</span>
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                    ` : `
                    <button onclick="window.location.href='login.html'" class="mt-2 w-full text-left flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-800 font-bold rounded-lg border border-blue-100">
                        <span>Log In</span>
                        <i class="fa-solid fa-right-to-bracket"></i>
                    </button>
                    `}
                </div>
            </div>
        </header>
    `;

    // 4. ATTACH MOBILE MENU TOGGLE LOGIC
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            const icon = mobileBtn.querySelector('i');
            
            // Swap icon between Hamburger and X
            if (mobileMenu.classList.contains('hidden')) {
                icon.classList.replace('fa-xmark', 'fa-bars');
                mobileBtn.classList.replace('bg-blue-800', 'bg-blue-50');
                mobileBtn.classList.replace('text-white', 'text-blue-900');
            } else {
                icon.classList.replace('fa-bars', 'fa-xmark');
                mobileBtn.classList.replace('bg-blue-50', 'bg-blue-800');
                mobileBtn.classList.replace('text-blue-900', 'text-white');
            }
        });
    }
}

// --- GLOBAL FUNCTIONS ---
window.globalLogout = function() {
    if(confirm("Are you sure you want to log out?")) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
};

window.triggerGlobalSearch = function() {
    const query = prompt("Search for a Driver, Vehicle, or Task:");
    if (query) {
        alert("Search initiated for: " + query + "\n\n(Table filtering logic can be attached here)");
    }
};