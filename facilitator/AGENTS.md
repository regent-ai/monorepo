# Facilitator

Express server that processes x402 payments and routes them to agents.

## What This Is

The Facilitator is the payment routing layer for Regent agents. It verifies x402 payment headers, settles transactions on-chain, and generates reputation feedback authorization tokens.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Express app entry point, route definitions |
| `src/config/env.ts` | Environment variable configuration |
| `src/config/contracts.ts` | Contract addresses per network |
| `src/services/feedbackService.ts` | Generates `feedbackAuth` for ERC-8004 reputation |
| `src/services/registerService.ts` | Agent registration via EIP-7702 |
| `src/discovery/crawler.ts` | Crawls x402 resources for catalog |
| `src/discovery/catalog.ts` | In-memory resource catalog |
| `src/utils/rpc.ts` | Multi-network RPC configuration |

## Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/verify` | POST | Validate payment requirements |
| `/settle` | POST | Settle payments on-chain |
| `/register` | POST | Register agent identity via EIP-7702 |
| `/supported` | GET | Supported kinds grouped by version + signer registry + extensions |
| `/discover` | POST | Crawl discovery-enabled resources |
| `/catalog` | GET | Read discovery catalog snapshot |

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Environment Variables

Required environment variables (see `.env.example` if available):
- `RPC_URL_BASE_MAINNET` — Base Mainnet RPC endpoint
- `RPC_URL_BASE_SEPOLIA` — Base Sepolia RPC endpoint
- `FACILITATOR_PRIVATE_KEY` — Private key for signing transactions

## Architecture

```
Client Request (x402 header)
       │
       ▼
  ┌─────────┐
  │ /verify │ ← Validate payment meets requirements
  └────┬────┘
       │
       ▼
  ┌─────────┐
  │ /settle │ ← Execute on-chain settlement
  └────┬────┘
       │
       ├─► Route request to agent backend
       │
       └─► Generate feedbackAuth token
           (for ERC-8004 reputation)
```

## Cross-References

- **Uses**: `regent-sdk` payment types and ERC-8004 interfaces
- **Consumed by**: Platform fleet ops, skills, any x402-enabled client
- **Related**: See root `AGENTS.md` for beads workflow

## Issue Tracking

See root `AGENTS.md` for beads workflow. Use `bd ready --json` to find work.
