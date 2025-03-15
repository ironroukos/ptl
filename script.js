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
        picksContainer.style.display = "none";

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
            picksContainer.style.display =
