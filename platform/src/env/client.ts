import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

const ethAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const env = createEnv({
  clientPrefix: "VITE_",
  shared: {
    // Public (client-safe): used by viem public client + wallet chain add/switch.
    BASE_RPC_URL: z.url(),
  },
  client: {
    VITE_BASE_URL: z.url().default("http://localhost:3000"),
    VITE_ERC8004_SUBGRAPH_URL: z.url().optional(),
    // Fleet backend WebSocket base URL (e.g. wss://fleet-api.regent.cx)
    VITE_FLEET_WS_BASE_URL: z.url().optional(),
    VITE_NEXT_PUBLIC_REDEEMER_ADDRESS: ethAddress.optional(),
  },
  runtimeEnv: import.meta.env,
});
