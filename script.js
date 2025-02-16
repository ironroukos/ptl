let allBets = [];
let activeFilters = { tipster: "all" };

document.addEventListener('DOMContentLoaded', () => {
    // Setup filter buttons
    document.querySelectorAll('.sidebar button').forEach(button => {
        button.addEventListener('click', () => {
            filterBets('tipster', button.dataset.filterValue);
        });
    });

    // Setup dropdown filter for mobile
    document.getElementById('tipster-dropdown').addEventListener('change', function() {
        filterBets('tipster', this.value);
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
        return activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster;
    });
    renderBets(filteredBets);
    updateStats(filteredBets);
}

function updateStats(bets) {
    // Update stats
    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter(bet => bet.Result === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter(bet => bet.Result === "Lost").length;

    // Calculate total Profit/Loss
    const totalProfit = bets.reduce((sum, bet) => sum + (parseFloat(bet['Profit/Loss']) || 0), 0).toFixed(2);
    document.getElementById("profit-loss").textContent = `€${totalProfit}`;

    // Update Profit/Loss for each tipster
    const tipsterStats = calculateTipsterStats(bets);
    updateTipsterStats(tipsterStats);
}

function calculateTipsterStats(bets) {
    const tipsterStats = {};

    bets.forEach(bet => {
        const tipster = bet.Tipster;
        if (!tipsterStats[tipster]) {
            tipsterStats[tipster] = { total: 0, won: 0, lost: 0, profit: 0 };
        }

        tipsterStats[tipster].total++;
        if (bet.Result === "Won") tipsterStats[tipster].won++;
        if (bet.Result === "Lost") tipsterStats[tipster].lost++;
        tipsterStats[tipster].profit += parseFloat(bet['Profit/Loss']) || 0;
    });

    return tipsterStats;
}

function updateTipsterStats(tipsterStats) {
    document.querySelectorAll('.sidebar button[data-filter-type="tipster"]').forEach(button => {
        const tipster = button.dataset.filterValue;
        if (tipster === "all") return; // Skip "All" button

        const stats = tipsterStats[tipster] || { profit: 0 };
        button.innerHTML = `${tipster} <span class="tipster-stats">(€${stats.profit.toFixed(2)})</span>`;
    });
}

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    tbody.innerHTML = bets.map(bet => {
        let status = ""; // Hidden column data

        if (bet.Result === "Won") {
            status = "Win";
        } else if (bet.Result === "Lost") {
            status = "Loss";
        } else {
            status = "Pending";
        }

        return `
            <tr>
                <td>${bet['Date & Time']}</td>
                <td>${bet.Match}</td>
                <td>${bet.Prediction}</td>
                <td>${bet.Odds?.toFixed(2) || '-'}</td>
                <td>${bet.Stake || '-'}</td>
                <td>${bet.Result || 'Pending'}</td>
                <td style="display: none;">${status}</td> <!-- Hidden Status Column -->
                <td>${bet['Profit/Loss'] ? '€' + bet['Profit/Loss'] : '-'}</td>
            </tr>
        `;
    }).join("");
}
