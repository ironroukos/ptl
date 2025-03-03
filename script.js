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
        .then((response) => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then((csvData) => {
            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (!results.data.length) {
                        console.error("❌ CSV is empty or malformed");
                        return;
                    }

                    allBets = results.data.filter(bet => bet["Date"] && bet["Date"].trim() !== "");

                    // ✅ Sort by Date (Newest to Oldest)
                    allBets.sort((a, b) => {
                        let dateA = new Date(a["Date"] + " " + (a["Time"] || "00:00"));
                        let dateB = new Date(b["Date"] + " " + (b["Time"] || "00:00"));
                        return dateB - dateA;
                    });

                    calculateTipsterStats();
                    applyFilters();
                },
                error: (err) => console.error("❌ CSV Parse Error:", err),
            });
        })
        .catch((error) => console.error("❌ Fetch Error:", error));
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
    if (!tbody) {
        console.error("❌ Table body #bets-list not found!");
        return;
    }

    tbody.innerHTML = bets
        .map((bet) => {
            let rowClass = bet.Result === "Won" ? "won" : bet.Result === "Lost" ? "lost" : "pending";
            return `
                <tr class="${rowClass}">
                    <td>${bet["Date"]}</td>
                    <td>${bet["Match"] || "-"}</td>
                    <td>${bet["Prediction"] || "-"}</td>
                    <td>${bet["Odds"] ? parseFloat(bet["Odds"]).toFixed(2) : "-"}</td>
                </tr>
            `;
        })
        .join("");
}

function updateStats(bets) {
    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter((bet) => bet.Result === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter((bet) => bet.Result === "Lost").length;
    
    const totalProfit = bets.reduce((sum, bet) => sum + (parseFloat(bet["Profit/Loss"]) || 0), 0).toFixed(2);
    document.getElementById("profit-loss").textContent = `€${totalProfit}`;
}

function calculateTipsterStats() {
    tipsterStats = {};

    allBets.forEach((bet) => {
        if (!tipsterStats[bet.Tipster]) {
            tipsterStats[bet.Tipster] = { profitLoss: 0 };
        }
        tipsterStats[bet.Tipster].profitLoss += parseFloat(bet["Profit/Loss"]) || 0;
    });

    // Sort tipsters by profit (highest to lowest)
    let sortedTipsters = Object.entries(tipsterStats).sort((a, b) => b[1].profitLoss - a[1].profitLoss);

    // Update leaderboard buttons
    document.querySelectorAll(".sidebar button").forEach((button) => {
        const tipster = button.dataset.filterValue;
        const tipsterData = tipsterStats[tipster];

        if (tipsterData) {
            button.innerHTML = `${tipster} (€${tipsterData.profitLoss.toFixed(2)})`;
        }
    });

    console.log("✅ Tipster Stats Updated:", tipsterStats);
}
