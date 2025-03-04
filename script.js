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
        const tipsterContainer = document.createElement("div");
        tipsterContainer.className = "tipster-container";

        const tipsterButton = document.createElement("button");
        tipsterButton.className = "tipster-button";
        tipsterButton.textContent = `${tipster} (€${stats.profitLoss.toFixed(2)})`;

        const picksContainer = document.createElement("div");
        picksContainer.className = "tipster-picks";
        picksContainer.style.display = "none";

        stats.bets.forEach(bet => {
            const betItem = document.createElement("div");
            betItem.className = "pick-item";
            betItem.innerHTML = `
                <strong>${bet.Date}</strong> - ${bet.Match || "-"} 
                <span style="color: yellow;">${bet.Prediction || "-"}</span> 
                (Odds: <strong>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</strong>)
            `;
            picksContainer.appendChild(betItem);
        });

        tipsterButton.addEventListener("click", () => {
            const isExpanded = picksContainer.style.display === "block";
            document.querySelectorAll(".tipster-picks").forEach(p => p.style.display = "none");
            picksContainer.style.display = isExpanded ? "none" : "block";
        });

        tipsterContainer.appendChild(tipsterButton);
        tipsterContainer.appendChild(picksContainer);
        leaderboard.appendChild(tipsterContainer);
    });
}
