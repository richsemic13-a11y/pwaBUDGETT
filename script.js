let budgetData = {
    totalBudget: 0,
    totalExpenses: 0,
    budgetLeft: 0,
    expenses: []
};

let expenseChart = null;
let currentUser = localStorage.getItem("currentUser") || null;

/* =========================
   STORAGE / USER HELPERS
========================= */
function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getBudgetKey() {
    return `budgetData_${currentUser}`;
}

function loadBudgetData() {
    const savedData = JSON.parse(localStorage.getItem(getBudgetKey()));

    budgetData = savedData || {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };
}

function saveBudgetData() {
    if (currentUser) {
        localStorage.setItem(getBudgetKey(), JSON.stringify(budgetData));
    }
}

/* =========================
   DISPLAY HELPERS
========================= */
function showApp() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
}

function showAuth() {
    document.getElementById("authSection").style.display = "flex";
    document.getElementById("appSection").style.display = "none";
}

function setDisplayUsername() {
    const users = getUsers();
    const user = users.find(u => u.email === currentUser);

    if (user) {
        document.getElementById("displayUsername").textContent = `${user.firstName} ${user.lastName}`;
    } else {
        document.getElementById("displayUsername").textContent = "User";
    }
}

function formatCurrency(value) {
    return "₱" + Number(value).toFixed(2);
}

/* =========================
   CHART FUNCTIONS
========================= */
function updateChart() {
    const chartContainer = document.getElementById("chartContainer");

    if (chartContainer.style.display === "none") return;

    const categoryTotals = {};

    budgetData.expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (expenseChart) {
        expenseChart.destroy();
        expenseChart = null;
    }

    if (labels.length === 0) return;

    const ctx = document.getElementById("expenseChart").getContext("2d");

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: [
                        "#4e79a7",
                        "#f28e2b",
                        "#e15759",
                        "#76b7b2",
                        "#59a14f"
                    ]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

/* =========================
   UI RENDER FUNCTIONS
========================= */
function renderExpenseTable() {
    const tableBody = document.getElementById("expenseTableBody");
    tableBody.innerHTML = "";

    if (budgetData.expenses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No expenses yet.</td>
            </tr>
        `;
        return;
    }

    budgetData.expenses.forEach(expense => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", expense.id);

        row.innerHTML = `
            <td class="title-cell">${expense.title}</td>
            <td class="amount-cell">${formatCurrency(expense.amount)}</td>
            <td class="category-cell">${expense.category}</td>
            <td>${expense.date}</td>
            <td class="action-cell text-center">
                <button class="btn btn-sm btn-warning edit-btn mb-1">Edit</button>
                <button class="btn btn-sm btn-success save-btn mb-1" style="display: none;">Save</button>
                <button class="btn btn-sm btn-secondary cancel-btn mb-1" style="display: none;">Cancel</button>
                <button class="btn btn-sm btn-danger delete-btn mb-1">Remove</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function updateSummary() {
    document.getElementById("totalBudget").textContent = formatCurrency(budgetData.totalBudget);
    document.getElementById("totalExpenses").textContent = formatCurrency(budgetData.totalExpenses);
    document.getElementById("budgetLeft").textContent = formatCurrency(budgetData.budgetLeft);
}

function updateUI() {
    updateSummary();
    renderExpenseTable();
    updateChart();
}

/* =========================
   AUTH FUNCTIONS
========================= */
function switchToRegister() {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("registerBox").style.display = "block";

    document.getElementById("loginForm").reset();
    document.getElementById("showLoginPassword").checked = false;
    document.getElementById("loginPassword").type = "password";
}

function switchToLogin() {
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("loginBox").style.display = "block";

    document.getElementById("registerForm").reset();
    document.getElementById("showRegisterPassword").checked = false;
    document.getElementById("registerPassword").type = "password";
    document.getElementById("confirmPassword").type = "password";
}

function registerUser(event) {
    event.preventDefault();

    const firstName = document.getElementById("registerFirstName").value.trim();
    const lastName = document.getElementById("registerLastName").value.trim();
    const number = document.getElementById("registerNumber").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const users = getUsers();

    if (users.find(user => user.email === email)) {
        alert("Email already registered.");
        return;
    }

    users.push({
        firstName,
        lastName,
        number,
        email,
        password
    });

    saveUsers(users);

    alert("Registration successful!");
    switchToLogin();
}

function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert("Invalid email or password.");
        return;
    }

    currentUser = email;
    localStorage.setItem("currentUser", currentUser);

    loadBudgetData();
    setDisplayUsername();
    showApp();
    updateUI();

    document.getElementById("loginForm").reset();
}

function logoutUser() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    showAuth();
}

/* =========================
   BUDGET FUNCTIONS
========================= */
function addBudget(event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById("budget").value);

    if (isNaN(amount) || amount <= 0) {
        alert("Enter valid budget.");
        return;
    }

    budgetData.totalBudget += amount;
    budgetData.budgetLeft += amount;

    saveBudgetData();
    updateUI();

    document.getElementById("budgetForm").reset();
}

function addExpense(event) {
    event.preventDefault();

    const title = document.getElementById("expense").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!title || isNaN(amount) || amount <= 0) {
        alert("Enter valid expense.");
        return;
    }

    if (amount > budgetData.budgetLeft) {
        alert("Not enough budget.");
        return;
    }

    const expense = {
        id: Date.now(),
        title: title,
        amount: amount,
        category: category,
        date: new Date().toLocaleDateString()
    };

    budgetData.expenses.push(expense);
    budgetData.totalExpenses += amount;
    budgetData.budgetLeft -= amount;

    saveBudgetData();
    updateUI();

    document.getElementById("expenseForm").reset();
}

function resetAll() {
    const confirmReset = confirm("Are you sure you want to reset everything?");
    if (!confirmReset) return;

    budgetData = {
        totalBudget: 0,
        totalExpenses: 0,
        budgetLeft: 0,
        expenses: []
    };

    saveBudgetData();
    updateUI();
}

/* =========================
   EXPENSE ACTIONS
========================= */
function enableEditMode(row, expense) {
    row.querySelector(".title-cell").innerHTML = `
        <input type="text" class="form-control form-control-sm edit-title" value="${expense.title}">
    `;

    row.querySelector(".amount-cell").innerHTML = `
        <input type="number" class="form-control form-control-sm edit-amount" value="${expense.amount}">
    `;

    row.querySelector(".category-cell").innerHTML = `
        <select class="form-control form-control-sm edit-category">
            <option ${expense.category === "Food" ? "selected" : ""}>Food</option>
            <option ${expense.category === "Bills" ? "selected" : ""}>Bills</option>
            <option ${expense.category === "Transport" ? "selected" : ""}>Transport</option>
            <option ${expense.category === "Entertainment" ? "selected" : ""}>Entertainment</option>
            <option ${expense.category === "Others" ? "selected" : ""}>Others</option>
        </select>
    `;

    row.querySelector(".edit-btn").style.display = "none";
    row.querySelector(".delete-btn").style.display = "none";
    row.querySelector(".save-btn").style.display = "inline-block";
    row.querySelector(".cancel-btn").style.display = "inline-block";
}

function deleteExpense(expenseIndex) {
    const expense = budgetData.expenses[expenseIndex];

    const confirmDelete = confirm("Delete this expense?");
    if (!confirmDelete) return;

    budgetData.totalExpenses -= expense.amount;
    budgetData.budgetLeft += expense.amount;
    budgetData.expenses.splice(expenseIndex, 1);

    saveBudgetData();
    updateUI();
}

function saveEditedExpense(row, expense) {
    const newTitle = row.querySelector(".edit-title").value.trim();
    const newAmount = parseFloat(row.querySelector(".edit-amount").value);
    const newCategory = row.querySelector(".edit-category").value;

    if (!newTitle || isNaN(newAmount) || newAmount <= 0) {
        alert("Invalid input.");
        return;
    }

    // Remove old values first
    budgetData.totalExpenses -= expense.amount;
    budgetData.budgetLeft += expense.amount;

    if (newAmount > budgetData.budgetLeft) {
        alert("Not enough budget.");

        // Revert old values
        budgetData.totalExpenses += expense.amount;
        budgetData.budgetLeft -= expense.amount;
        return;
    }

    // Update expense data
    expense.title = newTitle;
    expense.amount = newAmount;
    expense.category = newCategory;

    // Apply new values
    budgetData.totalExpenses += newAmount;
    budgetData.budgetLeft -= newAmount;

    saveBudgetData();
    updateUI();
}

function handleExpenseTableActions(event) {
    const row = event.target.closest("tr");
    if (!row) return;

    const expenseId = Number(row.getAttribute("data-id"));
    const expenseIndex = budgetData.expenses.findIndex(exp => exp.id === expenseId);

    if (expenseIndex === -1) return;

    const expense = budgetData.expenses[expenseIndex];

    if (event.target.classList.contains("delete-btn")) {
        deleteExpense(expenseIndex);
        return;
    }

    if (event.target.classList.contains("edit-btn")) {
        enableEditMode(row, expense);
        return;
    }

    if (event.target.classList.contains("save-btn")) {
        saveEditedExpense(row, expense);
        return;
    }

    if (event.target.classList.contains("cancel-btn")) {
        updateUI();
    }
}

/* =========================
   CHART TOGGLE
========================= */
function toggleChart() {
    const chartContainer = document.getElementById("chartContainer");

    if (chartContainer.style.display === "none") {
        chartContainer.style.display = "block";
    } else {
        chartContainer.style.display = "none";
    }

    updateChart();
}

/* =========================
   PASSWORD TOGGLE
========================= */
function toggleLoginPassword() {
    const loginPassword = document.getElementById("loginPassword");
    loginPassword.type = this.checked ? "text" : "password";
}

function toggleRegisterPassword() {
    const registerPassword = document.getElementById("registerPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const inputType = this.checked ? "text" : "password";

    registerPassword.type = inputType;
    confirmPassword.type = inputType;
}

/* =========================
   APP INITIALIZATION
========================= */
function setupEventListeners() {
    // Auth switch
    document.getElementById("showRegister").addEventListener("click", function (event) {
        event.preventDefault();
        switchToRegister();
    });

    document.getElementById("showLogin").addEventListener("click", function (event) {
        event.preventDefault();
        switchToLogin();
    });

    // Password toggles
    document.getElementById("showLoginPassword").addEventListener("change", toggleLoginPassword);
    document.getElementById("showRegisterPassword").addEventListener("change", toggleRegisterPassword);

    // Auth submit
    document.getElementById("registerForm").addEventListener("submit", registerUser);
    document.getElementById("loginForm").addEventListener("submit", loginUser);

    // Main app submit
    document.getElementById("budgetForm").addEventListener("submit", addBudget);
    document.getElementById("expenseForm").addEventListener("submit", addExpense);

    // Buttons
    document.getElementById("logoutBtn").addEventListener("click", logoutUser);
    document.getElementById("resetBtn").addEventListener("click", resetAll);
    document.getElementById("toggleChartBtn").addEventListener("click", toggleChart);

    // Expense table actions
    document.getElementById("expenseTableBody").addEventListener("click", handleExpenseTableActions);
}

function autoLoginIfPossible() {
    if (!currentUser) {
        showAuth();
        return;
    }

    loadBudgetData();
    setDisplayUsername();
    showApp();
    updateUI();
}

document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
    autoLoginIfPossible();
});

// -----------------------------
// PWA INSTALL PROMPT
// -----------------------------
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show Install Button
  const installBtn = document.createElement('button');
  installBtn.textContent = 'Install App';
  installBtn.id = 'installBtn';
  installBtn.className = 'btn btn-success mb-3';
  document.body.prepend(installBtn);

  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
});

// -----------------------------
// REGISTER SERVICE WORKER
// -----------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err));
  });
}