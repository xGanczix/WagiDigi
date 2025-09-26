const sql = require("mssql");
const dotenv = require("dotenv");

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_YAKUDO,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("✅ Połączono z MSSQL");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Błąd połączenia z MSSQL:", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
