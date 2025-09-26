const urlParams = new URLSearchParams(window.location.search);
const uzytkownikId = urlParams.get("uzytkownikId");

async function fetchDaneUzytkownika() {
  const response = await fetch(
    `${CONFIG.URL}/api/uzytkownik-edycja-dane/${uzytkownikId}`
  );
  const data = await response.json();

  const login = data[0].WuLogin;
  const rola = data[0].WURole;
  document.getElementById("dodanie-uzytkownika-form-login").value = login;
  document.getElementById("dodanie-uzytkownika-form-rola").value = rola;
}

// document
//   .getElementById("uzytkownicy-edycja-btn")
//   .addEventListener("click", async function (event) {
//     event.preventDefault();

//     const loginWartosc = document.getElementById(
//       "dodanie-uzytkownika-form-login"
//     ).value;
//     const rolaWartosc = document.getElementById(
//       "dodanie-uzytkownika-form-rola"
//     ).value;

//     try {
//       const response = await fetch(`${CONFIG.URL}`)
//     }
//   });

document.getElementById("uzytkownicy-powrot").addEventListener("click", () => {
  window.location.href = "uzytkownicy.html";
});

document.addEventListener("DOMContentLoaded", () => {
  fetchDaneUzytkownika();
});
