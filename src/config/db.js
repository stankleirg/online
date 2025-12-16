const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DB_PATH || "./data/app.sqlite";
const resolved = path.resolve(dbPath);

const db = new Database(resolved);
db.pragma("journal_mode = WAL");

module.exports = { db };
