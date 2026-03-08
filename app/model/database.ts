import Database from "better-sqlite3";

const db = new Database("data/audiobooktube.db", { verbose: console.log });
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );
`);

export default db;

type Setting = {
  key: string;
  value: string;
};

export const getSettings = () => {
  try {
    return db.prepare("SELECT key, value FROM settings").all() as Setting[];
  } catch (error) {
    console.error("Error fetching settings:", error);
    return [];
  }
};

export const getSetting = (key: string) => {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
      | { value: string }
      | undefined;
    return row ? row.value : null;
  } catch (error) {
    console.error(`Error fetching setting for key "${key}":`, error);
    return null;
  }
};

export const setSetting = (key: string, value: string) => {
  try {
    if (value === "") {
      db.prepare("DELETE FROM settings WHERE key = ?").run(key);
    } else {
      db.prepare(
        `
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `
      ).run(key, value);
    }
  } catch (error) {
    console.error("Error saving setting:", error);
  }
};
