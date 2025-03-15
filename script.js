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

allBets.sort((a, b) => parseCustomDate(b["Date"]) - parseCustomDate(a["Date"]));

function parseCustomDate(dateStr) {
  if (!dateStr) return 0; // Handle empty values
  const dateRegex = /(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})/;
  const match = dateStr.match(dateRegex);
  if (!match) return 0; // Skip invalid dates
  const [, day, month, hour, minute] = match.map(Number);
  const currentYear = new Date().getFullYear(); // Assume current year
  return new Date(currentYear, month - 1, day, hour, minute).getTime();
}

function calculateTipsterStats() {
  tipsterStats = {};
  allBets.forEach(bet => {
    if (!tipsterStats[bet.Tipster]) {
      tipsterStats[bet.Tipster] = {
        profitLoss: 0,
        bets: [],
        wins: 0,
        losses: 0
      };
    }
    tipsterStats[bet.Tipster].profitLoss += parseFloat(bet["Profit/Loss"]) || 0;
    tipsterStats[bet.Tipster].bets.push(bet);
    
    // Count only wins and losses
    if (bet.Result === "Won") {
      tipsterStats[bet.Tipster].wins++;
    } else if (bet.Result === "Lost") {
      tipsterStats[bet.Tipster].losses++;
    }
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
    
    // Create a flex container for the button content
    tipsterButton.style.display = "flex";
    tipsterButton.style.justifyContent = "space-between";
    tipsterButton.style.width = "100%";
    tipsterButton.style.textAlign = "left";
    
    // Create spans for tipster name and stats
    const tipsterName = document.createElement("span");
    tipsterName.textContent = tipster;
    
    const tipsterStats = document.createElement("span");
    tipsterStats.textContent = `${stats.bets.length} bets | ${stats.wins}W ${stats.losses}L | P/L: €${stats.profitLoss.toFixed(2)}`;
    tipsterStats.style.textAlign = "right";
    
    // Add spans to button
    tipsterButton.appendChild(tipsterName);
    tipsterButton.appendChild(tipsterStats);
    
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
      betItem.innerHTML = `<strong>${bet.Date}</strong> - ${bet.Match || "-"} <span style="color: yellow;">${bet.Prediction || "-"}</span> (Odds: <strong>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</strong>)`;
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
