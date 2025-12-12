import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url().optional(),
    VITE_BASE_URL: z.url().default("http://localhost:3000"),
    OPENSEA_API_KEY: z.string().optional(),
    // Fleet ops backend (multi-tenant) used by /dashboard and /agent/$id?tab=ops
    FLEET_API_BASE_URL: z.url().optional(),
    // Optional: if set, platform admin proxy routes require and forward this token
    // via Authorization: Bearer <FLEET_ADMIN_TOKEN>
    FLEET_ADMIN_TOKEN: z.string().optional(),
  },
  runtimeEnv: process.env,
});
