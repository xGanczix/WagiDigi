document.getElementById("uzytkownicy-powrot").addEventListener("click", () => {
  window.location.href = "uzytkownicy.html";
});

const message = document.getElementById("message");

const login = document.getElementById("dodanie-uzytkownika-form-login");
const haslo = document.getElementById("dodanie-uzytkownika-form-haslo");
const haslo1 = document.getElementById("dodanie-uzytkownika-form-haslo1");
const rola = document.getElementById("dodanie-uzytkownika-form-rola");

document
  .getElementById("dodanie-uzytkownika-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const loginWartosc = login.value;
    const hasloWartosc = haslo.value;
    const haslo1Wartosc = haslo1.value;
    const rolaWartosc = rola.value;

    if (hasloWartosc === haslo1Wartosc) {
      try {
        const response = await fetch(`${CONFIG.URL}/api/uzytkownik-dodanie`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loginWartosc,
            hasloWartosc,
            rolaWartosc,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          window.location.href = "uzytkownicy.html";
        } else {
          message.textContent =
            data.error || "Wystąpił błąd przy dodawaniu użytkownika";
          console.log("Błąd przy dodawaniu użytkownika: ", data.error);
          message.style.opacity = 1;
          setTimeout(() => {
            message.style.opacity = 0;
          }, 3000);
        }
      } catch (err) {
        message.textContent = "Wystąpił błąd przy dodawaniu użytkownika";
        message.style.opacity = 1;
        setTimeout(() => {
          message.style.opacity = 0;
        }, 3000);
        console.log("Błąd przy dodawaniu użytkownika: ", err);
      }
    } else {
      message.textContent = "Hasła nie są zgodne!";
      message.style.opacity = 1;
      setTimeout(() => {
        message.style.opacity = 0;
      }, 3000);
    }
  });
