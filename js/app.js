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
        <button onclick="toggleTheme()" class="text-xl text-gray-400 dark:text-gray-300 hover:text-blue-800 dark:hover:text-yellow-400 transition-colors p-2 rounded-lg mr-2" title="Toggle Dark Mode">
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

// ==========================================
// --- GLOBAL CHAT WIDGET SYSTEM ---
// ==========================================
const API_BASE_CHAT = 'https://iacademy-rfid.onrender.com/api';

document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (token && role) {
        // Clean up any rogue widgets
        const oldAdminWidget = document.getElementById('adminChatWidget');
        if (oldAdminWidget) oldAdminWidget.remove();
        
        const oldDriverWidget = document.getElementById('driverChatWidget');
        if (oldDriverWidget) oldDriverWidget.remove();

        injectGlobalChat(role);
    }
});

function injectGlobalChat(role) {
    if (document.getElementById('globalChatWrapper')) return;

    const chatWrapper = document.createElement('div');
    chatWrapper.id = 'globalChatWrapper';
    document.body.appendChild(chatWrapper);

    if (role === 'admin') {
        chatWrapper.innerHTML = `
            <div id="adminChatWidget" class="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
                <div id="adminChatBox" class="hidden w-80 sm:w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden flex-col transition-colors duration-300 h-[500px]">
                    <div class="bg-blue-800 dark:bg-blue-900 p-4 flex justify-between items-center text-white transition-colors">
                        <div class="flex items-center gap-2">
                            <button id="btnBackChat" onclick="window.showChatList()" class="hidden hover:text-blue-200 transition-colors"><i class="fa-solid fa-arrow-left"></i></button>
                            <h3 id="chatHeaderTitle" class="font-bold flex items-center gap-2"><i class="fa-solid fa-inbox"></i> Driver Messages</h3>
                        </div>
                        <div class="flex items-center gap-3">
                            <button id="btnClearChat" onclick="window.clearAdminChat()" class="hidden text-red-300 hover:text-red-400 transition-colors" title="Clear Conversation"><i class="fa-solid fa-trash-can"></i></button>
                            <button onclick="window.toggleAdminChat()" class="text-blue-200 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                    </div>
                    <div id="chatContactList" class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 custom-scrollbar p-2 space-y-1 transition-colors">
                        <div class="p-4 text-center text-gray-400 text-sm"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>
                    </div>
                    <div id="activeChatView" class="hidden flex-1 flex flex-col min-h-0">
                        <div id="adminChatMessages" class="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex flex-col gap-3 custom-scrollbar text-sm transition-colors"></div>
                        <form id="adminChatForm" class="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 transition-colors">
                            <input type="text" id="adminChatInput" placeholder="Type a message..." autocomplete="off" required class="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm transition-colors">
                            <button type="submit" class="bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-colors shrink-0"><i class="fa-solid fa-paper-plane"></i></button>
                        </form>
                    </div>
                </div>
                <button onclick="window.toggleAdminChat()" class="w-14 h-14 bg-blue-800 dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl relative transition-transform hover:scale-105 focus:outline-none">
                    <i class="fa-solid fa-comments"></i>
                    <span id="adminChatBadge" class="hidden absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
                </button>
            </div>
        `;
        initAdminChatLogic();

    } else if (role === 'driver') {
        chatWrapper.innerHTML = `
            <div id="driverChatWidget" class="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
                <div id="chatBox" class="hidden w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden flex-col transition-colors duration-300">
                    <div class="bg-blue-800 dark:bg-blue-900 p-4 flex justify-between items-center text-white transition-colors">
                        <h3 class="font-bold flex items-center gap-2"><i class="fa-solid fa-headset"></i> Control Center</h3>
                        <div class="flex items-center gap-3">
                            <button onclick="window.clearDriverChat()" class="text-red-300 hover:text-red-400 transition-colors" title="Clear Conversation"><i class="fa-solid fa-trash-can"></i></button>
                            <button onclick="window.toggleChat()" class="text-blue-200 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                    </div>
                    <div id="chatMessages" class="p-4 h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex flex-col gap-3 custom-scrollbar text-sm transition-colors">
                        <div class="text-center text-xs text-gray-400 dark:text-gray-500 my-2">Send a message to the Admin. Request early access for future tasks here.</div>
                    </div>
                    <form id="chatForm" class="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 transition-colors">
                        <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off" required class="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm transition-colors">
                        <button type="submit" class="bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-colors shrink-0"><i class="fa-solid fa-paper-plane"></i></button>
                    </form>
                </div>
                <button onclick="window.toggleChat()" class="w-14 h-14 bg-blue-800 dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl relative transition-transform hover:scale-105 focus:outline-none">
                    <i class="fa-solid fa-comments"></i>
                    <span id="chatBadge" class="hidden absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
                </button>
            </div>
        `;
        initDriverChatLogic();
    }
}

// ----------------------------------------------------
// ADMIN CHAT LOGIC
// ----------------------------------------------------
function initAdminChatLogic() {
    let adminChatOpen = localStorage.getItem('adminChatOpen') === 'true';
    let currentChatDriver = localStorage.getItem('currentChatDriver') || null;
    let adminChatInterval;
    let allChatMessages = [];
    let allDriversCache = [];

    window.toggleAdminChat = function() {
        adminChatOpen = !adminChatOpen;
        localStorage.setItem('adminChatOpen', adminChatOpen); 
        
        const box = document.getElementById('adminChatBox');
        const badge = document.getElementById('adminChatBadge');
        
        if (adminChatOpen) {
            box.classList.remove('hidden');
            box.classList.add('flex');
            badge.classList.add('hidden');
            if (currentChatDriver) window.openDriverChat(currentChatDriver);
            else window.showChatList();
            
            loadAdminMessages();
            adminChatInterval = setInterval(loadAdminMessages, 5000); 
        } else {
            box.classList.add('hidden');
            box.classList.remove('flex');
            clearInterval(adminChatInterval);
        }
    };

    window.showChatList = function() {
        currentChatDriver = null;
        localStorage.removeItem('currentChatDriver'); 
        
        document.getElementById('activeChatView').classList.add('hidden');
        document.getElementById('chatContactList').classList.remove('hidden');
        document.getElementById('btnBackChat').classList.add('hidden');
        document.getElementById('btnClearChat').classList.add('hidden'); 
        document.getElementById('chatHeaderTitle').innerHTML = `<i class="fa-solid fa-inbox"></i> Driver Messages`;
        renderContactList();
    };

    window.openDriverChat = function(driverUsername) {
        currentChatDriver = driverUsername;
        localStorage.setItem('currentChatDriver', driverUsername); 
        
        document.getElementById('chatContactList').classList.add('hidden');
        document.getElementById('activeChatView').classList.remove('hidden');
        document.getElementById('activeChatView').classList.add('flex');
        document.getElementById('btnBackChat').classList.remove('hidden');
        document.getElementById('btnClearChat').classList.remove('hidden'); 
        document.getElementById('chatHeaderTitle').innerHTML = `<i class="fa-solid fa-user"></i> ${driverUsername}`;
        
        fetch(`${API_BASE_CHAT}/messages/mark-read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: driverUsername, role: 'admin' })
        }).catch(err => console.log("Mark read failed silently"));
        
        renderActiveChat();
    };

    window.clearAdminChat = async function() {
        if (!currentChatDriver) return;
        if (confirm(`Are you sure you want to clear your conversation with ${currentChatDriver}?`)) {
            try {
                const res = await fetch(`${API_BASE_CHAT}/messages/clear`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ driverUsername: currentChatDriver, clearedBy: 'Admin' })
                });
                if (res.ok) {
                    allChatMessages = allChatMessages.filter(m => !(m.sender === currentChatDriver || m.receiver === currentChatDriver));
                    renderActiveChat();
                }
            } catch (err) {}
        }
    };

    async function loadAdminMessages() {
        try {
            if(allDriversCache.length === 0) {
                const driverRes = await fetch(`${API_BASE_CHAT}/drivers`);
                if(driverRes.ok) {
                    allDriversCache = await driverRes.json();
                } else {
                    throw new Error("Could not fetch drivers list");
                }
            }

            const res = await fetch(`${API_BASE_CHAT}/messages/Admin`);
            if (!res.ok) throw new Error("Could not fetch chat messages");
            
            allChatMessages = await res.json();
            
            if (!adminChatOpen) {
                const hasUnread = allChatMessages.some(m => m.receiver === 'Admin' && !m.isRead);
                if (hasUnread) document.getElementById('adminChatBadge').classList.remove('hidden');
                return;
            }

            if (currentChatDriver) renderActiveChat();
            else renderContactList();
            
        } catch (err) { 
            console.error("Chat Error:", err); 
            if (adminChatOpen && !currentChatDriver) {
                const listContainer = document.getElementById('chatContactList');
                if (listContainer) {
                    listContainer.innerHTML = '<div class="p-4 text-center text-red-500 text-xs font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Waiting for backend server...</div>';
                }
            }
        }
    }

    function renderContactList() {
        const container = document.getElementById('chatContactList');
        if (!container) return;

        const driversMap = {};
        allDriversCache.forEach(d => { driversMap[d.username] = { latest: null, unread: 0, messages: [] }; });

        allChatMessages.forEach(m => {
            const driverName = m.sender === 'Admin' ? m.receiver : m.sender;
            if (!driversMap[driverName]) driversMap[driverName] = { latest: null, unread: 0, messages: [] };
            driversMap[driverName].messages.push(m);
            driversMap[driverName].latest = m;
            if (m.receiver === 'Admin' && !m.isRead) driversMap[driverName].unread++;
        });

        const sortedDrivers = Object.keys(driversMap).sort((a, b) => {
            const timeA = driversMap[a].latest ? new Date(driversMap[a].latest.timestamp).getTime() : 0;
            const timeB = driversMap[b].latest ? new Date(driversMap[b].latest.timestamp).getTime() : 0;
            return timeB - timeA;
        });

        if (sortedDrivers.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-500 text-xs">No drivers registered yet.</div>';
            return;
        }

        container.innerHTML = sortedDrivers.map(driver => {
            const data = driversMap[driver];
            const lastMsg = data.latest ? data.latest.text : "No messages yet";
            const timeStr = data.latest ? new Date(data.latest.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
            const unreadBadge = data.unread > 0 ? `<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">${data.unread}</span>` : '';
            return `
            <div onclick="window.openDriverChat('${driver}')" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors shadow-sm">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0"><i class="fa-solid fa-user"></i></div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">${driver}</h4>
                        <span class="text-[9px] text-gray-400 shrink-0 ml-2">${timeStr}</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${lastMsg}</p>
                </div>
                ${unreadBadge}
            </div>`;
        }).join('');
    }

    function renderActiveChat() {
        if (!currentChatDriver) return;
        const container = document.getElementById('adminChatMessages');
        if (!container) return;

        const driverMessages = allChatMessages.filter(m => m.sender === currentChatDriver || m.receiver === currentChatDriver);
        const currentMsgCount = container.querySelectorAll('.msg-bubble').length;
        if (driverMessages.length === currentMsgCount && currentMsgCount !== 0) return;

        let html = driverMessages.length === 0 ? '<div class="text-center text-xs text-gray-400 my-2">No messages yet. Start the conversation!</div>' : '';
        html += driverMessages.map(m => {
            const isAdmin = m.sender === 'Admin';
            const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            if (isAdmin) {
                return `<div class="msg-bubble self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                            <p class="whitespace-pre-wrap leading-snug">${m.text}</p>
                            <span class="text-[9px] text-blue-200 block text-right mt-1">${time}</span>
                        </div>`;
            } else {
                return `<div class="msg-bubble self-start bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                            <p class="whitespace-pre-wrap leading-snug">${m.text}</p>
                            <span class="text-[9px] text-gray-500 dark:text-gray-400 block mt-1">${time}</span>
                        </div>`;
            }
        }).join('');
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    document.getElementById('adminChatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentChatDriver) return;
        const input = document.getElementById('adminChatInput');
        const text = input.value.trim();
        if (!text) return;
        input.value = ''; 
        
        const msg = { sender: 'Admin', receiver: currentChatDriver, text: text };
        const container = document.getElementById('adminChatMessages');
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        container.innerHTML += `<div class="msg-bubble self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm opacity-70">
                                    <p class="whitespace-pre-wrap leading-snug">${text}</p>
                                    <span class="text-[9px] text-blue-200 block text-right mt-1">${time}</span>
                                </div>`;
        container.scrollTop = container.scrollHeight;

        try {
            await fetch(`${API_BASE_CHAT}/messages`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg)
            });
            loadAdminMessages(); 
        } catch(err) { alert('Failed to send message'); }
    });

    // --- CHECK FOR OPEN CHAT ON LOAD ---
    if (adminChatOpen) {
        document.getElementById('adminChatBox').classList.remove('hidden');
        document.getElementById('adminChatBox').classList.add('flex');
        document.getElementById('adminChatBadge').classList.add('hidden');
        if (currentChatDriver) window.openDriverChat(currentChatDriver);
        else window.showChatList();
        
        loadAdminMessages();
        adminChatInterval = setInterval(loadAdminMessages, 5000);
    } else {
        setTimeout(loadAdminMessages, 2000); 
        setInterval(() => { if(!adminChatOpen) loadAdminMessages(); }, 10000);
    }
}

// ----------------------------------------------------
// DRIVER CHAT LOGIC
// ----------------------------------------------------
function initDriverChatLogic() {
    let driverChatOpen = localStorage.getItem('driverChatOpen') === 'true';
    let chatInterval;

    window.toggleChat = function() {
        driverChatOpen = !driverChatOpen;
        localStorage.setItem('driverChatOpen', driverChatOpen); 
        
        const box = document.getElementById('chatBox');
        const badge = document.getElementById('chatBadge');
        
        if (driverChatOpen) {
            box.classList.remove('hidden');
            box.classList.add('flex');
            badge.classList.add('hidden');
            loadMessages();
            chatInterval = setInterval(loadMessages, 5000); 
            fetch(`${API_BASE_CHAT}/messages/mark-read`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: localStorage.getItem('username'), role: 'driver' })
            }).catch(e => console.log("Mark read failed silently"));
        } else {
            box.classList.add('hidden');
            box.classList.remove('flex');
            clearInterval(chatInterval);
        }
    };

    window.clearDriverChat = async function() {
        const myName = localStorage.getItem('username');
        if (!myName) return;
        if (confirm("Are you sure you want to clear this conversation?")) {
            try {
                const res = await fetch(`${API_BASE_CHAT}/messages/clear`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ driverUsername: myName, clearedBy: myName })
                });
                if (res.ok) {
                    const container = document.getElementById('chatMessages');
                    if(container) container.innerHTML = '<div class="text-center text-xs text-gray-400 dark:text-gray-500 my-2">Send a message to the Admin. Request early access for future tasks here.</div>';
                }
            } catch (err) {}
        }
    };

    async function loadMessages() {
        const myName = localStorage.getItem('username');
        if (!myName) return;
        
        try {
            const res = await fetch(`${API_BASE_CHAT}/messages/${myName}`);
            if (!res.ok) throw new Error("Could not fetch messages");
            const messages = await res.json();
            
            if (!driverChatOpen) {
                const hasUnread = messages.some(m => m.receiver === myName && !m.isRead);
                if (hasUnread) document.getElementById('chatBadge').classList.remove('hidden');
                return;
            }

            const container = document.getElementById('chatMessages');
            if (!container) return;

            const currentMsgCount = container.querySelectorAll('.msg-bubble').length;
            if (messages.length === currentMsgCount && currentMsgCount !== 0) return;

            let html = '<div class="text-center text-xs text-gray-400 dark:text-gray-500 my-2">Send a message to the Admin. Request early access for future tasks here.</div>';
            html += messages.map(m => {
                const isMe = m.sender === myName;
                const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                if (isMe) {
                    return `<div class="msg-bubble self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                                <p class="whitespace-pre-wrap leading-snug">${m.text}</p>
                                <span class="text-[9px] text-blue-200 block text-right mt-1">${time}</span>
                            </div>`;
                } else {
                    return `<div class="msg-bubble self-start bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm">
                                <p class="whitespace-pre-wrap leading-snug">${m.text}</p>
                                <span class="text-[9px] text-gray-500 dark:text-gray-400 block mt-1">${time}</span>
                            </div>`;
                }
            }).join('');
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        } catch (err) { console.error("Chat load error", err); }
    }

    document.getElementById('chatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;
        input.value = ''; 
        
        const msg = { sender: localStorage.getItem('username'), receiver: 'Admin', text: text };
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        container.innerHTML += `<div class="msg-bubble self-end bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm opacity-70">
                                    <p class="whitespace-pre-wrap leading-snug">${text}</p>
                                    <span class="text-[9px] text-blue-200 block text-right mt-1">${time}</span>
                                </div>`;
        container.scrollTop = container.scrollHeight;

        try {
            await fetch(`${API_BASE_CHAT}/messages`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg)
            });
            loadMessages(); 
        } catch(err) { alert('Failed to send message'); }
    });

    if (driverChatOpen) {
        document.getElementById('chatBox').classList.remove('hidden');
        document.getElementById('chatBox').classList.add('flex');
        document.getElementById('chatBadge').classList.add('hidden');
        loadMessages();
        chatInterval = setInterval(loadMessages, 5000);
    } else {
        setTimeout(loadMessages, 2000); 
        setInterval(() => { if(!driverChatOpen) loadMessages(); }, 10000);
    }
}