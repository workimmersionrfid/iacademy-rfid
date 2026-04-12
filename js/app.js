// js/app.js

function renderNavigation(activePageId) {
    const navContainer = document.getElementById('shared-nav');
    if (!navContainer) return;

    const navItems = [
        { id: 'dashboard', name: 'Dashboard', href: 'dashboard.html' },
        { id: 'fuel-log', name: 'Mileage and Fuel Log', href: 'fuel-log.html' },
        { id: 'calculator', name: 'Calculator', href: 'calculator.html' },
        { id: 'travel-map', name: 'Travel Map', href: 'travel-map.html' },
        { id: 'insights', name: 'Insights', href: 'insights.html' }
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

                <div class="flex items-center gap-6 text-[#666666] text-xl">
                    <button class="hover:text-[#3674FF] transition-colors"><i class="fa-solid fa-magnifying-glass"></i></button>
                    <button class="hover:text-[#3674FF] transition-colors"><i class="fa-regular fa-user"></i></button>
                </div>
            </div>
        </header>
    `;
}

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