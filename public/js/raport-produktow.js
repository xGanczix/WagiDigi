const dataStart = document.getElementById("raport-produktow-start-date");
const dataKoniec = document.getElementById("raport-produktow-end-date");

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = new Date();
const weekBefore = new Date(today);
weekBefore.setDate(today.getDate() - 7);

const formattedToday = formatDateToYYYYMMDD(today);
const formattedWeekBefore = formatDateToYYYYMMDD(weekBefore);

dataKoniec.value = formattedToday;
// dataStart.value = formattedWeekBefore;

const searchInput = document.getElementById("raport-produktow-nazwa-search");
const searchCodeInput = document.getElementById("raport-produktow-kod-search");
const resultsList = document.getElementById("raport-produktow-nazwa-results");
const resultsListCode = document.getElementById("raport-produktow-kod-results");

async function fetchAndDisplayResults(query) {
  if (!query) {
    document.getElementById("raport-produktow-nazwa-results").style.display =
      "none";
    resultsList.innerHTML = "";
    return;
  }
  try {
    const response = await fetch(
      `/api/raporty/pobranie-towarow-pcm-nazwa?search=${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) throw new Error("Błąd sieci");
    const data = await response.json();
    document.getElementById("raport-produktow-nazwa-results").style.display =
      "block";
    resultsList.innerHTML = data
      .map(
        (item) =>
          `<li data-kod="${item.Kod}" class="raport-produktow-item" data-nazwa="${item.Nazwa}">${item.Nazwa} (${item.Kod})</li>`
      )
      .join("");
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    resultsList.innerHTML = "";
  }
}

async function fetchAndDisplayResultsCode(query) {
  if (!query) {
    document.getElementById("raport-produktow-kod-results").style.display =
      "none";
    resultsListCode.innerHTML = "";
    return;
  }
  try {
    const response = await fetch(
      `/api/raporty/pobranie-towarow-pcm-kod?search=${encodeURIComponent(
        query
      )}`
    );
    if (!response.ok) throw new Error("Błąd sieci");
    const data = await response.json();
    document.getElementById("raport-produktow-kod-results").style.display =
      "block";
    resultsListCode.innerHTML = data
      .map(
        (item) =>
          `<li data-kod="${item.Kod}" class="raport-produktow-item" data-nazwa="${item.Nazwa}">${item.Kod} (${item.Nazwa})</li>`
      )
      .join("");
  } catch (error) {
    console.error("Błąd podczas pobierania danych:", error);
    resultsListCode.innerHTML = "";
  }
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  fetchAndDisplayResults(query);
});

searchCodeInput.addEventListener("input", () => {
  const query = searchCodeInput.value.trim();
  fetchAndDisplayResultsCode(query);
});

resultsList.addEventListener("click", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  searchInput.value = li.dataset.nazwa;
  searchCodeInput.value = li.dataset.kod;
  resultsList.innerHTML = "";
});

resultsListCode.addEventListener("click", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  searchInput.value = li.dataset.nazwa;
  searchCodeInput.value = li.dataset.kod;
  resultsListCode.innerHTML = "";
});

document
  .getElementById("raport-produktow-search-reset")
  .addEventListener("click", () => {
    searchInput.value = "";
    searchCodeInput.value = "";
  });

async function fetchProductReport() {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const kod = searchCodeInput.value;

    const response = await fetch(
      `${CONFIG.URL}/api/raporty/produkty-sprzedaz-dzien?kod=${kod}&start=${dataStartValue}&end=${dataKoniecValue}`
    );
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      alert("Brak danych do wyświetlenia.");
      return;
    }

    const cleanedItemName = data[0].ItemName.trim().replace(/\s+/g, " ");

    const chartData = {
      dates: data.map((item) => item.Data.slice(0, 10)), // tylko YYYY-MM-DD
      prices: data.map((item) => item.TotalPrice),
    };

    const options = {
      chart: {
        type: "area",
        height: 350,
      },
      series: [
        {
          name: cleanedItemName,
          data: chartData.prices,
        },
      ],
      stroke: {
        curve: "smooth",
        width: 3,
      },
      fill: {
        type: "solid",
        opacity: 0.3,
      },
      colors: ["#1b98ff"],
      xaxis: {
        categories: chartData.dates,
        title: {
          text: "Data",
        },
      },
      yaxis: {
        title: {
          text: "Wartość sprzedaży (TotalPrice)",
        },
      },
      title: {
        text: `Sprzedaż: ${cleanedItemName}`,
        align: "center",
      },
      tooltip: {
        y: {
          formatter: (val) => `${val.toFixed(2)} zł`,
        },
      },
    };

    const chartContainer = document.getElementById(
      "product-line-chart-container"
    );
    chartContainer.innerHTML = "";

    const chart = new ApexCharts(chartContainer, options);
    chart.render();
  } catch (err) {
    console.error("Błąd podczas pobierania raportu produktów: ", err);
    alert("Wystąpił błąd przy pobieraniu danych.");
  }
}

document
  .getElementById("raport-produktow-search-report")
  .addEventListener("click", () => {
    let kod = searchCodeInput.value;
    if (!kod) {
      alert("Wybierz produkt po nazwie lub kodzie");
      return;
    } else if (kod.length != 13) {
      alert("Kod jest niepoprawny! Musi posiadać 13 znaków");
    } else if (dataStart.value > dataKoniec.value) {
      alert("Data początkowa nie może być większa od daty końcowej");
    } else {
      fetchProductReport();
    }
  });

document.addEventListener("DOMContentLoaded", fetchProductReport());
