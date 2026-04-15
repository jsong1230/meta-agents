import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "meta-agents.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      address TEXT PRIMARY KEY,
      did TEXT NOT NULL,
      creator TEXT NOT NULL,
      model TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '',
      registered_at INTEGER NOT NULL DEFAULT (unixepoch()),
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_address TEXT NOT NULL REFERENCES agents(address),
      pair TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL NOT NULL,
      value REAL NOT NULL,
      timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
      tx_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS follows (
      user_id TEXT NOT NULL,
      agent_address TEXT NOT NULL REFERENCES agents(address),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (user_id, agent_address)
    );

    CREATE INDEX IF NOT EXISTS idx_trades_agent ON trades(agent_address);
    CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
    CREATE INDEX IF NOT EXISTS idx_follows_agent ON follows(agent_address);
  `);
}
