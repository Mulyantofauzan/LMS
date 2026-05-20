import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Define global type for HMR safe database connection
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle>;
};

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV !== 'production') {
  if (!globalForDb.db) {
    const sqlite = new Database('sqlite.db');
    globalForDb.db = drizzle(sqlite, { schema });
  }
  db = globalForDb.db;
} else {
  const sqlite = new Database('sqlite.db');
  db = drizzle(sqlite, { schema });
}

export { db };
