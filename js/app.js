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
            ? "text-blue-800 dark:text-blue-400 border-blue-800 dark:border-blue-400" 
            : "text-gray-500 dark:text-gray-400 hover:text-blue-800 dark:hover:text-white border-transparent";

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
            ? "text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-gray-800 border-l-4 border-blue-800 dark:border-blue-400" 
            : "text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent";

        return `
            <a href="${item.href}" class="block px-4 py-3 rounded-r-lg transition-colors ${activeClasses}">
                ${item.name}
            </a>
        `;
    }).join('');

    // 2. DYNAMIC PROFILE & AUTH BUTTONS
    const authButtonHTML = token 
        ? `<button onclick="globalLogout()" class="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg transition-colors shadow-sm">
                <i class="fa-solid fa-right-from-bracket text-lg"></i>
                <span class="hidden md:inline">Log Out</span>
           </button>`
        : `<button onclick="window.location.href='login.html'" class="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg transition-colors shadow-sm">
                <i class="fa-solid fa-right-to-bracket text-lg"></i>
                <span class="hidden md:inline">Log In</span>
           </button>`;

    const userProfileHTML = token 
        ? `<div class="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200 mr-2" title="Logged in as ${username}">
                <i class="fa-regular fa-circle-user text-2xl text-blue-800 dark:text-blue-400"></i>
                <div class="hidden lg:flex flex-col leading-tight">
                    <span>${username}</span>
                    <span class="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">${role}</span>
                </div>
           </div>`
        : `<button onclick="window.location.href='login.html'" class="text-2xl text-gray-400 dark:text-gray-500 hover:text-blue-800 dark:hover:text-blue-400 transition-colors mr-2" title="Sign In">
                <i class="fa-regular fa-circle-user"></i>
           </button>`;

    // THEME TOGGLE BUTTON
    const themeToggleHTML = `
        <button onclick="toggleTheme()" class="text-xl text-gray-400 dark:text-gray-300 hover:text-blue-800 dark:hover:text-yellow-400 transition-colors p-2 rounded-lg" title="Toggle Dark Mode">
            <i class="fa-solid fa-moon dark:hidden"></i>
            <i class="fa-solid fa-sun hidden dark:inline text-yellow-400"></i>
        </button>
        <div class="hidden lg:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
    `;

    // 3. RENDER FULL NAVIGATION
    navContainer.innerHTML = `
        <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
            <div class="max-w-[1500px] mx-auto px-6 flex items-center justify-between gap-8 h-20 lg:h-auto">
                
                <div class="flex items-center gap-3 shrink-0 cursor-pointer" onclick="window.location.href='${role === 'admin' ? 'dashboard.html' : 'driver-dashboard.html'}'">
                    <img src="logo.png" alt="iACADEMY RFID Logo" class="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-md transition-transform hover:scale-105">
                    <span class="font-black text-xl md:text-2xl tracking-tight text-gray-800 dark:text-white hidden sm:block ml-1">iACADEMY <span class="text-blue-800 dark:text-blue-400 font-light">RFID</span></span>
                </div>

                <nav class="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-8 text-[13px] xl:text-[14px] whitespace-nowrap">
                    ${desktopLinksHTML}
                </nav>

                <div class="hidden lg:flex items-center gap-3 shrink-0 py-4">
                    ${role === 'admin' ? `
                    <button onclick="triggerGlobalSearch()" class="text-xl text-gray-400 dark:text-gray-300 hover:text-blue-800 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-800 p-2 rounded-lg" title="Search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                    <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    ` : ''}
                    
                    ${themeToggleHTML}
                    ${userProfileHTML}
                    ${authButtonHTML}
                </div>

                <div class="flex lg:hidden items-center gap-3 shrink-0">
                    ${themeToggleHTML}
                    ${userProfileHTML}
                    <button id="mobile-menu-btn" class="text-blue-900 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none p-2.5 bg-blue-50 dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-gray-700 transition-colors">
                        <i class="fa-solid fa-bars text-xl"></i>
                    </button>
                </div>
            </div>

            <div id="mobile-menu" class="hidden lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute w-full shadow-2xl transition-colors duration-300">
                <div class="px-4 py-4 flex flex-col space-y-1">
                    ${mobileLinksHTML}
                    
                    <hr class="border-gray-100 dark:border-gray-800 my-3">
                    
                    ${token ? `
                    <button onclick="globalLogout()" class="mt-2 w-full text-left flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-lg border border-red-100 dark:border-red-900/50 transition-colors">
                        <span>Log Out</span>
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                    ` : `
                    <button onclick="window.location.href='login.html'" class="mt-2 w-full text-left flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-bold rounded-lg border border-blue-100 dark:border-blue-900/50 transition-colors">
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
            
            if (mobileMenu.classList.contains('hidden')) {
                icon.classList.replace('fa-xmark', 'fa-bars');
            } else {
                icon.classList.replace('fa-bars', 'fa-xmark');
            }
        });
    }
}

// --- GLOBAL FUNCTIONS ---

// NEW: Theme Toggle Logic!
window.toggleTheme = function() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
};

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