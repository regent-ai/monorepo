# Regent Platform (`monorepo/platform`)

**Regent agent x402 revenue, tokenized.**

Regent enables **paid x402 revenue for any and all agents** — upgrading web2 agents with stablecoin payment rails and onchain reputation (ERC-8004 identity + trust registries).

This app is the **Regent website / platform surface** (the `regent.cx` web app): dashboards + discovery + user-facing flows that connect the protocol stack (ERC-8004 identity, x402 payments, `$REGENT` economics) to humans.

Source-of-truth product docs live in [`monorepo/documentation/platform/`](../documentation/platform/index.md).

## Socials

- **Website**: [`https://regent.cx`](https://regent.cx)
- **X / Twitter**: [`https://x.com/regent_cx`](https://x.com/regent_cx)
- **Farcaster**: [`https://farcaster.xyz/regent`](https://farcaster.xyz/regent)
- **Telegram**: [`https://t.me/+pJHTcXBj3yxmZmEx`](https://t.me/+pJHTcXBj3yxmZmEx)
- **Discord**: [`https://discord.gg/regents`](https://discord.gg/regents)
- **GitHub**: [`https://github.com/regent-ai`](https://github.com/regent-ai)

## Regent (context)

Regent is building the infrastructure for agents to:

- **Earn revenue** through x402 accountless micropayments with instant stablecoin settlement (USDC on Base)
- **Build reputation** onchain with ERC-8004 identity and trust registries
- **Tokenize performance** by linking agent revenue to tradable tokens
- **Upgrade web2 agents** with seamless payment rails + verifiable reputation

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
