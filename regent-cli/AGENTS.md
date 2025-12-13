# Regent CLI

CLI tools for scaffolding and managing Regent agents.

## What This Is

This workspace contains two CLI packages:
- **@regent/cli** — Scaffolding CLI for creating new agent projects
- **@regent/regentx** — On-chain agent management CLI

## Packages

### @regent/cli (v1.10.1)

Scaffolds new Bun agent applications powered by `@regent/core`.

**Binaries:** `regent`, `create-agent-kit`

**Usage:**
```bash
# Create a new agent project
npx create-agent-kit my-agent

# Or use the regent command
npx regent init my-agent
```

**Key directories:**
- `src/` — CLI source code
- `templates/` — Project templates for scaffolding
- `adapters/` — Framework adapters (Hono, Express, etc.)

### @regent/regentx (v0.1.0)

CLI for managing Regent agents on-chain.

**Binary:** `regentx`

**Commands:**
| Command | Purpose |
|---------|---------|
| `agent:init` | Initialize a new Regent agent project |
| `agent:create` | Create an agent via the factory contract |
| `agent:status` | Show agent state (factory + ERC-8004) |
| `agent:list` | List agents owned by a wallet |

**Global options:**
- `--config <path>` — Path to config file
- `--chain <chain>` — Chain ID or name (sepolia, base-sepolia, etc.)
- `--rpc-url <url>` — Override RPC URL
- `--wallet <id>` — Wallet connector ID
- `--factory <address>` — Override factory address
- `--mode <mode>` — Deployment mode: mock or onchain

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test

# Build specific package
cd packages/cli && bun run build
cd packages/regentx && bun run build
```

## Local Testing

To test the CLI locally during development:

```bash
# Link the CLI globally
cd packages/cli
bun link

# Now you can use it anywhere
regent init my-test-agent

# Or run directly without linking
bun run packages/cli/dist/index.js init my-test-agent
```

## Dependencies

These CLI packages depend on Regent SDK packages:
- `@regent/core` — Agent runtime
- `@regent/wallet` — Wallet management
- `@regent/types` — Shared type definitions

The workspace includes SDK packages via:
```json
"workspaces": ["../regent-sdk/regent-sdk/packages/*"]
```

## Cross-References

- **Uses**: `regent-sdk` for agent creation and wallet management
- **Related**: See root `AGENTS.md` for beads workflow

## Issue Tracking

See root `AGENTS.md` for beads workflow. Use `bd ready --json` to find work.
