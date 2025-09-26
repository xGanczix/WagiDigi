document.getElementById("logout").addEventListener("click", async function () {
  let login = document.getElementById("username").innerText;
  if (login === null || login === "") {
    login = "SERWIS";
  }
  try {
    await fetch(`${CONFIG.URL}/api/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login,
      }),
    });
  } catch (err) {
    console.err("Błąd podczas wylogowywania użytkownika");
  }
});

document.getElementById("logout").addEventListener("click", async function () {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
});
