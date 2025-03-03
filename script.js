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
            tipsterStats[bet.Tipster] = { profitLoss: 0, bets: [], total: 0, won: 0, lost: 0 };
        }
        let tipster = tipsterStats[bet.Tipster];
        tipster.profitLoss += parseFloat(bet["Profit/Loss"]) || 0;
        tipster.total++;
        if (bet.Result === "Won") tipster.won++;
        if (bet.Result === "Lost") tipster.lost++;
        tipster.bets.push(bet);
    });
}

function displayLeaderboard() {
    const leaderboard = document.getElementById("tipster-list");
    leaderboard.innerHTML = "";

    const sortedTipsters = Object.entries(tipsterStats)
        .sort((a, b) => b[1].profitLoss - a[1].profitLoss);

    sortedTipsters.forEach(([tipster, stats]) => {
        const button = document.createElement("button");
        button.classList.add("tipster-button");
        button.innerHTML = `${tipster} (€${stats.profitLoss.toFixed(2)})`;
        button.addEventListener("click", () => toggleTipsterHistory(tipster));
        
        const container = document.createElement("div");
        container.classList.add("tipster-container");
        container.appendChild(button);
        
        const details = document.createElement("div");
        details.classList.add("tipster-details", "hidden");
        details.innerHTML = `
            <div class="stats-table">
                <p><strong>Total Bets:</strong> ${stats.total}</p>
                <p><strong>Won:</strong> ${stats.won}</p>
                <p><strong>Lost:</strong> ${stats.lost}</p>
                <p><strong>Profit/Loss:</strong> €${stats.profitLoss.toFixed(2)}</p>
            </div>
            <table class="bets-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Match</th>
                        <th>Prediction</th>
                        <th>Odds</th>
                    </tr>
                </thead>
                <tbody id="bets-${tipster}"></tbody>
            </table>
        `;
        
        container.appendChild(details);
        leaderboard.appendChild(container);
    });
}

function toggleTipsterHistory(tipster) {
    document.querySelectorAll(".tipster-details").forEach(el => el.classList.add("hidden"));
    if (activeTipster === tipster) {
        activeTipster = null;
    } else {
        activeTipster = tipster;
        const details = document.querySelector(`#bets-${tipster}`).closest(".tipster-details");
        details.classList.remove("hidden");
        renderBets(tipsterStats[tipster].bets, tipster);
    }
}

function renderBets(bets, tipster) {
    const tbody = document.getElementById(`bets-${tipster}`);
    tbody.innerHTML = bets.map(bet => {
        let rowClass = bet.Result === "Won" ? "won" : bet.Result === "Lost" ? "lost" : "pending";
        return `
            <tr class="${rowClass}">
                <td>${bet.Date}</td>
                <td>${bet.Match || "-"}</td>
                <td>${bet.Prediction || "-"}</td>
                <td>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</td>
            </tr>`;
    }).join("");
}
