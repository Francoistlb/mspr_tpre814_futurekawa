const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../db/futurekawa.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSqlPath = path.join(path.dirname(dbPath), 'init.sql');
if (fs.existsSync(initSqlPath)) {
  db.exec(fs.readFileSync(initSqlPath, 'utf8'));
}

const query = async (sql, params = []) => {
  const verb = sql.trim().split(/\s+/)[0].toUpperCase();
  const stmt = db.prepare(sql);
  if (verb === 'SELECT') {
    return { rows: stmt.all(...params) };
  }
  const info = stmt.run(...params);
  return { rows: [], changes: info.changes, lastID: info.lastInsertRowid };
};

module.exports = { pool: { query }, db };
