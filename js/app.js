// js/app.js

function renderNavigation(activePageId) {
    const navContainer = document.getElementById('shared-nav');
    if (!navContainer) return;

    const navItems = [
        { id: 'dashboard', name: 'Dashboard', href: 'dashboard.html' },
        { id: 'fuel-log', name: 'Mileage and Fuel Log', href: 'fuel-log.html' },
        { id: 'calculator', name: 'Calculator', href: 'calculator.html' },
        { id: 'travel-map', name: 'Travel Map', href: 'travel-map.html' },
    ];

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

    // --- NEW: Dynamic Icon Logic ---
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username') || '';

    // If logged in, show Logout. If logged out, show Login.
    const authButtonHTML = token 
        ? `<button onclick="globalLogout()" class="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                <i class="fa-solid fa-right-from-bracket text-lg"></i>
                <span>Log Out</span>
           </button>`
        : `<button onclick="window.location.href='login.html'" class="flex items-center gap-2 text-sm font-bold text-[#3674FF] hover:text-[#1349CC] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                <i class="fa-solid fa-right-to-bracket text-lg"></i>
                <span>Log In</span>
           </button>`;

    const userProfileHTML = token 
        ? `<div class="flex items-center gap-2 text-sm font-bold text-gray-700 mr-2" title="Logged in as ${username}">
                <i class="fa-regular fa-user text-xl"></i>
                <span class="hidden md:inline">${username}</span>
           </div>`
        : `<button onclick="window.location.href='login.html'" class="text-xl hover:text-[#3674FF] transition-colors mr-2" title="Sign In">
                <i class="fa-regular fa-user"></i>
           </button>`;

    navContainer.innerHTML = `
        <header class="bg-white border-b border-[#e5e7eb] shadow-sm">
            <div class="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                
                <div class="flex items-center gap-3 py-4">
                    <i class="fa-solid fa-building text-[#3674FF] text-3xl"></i>
                    <span class="font-bold text-2xl tracking-tight text-[#333333]">iACADEMY RFID</span>
                </div>

                <nav class="hidden lg:flex items-center gap-8 text-[15px]">
                    ${linksHTML}
                </nav>

                <div class="flex items-center gap-4 text-[#666666]">
                    <button onclick="triggerGlobalSearch()" class="text-xl hover:text-[#3674FF] transition-colors" title="Search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                    
                    ${userProfileHTML}

                    ${authButtonHTML}
                </div>
            </div>
        </header>
    `;
}

// --- GLOBAL FUNCTIONS ---

// Replaces the old logout function in individual files
window.globalLogout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
};

// Search Placeholder (We can connect this to a real table filter later!)
window.triggerGlobalSearch = function() {
    const query = prompt("Search for a Driver, Vehicle, or Task:");
    if (query) {
        alert("Search initiated for: " + query + "\n\n(We will connect this to filter your dashboard tables in a later step!)");
    }
};

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(!modal) return;
    const box = modal.children[0];
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(!modal) return;
    const box = modal.children[0];
    box.classList.remove('scale-100', 'opacity-100');
    box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 200); 
}