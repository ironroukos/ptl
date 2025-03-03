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
                    allBets.sort((a, b) => parseCustomDate(b["Date"]) - parseCustomDate(a["Date"])); // Sort newest first
                    calculateTipsterStats();
                    displayLeaderboard();
                }
            });
        });
});

// Function to parse different date formats manually
function parseCustomDate(dateStr) {
    const datePatterns = [
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // D-M-YYYY or DD-MM-YYYY
        /(\d{1,2})\s([A-Za-z]+)\s(\d{4})/ // D Month YYYY (e.g., 1 March 2024)
    ];

    for (let pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
            let day, month, year;

            if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
                day = parseInt(match[1], 10);
                month = parseInt(match[2], 10) - 1;
                year = parseInt(match[3], 10);
            } else if (pattern === datePatterns[2]) {
                day = parseInt(match[1], 10);
                month = new Date(`${match[2]} 1, 2024`).getMonth();
                year = parseInt(match[3], 10);
            }

            return new Date(year, month, day);
        }
    }
    return null; // Return null if no valid format is found
}

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

        // Add total bets count
        const totalBets = document.createElement("div");
        totalBets.className = "total-bets";
        totalBets.textContent = `Total Bets: ${stats.bets.length}`;
        picksContainer.appendChild(totalBets);

        stats.bets.forEach(bet => {
            let rowClass = bet.Result === "Won" ? "won" : bet.Result === "Lost" ? "lost" : "pending";
            const betItem = document.createElement("div");
            betItem.className = `pick-item ${rowClass}`;
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
