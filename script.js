let allBets = [];
let activeFilters = { sport: "all", tipster: "all" };

document.addEventListener('DOMContentLoaded', () => {
    // Setup filter buttons
    document.querySelectorAll('.sidebar button').forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.dataset.filterType;
            const filterValue = button.dataset.filterValue;
            filterBets(filterType, filterValue);
        });
    });

    // Load CSV data
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv")
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    allBets = results.data.filter(bet => bet['Date & Time']);
                    allBets.sort((a, b) => new Date(b['Date & Time']) - new Date(a['Date & Time']));
                    applyFilters();
                },
                error: (err) => console.error("CSV Error:", err)
            });
        })
        .catch(error => console.error("Fetch Error:", error));
});

function filterBets(type, value) {
    activeFilters[type] = value === "all" ? "all" : value;
    applyFilters();
}

function applyFilters() {
    const filteredBets = allBets.filter(bet => {
        const sportMatch = activeFilters.sport === "all" || bet.Sport === activeFilters.sport;
        const tipsterMatch = activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster;
        return sportMatch && tipsterMatch;
    });
    renderBets(filteredBets);
    updateStats(filteredBets);
}

function calculateProfitLoss(bet) {
    if (!bet.Odds || !bet.Stake) return 0; // Handle missing values
    if (bet.Result === "Won") return (bet.Stake * (bet.Odds - 1)).toFixed(2);
    if (bet.Result === "Lost") return (-bet.Stake).toFixed(2);
    return 0;
}

function updateStats(bets) {
    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter(bet => bet.Result === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter(bet => bet.Result === "Lost").length;
    
    const totalProfit = bets.reduce((sum, bet) => {
        return sum + parseFloat(calculateProfitLoss(bet));
    }, 0).toFixed(2);
    
    document.getElementById("profit-loss").textContent = `€${totalProfit}`;
}

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    tbody.innerHTML = bets.map(bet => `
        <tr class="${(bet.Result || 'Pending').toLowerCase()}">
            <td>${bet['Date & Time']}</td>
            <td>${bet.Match}</td>
            <td>${bet.Prediction}</td>
            <td>${bet.Odds?.toFixed(2) || '-'}</td>
            <td>${bet.Stake || '-'}</td>
            <td>${bet.Result || 'Pending'}</td>
            <td>${calculateProfitLoss(bet) !== 0 ? '€' + calculateProfitLoss(bet) : '-'}</td>
        </tr>
    `).join("");
}
