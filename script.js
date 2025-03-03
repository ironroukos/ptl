let allBets = [];
let activeFilters = { tipster: "all" };
let tipsterStats = {};

document.addEventListener("DOMContentLoaded", () => {
    // Fetch data from Google Sheets
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv")
        .then(response => response.text())
        .then(csvData => {
            // Parse CSV data
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: results => {
                    console.log("Raw data from CSV:", results.data);
                    // Filter out rows without a Date
                    allBets = results.data.filter(bet => bet["Date"]);
                    
                    // Ensure column names match
                    allBets = allBets.map(bet => {
                        return {
                            Tipster: bet.Tipster || bet.tipster || "",
                            Date: bet.Date || bet.date || "",
                            Match: bet.Match || bet.match || "",
                            Prediction: bet.Prediction || bet.prediction || "",
                            Odds: bet.Odds || bet.odds || 0,
                            Result: bet.Result || bet.result || "",
                            "Profit/Loss": bet["Profit/Loss"] || bet["profit/loss"] || 0
                        };
                    });
                    
                    console.log("Processed bets:", allBets);
                    
                    // Sort by date (newest first)
                    allBets.sort((a, b) => {
                        const dateA = new Date(formatDate(a.Date));
                        const dateB = new Date(formatDate(b.Date));
                        return dateB - dateA;
                    });
                    
                    // Initialize the page
                    calculateTipsterStats();
                    populateTipsterDropdown();
                    populateTipsterButtons();
                    applyFilters();
                },
                error: error => {
                    console.error("Error parsing CSV:", error);
                }
            });
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });

    // Event listeners
    document.getElementById("tipster-dropdown").addEventListener("change", function() {
        filterBets("tipster", this.value);
    });
});

// Helper function to format dates consistently
function formatDate(dateStr) {
    // Handle European format DD/MM/YYYY or DD/MM/YY
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${month}/${day}/${year.length === 2 ? '20' + year : year}`;
    }
    // Handle European format DD-MM-YYYY or DD-MM-YY
    else if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return `${month}/${day}/${year.length === 2 ? '20' + year : year}`;
    }
    return dateStr;
}

function filterBets(type, value) {
    activeFilters[type] = value;
    applyFilters();
    
    // Update active button styling
    if (type === "tipster") {
        document.querySelectorAll('.sidebar button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-value') === value) {
                btn.classList.add('active');
            }
        });
    }
}

function applyFilters() {
    const filteredBets = allBets.filter(bet => {
        return (activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster);
    });
    
    renderBets(filteredBets);
    updateStats(filteredBets);
}

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    
    if (bets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-results">No bets found matching your filters</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = bets.map(bet => {
        // Format the date
        let displayDate = bet.Date;
        if (typeof bet.Date === 'string') {
            // Try to format to DD/MM/YYYY HH:MM if it includes time
            try {
                if (bet.Date.includes(':')) {
                    const parts = bet.Date.split(' ');
                    const datePart = parts[0];
                    const timePart = parts[1] || '';
                    
                    if (datePart.includes('/')) {
                        const [day, month, year] = datePart.split('/');
                        displayDate = `${day}/${month}/${year} ${timePart}`;
                    } else if (datePart.includes('-')) {
                        const [day, month, year] = datePart.split('-');
                        displayDate = `${day}/${month}/${year} ${timePart}`;
                    }
                }
            } catch (e) {
                console.log("Error formatting date:", e);
                displayDate = bet.Date;
            }
        }
        
        return `
            <tr class="${bet.Result && bet.Result.toLowerCase() === "won" ? "won" : "lost"}">
                <td>${displayDate || "N/A"}</td>
                <td>${bet.Match || "N/A"}</td>
                <td>${bet.Prediction || "N/A"}</td>
                <td>${bet.Odds || "N/A"}</td>
                <td>${bet.Result || "N/A"}</td>
            </tr>
        `;
    }).join("");
}

function updateStats(bets) {
    const totalBets = bets.length;
    const wonBets = bets.filter(bet => bet.Result && bet.Result.toLowerCase() === "won").length;
    const lostBets = bets.filter(bet => bet.Result && bet.Result.toLowerCase() === "lost").length;
    
    // Calculate profit/loss with proper error handling
    const profitLoss = bets.reduce((sum, bet) => {
        const pl = parseFloat(bet["Profit/Loss"]);
        return sum + (isNaN(pl) ? 0 : pl);
    }, 0);
    
    document.getElementById("total-bets").textContent = totalBets;
    document.getElementById("won-bets").textContent = wonBets;
    document.getElementById("lost-bets").textContent = lostBets;
    document.getElementById("profit-loss").textContent = `€${profitLoss.toFixed(2)}`;
}

function calculateTipsterStats() {
    tipsterStats = { "all": 0 };
    
    allBets.forEach(bet => {
        const tipster = bet.Tipster || "unknown";
        const profitLoss = parseFloat(bet["Profit/Loss"]);
        
        if (!tipsterStats[tipster]) {
            tipsterStats[tipster] = 0;
        }
        
        if (!isNaN(profitLoss)) {
            tipsterStats[tipster] += profitLoss;
            tipsterStats["all"] += profitLoss;
        }
    });
    
    console.log("Tipster stats:", tipsterStats);
}

function populateTipsterDropdown() {
    const dropdown = document.getElementById("tipster-dropdown");
    const tipsters = ["all", ...new Set(allBets.map(bet => bet.Tipster).filter(Boolean))];
    
    dropdown.innerHTML = tipsters.map(tipster => 
        `<option value="${tipster}">${tipster === "all" ? "All Tipsters" : tipster}</option>`
    ).join("");
}

function populateTipsterButtons() {
    const buttonsContainer = document.querySelector(".desktop-buttons");
    const tipsters = ["all", ...new Set(allBets.map(bet => bet.Tipster).filter(Boolean))];
    
    buttonsContainer.innerHTML = tipsters.map(tipster => {
        const profit = tipsterStats[tipster] || 0;
        const profitClass = profit >= 0 ? "profit-positive" : "profit-negative";
        
        return `
            <button data-value="${tipster}" class="${tipster === 'all' ? 'active' : ''}" onclick="filterBets('tipster', '${tipster}')">
                <span>${tipster === "all" ? "All Tipsters" : tipster}</span>
                <span class="${profitClass}">${profit >= 0 ? '+' : ''}€${profit.toFixed(2)}</span>
            </button>
        `;
    }).join("");
}
