function renderNavigation(activePageId) {
    const navContainer = document.getElementById('shared-nav');
    if (!navContainer) return;

    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username') || '';

    // 1. DYNAMIC NAVIGATION BASED ON ROLE
    let navItems = [];
    
    if (role === 'admin' || role === 'superadmin') {
        navItems = [
            { id: 'dashboard', name: 'Control Center', href: 'dashboard.html' },
            { id: 'reports', name: 'Reports & Analytics', href: 'reports.html' },
            { id: 'fuel-log', name: 'Fuel & Mileage Logs', href: 'fuel-log.html' },
            { id: 'calculator', name: 'Trip Calculator', href: 'calculator.html' },
            { id: 'travel-map', name: 'Fleet Map & Routing', href: 'travel-map.html' },
        ];

        // PROTECTED ROUTE: Only SuperAdmins (or admins granted special access) get this link
        if (role === 'superadmin' || localStorage.getItem('grantedSuperAccess') === 'true') {
            navItems.push({ 
                id: 'superadmin', 
                name: '<i class="fa-solid fa-chess-king text-yellow-500 mr-1"></i> Super Admin', 
                href: 'superadmin-dashboard.html' 
            });
        }

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
            <a href="${item.href}" class="py-7 relative font-medium transition-colors border-b-2 ${activeClasses} flex items-center">
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
                <div class="flex items-center gap-3 shrink-0 cursor-pointer" onclick="window.location.href='${(role === 'admin' || role === 'superadmin') ? 'dashboard.html' : 'driver-dashboard.html'}'">
                    <img src="logo.png" alt="iACADEMY RFID Logo" class="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-md transition-transform hover:scale-105">
                    <span class="font-black text-xl md:text-2xl tracking-tight text-gray-800 dark:text-white hidden sm:block ml-1">iACADEMY <span class="text-blue-800 dark:text-blue-400 font-light">RFID</span></span>
                </div>
                <nav class="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-8 text-[13px] xl:text-[14px] whitespace-nowrap">
                    ${desktopLinksHTML}
                </nav>
                <div class="hidden lg:flex items-center gap-3 shrink-0 py-4">
                    ${(role === 'admin' || role === 'superadmin') ? `
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

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            const icon = mobileBtn.querySelector('i');
            if (mobileMenu.classList.contains('hidden')) icon.classList.replace('fa-xmark', 'fa-bars');
            else icon.classList.replace('fa-bars', 'fa-xmark');
        });
    }
}

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
    if (query) alert("Search initiated for: " + query + "\n\n(Table filtering logic can be attached here)");
};

// ==========================================
// --- UNIFIED CHAT WIDGET SYSTEM ---
// ==========================================
const API_BASE_CHAT = 'https://iacademy-rfid.onrender.com/api';

document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    
    if (token && role) {
        injectGlobalChat(role);
    }
});

function injectGlobalChat(role) {
    if (document.getElementById('globalChatWrapper')) return;

    const chatWrapper = document.createElement('div');
    chatWrapper.id = 'globalChatWrapper';
    document.body.appendChild(chatWrapper);

    const myName = localStorage.getItem('username') || 'User';
    
    let roleIcon = 'fa-user';
    if (role === 'superadmin') roleIcon = 'fa-chess-king';
    if (role === 'admin') roleIcon = 'fa-user-tie';
    if (role === 'driver') roleIcon = 'fa-headset';

    // 1. IDENTICAL HTML INTERFACE FOR ALL ROLES
    chatWrapper.innerHTML = `
        <div id="chatWidget" class="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
            <div id="chatBox" class="hidden w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden flex-col transition-colors duration-300 h-[500px]">
                <div class="bg-blue-800 dark:bg-blue-900 p-4 flex justify-between items-center text-white transition-colors">
                    <h3 class="font-bold flex items-center gap-2 text-sm"><i class="fa-solid ${roleIcon}"></i> ${myName}</h3>
                    <div class="flex items-center">
                        <button onclick="window.clearChatHistory()" class="text-red-300 hover:text-red-400 transition-colors mr-3" title="Clear Conversation"><i class="fa-solid fa-trash-can text-lg"></i></button>
                        <button onclick="window.toggleChatWidget()" class="text-blue-200 hover:text-white transition-colors"><i class="fa-solid fa-xmark text-lg"></i></button>
                    </div>
                </div>
                <div class="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <select id="chatUserSelect" onchange="window.loadChatMessages()" class="w-full text-sm p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white outline-none font-bold shadow-sm cursor-pointer">
                        <option value="" disabled selected>Select user/group to message...</option>
                    </select>
                </div>
                <div id="chatMessages" class="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex flex-col gap-3 custom-scrollbar text-sm transition-colors">
                    <div class="text-center text-xs text-gray-400 italic my-auto">Select a chat to start</div>
                </div>
                <form id="chatForm" class="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 transition-colors">
                    <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off" required class="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 outline-none focus:border-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm" disabled>
                    <button type="submit" id="chatBtn" class="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md disabled:opacity-50" disabled><i class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
            <button onclick="window.toggleChatWidget()" class="w-14 h-14 bg-blue-800 hover:bg-blue-900 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl relative transition-transform hover:scale-105 focus:outline-none border-2 border-white dark:border-gray-800">
                <i class="fa-solid fa-comment-dots"></i>
                <span id="chatBadge" class="hidden absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
            </button>
        </div>
    `;

    initGlobalChatLogic(role);
}

// 2. UNIFIED CHAT LOGIC CONTROLLER
function initGlobalChatLogic(role) {
    let chatOpen = localStorage.getItem('chatOpen') === 'true';
    let chatInterval;
    let allUsersCache = [];

    window.toggleChatWidget = function() {
        chatOpen = !chatOpen;
        localStorage.setItem('chatOpen', chatOpen); 
        const box = document.getElementById('chatBox');
        
        if (chatOpen) {
            box.classList.remove('hidden'); box.classList.add('flex');
            document.getElementById('chatBadge').classList.add('hidden');
            populateDropdown(role);
            window.loadChatMessages();
        } else {
            box.classList.add('hidden'); box.classList.remove('flex');
            clearInterval(chatInterval);
        }
    };

    window.clearChatHistory = async function() {
        const myName = localStorage.getItem('username');
        const selectedUser = document.getElementById('chatUserSelect').value;
        if (selectedUser && selectedUser.startsWith('BROADCAST')) {
            alert("Global Comms history cannot be deleted manually.");
            return;
        }

        if (confirm("Are you sure you want to clear your personal chat history?")) {
            try {
                await fetch(`${API_BASE_CHAT}/messages/clear/${myName}`, { method: 'DELETE' });
                document.getElementById('chatMessages').innerHTML = '<div class="text-center text-xs text-gray-400 italic my-auto">Chat history cleared.</div>';
            } catch (err) { console.error(err); }
        }
    };

    async function populateDropdown(role) {
        if (allUsersCache.length > 0) return; 
        try {
            const [driversRes, adminsRes] = await Promise.all([ fetch(`${API_BASE_CHAT}/drivers`), fetch(`${API_BASE_CHAT}/admins`) ]);
            const drivers = await driversRes.json();
            const admins = await adminsRes.json();
            
            if (!admins.some(a => a.username === 'admin_boss')) {
                admins.unshift({ username: 'admin_boss', role: 'superadmin' });
            }

            const select = document.getElementById('chatUserSelect');
            const myName = localStorage.getItem('username');
            
            select.innerHTML = `<option value="" disabled selected>Select user/group to message...</option>`;
            
            if (role === 'superadmin' || role === 'admin') {
                select.innerHTML += `<option value="BROADCAST_ALL" class="text-blue-600 font-black">📢 Global Comms (All)</option>`;
                select.innerHTML += `<option value="BROADCAST_ADMINS" class="text-purple-600 font-black">📢 Global Comms (Admins)</option>`;
            } else if (role === 'driver') {
                select.innerHTML += `<option value="BROADCAST_ALL" class="text-blue-600 font-black">📢 Global Comms (All)</option>`;
            }

            if (role === 'driver') {
                allUsersCache = [...admins];
            } else {
                allUsersCache = [...admins, ...drivers];
            }
            
            allUsersCache.forEach(u => {
                if (u.username !== myName) {
                    let roleLabel = '(Admin)';
                    if (u.role === 'driver') roleLabel = '(Driver)';
                    if (u.role === 'superadmin' || u.username === 'admin_boss') roleLabel = '(Super Admin)';
                    
                    select.innerHTML += `<option value="${u.username}" data-role="${u.role}">${u.username} ${roleLabel}</option>`;
                }
            });
        } catch (e) { console.error(e); }
    }

    window.loadChatMessages = async function() {
        const selectedUser = document.getElementById('chatUserSelect').value;
        const input = document.getElementById('chatInput');
        const btn = document.getElementById('chatBtn');
        const msgBox = document.getElementById('chatMessages');
        
        clearInterval(chatInterval);
        if (!selectedUser) { input.disabled = true; btn.disabled = true; return; }
        
        input.disabled = false; btn.disabled = false;

        await fetchMessagesThread(selectedUser, msgBox);
        chatInterval = setInterval(() => fetchMessagesThread(selectedUser, msgBox), 5000); 
    };

    document.getElementById('chatForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedUser = document.getElementById('chatUserSelect').value;
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        const myName = localStorage.getItem('username'); 

        if (!text || !selectedUser) return;
        input.disabled = true; 

        const msgBox = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        msgBox.innerHTML += `
            <div class="flex flex-col items-end w-full animate-fade-in">
                <div class="text-[9px] font-bold text-gray-400 mb-1 text-right mr-1 uppercase tracking-widest">YOU</div>
                <div class="msg-bubble self-end bg-blue-600 text-white max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm opacity-70">
                    <p class="whitespace-pre-wrap leading-snug">${text}</p>
                    <div class="text-[9px] text-blue-200 mt-1 text-right">${time}</div>
                </div>
            </div>`;
        msgBox.scrollTop = msgBox.scrollHeight;
        input.value = ''; 

        try {
            await fetch(`${API_BASE_CHAT}/messages`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: myName, receiver: selectedUser, text: text })
            });
            await fetchMessagesThread(selectedUser, msgBox); 
        } catch (err) { alert("Failed to send message."); } 
        finally { input.disabled = false; input.focus(); }
    });

    if (chatOpen) window.toggleChatWidget();
}

// ====================================================
// SHARED UTILITY: FETCH AND RENDER MESSAGES THREAD
// ====================================================
async function fetchMessagesThread(selectedUser, msgBox) {
    const myName = localStorage.getItem('username');
    try {
        const res = await fetch(`${API_BASE_CHAT}/messages/${selectedUser}`);
        const messages = await res.json();
        
        const thread = messages.filter(m => {
            if (selectedUser.startsWith('BROADCAST')) {
                return m.receiver === selectedUser; 
            }
            return (m.sender === myName && m.receiver === selectedUser) || 
                   (m.sender === selectedUser && m.receiver === myName) ||
                   (m.sender === 'Admin' && m.receiver === selectedUser) || 
                   (m.sender === selectedUser && m.receiver === 'Admin');
        });

        if (thread.length === 0) {
            if (selectedUser.startsWith('BROADCAST')) {
                msgBox.innerHTML = '<div class="text-center text-xs text-gray-400 italic my-auto">Welcome to Global Comms. Start the conversation!</div>';
            } else {
                msgBox.innerHTML = '<div class="text-center text-xs text-gray-400 italic my-auto">No messages yet. Say hi!</div>';
            }
            return;
        }

        const currentCount = msgBox.querySelectorAll('.msg-bubble').length;
        if (thread.length === currentCount && currentCount > 0) return;

        msgBox.innerHTML = thread.map(m => {
            const isMe = m.sender === myName || m.sender === 'Admin';
            const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const align = isMe ? 'self-end bg-blue-600 text-white' : 'self-start bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
            
            const senderTag = `<div class="text-[9px] font-bold text-gray-400 mb-1 ${isMe ? 'text-right mr-1' : 'ml-1'} uppercase tracking-widest">${isMe ? 'YOU' : m.sender}</div>`;
            
            return `
                <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full animate-fade-in">
                    ${senderTag}
                    <div class="msg-bubble ${align} max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm">
                        <p class="whitespace-pre-wrap leading-snug">${m.text}</p>
                        <div class="text-[9px] opacity-70 mt-1 text-right">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        msgBox.scrollTop = msgBox.scrollHeight;

        const myRole = localStorage.getItem('userRole');
        await fetch(`${API_BASE_CHAT}/messages/mark-read`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: selectedUser, role: myRole })
        }).catch(e => {});

    } catch (err) { console.error("Chat load error", err); }
}