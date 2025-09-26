const themeToggleButton = document.getElementById("theme-mode-btn");

const themeIcons = [
  {
    id: "#menu-icon",
    light: "../img/lightgrey/menu-lightgrey.png",
    dark: "../img/white/menu-white.png",
  },
  {
    id: "#theme-icon",
    light: "../img/lightgrey/moon-lightgrey.png",
    dark: "../img/white/sun-white.png",
  },
  {
    id: "#raport-produktow-search-icon",
    light: "../img/lightgrey/magnifier-lightgrey.png",
    dark: "../img/white/magnifier-white.png",
  },
  {
    id: "#raport-produktow-kod-search-icon",
    light: "../img/lightgrey/barcode-lightgrey.png",
    dark: "../img/white/barcode-white.png",
  },
  {
    id: "#logout-icon",
    light: "../img/lightgrey/power-off-lightgrey.png",
    dark: "../img/white/power-off-white.png",
  },
  {
    id: "#logo-icon",
    light: "../img/blue/balance-blue.png",
    dark: "../img/white/balance-white.png",
  },
  {
    id: "#home-icon",
    light: "../img/blue/home-blue.png",
    dark: "../img/white/home-white.png",
  },
  {
    id: "#raport-kasjerow-icon",
    light: "../img/blue/increase-blue.png",
    dark: "../img/white/increase-white.png",
  },
  {
    id: "#raport-etykiet-icon",
    light: "../img/blue/shopping-cart-blue.png",
    dark: "../img/white/shopping-cart-white.png",
  },
  {
    id: "#raport-porownanie-icon",
    light: "../img/blue/compare-blue.png",
    dark: "../img/white/compare-white.png",
  },
  {
    id: "#raport-produktow-icon",
    light: "../img/blue/ham-leg-blue.png",
    dark: "../img/white/ham-leg-white.png",
  },
  {
    id: "#uzytkownicy-icon",
    light: "../img/blue/user-blue.png",
    dark: "../img/white/user-white.png",
  },
  {
    id: "#serwis-icon",
    light: "../img/blue/repair-tool-blue.png",
    dark: "../img/white/repair-tool-white.png",
  },
  {
    id: "#ustawienia-icon",
    light: "../img/blue/settings-blue.png",
    dark: "../img/white/settings-white.png",
  },
  {
    id: "#raport-ilosc-transakcji-icon",
    light: "../img/blue/user-blue.png",
    dark: "../img/blue/user-blue.png",
  },
  {
    id: "#raport-wartosc-transakcji-icon",
    light: "../img/red/money-bag-red.png",
    dark: "../img/red/money-bag-red.png",
  },
  {
    id: "#raport-waga-transakcji-icon",
    light: "../img/green/balance-1-green.png",
    dark: "../img/green/balance-1-green.png",
  },
  {
    id: "#raport-top-dzien-icon",
    light: "../img/iceblue/calendar-iceblue.png",
    dark: "../img/iceblue/calendar-iceblue.png",
  },
  {
    id: "#filtr-icon",
    light: "../img/white/filter-white.png",
    dark: "../img/black/filter-black.png",
  },
  {
    id: "#zatwierdzone-bledy-icon",
    light: "../img/blue/check-blue.png",
    dark: "../img/white/check-white.png",
  },
  {
    id: "#column-info-icon",
    light: "../img/black/information-black.png",
    dark: "../img/white/information-white.png",
  },
];

function updateThemeIcons(mode) {
  themeIcons.forEach((icon) => {
    const el = document.querySelector(icon.id);
    if (el) {
      el.src = mode === "dark" ? icon.dark : icon.light;
    }
  });
}

const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark-mode");
}
updateThemeIcons(savedTheme);

themeToggleButton.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark-mode");
  const newTheme = isDark ? "dark" : "light";
  localStorage.setItem("theme", newTheme);
  updateThemeIcons(newTheme);
});
