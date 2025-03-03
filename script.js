let allBets = [];
let activeFilters = { tipster: "all" };
let tipsterStats = {};

document.addEventListener("DOMContentLoaded", () => {
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv")
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: results => {
                    allBets = results.data.filter(bet => bet["Date"]);
                    allBets.sort((a, b) => new Date(b["Date"]) - new Date(a["Date"]));
                    calculateTipsterStats();
                    applyFilters();
                }
            });
        });

    document.getElementById("tipster-dropdown").addEventListener("change", function () {
        filterBets("tipster", this.value);
    });
});

function filterBets(type, value) {
    activeFilters[type] = value;
    applyFilters();
}

function applyFilters() {
    const filteredBets = allBets.filter(bet => activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster);
    renderBets(filteredBets);
}

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    tbody.innerHTML = bets.map(bet => `
        <tr class="${bet.Status === "Won" ? "won" : "lost"}">
            <td>${bet["Date"]}</td>
            <td>${bet.Match}</td>
            <td>${bet.Prediction}</td>
            <td>${bet.Odds}</td>
            <td>${bet.Result}</td>
        </tr>
    `).join("");
}

function calculateTipsterStats() {
    tipsterStats = {};
    allBets.forEach(bet => {
        tipsterStats[bet.Tipster] = (tipsterStats[bet.Tipster] || 0) + (parseFloat(bet["Profit/Loss"]) || 0);
    });
}
