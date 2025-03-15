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
                        allBets.sort((a, b) => parseCustomDate(b["Date"]) - parseCustomDate(a["Date"])); // Sort newest first
                        calculateTipsterStats();
                        displayLeaderboard();
                    }
                });
            });
    });

    function parseCustomDate(dateStr) {
        if (!dateStr) return 0;
        const dateRegex = /(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})/;
        const match = dateStr.match(dateRegex);

        if (!match) return 0;

        const [, day, month, hour, minute] = match.map(Number);
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, month - 1, day, hour, minute).getTime();
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

            const wins = stats.bets.filter(bet => bet.Result === "Won").length;
            const losses = stats.bets.filter(bet => bet.Result === "Lost").length;

            const tipsterButton = document.createElement("button");
            tipsterButton.className = "tipster-button";
            tipsterButton.innerHTML = `
                <strong>${tipster}</strong> 
                <span class="stats-inline">
                    | Bets: ${stats.bets.length} | Wins: ${wins} | Losses: ${losses} | P/L: €${stats.profitLoss.toFixed(2)}
                </span>
            `;

            const picksContainer = document.createElement("div");
            picksContainer.className = "tipster-picks";

            stats.bets.forEach(bet => {
                let rowClass = bet.Result === "Won" ? "won" : bet.Result === "Lost" ? "lost" : "pending";
                const betItem = document.createElement("div");
                betItem.className = `pick-item ${rowClass}`;
                betItem.innerHTML = `<strong>${bet.Date}</strong> - ${bet.Match || "-"} (${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"})`;
                picksContainer.appendChild(betItem);
            });

            tipsterButton.addEventListener("click", () => {
                picksContainer.style.display = picksContainer.style.display === "block" ? "none" : "block";
            });

            tipsterContainer.appendChild(tipsterButton);
            tipsterContainer.appendChild(picksContainer);
            leaderboard.appendChild(tipsterContainer);
        });
    }

function getStatElement(label, value, className) {
    const stat = document.createElement("p");
    stat.className = className;
    stat.innerHTML = `${label}: <span>${value}</span>`;
    return stat;
}

function displayTipsterStats(tipster, stats) {
    const picksContainer = document.createElement("div");
    picksContainer.className = "tipster-picks";
    picksContainer.style.display = "none";

    // Create Stats Section
    picksContainer.appendChild(getStatElement("Total Bets", stats.bets.length, "total-bets"));
    picksContainer.appendChild(getStatElement("Wins", stats.bets.filter(bet => bet.Result === "Won").length, "wins"));
    picksContainer.appendChild(getStatElement("Losses", stats.bets.filter(bet => bet.Result === "Lost").length, "losses"));

    // Profit/Loss styling based on value
    const profitLossClass = stats.profitLoss >= 0 ? "profit" : "loss";
    picksContainer.appendChild(getStatElement("P/L", `€${stats.profitLoss.toFixed(2)}`, profitLossClass));

    return picksContainer;
}
