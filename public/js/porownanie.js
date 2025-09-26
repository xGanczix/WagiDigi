async function fetchPorownanie() {
  try {
    const response = await fetch(`${CONFIG.URL}/api/porownanie-sprzedazy`);
    const data = await response.json();

    const tableBody = document.querySelector("#porownanie-sprzedazy tbody");
    tableBody.innerHTML = "";

    data.forEach((row) => {
      const tr = document.createElement("tr");

      const dateObj = new Date(row.Data);
      const formattedDate = dateObj.toLocaleDateString("pl-PL");

      const timeObj = new Date(row.Czas);
      const formattedTime = timeObj.toLocaleTimeString("pl-PL", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      tr.innerHTML = `
    <td class="column-roznica-120 red-color">${row.Wartosc} zł</td>
    <td>${row.PSNazwa}</td>
    <td>${row.Kod}</td>
    <td>${formattedDate}<br/><span id="report-hours-color">${formattedTime}</span></td>
    <td class="column-roznica-120">${row.ClerkNumber}</td>
    <td>
      <textarea placeholder="Opis sytuacji" class="opis" rows="4" id="description-${row.WagaId}"></textarea>
    </td>
    <td class="column-action-btns">
      <button onclick="handleSaveDescription(${row.WagaId})" class="opis-zapisz">Zapisz</button>
    </td>
  `;

      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

async function handleSaveDescription(reportId) {
  const textarea = document.getElementById(`description-${reportId}`);
  const description = textarea.value.trim();

  if (description) {
    await saveDescription(reportId, description);
  } else {
    alert("Opis nie może być pusty.");
  }
}

async function saveDescription(reportId, description) {
  try {
    const username = document.getElementById("username").textContent;
    console.log(username);

    const response = await fetch(
      `${CONFIG.URL}/api/porownanie-sprzedazy-opis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId, description, username }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      window.location.reload();
    } else {
      alert("Błąd: " + data.message);
    }
  } catch (error) {
    console.error("Błąd podczas zapisywania opisu:", error);
    alert("Wystąpił błąd podczas zapisywania opisu.");
  }
}

window.onload = async function () {
  await fetchPorownanie();
};
