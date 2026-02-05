import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("expense_tracker.db");

export function initDb() {
  db.execSync("PRAGMA foreign_keys = ON;");

  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, name)
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // need to delete not use
  db.execSync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, month)
    );
  `);

  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_expenses_user_date
    ON expenses(user_id, date);

    CREATE INDEX IF NOT EXISTS idx_expenses_user_category
    ON expenses(user_id, category_id);
  `);
}

// SQL injection prevention
export function run(sql: string, params: (string | number | null)[] = []) {
  db.runSync(sql, params);
}

// For Security & Convenience
export function getOne<T>(
  sql: string,
  params: (string | number | null)[] = [],
): T | null {
  return db.getFirstSync<T>(sql, params) ?? null;
}

export function getAll<T>(
  sql: string,
  params: (string | number | null)[] = [],
): T[] {
  return db.getAllSync<T>(sql, params) as T[];
}
