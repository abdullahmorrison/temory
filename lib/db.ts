import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@/db/schema";

export type Db = ReturnType<typeof openDb>;

/** Open a database and bring its schema up to date. Pass ":memory:" for a throwaway one. */
export function openDb(file: string) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "db/migrations") });
  return db;
}

let instance: Db | undefined;

// Opened on first use, not at import, so `next build` never touches the file.
export function getDb() {
  return (instance ??= openDb(process.env.DATABASE_PATH ?? "data/crm.db"));
}

/** The database as one account sees it. Everything that reads or writes someone's things takes this. */
export type UserDb = { db: Db; userId: number };
