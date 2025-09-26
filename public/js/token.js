async function checkAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${CONFIG.URL}/api/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
  } catch (error) {
    console.warn("Błąd autoryzacji:", error.message);
    redirectToLogin();
  }
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "error-token.html";
}

document.addEventListener("DOMContentLoaded", checkAuth);

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Błąd dekodowania tokena", e);
    return null;
  }
}

const token = localStorage.getItem("token");

if (token) {
  const decoded = parseJwt(token);
  if (decoded.userId && decoded.login) {
    document.getElementById("username").textContent = decoded.login;
  } else {
    document.getElementById("username").textContent = "Pinnex-Info";
  }
}
