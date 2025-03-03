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
                        const dateA = new Date(parseDate(a.Date));
                        const dateB = new Date(parseDate(b.Date));
                        return dateB - dateA;
                    });
                    
                    // Initialize the page
                    calculateTipsterStats();
                    populateTipsterButtons();
                    populateLeaderboard();
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

// Helper function to parse dates properly
function parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    // Handle European format DD/MM/YYYY or DD/MM/YY
    if (typeof dateStr === 'string') {
        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return new Date(`${month}/${day}/${year.length === 2 ? '20' + year : year}`);
        } 
        // Handle European format DD-MM-YYYY or DD-MM-YY
        else if (dateStr.includes('-')) {
            const [day, month, year] = dateStr.split('-');
            return new Date(`${month}/${day}/${year.length === 2 ? '20' + year : year}`);
        }
    }
    return new Date(dateStr);
}

// Helper function to format dates for display
function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    
    // Handle European format DD/MM/YYYY or DD/MM/YY
    if (typeof dateStr === 'string') {
        if (dateStr.includes('/')) {
            const parts = dateStr.split(' ');
            return parts[0]; // Just return the date part
        } 
        // Handle European format DD-MM-YYYY or DD-MM-YY
        else if (dateStr.includes('-')) {
            const parts = dateStr.split(' ');
            return parts[0].replace(/-/g, '/'); // Convert to DD/MM/YYYY format
        }
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
        let displayDate = formatDate(bet.Date);
        
        // Format the time if it exists
        if (typeof bet.Date === 'string' && bet.Date.includes(':')) {
            const timePart = bet.Date.split(' ')[1];
            if (timePart) {
                displayDate += ` ${timePart}`;
            }
        }
        
        return `
            <tr class="${bet.Result && bet.Result.toLowerCase() === "won" ? "won" : "lost"}">
                <td>${displayDate}</td>
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
            tipsterStats[tipster] = {
                profit: 0,
                totalBets: 0,
                wonBets: 0,
                lostBets: 0
            };
        }
        
        tipsterStats[tipster].totalBets++;
        
        if (bet.Result && bet.Result.toLowerCase() === "won") {
            tipsterStats[tipster].wonBets++;
        } else if (bet.Result && bet.Result.toLowerCase() === "lost") {
            tipsterStats[tipster].lostBets++;
        }
        
        if (!isNaN(profitLoss)) {
            tipsterStats[tipster].profit += profitLoss;
            tipsterStats["all"] += profitLoss;
        }
    });
    
    console.log("Tipster stats:", tipsterStats);
}

function populateTipsterButtons() {
    const dropdown = document.getElementById("tipster-dropdown");
    const buttonsContainer = document.querySelector(".desktop-buttons");
    const tipsters = ["all", ...new Set(allBets.map(bet => bet.Tipster).filter(Boolean))];
    
    // Populate dropdown
    dropdown.innerHTML = tipsters.map(tipster => 
        `<option value="${tipster}">${tipster === "all" ? "All Tipsters" : tipster}</option>`
    ).join("");
    
    // Populate buttons
    buttonsContainer.innerHTML = tipsters.map(tipster => {
        const stats = tipsterStats[tipster] || { profit: 0 };
        const profit = stats.profit || 0;
        const profitClass = profit >= 0 ? "profit-positive" : "profit-negative";
        const displayName = tipster === "all" ? "All Tipsters" : tipster;
        
        return `
            <button data-value="${tipster}" class="${tipster === 'all' ? 'active' : ''}" onclick="filterBets('tipster', '${tipster}')">
                <span>${displayName}</span>
                <span class="${profitClass}">${profit >= 0 ? '+' : ''}€${profit.toFixed(2)}</span>
            </button>
        `;
    }).join("");
}

function populateLeaderboard() {
    // Create leaderboard section if it doesn't exist
    if (!document.querySelector('.leaderboard')) {
        const container = document.querySelector('.container');
        const leaderboardHTML = `
            <div class="leaderboard">
                <h2>Tipster Leaderboard</h2>
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Tipster</th>
                            <th>Profit/Loss</th>
                            <th>Win Rate</th>
                        </tr>
                    </thead>
                    <tbody id="leaderboard-body"></tbody>
                </table>
            </div>
        `;
        
        // Insert leaderboard after the main content
        const mainContent = document.querySelector('.content');
        mainContent.insertAdjacentHTML('afterend', leaderboardHTML);
    }
    
    // Get all tipsters except 'all'
    const tipsters = Object.keys(tipsterStats).filter(t => t !== 'all');
    
    // Sort tipsters by profit (descending)
    tipsters.sort((a, b) => {
        return tipsterStats[b].profit - tipsterStats[a].profit;
    });
    
    // Populate leaderboard
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = tipsters.map((tipster, index) => {
        const stats = tipsterStats[tipster];
        const profit = stats.profit;
        const profitClass = profit >= 0 ? "profit-positive" : "profit-negative";
        
        // Calculate win rate
        const winRate = stats.totalBets > 0 ? 
            ((stats.wonBets / stats.totalBets) * 100).toFixed(1) : 0;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${tipster}</td>
                <td class="${profitClass}">${profit >= 0 ? '+' : ''}€${profit.toFixed(2)}</td>
                <td>${winRate}% (${stats.wonBets}/${stats.totalBets})</td>
            </tr>
        `;
    }).join('');
}
