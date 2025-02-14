let allBets = [];
let activeFilters = { tipster: "all" };

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
        return activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster;
    });
    renderBets(filteredBets);
    updateStats(filteredBets);
}

function updateStats(bets) {
    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter(bet => bet.Result === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter(bet => bet.Result === "Lost").length;
}

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    tbody.innerHTML = bets.map(bet => `
        <tr class="${(bet.Result || 'Pending').toLowerCase()}">
            <td>${bet['Date & Time']}</td>
            <td>${bet.Match}</td>
            <td>${bet.Prediction}</td>
            <td>${bet.Odds?.toFixed(2) || '-'}</td>
            <td>${bet.Result || 'Pending'}</td>
        </tr>
    `).join("");
}
