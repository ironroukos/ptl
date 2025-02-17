let allBets = [];
let activeFilters = { tipster: "all" };
let tipsterStats = {};

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".sidebar button").forEach((button) => {
        button.addEventListener("click", () => {
            filterBets("tipster", button.dataset.filterValue);
        });
    });

    document.getElementById("tipster-dropdown").addEventListener("change", function () {
        filterBets("tipster", this.value);
    });

    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv")
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,  // Ensures first row is used as headers
                dynamicTyping: true,
                skipEmptyLines: true,  // Ignores any empty rows
                complete: (results) => {
                    if (!results.data.length) throw new Error("CSV is empty or malformed");

                    allBets = results.data.filter(bet => bet["Date & Time"]); // Ensure valid rows
                    allBets.sort((a, b) => Date.parse(b["Date & Time"]) - Date.parse(a["Date & Time"]));

                    calculateTipsterStats();
                    applyFilters();
                },
                error: (err) => console.error("CSV Parse Error:", err),
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

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    tbody.innerHTML = bets.map(bet => {
        let rowClass = bet.Result === "Won" ? "won" : bet.Result === "Lost" ? "lost" : "pending";
        return `
            <tr class="${rowClass}">
                <td>${bet['Date & Time'] || '-'}</td>
                <td>${bet.Match || '-'}</td>
                <td>${bet.Prediction || '-'}</td>
                <td>${bet.Odds ? bet.Odds.toFixed(2) : '-'}</td>
                <td>${bet.Stake || '-'}</td>
                <td>${bet.Result || '-'}</td> 
                <td>${bet['Profit/Loss'] ? '€' + bet['Profit/Loss'] : '-'}</td>
            </tr>
        `;
    }).join("");
}

function updateStats(bets) {
    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter(bet => bet.Status === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter(bet => bet.Status === "Lost").length;

    const totalProfit = bets.reduce((sum, bet) => sum + (parseFloat(bet["Profit/Loss"]) || 0), 0).toFixed(2);
    document.getElementById("profit-loss").textContent = `€${totalProfit}`;
}

function calculateTipsterStats() {
    tipsterStats = {};

    allBets.forEach(bet => {
        if (!tipsterStats[bet.Tipster]) {
            tipsterStats[bet.Tipster] = { profitLoss: 0 };
        }
        tipsterStats[bet.Tipster].profitLoss += parseFloat(bet["Profit/Loss"]) || 0;
    });

    document.querySelectorAll(".sidebar button").forEach(button => {
        const tipster = button.dataset.filterValue;
        if (tipsterStats[tipster]) {
            button.innerHTML = `${tipster} (€${tipsterStats[tipster].profitLoss.toFixed(2)})`;
        }
    });
}
