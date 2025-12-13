# Regent Platform

Web application at `regent.cx`.

## What This Is

The Platform is the user-facing interface for the Regent ecosystem:
- Agent Explorer — Browse and search ERC-8004 agents
- Agent Profiles — View agent details, reputation, and operations
- Fleet Dashboard — Aggregate view of fleet operations
- Redemption — NFT → REGENT token redemption

## Package Manager

**Use Bun for all package management and script execution.**

```bash
# Install dependencies
bun install

# Run scripts
bun run dev
bun run build
bun run check-types

# Add packages
bun add <package>
bun add -d <dev-package>
```

Do NOT use npm, yarn, or pnpm.

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Platform home dashboard |
| `/explorer` | ERC-8004 agent explorer (grid/list views) |
| `/agent/$id` | Agent profile + reviews |
| `/agent/$id?tab=ops` | Agent operations panel |
| `/dashboard` | Fleet ops aggregate dashboard |
| `/redeem` | NFT → REGENT token redemption |

## Key Files

| File | Purpose |
|------|---------|
| `src/routes/__root.tsx` | Root layout, theme provider, head content |
| `src/routes/explorer.tsx` | Agent explorer with grid/list views |
| `src/routes/agent/$id.tsx` | Agent profile page |
| `src/routes/dashboard.tsx` | Fleet dashboard |
| `src/lib/erc8004/subgraph.ts` | GraphQL client for ERC-8004 data |
| `src/lib/fleet/api.ts` | Fleet backend API client |

## Environment Variables

### Server (`src/env/server.ts`)
- `FLEET_API_BASE_URL` — Fleet backend HTTP API base URL
- `FLEET_ADMIN_TOKEN` — (optional) Enables admin proxy endpoints

### Client (`src/env/client.ts`)
- `VITE_FLEET_WS_BASE_URL` — (optional) Fleet backend WebSocket URL

## Fleet Integration

### API Routes (`server/routes/api/fleet/`)
- **Public**: `GET /api/fleet/tenants`, `GET /api/fleet/agent/:erc8004Id/{info,agents,events,chat}`
- **Admin**: `POST /api/fleet/agent/:erc8004Id/{ensure,chat/send}`

### Client Helpers
- `src/lib/fleet/api.ts` — Typed fetchers for proxy routes
- `src/lib/fleet/ws.ts` — `useFleetWebSocket({ erc8004Id })` hook

## Explorer Route Notes

Uses TanStack Router with optional search params:
- `view`: `grid | list`
- `mode`: `all | regent`
- `sort`: `newest | mostReviews | name`
- `search`: string
- `hasReviews`, `hasEndpoint`: booleans
- `page`, `perPage`: numbers (list view)

The infinite grid component (`src/lib/thiings-grid.tsx`) exposes:
- `publicGetCurrentPosition()`, `publicSetCurrentPosition()`, `publicResetPosition()`
- `onVisibleRangeChange({ minIndex, maxIndex, offset })` for prefetch triggers

## Cross-References

- **Uses**: `facilitator` for fleet ops backend, `regent-sdk` types
- **Related**: See root `AGENTS.md` for beads workflow

## Issue Tracking

See root `AGENTS.md` for beads workflow. Use `bd ready --json` to find work.
