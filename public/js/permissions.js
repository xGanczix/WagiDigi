function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Błąd dekodowania tokena", e);
    return null;
  }
}

function applyPermissions() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const decoded = parseJwt(token);
  if (!decoded || !decoded.role) return;

  const roleId = Number(decoded.role);

  const raportKasjerow = document.getElementById("raport-kasjerow");
  const raportEtykiet = document.getElementById("raport-etykiet");
  const raportPorownanie = document.getElementById("raport-porownanie");
  const uzytkownicy = document.getElementById("nav-uzytkownicy");
  const serwis = document.getElementById("serwis");
  const ustawienia = document.getElementById("ustawienia");

  if (roleId === 1) {
    raportKasjerow.style.display = "flex";
    raportEtykiet.style.display = "flex";
    raportPorownanie.style.display = "flex";
    uzytkownicy.style.display = "flex";
    ustawienia.style.display = "flex";
  } else if (roleId === 2) {
    raportKasjerow.style.display = "flex";
    raportEtykiet.style.display = "flex";
    raportPorownanie.style.display = "flex";
    uzytkownicy.style.display = "flex";
    serwis.style.display = "flex";
    ustawienia.style.display = "flex";
  } else if (roleId === 3) {
    raportKasjerow.style.display = "flex";
    raportEtykiet.style.display = "flex";
    raportPorownanie.style.display = "flex";
  } else if (roleId === 4) {
    raportPorownanie.style.display = "flex";
  }
}

export { applyPermissions };
