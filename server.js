const express = require("express");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { poolPromise, sql } = require("./db");
const { hash } = require("crypto");

const app = express();
const appPort = 3000;

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const dbApp = process.env.DB_APP;
const dbPcm = process.env.DB_PCM;
const dbYakudo = process.env.DB_YAKUDO;

const logsDir = path.join(__dirname, "logs");

app.get("/api/logs", (req, res) => {
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Nie udało się odczytać folderu" });
    }

    const sortedFiles = files.sort((a, b) => b.localeCompare(a));

    res.json(sortedFiles);
  });
});

app.get("/api/logs/:filename", (req, res) => {
  const filePath = path.join(logsDir, req.params.filename);
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(404).json({ error: "Plik nie istnieje" });
    }
    res.send(data);
  });
});

async function hashPassword(password) {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(passwordHash);
  } catch (err) {
    console.error("Hashing error:", err);
  }
}

function logToFile(message) {
  try {
    const date = new Date();
    const offsetDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    const dateString = offsetDate.toISOString().split("T")[0];
    const logFileName = `log_${dateString}.log`;
    const logsDir = path.join(__dirname, "logs");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFilePath = path.join(logsDir, logFileName);

    const logMessage = `[${offsetDate
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)}] ${message}\n`;

    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error("Błąd zapisu do logu:", err);
  }
}

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;

  try {
    const envLogin = process.env.SERWIS_LOGIN;
    const envPasswordHash = process.env.SERWIS_PASSWORD;

    if (login === envLogin) {
      const passwordMatch = await bcrypt.compare(password, envPasswordHash);
      if (passwordMatch) {
        logToFile(`[INFO] Zalogowano SERWIS`);
        const token = jwt.sign(
          {
            userId: 0,
            login: envLogin,
            role: 2,
          },
          jwtSecret,
          { expiresIn: "1h" }
        );
        return res.json({ message: "Zalogowano pomyślnie (env)", token });
      } else {
        logToFile(`[WARNING] Nieudana próba logowania dla SERWIS`);
        return res
          .status(401)
          .json({ message: "Nieprawidłowy login lub hasło" });
      }
    }

    const pool = await poolPromise;

    const result = await pool.request().input("login", sql.VarChar, login)
      .query(`
        SELECT
          *
        FROM
          [${dbApp}].dbo.WebUsers AS wu
          LEFT JOIN [${dbApp}].dbo.Roles AS r on r.RId = wu.WURole
        WHERE
          WUIsActive = 1
          AND WULogin = @login
      `);

    if (result.recordset.length === 0) {
      logToFile(`[WARNING] Nieudana próba logowania dla: ${login}`);
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
    }

    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.WUPassword);

    if (!passwordMatch) {
      logToFile(`[WARNING] Nieudana próba logowania dla: ${user.WULogin}`);
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
    }
    logToFile(`[INFO] Zalogowano ${user.WULogin}`);
    const token = jwt.sign(
      {
        userId: user.WUId,
        login: user.WULogin,
        role: user.RId,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res.json({ message: "Zalogowano pomyślnie", token });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas logowania: ${err}`);
    res.status(500).json({ message: "Błąd podczas logowania" });
  }
});

app.post("/api/logout", async (req, res) => {
  const { login } = req.body;
  logToFile(`[INFO] Wylogowano użytkownika: ${login}`);
});

app.post("/api/verify", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Brak tokenu" });
  }

  jwt.verify(token, jwtSecret, (err) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Nieprawidłowy lub wygasły token" });
    }
    res.json({ message: "Token prawidłowy" });
  });
});

app.get("/api/uzytkownicy/:status", async (req, res) => {
  const status = req.params.status;
  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
	      wu.WUId,
	      wu.WULogin,
	      wu.WUIsActive,
	      wu.WUCreated,
	      r.RName
      FROM
        [${dbApp}].dbo.WebUsers AS wu
	    LEFT JOIN [${dbApp}].dbo.Roles AS r ON r.RId = wu.WURole
    `;
    if (status === "1") {
      sql += "WHERE wu.WUIsActive = 1";
    } else if (status === "2") {
      sql += "WHERE wu.WUIsActive = 0";
    } else {
      sql += "";
    }
    const result = await pool.request().query(sql);

    logToFile(`[INFO] Pobranie danych o użytkownikach`);
    res.json(result.recordset);
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas pobierania danych o użytkownikach: ${err}`);
    res.status(500).send(err.message);
  }
});

app.get("/api/raporty/top-produkty", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;
  try {
    const pool = await poolPromise;
    let sql = `
      SELECT TOP 3
	      ItemName AS NazwaTowaru,
	      (SUM(Weight) / 1000) AS SumaWaga
      FROM [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY ItemName
      ORDER BY SumaWaga DESC
    `;

    const result = await pool.request().query(sql);

    logToFile(`[INFO] Pobranie danych o top produktach`);
    res.json(result.recordset);
  } catch (err) {
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o top produktach || ${err}`
    );
    res.status(500).send(err.message);
  }
});

app.get("/api/raporty/top-kasjerzy", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT TOP 3
        ClerkNumber AS NumerKasjera,
        SUM(NumberOfItems) AS IloscEtykiet
      FROM [${dbYakudo}].dbo.ClerkSummaries
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY ClerkNumber
      HAVING SUM(NumberOfItems) > 0
      ORDER BY IloscEtykiet DESC
    `;

    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o top kasjerach`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o top kasjerach || ${err}`
    );
  }
});

app.get("/api/raporty/top-godziny", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      WITH Hours AS (
            SELECT 0 AS Hour
            UNION ALL
            SELECT Hour + 1 FROM Hours WHERE Hour < 23
        )
        SELECT 
            H.Hour AS Godzina,
            ISNULL(SUM(Weight) / 1000, 0) AS Sprzedaz
        FROM 
          Hours H
        LEFT JOIN 
            [${dbApp}].dbo.ReportPluTransactions
        ON 
            DATEPART(HOUR, Created) = H.Hour
        WHERE 
            Created BETWEEN '${startDateTime}' AND '${endDateTime}'
        GROUP BY 
            H.Hour
        ORDER BY 
            H.Hour
      `;
    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o top godzinach`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o top godzinach || ${err}`
    );
  }
});

app.get("/api/raporty/waga-dzienna", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
	      CAST(Created AS DATE) AS Data,
	      SUM(Weight) / 1000 AS SumaWaga
      FROM
	      [${dbApp}].dbo.ReportPluTransactions
      WHERE
	      Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY
	      CAST(Created AS DATE)
    `;

    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o sumie wagi na dzień`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o sumie wagi na dzień || ${err}`
    );
  }
});

app.get("/api/raporty/wartosc-sprzedazy-wagi", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
	      ScaleName AS Waga,
	      REPLACE(FORMAT(SUM(TotalPrice),'N0'), '.','') AS WartoscSprzedazy
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE
        Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY
        ScaleName
    `;
    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o wartości sprzedaży towarów`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o wartości sprzedaży towarów: ${err}`
    );
  }
});

app.get("/api/raporty/ilosc-transakcji-tydzien", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
        COUNT(*) AS IloscTransakcji 
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE
        Created BETWEEN '${startDateTime}' AND '${endDateTime}'
    `;

    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o transakcjach na tydzień`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o transakcjach na tydzień: ${err}`
    );
  }
});

app.get("/api/raporty/wartosc-transakcji-tydzien", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
        FORMAT(SUM(TotalPrice) / 100, 'N2') AS WartoscTransakcji
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
    `;
    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o wartości transakcji na tydzień`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o wartości transakcji na tydzień: ${err}`
    );
  }
});

app.get("/api/raporty/waga-transakcji-tydzien", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
        SUM(Weight) / 1000 AS WagaTransakcji
      FROM [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
    `;
    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o wadze transakcji na tydzień`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o wadze transakcji na tydzień: ${err}`
    );
  }
});

app.get("/api/raporty/top-dzien", async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const startDateTime = `${sevenDaysAgo.toISOString().split("T")[0]} 00:00:00`;
  const endDateTime = `${yesterday.toISOString().split("T")[0]} 23:59:59`;

  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
	      CAST(Created AS DATE) AS Data,
	      SUM(TotalPrice) AS WartoscSprzedazy
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY
	      CAST(Created AS DATE)
      ORDER BY
	      SUM(TotalPrice) DESC
    `;
    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o top dniu w tygodniu`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o top dniu w tygodniu: ${err}`
    );
  }
});

app.get(
  "/api/raporty-kasjerow/waga-kasjerzy-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    try {
      const dataStartValue = req.params.dataStartValue;
      const dataKoniecValue = req.params.dataKoniecValue;
      const startDateTime = `${dataStartValue} 00:00:00`;
      const endDateTime = `${dataKoniecValue} 23:59:59`;
      const pool = await poolPromise;
      let sql = `
      SELECT
        ClerkNumber AS NumerKasjera,
        SUM(TotalWeight) / 1000 AS SumaWaga
      FROM [${dbYakudo}].dbo.ClerkSummaries
      BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY ClerkNumber
    `;

      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o sumie wagi dla kasjera`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o sumie wagi dla kasjera: ${err}`
      );
    }
  }
);

app.get("/api/raporty-kasjerow/ilosc-kasjerzy", async (req, res) => {
  try {
    const pool = await poolPromise;
    let sql = `
      SELECT
        ClerkNumber AS NumerKasjera,
        SUM(NumberOfItems) AS IloscEtykiet
      FROM [${dbYakudo}].dbo.ClerkSummaries
      BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY ClerkNumber
    `;

    const result = await pool.request().query(sql);
    logToFile(`[INFO] Pobranie danych o sumie ilości etykiet dla kasjera`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o sumie ilości etykiet dla kasjera: ${err}`
    );
  }
});

app.get(
  "/api/raporty/top-produkty-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;
    try {
      const pool = await poolPromise;
      let sql = `
      SELECT TOP 3
	      ItemName AS NazwaTowaru,
	      (SUM(Weight) / 1000) AS SumaWaga
      FROM [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY ItemName
      ORDER BY SumaWaga DESC
    `;

      const result = await pool.request().query(sql);

      logToFile(`[INFO] Pobranie danych o top produktach dla zakresu dat`);
      res.json(result.recordset);
    } catch (err) {
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o top produktach dla zakresu dat || ${err}`
      );
      res.status(500).send(err.message);
    }
  }
);

app.get(
  "/api/raporty/top-kasjerzy-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT TOP 3
        ClerkNumber AS NumerKasjera,
        SUM(NumberOfItems) AS IloscEtykiet
      FROM [${dbYakudo}].dbo.ClerkSummaries
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY ClerkNumber
      HAVING SUM(NumberOfItems) > 0
      ORDER BY IloscEtykiet DESC
    `;

      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o top kasjerach`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o top kasjerach || ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/top-godziny-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      WITH Hours AS (
            SELECT 0 AS Hour
            UNION ALL
            SELECT Hour + 1 FROM Hours WHERE Hour < 23
        )
        SELECT 
            H.Hour AS Godzina,
            ISNULL(SUM(Weight) / 1000, 0) AS Sprzedaz
        FROM 
          Hours H
        LEFT JOIN 
            [${dbApp}].dbo.ReportPluTransactions
        ON 
            DATEPART(HOUR, Created) = H.Hour
        WHERE 
            Created BETWEEN '${startDateTime}' AND '${endDateTime}'
        GROUP BY 
            H.Hour
        ORDER BY 
            H.Hour
      `;
      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o top godzinach`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o top godzinach || ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/waga-dzienna-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT
	      CAST(Created AS DATE) AS Data,
	      SUM(Weight) / 1000 AS SumaWaga
      FROM
	      [${dbApp}].dbo.ReportPluTransactions
      WHERE
	      Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY
	      CAST(Created AS DATE)
    `;

      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o sumie wagi na dzień`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o sumie wagi na dzień || ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/wartosc-sprzedazy-wagi-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT
	      ScaleName AS Waga,
	      REPLACE(FORMAT(SUM(TotalPrice),'N0'), '.','') AS WartoscSprzedazy
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE
        Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY
        ScaleName
    `;
      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o wartości sprzedaży towarów`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o wartości sprzedaży towarów: ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/ilosc-transakcji-tydzien-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT
        COUNT(*) AS IloscTransakcji 
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE
        Created BETWEEN '${startDateTime}' AND '${endDateTime}'
    `;

      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o transakcjach na tydzień`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o transakcjach na tydzień: ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/wartosc-transakcji-tydzien-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT
        FORMAT(SUM(TotalPrice) / 100, 'N2') AS WartoscTransakcji
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
    `;
      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o wartości transakcji na tydzień`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o wartości transakcji na tydzień: ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/waga-transakcji-tydzien-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT
        SUM(Weight) / 1000 AS WagaTransakcji
      FROM [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
    `;
      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o wadze transakcji na tydzień`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o wadze transakcji na tydzień: ${err}`
      );
    }
  }
);

app.get(
  "/api/raporty/top-dzien-zakres/:dataStartValue/:dataKoniecValue",
  async (req, res) => {
    const dataStartValue = req.params.dataStartValue;
    const dataKoniecValue = req.params.dataKoniecValue;
    const startDateTime = `${dataStartValue} 00:00:00`;
    const endDateTime = `${dataKoniecValue} 23:59:59`;

    try {
      const pool = await poolPromise;
      let sql = `
      SELECT
	      CAST(Created AS DATE) AS Data,
	      SUM(TotalPrice) AS WartoscSprzedazy
      FROM
        [${dbApp}].dbo.ReportPluTransactions
      WHERE Created BETWEEN '${startDateTime}' AND '${endDateTime}'
      GROUP BY
	      CAST(Created AS DATE)
      ORDER BY
	      SUM(TotalPrice) DESC
    `;
      const result = await pool.request().query(sql);
      logToFile(`[INFO] Pobranie danych o top dniu w tygodniu`);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
      logToFile(
        `[ERROR] Błąd podczas pobierania danych o top dniu w tygodniu: ${err}`
      );
    }
  }
);

app.post("/api/uzytkownik-dodanie", async (req, res) => {
  const { loginWartosc, hasloWartosc, rolaWartosc } = req.body;

  if (!loginWartosc || !hasloWartosc || !rolaWartosc) {
    return res.status(400).json({ error: "Wszystkie pola są wymagane" });
  }

  try {
    const passwordHash = await bcrypt.hash(hasloWartosc, 10);
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("login", loginWartosc)
      .query(
        `SELECT WULogin FROM [${dbApp}].dbo.WebUsers WHERE WULogin = @login`
      );

    if (result.recordset.length > 0) {
      return res.status(400).json({ error: "Podany login już istnieje" });
    }

    await pool
      .request()
      .input("login", loginWartosc)
      .input("haslo", passwordHash)
      .input("rola", rolaWartosc).query(`
        INSERT INTO [${dbApp}].dbo.WebUsers (WULogin, WUPassword, WURole)
        VALUES (@login, @haslo, @rola)
      `);
    logToFile(
      `[INFO] Dodano pomyślnie użytkownika || Login: ${loginWartosc} Rola: ${rolaWartosc}`
    );
    return res.status(201).json({ message: "Użytkownik dodany pomyślnie" });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas dodawania użytkownika || ${err}`);
    return res.status(500).json({ error: "Wystąpił błąd serwera" });
  }
});

app.put("/api/uzytkownik-usuniecie/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  try {
    const pool = await poolPromise;
    let sql = `
      UPDATE [${dbApp}].dbo.WebUsers SET WUIsActive = 0 WHERE WUId = @id
    `;
    await pool.request().input("id", uzytkownikId).query(sql);
    logToFile(`[INFO] Usunięto użytkownika o ID: ${uzytkownikId}`);
    return res.status(201).json({ message: "Użytkownik usunięty pomyślnie" });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas usuwania użytkownika || ${err}`);
    return res.status(500).json({ error: "Wystąpił błąd serwera" });
  }
});

app.put("/api/uzytkownik-przywrocenie/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  try {
    const pool = await poolPromise;
    let sql = `
      UPDATE [${dbApp}].dbo.WebUsers SET WUIsActive = 1 WHERE WUId = @id
    `;
    await pool.request().input("id", uzytkownikId).query(sql);
    logToFile(`[INFO] Przywrócono użytkownika o ID: ${uzytkownikId}`);
    return res
      .status(201)
      .json({ message: "Użytkownik przywrócony pomyślnie" });
  } catch (err) {
    logToFile(`[ERROR] Błąd podczas przywracania użytkownika || ${err}`);
    return res.status(500).json({ error: "Wystąpił błąd serwera" });
  }
});

app.get("/api/uzytkownik-edycja-dane/:uzytkownikId", async (req, res) => {
  const uzytkownikId = req.params.uzytkownikId;
  try {
    const pool = await poolPromise;
    let sql = `
      SELECT WuLogin, WURole FROM [${dbApp}].dbo.WebUsers WHERE WUId = @id
    `;
    const result = await pool.request().input("id", uzytkownikId).query(sql);
    logToFile(`[INFO] Pobranie danych o użytkowniku o ID: ${uzytkownikId}`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o użytkowniku o ID: ${uzytkownikId}: ${err}`
    );
  }
});

app.get("/api/porownanie-sprzedazy", async (req, res) => {
  try {
    let pool = await poolPromise;
    let query = `
      WITH Waga AS (
      SELECT
        Id,
        '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????' AS Kod,
        CAST(Weight AS FLOAT) / 1000 AS Waga,
        CAST(Created AS DATE) AS Data,
        CAST(Created AS TIME) AS Czas,
        TotalPrice / 100 AS Wartosc,
        ItemName,
        ClerkNumber,
        ROW_NUMBER() OVER(PARTITION BY '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????', CAST(Created AS DATE), CAST(Weight AS FLOAT) / 1000
                                ORDER BY Id) AS rn_waga
      FROM
        [${dbYakudo}].dbo.ReportPluTransactions
      ),
      POS AS (
      SELECT
        d.DokId,
        t.Kod,
        t.Nazwa,
        pd.IloscPlus AS Waga,
        CAST(d.Data AS DATE) AS Data,
        CAST(d.Data AS TIME) AS Czas,
        pd.Wartosc AS Wartosc,
        ROW_NUMBER() OVER(PARTITION BY t.Kod, CAST(d.Data AS DATE), pd.IloscPlus ORDER BY d.DokId) AS rn_pos
      FROM
        [${dbPcm}].dbo.PozDok AS pd
      LEFT JOIN [${dbPcm}].dbo.Dok AS d ON
        d.DokId = pd.DokId
      LEFT JOIN [${dbPcm}].dbo.Towar AS t ON
        t.TowId = pd.TowId
      WHERE
        d.TypDok = 21
        AND d.Aktywny = 1
      ),
      Dopasowane AS (
      SELECT
        w.Id AS WagaId,
        p.DokId AS PosId,
        w.Kod,
        w.Waga,
        w.Data,
        w.Czas,
        w.Wartosc,
        w.ItemName,
        w.ClerkNumber,
        'OK' AS Status
      FROM
        Waga w
      INNER JOIN POS p 
              ON
        w.Kod = p.Kod
        AND w.Data = p.Data
        AND w.Waga = p.Waga
        AND w.rn_waga = p.rn_pos
      ),
      BrakNaPOSie AS (
      SELECT
        w.Id AS WagaId,
        NULL AS PosId,
        w.Kod,
        w.Waga,
        w.Data,
        w.Czas,
        w.Wartosc,
        w.ItemName,
        w.ClerkNumber,
        CASE
          WHEN w.Data < CAST(GETDATE() AS DATE) THEN 'Brak na POSie - dzień zakończony'
          ELSE 'Brak na POSie'
        END AS Status
      FROM
        Waga w
      LEFT JOIN Dopasowane d ON
        w.Id = d.WagaId
      WHERE
        d.WagaId IS NULL
      ),
      BrakNaWadze AS (
      SELECT
        NULL AS WagaId,
        p.DokId AS PosId,
        p.Kod,
        p.Nazwa,
        p.Waga,
        p.Data,
        p.Czas,
        p.Wartosc,
        CASE
          WHEN p.Data < CAST(GETDATE() AS DATE) THEN 'Brak na wadze - dzień zakończony'
          ELSE 'Brak na wadze'
        END AS Status
      FROM
        POS p
      LEFT JOIN Dopasowane d ON
        p.DokId = d.PosId
      WHERE
        d.PosId IS NULL
      ),
      WynikiSurowe AS (
      SELECT
        WagaId,
        Kod,
        ItemName,
        Data,
        Czas,
        Waga,
        NULL AS WagaPOS,
        Wartosc,
        ClerkNumber,
        Status
      FROM
        BrakNaPOSie
      UNION ALL
      SELECT
        NULL AS WagaId,
        Kod,
        Nazwa,
        Data,
        Czas,
        NULL AS WagaWaga,
        Waga AS WagaPOS,
        Wartosc,
        NULL AS ClerkNumber,
        Status
      FROM
        BrakNaWadze
      UNION ALL
      SELECT
        WagaId,
        Kod,
        ItemName,
        Data,
        Czas,
        Waga AS WagaWaga,
        Waga AS WagaPOS,
        Wartosc,
        NULL AS ClerkNumber,
        Status
      FROM
        Dopasowane
      )
      SELECT
        w.WagaId,
        w.Kod,
        w.ItemName,
        w.Data,
        w.Czas,
        w.Waga AS WagaZWagi,
        w.WagaPOS AS WagaZPOS,
        w.Wartosc,
        w.ClerkNumber,
        ps.PSId,
        ps.PSNazwa
      FROM
        WynikiSurowe w
      JOIN [${dbApp}].dbo.PorownanieStatus AS ps ON
        w.Status = ps.PSNazwa
      left JOIN [${dbApp}].dbo.ReportDescriptions AS rd ON
        w.WagaId = rd.ReportId
      WHERE
        w.Data = CAST(GETDATE() AS DATE) AND ps.PSId = 2 AND rd.ReportId IS NULL
      ORDER BY
        w.Data,
        w.Kod
      `;
    const result = await pool.request().query(query);
    logToFile(
      `[INFO] Porównanie danych o sprzedaży na podstawie tabel Wagi i PCM`
    );
    res.status(200).json(result.recordset);
  } catch (error) {
    logToFile(
      `[ERROR] Błąd podczas pobierania danych do porównania sprzedaży z Wagi i POSa || ${err}`
    );
    res.status(500).json({ message: "Błąd serwera" });
  }
});

app.post("/api/porownanie-sprzedazy-opis", async (req, res) => {
  try {
    const { reportId, description, username } = req.body;

    let pool = await poolPromise;
    await pool
      .request()
      .input("reportId", sql.Int, reportId)
      .input("description", sql.NVarChar, description)
      .input("username", sql.NVarChar, username).query(`
        INSERT INTO [${dbApp}].dbo.ReportDescriptions (ReportId, Description, Author)
        VALUES (@reportId, @description, @username);
      `);

    res.status(200).json({ message: "Opis zapisany pomyślnie" });
  } catch (error) {
    console.error("Błąd MSSQL:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

app.get("/api/zatwierdzone-bledy", async (req, res) => {
  try {
    let pool = await poolPromise;

    const result = await pool.request().query(`
      WITH Waga AS (
      SELECT
        Id,
        '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????' AS Kod,
        CAST(Weight AS FLOAT) / 1000 AS Waga,
        CAST(Created AS DATE) AS Data,
        CAST(Created AS TIME) AS Czas,
        TotalPrice / 100 AS Wartosc,
        ItemName,
        ClerkNumber,
        ROW_NUMBER() OVER(PARTITION BY '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????', CAST(Created AS DATE), CAST(Weight AS FLOAT) / 1000
                                ORDER BY Id) AS rn_waga
      FROM
        [${dbYakudo}].dbo.ReportPluTransactions
      ),
      POS AS (
      SELECT
        d.DokId,
        t.Kod,
        t.Nazwa,
        pd.IloscPlus AS Waga,
        CAST(d.Data AS DATE) AS Data,
        CAST(d.Data AS TIME) AS Czas,
        pd.Wartosc AS Wartosc,
        ROW_NUMBER() OVER(PARTITION BY t.Kod, CAST(d.Data AS DATE), pd.IloscPlus ORDER BY d.DokId) AS rn_pos
      FROM
        [${dbPcm}].dbo.PozDok AS pd
      LEFT JOIN [${dbPcm}].dbo.Dok AS d ON
        d.DokId = pd.DokId
      LEFT JOIN [${dbPcm}].dbo.Towar AS t ON
        t.TowId = pd.TowId
      WHERE
        d.TypDok = 21
        AND d.Aktywny = 1
      ),
      Dopasowane AS (
      SELECT
        w.Id AS WagaId,
        p.DokId AS PosId,
        w.Kod,
        w.Waga,
        w.Data,
        w.Czas,
        w.Wartosc,
        w.ItemName,
        w.ClerkNumber,
        'OK' AS Status
      FROM
        Waga w
      INNER JOIN POS p 
              ON
        w.Kod = p.Kod
        AND w.Data = p.Data
        AND w.Waga = p.Waga
        AND w.rn_waga = p.rn_pos
      ),
      BrakNaPOSie AS (
      SELECT
        w.Id AS WagaId,
        NULL AS PosId,
        w.Kod,
        w.Waga,
        w.Data,
        w.Czas,
        w.Wartosc,
        w.ItemName,
        w.ClerkNumber,
        CASE
          WHEN w.Data < CAST(GETDATE() AS DATE) THEN 'Brak na POSie - dzień zakończony'
          ELSE 'Brak na POSie'
        END AS Status
      FROM
        Waga w
      LEFT JOIN Dopasowane d ON
        w.Id = d.WagaId
      WHERE
        d.WagaId IS NULL
      ),
      BrakNaWadze AS (
      SELECT
        NULL AS WagaId,
        p.DokId AS PosId,
        p.Kod,
        p.Nazwa,
        p.Waga,
        p.Data,
        p.Czas,
        p.Wartosc,
        CASE
          WHEN p.Data < CAST(GETDATE() AS DATE) THEN 'Brak na wadze - dzień zakończony'
          ELSE 'Brak na wadze'
        END AS Status
      FROM
        POS p
      LEFT JOIN Dopasowane d ON
        p.DokId = d.PosId
      WHERE
        d.PosId IS NULL
      ),
      WynikiSurowe AS (
      SELECT
        WagaId,
        Kod,
        ItemName,
        Data,
        Czas,
        Waga,
        NULL AS WagaPOS,
        Wartosc,
        ClerkNumber,
        Status
      FROM
        BrakNaPOSie
      UNION ALL
      SELECT
        NULL AS WagaId,
        Kod,
        Nazwa,
        Data,
        Czas,
        NULL AS WagaWaga,
        Waga AS WagaPOS,
        Wartosc,
        NULL AS ClerkNumber,
        Status
      FROM
        BrakNaWadze
      UNION ALL
      SELECT
        WagaId,
        Kod,
        ItemName,
        Data,
        Czas,
        Waga AS WagaWaga,
        Waga AS WagaPOS,
        Wartosc,
        NULL AS ClerkNumber,
        Status
      FROM
        Dopasowane
      )
      SELECT
        w.WagaId,
        w.Kod,
        w.ItemName,
        w.Data,
        w.Czas,
        w.Waga AS WagaZWagi,
        w.WagaPOS AS WagaZPOS,
        w.Wartosc,
        w.ClerkNumber,
        ps.PSId,
        ps.PSNazwa,
        rd.Description,
        rd.Author,
        CAST(rd.CreatedAt AS Date) AS DataOpisu,
        CAST(rd.CreatedAt AS TIME) AS CzasOpisu
      FROM
        WynikiSurowe w
      JOIN [${dbApp}].dbo.PorownanieStatus ps ON
        w.Status = ps.PSNazwa
        LEFT JOIN [${dbApp}].dbo.ReportDescriptions AS rd ON rd.ReportId = w.WagaId
        WHERE rd.Description IS NOT NULL AND ps.PSID != 1 AND ps.PSID != 3
      ORDER BY
        w.Data DESC,
        w.Kod
        `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Błąd MSSQL:", error);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

app.get("/api/raporty/pobranie-towarow-pcm-nazwa", async (req, res) => {
  try {
    let pool = await poolPromise;
    const searchTerm = req.query.search || "";
    const result = await pool
      .request()
      .input("searchTerm", sql.VarChar, searchTerm).query(`
        SELECT
          Nazwa,
          Kod
        FROM
          [${dbPcm}].dbo.Towar
        WHERE Kod LIKE '%?'
        AND Nazwa LIKE '%' + @searchTerm + '%'
        ORDER BY Nazwa
      `);
    res.json(result.recordset);
    logToFile(`[INFO] Pobranie danych o towarach PCM po nazwie`);
  } catch (err) {
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o towarach PCM po nazwie: ${err}`
    );
    res.status(500).send(err.message);
  }
});

app.get("/api/raporty/pobranie-towarow-pcm-kod", async (req, res) => {
  try {
    let pool = await poolPromise;
    const searchTerm = req.query.search || "";
    const result = await pool
      .request()
      .input("searchTerm", sql.VarChar, searchTerm).query(`
        SELECT
          Nazwa,
          Kod
        FROM
          [${dbPcm}].dbo.Towar
        WHERE Kod LIKE '%?'
        AND Kod LIKE '%' + @searchTerm + '%'
        ORDER BY Nazwa
      `);
    res.json(result.recordset);
    logToFile(`[INFO] Pobranie danych o towarach PCM po kodzie`);
  } catch (err) {
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o towarach PCM po kodzie: ${err}`
    );
    res.status(500).send(err.message);
  }
});

app.get("/api/raporty/produkty-sprzedaz-dzien", async (req, res) => {
  try {
    const pool = await poolPromise;
    const kod = req.query.kod || "";
    const start = req.query.start || "";
    const end = req.query.end || "";
    const result = await pool
      .request()
      .input("kod", sql.VarChar, kod)
      .input("start", sql.VarChar, start)
      .input("end", sql.VarChar, end).query(`
      SELECT
        '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????' AS Kod,
        ItemName,
        SUM(Weight) AS TotalWeight,
        SUM(TotalPrice) AS TotalPrice,
        CAST(Created AS DATE) AS Data
      FROM
        ReportPluTransactions
      WHERE
        '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????' = @kod
        AND Created >= @start AND Created <= @end
      GROUP BY
        '27' + RIGHT('0000' + CAST(PluNumber AS VARCHAR), 4) + '???????',
        ItemName,
        CAST(Created AS DATE)  
    `);
    res.json(result.recordset);
    logToFile(`[INFO] Pobranie danych o wydruku dziennym etykiet`);
  } catch (err) {
    logToFile(
      `[ERROR] Błąd podczas pobierania danych o wydruku dziennym etykiet || ${err}`
    );
    res.status(500).send(err.message);
  }
});

app.listen(appPort, () => {
  console.log(`Aplikacja działa na porcie: ${appPort}`);
  logToFile(`[INFO] Aplikacja uruchomiona na porcie: ${appPort}`);
});
