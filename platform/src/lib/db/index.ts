import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env/server";

import * as schema from "~/lib/db/schema";

const getDatabase = createServerOnlyFn(() => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database operations");
  }
  const driver = postgres(env.DATABASE_URL);
  return drizzle({ client: driver, schema, casing: "snake_case" });
});

export const db = getDatabase();
