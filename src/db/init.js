require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { db } = require("../config/db");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

(function main() {
  ensureDir(path.resolve("./data"));

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','staff','customer')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL CHECK(price >= 0),
      stock INTEGER NOT NULL CHECK(stock >= 0),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY(product_id, category_id),
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      total_amount INTEGER NOT NULL CHECK(total_amount >= 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','processing','shipped','completed','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty INTEGER NOT NULL CHECK(qty > 0),
      price_snapshot INTEGER NOT NULL CHECK(price_snapshot >= 0),
      subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      method TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount >= 0),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
      paid_at TEXT,
      proof_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  console.log("DB initialized ✅");
})();
