let allBets = [];
let activeFilters = { sport: "all", tipster: "all" };

// Fetch CSV data and initialize bets
fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv")
    .then(response => response.text())
    .then(csvData => {
        allBets = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
        }).data;

        allBets.sort((a, b) => new Date(b.Date) - new Date(a.Date)); // Sort by date (newest first)
        applyFilters(); // Apply filters on initial load
    })
    .catch(error => console.error("Error loading bets:", error));

// Function to apply filters and update the table
function filterBets(type, value) {
    activeFilters[type] = activeFilters[type] === value ? "all" : value;
    applyFilters();
}

// Function to filter and display bets
function applyFilters() {
    const filteredBets = allBets.filter(bet => {
        const sportMatch = activeFilters.sport === "all" || bet.Sport === activeFilters.sport;
        const tipsterMatch = activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster;
        return sportMatch && tipsterMatch;
    });

    renderBets(filteredBets);
    updateStats(filteredBets);
}

// Function to calculate profit/loss
function calculateProfitLoss(bet) {
    if (bet.Result === "Won") return (bet.Stake * (bet.Odds - 1)).toFixed(2);
    if (bet.Result === "Lost") return (-bet.Stake).toFixed(2);
    return "-"; // Pending
}

// Function to update statistics
function updateStats(bets) {
    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter(bet => bet.Result === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter(bet => bet.Result === "Lost").length;
    document.getElementById("profit-loss").textContent = bets.reduce((sum, bet) => sum + parseFloat(calculateProfitLoss(bet)), 0).toFixed(2) + "€";
}

// Function to render bets in the table
function renderBets(bets) {
    const tableBody = document.getElementById("bets-list");
    if (!tableBody) return; // Prevent errors if table is missing

    tableBody.innerHTML = bets.map(bet => `
        <tr class="${bet.Result.toLowerCase()}">
            <td>${bet.Date}</td>
            <td>${bet.Match}</td>
            <td>${bet.Prediction}</td>
            <td>${bet.Odds.toFixed(2)}</td>
            <td>${bet.Stake}</td>
            <td>${bet.Result}</td>
            <td>${calculateProfitLoss(bet)}€</td>
        </tr>
    `).join("");
}
