document
  .getElementById("login-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const login = document.getElementById("login-form-login").value;
    const password = document.getElementById("login-form-password").value;

    try {
      const message = document.getElementById("message-login");
      const response = await fetch(`${CONFIG.URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        window.location.href = "pages/home.html";
      } else {
        message.textContent = data.message;
        message.style.opacity = 1;
        setTimeout(() => {
          message.style.opacity = 0;
        }, 3000);
      }
    } catch (error) {
      console.error("❗ Błąd logowania:", error);
    }
  });
