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
            console.log("✅ Raw CSV Data:", csvData);

            Papa.parse(csvData, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("✅ Parsed CSV Data:", results.data);

                    if (!results.data.length) {
                        console.error("❌ CSV is empty or malformed");
                        return;
                    }

                    if (!results.data[0]["Date"] || !results.data[0]["Match"]) {
                        console.error("❌ Column names do not match expected structure!");
                        return;
                    }

                    allBets = results.data.filter(bet => bet["Date"] && bet["Date"].trim() !== "");
                    console.log("📊 Filtered Bets:", allBets);

                    allBets.sort((a, b) => Date.parse(b["Date"]) - Date.parse(a["Date"]));

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
    console.log("📊 Applying Filters, Active Tipster:", activeFilters.tipster);
    
    const filteredBets = allBets.filter(bet => {
        return activeFilters.tipster === "all" || bet.Tipster === activeFilters.tipster;
    });

    console.log("✅ Bets After Filtering:", filteredBets);
    renderBets(filteredBets);
    updateStats(filteredBets);
}

function renderBets(bets) {
    console.log("📝 Rendering Bets:", bets);

    const tbody = document.getElementById("bets-list");
    if (!tbody) {
        console.error("❌ Table body #bets-list not found!");
        return;
    }

    tbody.innerHTML = bets
        .map((bet) => {
            let rowClass = bet.Status === "Won" ? "won" : bet.Status === "Lost" ? "lost" : "pending";
            return `
                <tr class="${rowClass}">
                    <td>${bet["Date"]}</td>
                    <td>${bet.Match || "-"}</td>
                    <td>${bet.Prediction || "-"}</td>
                    <td>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</td>
                </tr>
            `;
        })
        .join("");

    console.log("✅ Table Updated!");
}

function updateStats(bets) {
    console.log("📊 Updating Stats for Bets:", bets.length);

    document.getElementById("total-bets").textContent = bets.length;
    document.getElementById("won-bets").textContent = bets.filter((bet) => bet.Result === "Won").length;
    document.getElementById("lost-bets").textContent = bets.filter((bet) => bet.Result === "Lost").length;
    
    const totalProfit = bets.reduce((sum, bet) => sum + (parseFloat(bet["Profit/Loss"]) || 0), 0).toFixed(2);
    document.getElementById("profit-loss").textContent = `€${totalProfit}`;
}

function calculateTipsterStats() {
    tipsterStats = {};
    console.log("📊 Calculating Tipster Stats...");

    allBets.forEach((bet) => {
        if (!tipsterStats[bet.Tipster]) {
            tipsterStats[bet.Tipster] = { profitLoss: 0 };
        }
        tipsterStats[bet.Tipster].profitLoss += parseFloat(bet["Profit/Loss"]) || 0;
    });

    document.querySelectorAll(".sidebar button").forEach((button) => {
        const tipster = button.dataset.filterValue;
        if (tipsterStats[tipster]) {
            button.innerHTML = `${tipster} (€${tipsterStats[tipster].profitLoss.toFixed(2)})`;
        }
    });

    console.log("✅ Tipster Stats Updated:", tipsterStats);
}
