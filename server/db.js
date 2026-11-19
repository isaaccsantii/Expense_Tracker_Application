// Expense Tracker - PostgreSQL connection pool. Settings come from .env (see .env.example).
import pg from "pg";
import "dotenv/config";

// Return DATE columns as plain "YYYY-MM-DD" strings. By default pg turns them into
// JS Date objects at local midnight, which can shift the day by one in the browser.
pg.types.setTypeParser(1082, (value) => value);
// Return NUMERIC (money) as a JS number instead of a string
pg.types.setTypeParser(1700, (value) => parseFloat(value));

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || "ExpenseDB",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
});

pool.on("error", (err) => console.error("Unexpected PostgreSQL error:", err.message));

export default pool;
