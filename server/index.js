// Expense Tracker - Express JSON API (CS 312 Group Project, Phase 1)
// Phase-1 scope: authentication, expense CRUD, predefined categories,
// filtering by month/category, and a basic monthly total.

import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcryptjs";
import "dotenv/config";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 8000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const USERNAME_RULE = /^[A-Za-z0-9_.-]{3,30}$/;
const MONTH_RULE = /^\d{4}-(0[1-9]|1[0-2])$/;      // YYYY-MM
const DATE_RULE = /^\d{4}-\d{2}-\d{2}$/;           // YYYY-MM-DD

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "expense-tracker-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 },
  })
);

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Please sign in first." });
  next();
}

// First and last day of a YYYY-MM month, as strings PostgreSQL understands
function monthRange(month) {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`];
}

// Validates an expense body. Returns { error } or { data }.
async function validateExpense(body = {}) {
  const amount = Number(body.amount);
  const categoryId = Number(body.category_id);
  const date = String(body.expense_date || "");
  const description = String(body.description || "").trim().slice(0, 255) || null;

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Amount must be a number greater than 0." };
  if (amount > 99999999.99) return { error: "Amount is too large." };
  if (!/^\d+(\.\d{1,2})?$/.test(String(body.amount).trim())) return { error: "Amount can have at most 2 decimal places." };
  if (!DATE_RULE.test(date) || Number.isNaN(Date.parse(date))) return { error: "Please choose a valid date." };
  const cat = await db.query("SELECT 1 FROM categories WHERE category_id = $1", [categoryId]);
  if (cat.rowCount === 0) return { error: "Please choose a category." };

  return { data: { amount, categoryId, date, description } };
}

// Base query: each expense with its category name and color
const EXPENSE_SELECT = `
  SELECT e.expense_id, e.amount, e.expense_date, e.description, e.created_at, e.updated_at,
         c.category_id, c.name AS category, c.color
  FROM expenses e JOIN categories c ON c.category_id = e.category_id`;

// ---------- Auth ----------

app.post("/auth/signup", wrap(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const fullName = String(req.body.full_name || "").trim();
  const password = String(req.body.password || "");

  if (!username || !fullName || !password) return res.status(400).json({ error: "All fields are required." });
  if (!USERNAME_RULE.test(username)) return res.status(400).json({ error: "Username must be 3–30 characters: letters, numbers, _ . or -" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

  const taken = await db.query("SELECT 1 FROM users WHERE LOWER(username) = LOWER($1)", [username]);
  if (taken.rowCount > 0) return res.status(409).json({ error: "That username is taken. Please choose another." });

  const hash = await bcrypt.hash(password, 10);
  await db.query("INSERT INTO users (username, password, full_name) VALUES ($1, $2, $3)", [username, hash, fullName]);
  res.status(201).json({ message: "Account created." });
}));

app.post("/auth/signin", wrap(async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const { rows } = await db.query(
    "SELECT user_id, username, password, full_name FROM users WHERE LOWER(username) = LOWER($1)",
    [username]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Could not start a session." });
    req.session.user = { user_id: user.user_id, username: user.username, full_name: user.full_name };
    res.json({ user: req.session.user });
  });
}));

app.post("/auth/signout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Signed out." });
  });
});

app.get("/auth/me", (req, res) => res.json({ user: req.session.user || null }));

// ---------- Categories ----------

app.get("/categories", requireLogin, wrap(async (req, res) => {
  const { rows } = await db.query("SELECT category_id, name, color FROM categories ORDER BY category_id");
  res.json({ categories: rows });
}));

// ---------- Expenses ----------
// Every query filters by the signed-in user's id, so users only ever see their own data.

// GET /expenses?month=2026-11&category_id=3&sort=date_desc
app.get("/expenses", requireLogin, wrap(async (req, res) => {
  const { month, category_id, sort } = req.query;
  const where = ["e.user_id = $1"];
  const params = [req.session.user.user_id];

  if (month) {
    if (!MONTH_RULE.test(month)) return res.status(400).json({ error: "Month must look like YYYY-MM." });
    const [start, end] = monthRange(month);
    params.push(start, end);
    where.push(`e.expense_date BETWEEN $${params.length - 1} AND $${params.length}`);
  }
  if (category_id && category_id !== "all") {
    params.push(Number(category_id));
    where.push(`e.category_id = $${params.length}`);
  }

  const ORDER = {
    date_desc: "e.expense_date DESC, e.expense_id DESC",
    date_asc: "e.expense_date ASC, e.expense_id ASC",
    amount_desc: "e.amount DESC",
    amount_asc: "e.amount ASC",
  };
  const orderBy = ORDER[sort] || ORDER.date_desc;

  const { rows } = await db.query(`${EXPENSE_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${orderBy}`, params);
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  res.json({ expenses: rows, total: Math.round(total * 100) / 100, count: rows.length });
}));

// Basic monthly summary for the dashboard cards (full analytics are Phase 2)
app.get("/expenses/summary", requireLogin, wrap(async (req, res) => {
  const month = req.query.month;
  if (!MONTH_RULE.test(month || "")) return res.status(400).json({ error: "Month must look like YYYY-MM." });
  const [start, end] = monthRange(month);
  const { rows } = await db.query(
    `SELECT c.name AS category, c.color, SUM(e.amount)::numeric(12,2) AS total, COUNT(*)::int AS count
     FROM expenses e JOIN categories c ON c.category_id = e.category_id
     WHERE e.user_id = $1 AND e.expense_date BETWEEN $2 AND $3
     GROUP BY c.name, c.color ORDER BY total DESC`,
    [req.session.user.user_id, start, end]
  );
  const total = rows.reduce((s, r) => s + r.total, 0);
  const count = rows.reduce((s, r) => s + r.count, 0);
  res.json({
    month,
    total: Math.round(total * 100) / 100,
    count,
    topCategory: rows[0] || null,
    byCategory: rows,
  });
}));

app.post("/expenses", requireLogin, wrap(async (req, res) => {
  const { error, data } = await validateExpense(req.body);
  if (error) return res.status(400).json({ error });
  const { rows } = await db.query(
    `INSERT INTO expenses (user_id, category_id, amount, expense_date, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING expense_id`,
    [req.session.user.user_id, data.categoryId, data.amount, data.date, data.description]
  );
  const created = await db.query(`${EXPENSE_SELECT} WHERE e.expense_id = $1`, [rows[0].expense_id]);
  res.status(201).json({ expense: created.rows[0] });
}));

app.put("/expenses/:id", requireLogin, wrap(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: "Expense not found." });
  const { error, data } = await validateExpense(req.body);
  if (error) return res.status(400).json({ error });

  // The user_id condition means you can only update your own expenses
  const result = await db.query(
    `UPDATE expenses SET category_id = $1, amount = $2, expense_date = $3, description = $4, updated_at = NOW()
     WHERE expense_id = $5 AND user_id = $6 RETURNING expense_id`,
    [data.categoryId, data.amount, data.date, data.description, req.params.id, req.session.user.user_id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Expense not found." });
  const updated = await db.query(`${EXPENSE_SELECT} WHERE e.expense_id = $1`, [req.params.id]);
  res.json({ expense: updated.rows[0] });
}));

app.delete("/expenses/:id", requireLogin, wrap(async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: "Expense not found." });
  const result = await db.query("DELETE FROM expenses WHERE expense_id = $1 AND user_id = $2", [
    req.params.id,
    req.session.user.user_id,
  ]);
  if (result.rowCount === 0) return res.status(404).json({ error: "Expense not found." });
  res.json({ deleted: Number(req.params.id) });
}));

// ---------- Errors ----------
app.use((req, res) => res.status(404).json({ error: "Route not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  const dbDown = err.code === "ECONNREFUSED" || err.code === "3D000";
  res.status(500).json({ error: dbDown ? "Can't connect to the database. Is PostgreSQL running?" : "Server error. Please try again." });
});

app.listen(PORT, () => console.log(`Expense Tracker API running at http://localhost:${PORT}`));
