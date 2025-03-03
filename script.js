const tipstersData = [
    { name: "nikosk952", profit: 12.60 },
    { name: "accountant13", profit: 8.50 },
    { name: "spoik", profit: 1.00 },
    { name: "ironroukos", profit: -11.20 },
    { name: "theteacher", profit: -20.00 }
];

function updateLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = "";

    tipstersData.forEach(tipster => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = tipster.name;

        const profitCell = document.createElement("td");
        profitCell.textContent = `€${tipster.profit.toFixed(2)}`;
        profitCell.classList.add(tipster.profit >= 0 ? "profit-positive" : "profit-negative");

        row.appendChild(nameCell);
        row.appendChild(profitCell);
        leaderboardBody.appendChild(row);
    });
}

function populateTipsterButtons() {
    const dropdown = document.getElementById("tipster-dropdown");
    const buttonsContainer = document.getElementById("tipster-buttons");
    
    tipstersData.forEach(tipster => {
        // Dropdown Option
        const option = document.createElement("option");
        option.value = tipster.name;
        option.textContent = tipster.name;
        dropdown.appendChild(option);

        // Sidebar Button
        const button = document.createElement("button");
        button.textContent = tipster.name;
        button.setAttribute("data-filter-type", "tipster");
        button.setAttribute("data-filter-value", tipster.name);
        buttonsContainer.appendChild(button);
    });
}

// Run functions
updateLeaderboard();
populateTipsterButtons();
