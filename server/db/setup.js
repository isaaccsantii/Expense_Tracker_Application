// Optional shortcut: `npm run db:setup` runs schema.sql then seed.sql against the
// database in .env. Doing the same thing in pgAdmin's Query Tool works too.
// Create the empty ExpenseDB database first (pgAdmin > Databases > Create).
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

try {
  for (const file of ["schema.sql", "seed.sql"]) {
    await pool.query(await fs.readFile(path.join(dir, file), "utf8"));
    console.log(`Ran ${file}`);
  }
  console.log("ExpenseDB is ready.");
} catch (err) {
  console.error("Setup failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
