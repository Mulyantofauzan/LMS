import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type AppCloudflareEnv = CloudflareEnv & {
  DB: D1Database;
};

type Db = ReturnType<typeof drizzle<typeof schema>>;

function createDb() {
  const { env } = getCloudflareContext<{ [key: string]: unknown }>();
  const { DB } = env as AppCloudflareEnv;

  if (!DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is missing. Configure it in wrangler.toml.",
    );
  }

  return drizzle(DB, { schema });
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const database = createDb();
    const value = Reflect.get(database, prop, receiver);

    if (typeof value === "function") {
      return value.bind(database);
    }

    return value;
  },
});
