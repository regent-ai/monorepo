# Regent SDK

TypeScript SDK for building Regent-native agents.

## What This Is

This workspace contains the core packages for building agents with Regent:
- **@regent/core** — Agent runtime with extension system
- **@regent/http** — HTTP handling extension
- **@regent/payments** — x402 payment integration
- **@regent/identity** — ERC-8004 on-chain identity
- **@regent/a2a** — Agent-to-agent protocol
- **@regent/erc8004** — ERC-8004 SDK for identity, discovery, reputation

Key packages live under `regent-sdk/packages/`.

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test
```

## Key Files

| Package | Entry Point |
|---------|-------------|
| @regent/core | `packages/core/src/core/agent.ts` |
| @regent/erc8004 | `packages/erc8004/src/index.ts` |
| regent-sdk | `packages/sdk/src/index.ts` |

## Upstream Mirrors

This workspace keeps **local mirrors** of upstream OSS repos for review/sync:
- `lucid-agents/` (upstream: daydreamsai/lucid-agents)
- `agent0-ts/` (upstream: agent0lab/agent0-ts)

They remain **separate git repos** (each has its own `.git/`) and are **ignored** by the top-level monorepo.

Use the helper script to fetch + report upstream changes:

```bash
bun scripts/upstream-report.ts --clone
```

It reads/writes baseline sync state in `upstream-sync.json`.

## Cross-References

- **Used by**: `regent-cli`, `facilitator`, `platform`
- **Related**: See root `AGENTS.md` for beads workflow

## Issue Tracking

See root `AGENTS.md` for beads workflow. Use `bd ready --json` to find work.
