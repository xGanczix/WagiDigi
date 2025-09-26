const dataStart = document.getElementById("filtr-data-start");
const dataKoniec = document.getElementById("filtr-data-koniec");

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCssVariable(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

const today = new Date();
const weekBefore = new Date(today);
weekBefore.setDate(today.getDate() - 7);

const formattedToday = formatDateToYYYYMMDD(today);
const formattedWeekBefore = formatDateToYYYYMMDD(weekBefore);

dataKoniec.value = formattedToday;
dataStart.value = formattedWeekBefore;

let chartTopProdukty = null;
let chartTopKasjerzy = null;
let chartTopGodziny = null;
let chartWagaDzienna = null;
let chartWagi = null;

function getCssVariable(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

function downloadCSV(filename, rows) {
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadPDF(filename, headers, rows) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(filename.replace(".pdf", ""), 14, 20);

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [40, 167, 69] },
  });

  doc.save(filename);
}

function usunPolskieZnaki(tekst) {
  return tekst
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/Ą/g, "A")
    .replace(/Ć/g, "C")
    .replace(/Ę/g, "E")
    .replace(/Ł/g, "L")
    .replace(/Ń/g, "N")
    .replace(/Ó/g, "O")
    .replace(/Ś/g, "S")
    .replace(/Ź/g, "Z")
    .replace(/Ż/g, "Z");
}

async function fetchTopProdukty(pobierzCSV = false, pobierzPDF = false) {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/top-produkty-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    if (pobierzCSV) {
      const rows = [["NazwaTowaru", "SumaWaga"]];
      data.forEach((item) => rows.push([item.NazwaTowaru, item.SumaWaga]));
      downloadCSV(
        `top_produkty_${dataStart.value}-${dataKoniec.value}.csv`,
        rows
      );
      return;
    }

    if (pobierzPDF) {
      const headers = ["NazwaTowaru", "SumaWaga"];
      const rows = data.map((item) => [
        usunPolskieZnaki(item.NazwaTowaru),
        item.SumaWaga,
      ]);
      downloadPDF(
        `top_produkty_${dataStart.value}-${dataKoniec.value}.pdf`,
        headers,
        rows
      );
      return;
    }

    const nazwaTowaru = data.map((item) => item.NazwaTowaru);
    const sumaWaga = data.map((item) => item.SumaWaga);

    const colorStart = getCssVariable("--chart1");
    const colorEnd = getCssVariable("--chart2");

    const options = {
      chart: { type: "bar" },
      series: [
        {
          name: "Suma Wag Towarów (kg)",
          data: sumaWaga,
        },
      ],
      xaxis: { categories: nazwaTowaru },
      title: { text: "Top 3 - Towary" },
      dataLabels: {
        enabled: true,
        formatter: (val) => parseFloat(val).toFixed(3),
      },
      legend: { show: false },
      colors: [colorStart],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          type: "vertical",
          gradientToColors: [colorEnd],
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
    };

    if (chartTopProdukty) chartTopProdukty.destroy();

    chartTopProdukty = new ApexCharts(
      document.querySelector("#top-produkty"),
      options
    );
    chartTopProdukty.render();
  } catch (err) {
    console.error(
      "Błąd podczas pobierania danych do wykresu Top Produkty: ",
      err
    );
  }
}

async function fetchTopKasjerzy(pobierzCSV = false, pobierzPDF = false) {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/top-kasjerzy-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    if (pobierzCSV) {
      const rows = [["NumerKasjera", "IloscEtykiet"]];
      data.forEach((item) => rows.push([item.NumerKasjera, item.IloscEtykiet]));
      downloadCSV(
        `top_kasjerzy_${dataStart.value}-${dataKoniec.value}.csv`,
        rows
      );
      return;
    }

    if (pobierzPDF) {
      const headers = ["NumerKasjera", "IloscEtykiet"];
      const rows = data.map((item) => [item.NumerKasjera, item.IloscEtykiet]);
      downloadPDF(
        `top_kasjerzy_${dataStart.value}-${dataKoniec.value}.pdf`,
        headers,
        rows
      );
      return;
    }

    const numerKasjera = data.map((item) => item.NumerKasjera);
    const IloscEtykiet = data.map((item) => item.IloscEtykiet);

    const color1 = getCssVariable("--chart1");
    const color2 = getCssVariable("--chart2");
    const color3 = getCssVariable("--chart3");
    const color4 = getCssVariable("--chart4");
    const textColor = getCssVariable("--text-first");
    const container = getCssVariable("--container");

    const options = {
      chart: {
        type: "donut",
        height: "90%",
      },
      stroke: {
        colors: container,
      },
      series: IloscEtykiet,
      labels: numerKasjera,
      title: { text: "Top 3 - Kasjerzy" },
      dataLabels: {
        enabled: true,
        formatter: (val, opts) =>
          `${opts.w.globals.labels[opts.seriesIndex]}: ${parseFloat(
            val
          ).toFixed(1)}%`,
      },
      legend: {
        position: "bottom",
        labels: { colors: textColor },
      },
      colors: [color4, color3, color2, color1],
    };

    if (chartTopKasjerzy) chartTopKasjerzy.destroy();

    chartTopKasjerzy = new ApexCharts(
      document.querySelector("#top-kasjerzy"),
      options
    );
    chartTopKasjerzy.render();
  } catch (err) {
    console.error(
      "Błąd podczas pobierania danych do wykresu Top Kasjerzy: ",
      err
    );
  }
}

async function fetchWartoscWagi(pobierzCSV = false, pobierzPDF = false) {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/wartosc-sprzedazy-wagi-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    if (pobierzCSV) {
      const rows = [["NazwaWagi", "WartoscSprzedazy"]];
      data.forEach((item) => rows.push([item.Waga, item.WartoscSprzedazy]));
      downloadCSV(
        `wartosc_wagi_${dataStart.value}-${dataKoniec.value}.csv`,
        rows
      );
      return;
    }

    if (pobierzPDF) {
      const headers = ["NazwaWagi", "WartoscSprzedazy"];
      const rows = data.map((item) => [item.Waga, item.WartoscSprzedazy]);
      downloadPDF(
        `wartosc_wagi_${dataStart.value}-${dataKoniec.value}.pdf`,
        headers,
        rows
      );
      return;
    }

    const waga = data.map((item) => item.Waga);
    const wartoscSprzedazy = data.map((item) =>
      parseFloat(item.WartoscSprzedazy.replace(/,/g, ""))
    );

    const colors = [
      "#e6194B",
      "#f58231",
      "#ffe119",
      "#bfef45",
      "#3cb44b",
      "#42d4f4",
      "#4363d8",
      "#911eb4",
      "#f032e6",
      "#a9a9a9",
      "#fabebe",
      "#ffd8b1",
      "#fffac8",
      "#aaffc3",
      "#dcbeff",
      "#469990",
      "#9A6324",
      "#800000",
      "#000075",
      "#000000",
    ];

    const textColor = getCssVariable("--text-first");
    const container = getCssVariable("--container");

    const options = {
      chart: {
        type: "donut",
        height: "90%",
      },
      stroke: {
        colors: [container],
      },
      series: wartoscSprzedazy,
      labels: waga,
      title: { text: "Sprzedaż na wagach" },
      dataLabels: {
        enabled: false,
        formatter: (val, opts) =>
          `${opts.w.globals.labels[opts.seriesIndex]}: ${
            wartoscSprzedazy[opts.seriesIndex]
          }`,
      },
      legend: {
        position: "bottom",
        labels: { colors: textColor },
      },
      colors: colors,
    };

    if (chartWagi) chartWagi.destroy();

    chartWagi = new ApexCharts(
      document.querySelector("#sprzedaz-wagi"),
      options
    );
    chartWagi.render();
  } catch (err) {
    console.error(
      "Błąd podczas pobierania danych do wykresu Sprzedaż Wagi: ",
      err
    );
  }
}

async function fetchTopGodziny(pobierzCSV = false, pobierzPDF = false) {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/top-godziny-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    const allHours = Array.from({ length: 24 }, (_, index) => index);
    const sprzedaz = allHours.map((hour) => {
      const record = data.find((item) => parseInt(item.Godzina) === hour);
      return record ? record.Sprzedaz : 0;
    });

    if (pobierzCSV) {
      const rows = [["Godzina", "WartoscSprzedazy"]];
      for (let i = 0; i < allHours.length; i++) {
        rows.push([allHours[i], sprzedaz[i]]);
      }

      downloadCSV(
        `sprzedaz_godziny_${dataStart.value}-${dataKoniec.value}.csv`,
        rows
      );
      return;
    }

    if (pobierzPDF) {
      const headers = ["Godzina", "Wartosc Sprzedazy"];
      const rows = [];

      for (let i = 0; i < allHours.length; i++) {
        rows.push([allHours[i], sprzedaz[i]]);
      }

      downloadPDF(
        `sprzedaz_godziny_${dataStart.value}-${dataKoniec.value}.pdf`,
        headers,
        rows
      );
      return;
    }

    const lineColor = getCssVariable("--green");
    const pointColor = getCssVariable("--green-hover");

    const options = {
      chart: { type: "line" },
      series: [{ name: "Sprzedaż (kg)", data: sprzedaz }],
      colors: [lineColor],
      xaxis: { categories: allHours },
      title: { text: "Top Godziny" },
      yaxis: { min: 0 },
      stroke: {
        curve: "smooth",
        width: 3,
        colors: [lineColor],
      },
      markers: {
        size: 5,
        colors: [pointColor],
        strokeColor: lineColor,
        strokeWidth: 2,
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        y: {
          formatter: (val) => `${parseFloat(val).toFixed(3)} kg`,
        },
      },
    };

    if (chartTopGodziny) chartTopGodziny.destroy();

    chartTopGodziny = new ApexCharts(
      document.querySelector("#top-godziny"),
      options
    );
    chartTopGodziny.render();
  } catch (err) {
    console.error(
      "Błąd podczas pobierania danych do wykresu Top Godziny: ",
      err
    );
  }
}

async function fetchWagaDzienna(pobierzCSV = false, pobierzPDF = false) {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/waga-dzienna-zakres/${dataStartValue}/${dataKoniecValue}`
    );

    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    }

    const data = await response.json();

    if (pobierzCSV) {
      const rows = [["Data", "SumaWaga"]];
      data.forEach((item) => {
        const dataFormatted = new Date(item.Data).toLocaleDateString("pl-PL");
        rows.push([dataFormatted, item.SumaWaga]);
      });
      downloadCSV(
        `waga_dzienna_${dataStart.value}-${dataKoniec.value}.csv`,
        rows
      );
      return;
    }

    if (pobierzPDF) {
      const headers = ["Data", "Suma Waga"];
      const rows = data.map((item) => {
        const dataFormatted = new Date(item.Data).toLocaleDateString("pl-PL");
        return [dataFormatted, item.SumaWaga];
      });

      downloadPDF(
        `waga_dzienna_${dataStart.value}-${dataKoniec.value}.pdf`,
        headers,
        rows
      );
      return;
    }

    const dzien = data.map((item) => formatDate(item.Data));

    const sumaWaga = data.map((item) => item.SumaWaga);

    const colorStart = getCssVariable("--chart15");
    const colorEnd = getCssVariable("--chart14");

    const options = {
      chart: { type: "bar" },
      series: [
        {
          name: "Suma Wag Towarów (kg)",
          data: sumaWaga,
        },
      ],
      xaxis: { categories: dzien },
      title: { text: "Top 3 Dni - Waga" },
      dataLabels: {
        enabled: true,
        formatter: (val) => parseFloat(val).toFixed(3),
      },
      legend: { show: false },
      colors: [colorStart],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          type: "vertical",
          gradientToColors: [colorEnd],
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
    };

    if (chartWagaDzienna) chartWagaDzienna.destroy();
    chartWagaDzienna = new ApexCharts(
      document.querySelector("#ilosc-etykiet"),
      options
    );
    chartWagaDzienna.render();
  } catch (err) {
    console.error(
      "Błąd podczas pobierania danych do wykresu Waga Dzienna: ",
      err
    );
  }
}

async function fetchIloscTransakcji() {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/ilosc-transakcji-tydzien-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    const ilosc = data[0].IloscTransakcji;
    document.getElementById("ilosc-transakcji-text").innerHTML = ilosc;
  } catch (err) {
    console.error(
      "Błąd podczas pobierania danych do wykresu Ilość Transakcji Tydzień: ",
      err
    );
  }
}

async function fetchWartoscTransakcji() {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/wartosc-transakcji-tydzien-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    let wartosc = data[0].WartoscTransakcji;
    if (wartosc === null) {
      wartosc = 0;
    }
    document.getElementById("wartosc-transakcji-text").innerHTML =
      wartosc + " zł";
  } catch (err) {
    console.log(
      "Błąd podczas pobierania danych do wykresu Wartość Transakcji Tydzień: ",
      err
    );
  }
}

async function fetchWagaTransakcji() {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/waga-transakcji-tydzien-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    let waga = data[0].WagaTransakcji;
    if (waga === null) {
      waga = 0;
    }
    document.getElementById("waga-transakcji-text").innerHTML = waga + " kg";
  } catch (err) {
    console.log(
      "Błąd podczas pobierania danych do wykresu Waga Transakcji Tydzień: ",
      err
    );
  }
}

async function fetchTopDzien() {
  try {
    const dataStartValue = dataStart.value;
    const dataKoniecValue = dataKoniec.value;
    const response = await fetch(
      `${CONFIG.URL}/api/raporty/top-dzien-zakres/${dataStartValue}/${dataKoniecValue}`
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      document.getElementById("top-dzien-text").innerHTML = "";
      return;
    }

    const topDzien = data[0].Data;
    const formattedDate = new Date(topDzien).toISOString().split("T")[0];
    document.getElementById("top-dzien-text").innerHTML = "";
    document.getElementById("top-dzien-text").innerHTML = formattedDate;
  } catch (err) {
    console.log(
      "Błąd podczas pobierania danych do wykresu Top Dzień z 7 dni: ",
      err
    );
  }
}

function updateChartTopProduktyColors() {
  if (!chartTopProdukty) return;

  const colorStart = getCssVariable("--chart1");
  const colorEnd = getCssVariable("--chart2");

  chartTopProdukty.updateOptions({
    colors: [colorStart],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        type: "vertical",
        gradientToColors: [colorEnd],
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
  });
}

function updateChartTopKasjerzyColors() {
  if (!chartTopKasjerzy) return;

  const color1 = getCssVariable("--chart1");
  const color2 = getCssVariable("--chart2");
  const color3 = getCssVariable("--chart3");
  const color4 = getCssVariable("--chart4");
  const textColor = getCssVariable("--text-first");
  const container = getCssVariable("--container");

  chartTopKasjerzy.updateOptions({
    colors: [color4, color3, color2, color1],
    legend: {
      labels: { colors: textColor },
    },
    stroke: {
      colors: container,
    },
  });
}

function updateWartoscWagiColors() {
  if (!chartWagi) return;

  const textColor = getCssVariable("--text-first");
  const container = getCssVariable("--container");

  chartWagi.updateOptions({
    legend: {
      labels: { colors: textColor },
    },
    stroke: {
      colors: [container],
    },
  });
}

function updateChartTopGodzinyColors() {
  if (!chartTopGodziny) return;

  const lineColor = getCssVariable("--green");
  const pointColor = getCssVariable("--green-hover");

  chartTopGodziny.updateOptions({
    stroke: { colors: [lineColor] },
    markers: {
      colors: [pointColor],
      strokeColor: lineColor,
    },
  });
}

function updateChartWagaDziennaColors() {
  if (!chartWagaDzienna) return;

  const colorStart = getCssVariable("--chart15");
  const colorEnd = getCssVariable("--chart14");

  chartWagaDzienna.updateOptions({
    colors: [colorStart],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        type: "vertical",
        gradientToColors: [colorEnd],
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
  });
}

document.getElementById("filtr-data-filtruj").addEventListener("click", () => {
  if (dataStart.value > dataKoniec.value) {
    alert("Data początkowa jest większa od końcowej!");
  } else {
    fetchTopProdukty();
    fetchTopKasjerzy();
    fetchTopGodziny();
    fetchWagaDzienna();
    fetchWartoscWagi();
    fetchIloscTransakcji();
    fetchWartoscTransakcji();
    fetchWagaTransakcji();
    fetchTopDzien();
  }
});

const observer = new MutationObserver(() => {
  updateChartTopProduktyColors();
  updateChartTopKasjerzyColors();
  updateChartTopGodzinyColors();
  updateChartWagaDziennaColors();
  updateWartoscWagiColors();
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
});

document.querySelector("button.nav-button").addEventListener("click", () => {
  setTimeout(() => {
    fetchTopProdukty();
    fetchTopKasjerzy();
    fetchTopGodziny();
    fetchWagaDzienna();
    fetchWartoscWagi();
    fetchIloscTransakcji();
    fetchWartoscTransakcji();
    fetchWagaTransakcji();
    fetchTopDzien();
  }, 350);
});

const iloscTransakcji = document.getElementById("ilosc-transakcji");
const iloscTransakcjiLegenda = document.getElementById(
  "ilosc-transakcji-legenda"
);
const wartoscTransakcji = document.getElementById("wartosc-transakcji");
const wartoscTransakcjiLegenda = document.getElementById(
  "wartosc-transakcji-legenda"
);
const wagaTransakcji = document.getElementById("waga-transakcji");
const wagaTransakcjiLegenda = document.getElementById(
  "waga-transakcji-legenda"
);
const topDzien = document.getElementById("top-dzien-tydzien");
const topDzienLegenda = document.getElementById("top-dzien-tydzien-legenda");

iloscTransakcji.addEventListener("mouseenter", () => {
  iloscTransakcjiLegenda.style.opacity = 1;
});

iloscTransakcji.addEventListener("mouseleave", () => {
  iloscTransakcjiLegenda.style.opacity = 0;
});

wartoscTransakcji.addEventListener("mouseenter", () => {
  wartoscTransakcjiLegenda.style.opacity = 1;
});

wartoscTransakcji.addEventListener("mouseleave", () => {
  wartoscTransakcjiLegenda.style.opacity = 0;
});

wagaTransakcji.addEventListener("mouseenter", () => {
  wagaTransakcjiLegenda.style.opacity = 1;
});

wagaTransakcji.addEventListener("mouseleave", () => {
  wagaTransakcjiLegenda.style.opacity = 0;
});

topDzien.addEventListener("mouseenter", () => {
  topDzienLegenda.style.opacity = 1;
});

topDzien.addEventListener("mouseleave", () => {
  topDzienLegenda.style.opacity = 0;
});

document.getElementById("csv").addEventListener("click", () => {
  fetchTopProdukty(true, false, false);
  fetchTopKasjerzy(true, false, false);
  fetchWartoscWagi(true, false, false);
  fetchTopGodziny(true, false, false);
  fetchWagaDzienna(true, false, false);
});

document.getElementById("pdf").addEventListener("click", () => {
  fetchTopProdukty(false, true, false);
  fetchTopKasjerzy(false, true, false);
  fetchWartoscWagi(false, true, false);
  fetchTopGodziny(false, true, false);
  fetchWagaDzienna(false, true, false);
});

document.getElementById("png").addEventListener("click", async () => {
  pngTopProdukty();
  pngTopKasjerzy();
  pngWagi();
  pngTopGodziny();
  pngWagaDzienna();
});

async function pngTopProdukty() {
  if (!chartTopProdukty) {
    console.warn("Wykres nie jest załadowany");
    return;
  }

  try {
    const uri = await chartTopProdukty.dataURI();
    const link = document.createElement("a");
    link.href = uri.imgURI;
    link.download = `top_produkty_${dataStart.value}-${dataKoniec.value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.err("Błąd przy generowaniu .png z wykresu: ", err);
  }
}

async function pngTopKasjerzy() {
  if (!chartTopKasjerzy) {
    console.warn("Wykres nie jest załadowany");
    return;
  }

  try {
    const uri = await chartTopKasjerzy.dataURI();
    const link = document.createElement("a");
    link.href = uri.imgURI;
    link.download = `top_kasjerzy_${dataStart.value}-${dataKoniec.value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.err("Błąd przy generowaniu .png z wykresu: ", err);
  }
}

async function pngWagi() {
  if (!chartWagi) {
    console.warn("Wykres nie jest załadowany");
    return;
  }

  try {
    const uri = await chartWagi.dataURI();
    const link = document.createElement("a");
    link.href = uri.imgURI;
    link.download = `wartosc_wagi_${dataStart.value}-${dataKoniec.value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.err("Błąd przy generowaniu .png z wykresu: ", err);
  }
}

async function pngTopGodziny() {
  if (!chartTopGodziny) {
    console.warn("Wykres nie jest załadowany");
    return;
  }

  try {
    const uri = await chartTopGodziny.dataURI();
    const link = document.createElement("a");
    link.href = uri.imgURI;
    link.download = `sprzedaz_godziny_${dataStart.value}-${dataKoniec.value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.err("Błąd przy generowaniu .png z wykresu: ", err);
  }
}

async function pngWagaDzienna() {
  if (!chartWagaDzienna) {
    console.warn("Wykres nie jest załadowany");
    return;
  }

  try {
    const uri = await chartWagaDzienna.dataURI();
    const link = document.createElement("a");
    link.href = uri.imgURI;
    link.download = `waga_dzienna_${dataStart.value}-${dataKoniec.value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.err("Błąd przy generowaniu .png z wykresu: ", err);
  }
}
