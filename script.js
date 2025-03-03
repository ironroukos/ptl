let allBets = [];
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
                    allBets = results.data.filter(bet => bet["Date"] && bet["Date"].trim() !== "");
                    allBets.sort((a, b) => Date.parse(b["Date"]) - Date.parse(a["Date"]));
                    calculateTipsterStats();
                    renderLeaderboard();
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

function renderLeaderboard() {
    const leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";
    
    const sortedTipsters = Object.entries(tipsterStats).sort((a, b) => b[1].profitLoss - a[1].profitLoss);
    
    sortedTipsters.forEach(([tipster, data]) => {
        const tipsterElement = document.createElement("div");
        tipsterElement.classList.add("tipster");
        
        tipsterElement.innerHTML = `
            <div class="tipster-header" onclick="toggleTipster('${tipster}')">
                ${tipster} (€${data.profitLoss.toFixed(2)})
            </div>
            <div class="tipster-bets" id="${tipster}-bets" style="display: none;">
                ${renderBets(data.bets)}
            </div>
        `;
        
        leaderboard.appendChild(tipsterElement);
    });
}

function renderBets(bets) {
    return `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Match</th>
                    <th>Prediction</th>
                    <th>Odds</th>
                </tr>
            </thead>
            <tbody>
                ${bets.map(bet => `
                    <tr class="${bet.Result.toLowerCase()}">
                        <td>${bet.Date}</td>
                        <td>${bet.Match || "-"}</td>
                        <td>${bet.Prediction || "-"}</td>
                        <td>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function toggleTipster(tipster) {
    const betsContainer = document.getElementById(`${tipster}-bets`);
    betsContainer.style.display = betsContainer.style.display === "none" ? "block" : "none";
}
