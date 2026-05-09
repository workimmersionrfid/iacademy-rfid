// ==========================================
// --- ADMIN GOOGLE MAPS & ROUTING ---
// ==========================================

var dispatchMap, dirService, dirRenderer;
var calculatedDistance = "0 km";
var calculatedBudget = 0;
var tollCounter = 0;

const estimatedPrices = {
    "Diesel": 65.00, "Gasoline": 75.00, "Ron91": 72.00, "Ron95": 78.00, "Ron97": 82.00
};

const expressways = {
    "NLEX": ["Balintawak", "Mindanao Ave", "Karuhatan", "Valenzuela", "Meycauayan", "Marilao", "Bocaue", "Tambobong", "Philippine Arena", "Tabang", "Balagtas", "Guiguinto", "Plaridel", "Pulilan", "San Simon", "San Fernando", "Mexico", "Angeles", "Dau", "Sta. Ines"],
    "SCTEX": ["Mabalacat", "Clark South", "Clark North", "Porac", "Floridablanca", "Dinalupihan", "Tipo", "Concepcion", "San Miguel", "Tarlac"],
    "SLEX": ["Magallanes", "Nichols", "Merville", "Bicutan", "Sucat", "Alabang", "Filinvest", "Susana Heights", "San Pedro", "Southwoods", "Carmona", "Mamplasan", "Sta. Rosa", "ABI/Greenfield", "Cabuyao", "Silangan", "Calamba", "Santo Tomas"],
    "Skyway": ["Quezon Ave", "Plaza Dilao", "Nagtahan", "Buendia", "Amorsolo", "Magallanes", "NAIAx", "Bicutan", "Sucat", "Alabang", "South Station", "Filinvest", "Susana Heights"],
    "MCX": ["Daang Hari", "SLEX"],
    "STAR Tollway": ["Santo Tomas", "Tanauan", "Malvar", "Balete", "Lipa", "San Jose", "Ibaan", "Batangas City"],
    "CALAX": ["Mamplasan", "Laguna Boulevard", "Laguna Technopark", "Santa Rosa-Tagaytay", "Silang East", "Silang (Aguinaldo)"],
    "CAVITEX": ["Roxas Blvd", "MIA Road", "Zapote", "Bacoor", "Kawit"],
    "NAIAx": ["Skyway", "Sales", "Andrews Ave", "NAIA T3", "NAIA T1/T2", "Macapagal Blvd", "CAVITEX"],
    "TPLEX": ["Tarlac", "Victoria", "Pura", "Ramos", "Anao", "Carmen", "Urdaneta", "Binalonan", "Pozorrubio", "Sison", "Rosario"],
    "CCLEX": ["Cebu City", "Cordova"]
};

window.loadGoogleMaps = function() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAeJ7SLq9sJ1ZYhTaWAnsOB260RJLxK8Jw&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
};

window.initGooglePlaces = function() {
    dispatchMap = new google.maps.Map(document.getElementById('dispatchMap'), {
        center: { lat: 14.5632, lng: 121.0142 }, 
        zoom: 13, disableDefaultUI: true, zoomControl: true
    });
    
    dirService = new google.maps.DirectionsService();
    dirRenderer = new google.maps.DirectionsRenderer({
        map: dispatchMap, polylineOptions: { strokeColor: '#1d4ed8', strokeWeight: 6 }
    });

    const autocompleteOptions = { componentRestrictions: { country: "ph" }, fields: ["formatted_address", "geometry", "name"] };
    new google.maps.places.Autocomplete(document.getElementById('dOrigin'), autocompleteOptions);
    new google.maps.places.Autocomplete(document.getElementById('tDestinationCustom'), autocompleteOptions);
};

window.addDispatchTollSegment = function() {
    tollCounter++;
    const id = tollCounter;
    const container = document.getElementById('dTollSegments');
    
    let expOptions = `<option value="" disabled selected>Select expressway</option>`;
    for (const exp in expressways) { expOptions += `<option value="${exp}">${exp}</option>`; }

    container.insertAdjacentHTML('beforeend', `
        <div id="dseg-${id}" class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-3 rounded-lg relative transition-colors">
            <button type="button" onclick="document.getElementById('dseg-${id}').remove(); updateDispatchToll();" class="absolute top-2 right-2 text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button>
            <select id="dexp-${id}" onchange="updateDispatchExits(${id})" class="w-full text-xs bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-white border border-transparent dark:border-gray-700 rounded p-2 mb-2 outline-none focus:border-blue-400 transition-colors">
                ${expOptions}
            </select>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <select id="dentry-${id}" onchange="calculateDispatchSegment(${id})" class="w-full text-[10px] bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-white border border-transparent dark:border-gray-700 rounded p-2 outline-none focus:border-blue-400 transition-colors" disabled><option>Entry</option></select>
                <select id="dexit-${id}" onchange="calculateDispatchSegment(${id})" class="w-full text-[10px] bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-white border border-transparent dark:border-gray-700 rounded p-2 outline-none focus:border-blue-400 transition-colors" disabled><option>Exit</option></select>
            </div>
            <div class="text-right text-xs font-bold text-blue-800 dark:text-blue-400 hidden" id="dprice-${id}" data-cost="0">₱0.00</div>
        </div>
    `);
};

window.updateDispatchExits = function(id) {
    const expSelect = document.getElementById(`dexp-${id}`);
    const exits = expressways[expSelect.value] || [];
    let options = `<option value="" disabled selected>Point...</option>`;
    exits.forEach((exit, index) => { options += `<option value="${exit}" data-index="${index}">${exit}</option>`; });
    
    document.getElementById(`dentry-${id}`).innerHTML = options;
    document.getElementById(`dexit-${id}`).innerHTML = options;
    document.getElementById(`dentry-${id}`).disabled = false;
    document.getElementById(`dexit-${id}`).disabled = false;
};

window.updateDispatchToll = function() {
    let total = 0;
    document.querySelectorAll('[id^="dprice-"]').forEach(span => total += parseFloat(span.getAttribute('data-cost') || 0));
    return total;
};

window.calculateDispatchSegment = async function(id) {
    const expSelect = document.getElementById(`dexp-${id}`).value;
    const entrySelect = document.getElementById(`dentry-${id}`).value;
    const exitSelect = document.getElementById(`dexit-${id}`).value;
    const priceText = document.getElementById(`dprice-${id}`);

    if (entrySelect && exitSelect && entrySelect !== "Entry" && exitSelect !== "Exit") {
        priceText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>`;
        priceText.classList.remove('hidden');

        try {
            const originAddress = `${entrySelect}, ${expSelect}, Philippines`;
            const destinationAddress = `${exitSelect}, ${expSelect}, Philippines`;

            const response = await fetch(`${API_BASE}/toll-estimate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: { address: originAddress }, to: { address: destinationAddress }, vehicle: { type: "2AxlesAuto" } })
            });

            if (!response.ok) throw new Error("Backend Proxy Failed");
            const data = await response.json();
            
            let liveCost = 0;
            if (data.routes && data.routes.length > 0 && data.routes[0].costs) {
                liveCost = data.routes[0].costs.tag || data.routes[0].costs.cash || 0;
            }
            
            priceText.innerText = `₱${liveCost.toFixed(2)}`;
            priceText.setAttribute('data-cost', liveCost);
        } catch (error) {
            priceText.innerHTML = `<span class="text-red-500 text-[10px]">API Error</span>`;
            priceText.setAttribute('data-cost', 0);
        }
        window.updateDispatchToll(); 
    }
};

window.calculateDispatchRoute = function() {
    if (!dirService) return alert("Maps loading, please wait.");
    
    const origin = document.getElementById('dOrigin').value;
    let dest = document.getElementById('tDestinationSelect').value;
    if (dest === 'Other') dest = document.getElementById('tDestinationCustom').value;
    const plate = document.getElementById('dVehicle').value;

    if (!plate) return alert("Please select a Vehicle.");
    if (!origin || !dest) return alert("Please enter Origin and Destination.");
    
    const vehicle = allVehicles.find(v => v.plateNumber === plate);
    const efficiency = vehicle && vehicle.efficiency ? parseFloat(vehicle.efficiency) : 14;
    const fuelType = vehicle && vehicle.fuelType ? vehicle.fuelType : 'Gasoline';
    const pricePerLiter = estimatedPrices[fuelType] || 75.00;
    
    const btn = document.getElementById('btnCalculateRoute');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Thinking...`;
    btn.disabled = true;

    dirService.route({
        origin: origin, destination: dest, travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        btn.innerHTML = `<i class="fa-solid fa-calculator"></i> Calculate Route & Budget`;
        btn.disabled = false;

        if (status === "OK") {
            dirRenderer.setDirections(response);
            const route = response.routes[0].legs[0];
            
            calculatedDistance = route.distance.text;
            const distanceKm = parseFloat(route.distance.value) / 1000;
            const liters = (distanceKm / efficiency);
            const fuelCost = (liters * pricePerLiter);
            const tollCost = window.updateDispatchToll();
            
            calculatedBudget = fuelCost + tollCost;

            document.getElementById('dSumDistTime').innerText = `${route.distance.text} / ${route.duration.text}`;
            document.getElementById('dSumFuelVol').innerText = `${liters.toFixed(1)}L (${fuelType})`;
            document.getElementById('dSumFuelCost').innerText = `₱${fuelCost.toFixed(2)}`;
            document.getElementById('dSumTollCost').innerText = `₱${tollCost.toFixed(2)}`;
            document.getElementById('dSumTotal').innerText = `₱${calculatedBudget.toFixed(2)}`;

            const summary = document.getElementById('dispatchSummary');
            summary.classList.remove('hidden');
            setTimeout(() => {
                summary.classList.remove('translate-y-4', 'opacity-0');
                summary.classList.add('translate-y-0', 'opacity-100');
            }, 10);
        } else {
            alert("Google Maps cannot find a driving route between these points.");
        }
    });
};