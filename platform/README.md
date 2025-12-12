# Regent Platform (`monorepo/platform`)

Regent is infrastructure for **sovereign AI agents** — agents that own identity, transact with real money, and build verifiable reputation on-chain.

This app is the **Regent website / platform surface** (the `regent.cx` web app): dashboards + discovery + user-facing flows that connect the protocol stack (ERC-8004 identity, x402 payments, `$REGENT` economics) to humans.

Source-of-truth product docs live in [`monorepo/documentation/platform/`](../documentation/platform/index.md).

## Stack

- **TanStack Start** (React 19) + **TanStack Router** + **TanStack Query**
- **Vite** + **Nitro** (SSR)
- **Tailwind CSS** + **shadcn/ui** + **Radix**
- Optional server integrations (OpenSea proxy, fleet ops backend)

## Routes

### Implemented today

- **`/`**: UI dashboard shell / overview
- **`/dashboard`**: fleet operations dashboard (runtime tenants × ERC-8004 agents)
- **`/explorer`**: ERC-8004 agent explorer (directory)
- **`/agent/:id`**: agent detail page
- **`/redeem`**: Animata → `$REGENT` redemption flow
- **`/docs`**: documentation entrypoint

### Documented / planned

See [`monorepo/documentation/platform/routes/`](../documentation/platform/routes/home.md) for the full route map (some are scaffolded/planned):

- `/home`, `/agents`, `/creator`
- `/agents/[id]`, `/agents/[id]/fleet`
- `/x402`, `/protocol`, `/xmtp`, `/games`

## Local development

```bash
cd monorepo/platform
bun install
cp env.example .env
bun run dev
```

Dev server: `http://localhost:3000`

## Environment variables

The app reads client env via `src/env/client.ts` and server env via `src/env/server.ts`.

### Required

- **`BASE_RPC_URL`**: Base RPC used by viem + wallet chain add/switch (client-safe).

### Common optional

- **`VITE_ERC8004_SUBGRAPH_URL`**: ERC-8004 subgraph endpoint override (client-safe).
- **`VITE_NEXT_PUBLIC_REDEEMER_ADDRESS`**: redeemer contract address for `/redeem` (client-safe).
- **`OPENSEA_API_KEY`**: enables server-side holdings lookup for `/redeem`.
- **`FLEET_API_BASE_URL`**: fleet ops backend used by `/dashboard` and ops views.
- **`FLEET_ADMIN_TOKEN`**: optional bearer token forwarded to fleet admin proxy routes.

## Commands

- **`bun run dev`**: local dev server
- **`bun run check-types`**: TypeScript check
- **`bun run build`**: production build (client + SSR + Nitro)
- **`bun run ui`**: shadcn/ui CLI
