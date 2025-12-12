# ERC-8004 Explorer (legacy)

This directory is a **legacy standalone explorer** (Next.js) that was preserved for reference.

The **active ERC-8004 explorer UI** is now integrated into the Regent Platform app (`monorepo/platform`) and lives at:

- **Route**: `/explorer`
- **Implementation**: `monorepo/platform/src/routes/explorer.tsx`
- **Agent detail**: `monorepo/platform/src/routes/agent/$id.tsx`
- **Subgraph client**: `monorepo/platform/src/lib/erc8004/subgraph.ts`

## Working on the current explorer

From the main platform app:

```bash
cd monorepo/platform
bun install
bun run dev
```

## Status

Treat this `erc-8004-explorer/` folder as **deprecated**; it is not the source of truth for the explorer UI anymore and may be removed in a future cleanup.
