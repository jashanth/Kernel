// ✅ Check authentication before allowing access to pages
async function checkAuth() {
    try {
        console.log("Checking auth...");
        const response = await fetch("/api/auth-check", { 
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        console.log("Auth check response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`Auth check failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Auth check data:", data);

        if (!data.isAuthenticated) {
            console.log("Not authenticated, redirecting to login");
            localStorage.removeItem("isAuthenticated");
            window.location.href = "login.html";
        } else {
            console.log("Authentication confirmed for:", data.username);
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("username", data.username);
            localStorage.setItem("user", data.username); // Added this for compatibility
        }
    } catch (error) {
        console.error("Auth check error:", error);
        // Don't redirect immediately on error - consider network issues
        // Instead, check localStorage as fallback
        if (!localStorage.getItem("isAuthenticated")) {
            console.log("No local auth token, redirecting to login");
            window.location.href = "login.html";
        }
    }
}

// ✅ Run auth check only if not on login or signup page
if (!window.location.pathname.includes("login.html") && !window.location.pathname.includes("signup.html")) {
    checkAuth();
}

// ✅ Handle Signup
document.getElementById("signupForm")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("signupUsername").value;
    const password = document.getElementById("signupPassword").value;
    const balance = parseFloat(document.getElementById("signupBalance").value);
    const income = parseFloat(document.getElementById("signupIncome").value);

    if (!username || !password || isNaN(balance) || isNaN(income)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, balance, income })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Signup successful! Redirecting to login...");
        window.location.href = "login.html";
    } else {
        alert(data.message || "Signup failed! Username might already be taken.");
    }
});

// ✅ Handle Login
document.getElementById("loginForm")?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("username", username);
            localStorage.setItem("user", username); // Added this for compatibility
            
            // Store financial data
            if (data.balance !== undefined) {
                localStorage.setItem("totalBalance", data.balance);
            }
            if (data.income !== undefined) {
                localStorage.setItem("totalIncome", data.income);
            }
            
            window.location.href = "index.html"; // ✅ Redirect to main page after login
        } else {
            alert(data.message || "Invalid credentials! Please try again.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login. Please try again.");
    }
});
// ✅ Handle Logout
document.getElementById("logoutBtn")?.addEventListener("click", async function () {
    await fetch("/api/logout", { method: "POST", credentials: "include" });

    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("user"); // Added this for compatibility
    window.location.href = "login.html";
});