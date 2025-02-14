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
    fetch("YOUR_CSV_URL_HERE")
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    allBets = results.data.filter(bet => bet.Date); // Remove empty rows
                    allBets.sort((a, b) => new Date(b.Date) - new Date(a.Date));
                    applyFilters();
                },
                error: (err) => console.error("CSV Parsing Error:", err)
            });
        })
        .catch(error => console.error("Error loading bets:", error));
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
    if (bet.Result === "Won") return (bet.Stake * (bet.Odds - 1)).toFixed(2);
    if (bet.Result === "Lost") return (-bet.Stake).toFixed(2);
    return 0; // For pending bets
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
        <tr class="${bet.Result.toLowerCase()}">
            <td>${bet.Date}</td>
            <td>${bet.Match}</td>
            <td>${bet.Prediction}</td>
            <td>${bet.Odds.toFixed(2)}</td>
            <td>${bet.Stake}</td>
            <td>${bet.Result}</td>
            <td>${calculateProfitLoss(bet) !== 0 ? '€' + calculateProfitLoss(bet) : '-'}</td>
        </tr>
    `).join("");
}
