document.addEventListener("DOMContentLoaded", function () {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQhc8Xcasi8_LyoO8J1Cltv0yLzRGkYnKYk6rQhox4-dcyHgj0ZPAtY5IJ-rHtr48K80vOyyFnrkjto/pub?output=csv";
    let allBets = [];

    // Function to normalize date format (assumes manually entered dates)
    function formatDate(dateString) {
        if (!dateString) return "-";
        return dateString.replace(/(\d{2})\/(\d{2})/, "20$2-$1"); // Converts "17/02" to "2024-02-17"
    }

    function fetchData() {
        fetch(csvUrl)
            .then(response => response.text())
            .then(csvData => {
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        console.log("Parsed CSV Data:", results.data);
                        console.log("Parsed CSV Headers:", Object.keys(results.data[0])); 

                        // Ensure correct column names and filter empty Date & Time values
                        allBets = results.data.filter(bet => bet["Date & Time"] && bet["Date & Time"].trim() !== "");

                        renderBets(allBets);
                    },
                    error: function (error) {
                        console.error("CSV Parse Error:", error);
                    }
                });
            })
            .catch(error => console.error("Fetch Error:", error));
    }

    function renderBets(bets) {
        const tbody = document.getElementById("bets-list");
        if (!tbody) {
            console.error("Table body #bets-list not found!");
            return;
        }

        tbody.innerHTML = bets.map(bet => {
            let rowClass = bet.Status === "Won" ? "won" : bet.Status === "Lost" ? "lost" : "pending";
            return `
                <tr class="${rowClass}">
                    <td>${formatDate(bet["Date & Time"])}</td>
                    <td>${bet.Match || "-"}</td>
                    <td>${bet.Prediction || "-"}</td>
                    <td>${bet.Odds ? parseFloat(bet.Odds).toFixed(2) : "-"}</td>
                    <td>${bet.Stake || "-"}</td>
                    <td>${bet.Result || "-"}</td>
                    <td>${bet["Profit/Loss"] ? '€' + bet["Profit/Loss"] : "-"}</td>
                </tr>
            `;
        }).join("");

        updateStats(bets);
    }

    function updateStats(bets) {
        const totalBets = bets.length;
        const wonBets = bets.filter(bet => bet.Status === "Won").length;
        const lostBets = bets.filter(bet => bet.Status === "Lost").length;
        const profitLoss = bets.reduce((sum, bet) => sum + (parseFloat(bet["Profit/Loss"]) || 0), 0);

        document.getElementById("total-bets").textContent = totalBets;
        document.getElementById("won-bets").textContent = wonBets;
        document.getElementById("lost-bets").textContent = lostBets;
        document.getElementById("profit-loss").textContent = `€${profitLoss.toFixed(2)}`;
    }

    fetchData();
});
