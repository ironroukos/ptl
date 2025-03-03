let allBets = [];
let tipsterStats = {};
let activeTipster = null;

document.addEventListener("DOMContentLoaded", () => {
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv")
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: results => {
                    allBets = results.data.filter(bet => bet["Date"] && bet["Date"].trim() !== "");
                    allBets.sort((a, b) => Date.parse(b["Date"]) - Date.parse(a["Date"]));
                    calculateTipsterStats();
                    displayLeaderboard();
                }
            });
        });
});

function calculateTipsterStats() {
    tipsterStats = {};
    
    allBets.forEach(bet => {
        if (!tipsterStats[bet.Tipster]) {
            tipsterStats[bet.Tipster] = { profitLoss: 0, bets: [] };
        }
        tipsterStats[bet.Tipster].profitLoss += parseFloat(bet["Profit/Loss"]) || 0;
        tipsterStats[bet.Tipster].bets.push(bet);
    });
}

function displayLeaderboard() {
    const leaderboard = document.getElementById("tipster-list");
    leaderboard.innerHTML = "";

    const sortedTipsters = Object.entries(tipsterStats)
        .sort((a, b) => b[1].profitLoss - a[1].profitLoss);

    sortedTipsters.forEach(([tipster, stats]) => {
        const li = document.createElement("li");
        li.textContent = `${tipster} (€${stats.profitLoss.toFixed(2)})`;
        li.addEventListener("click", () => toggleTipsterHistory(tipster));
        leaderboard.appendChild(li);
    });
}

function toggleTipsterHistory(tipster) {
    if (activeTipster === tipster) {
        activeTipster = null;
        renderBets([]);
    } else {
        activeTipster = tipster;
        renderBets(tipsterStats[tipster].bets);
    }
}

function renderBets(bets) {
    const tbody = document.getElementById("bets-list");
    tbody.innerHTML = bets.map(bet => {
        let rowClass = bet.Status === "Won" ? "won" : bet.Status === "Lost" ? "lost" : "pending";
        return `
            <tr class="${rowClass}">
                <td>${bet.Date}</td>
                <td>${bet.Match || "-"}</td>
                <td>${bet.Prediction || "-"}</td>
                <td>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</td>
            </tr>`;
    }).join("");
}
