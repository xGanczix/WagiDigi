import { applyPermissions } from "./permissions.js";

fetch("nav.html")
  .then((response) => response.text())
  .then((data) => {
    document.querySelector("nav").innerHTML = data;

    applyPermissions();

    setTimeout(() => {
      const currentPath = window.location.pathname.split("/").pop();
      const links = document.querySelectorAll(".nav-link");

      links.forEach((link) => {
        const linkHref = link.getAttribute("href");

        const isSamePage =
          linkHref === currentPath ||
          (linkHref === "#" && currentPath === "index.html");

        if (isSamePage) {
          link.classList.add("nav-active");
        }
      });

      const currentTheme = localStorage.getItem("theme") || "light";
      updateThemeIcons(currentTheme);
    }, 0);
  });

const navBtn = document.querySelector("button.nav-button");

navBtn.addEventListener("click", () => {
  const html = document.documentElement;
  const isNowClosed = html.classList.toggle("nav-closed");

  localStorage.setItem("navState", isNowClosed ? "closed" : "open");
});

window.addEventListener("load", () => {
  document.documentElement.classList.add("nav-animated");
});
