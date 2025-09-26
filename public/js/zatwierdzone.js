async function fetchDataAndCreateChartsAndTable() {
  try {
    const response = await fetch(`${CONFIG.URL}/api/zatwierdzone-bledy`);
    const data = await response.json();

    const tableBody = document.querySelector("#zatwierdzone-bledy tbody");
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

      const dateObjOpis = new Date(row.DataOpisu);
      const formattedDateOpis = dateObj.toLocaleDateString("pl-PL");

      const timeObjOpis = new Date(row.CzasOpisu);
      const formattedTimeOpis = timeObj.toLocaleTimeString("pl-PL", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      tr.innerHTML = `
          <td class="red-color">${row.Wartosc} zł</td>
          <td>${row.PSNazwa}</td>
          <td>${row.ItemName}</td>
          <td>${formattedDate}<br><span id="report-hours-color">${formattedTime}</span></td>
          <td>${row.ClerkNumber}</td>
          <td><textarea class="opis" rows="4" disabled>${row.Description}</textarea></td>
          <td>${formattedDateOpis}<br><span id="report-hours-color">${formattedTimeOpis}<span></td>
          <td>${row.Author}</td>
        `;

      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
  }
}

window.onload = async function () {
  await fetchDataAndCreateChartsAndTable();
};
