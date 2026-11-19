-- Expense Tracker (CS 312 Group Project) - ExpenseDB schema
-- Create an empty database named ExpenseDB first, then run this file, then seed.sql.

DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id    SERIAL       PRIMARY KEY,
  username   VARCHAR(30)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,              -- bcrypt hash
  full_name  VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Predefined categories (custom categories are a Phase-2 feature)
CREATE TABLE categories (
  category_id SERIAL      PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  color       VARCHAR(7)  NOT NULL               -- hex color used in the UI
);

CREATE TABLE expenses (
  expense_id   SERIAL        PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id  INTEGER       NOT NULL REFERENCES categories(category_id),
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),   -- NUMERIC avoids floating-point rounding errors
  expense_date DATE          NOT NULL,
  description  VARCHAR(255),
  created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP
);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
