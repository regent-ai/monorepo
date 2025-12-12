# @regent/regentx

CLI for managing Regent agents on-chain.

## Overview

The `regentx` CLI provides commands for:

- Initializing Regent agent projects
- Creating agents via the factory contract
- Querying agent state (factory + ERC-8004)
- Managing agent lifecycle (pause, resume, transfer)

## Installation

```bash
# Recommended (no install)
bunx @regent/regentx@latest --help

# Or install globally (Bun)
bun add -g @regent/regentx

# Node alternative
# npm install -g @regent/regentx
```

## Quick Start

```bash
# Initialize a new project
regentx agent:init --name "my-agent"

# Edit regent.config.ts with your settings
# Set up .env with PRIVATE_KEY

# Create an agent (mock mode for development)
regentx agent:create --mode mock

# Check agent status
regentx agent:status
```

## Commands

### `regentx agent:init`

Initialize a new Regent agent project.

```bash
regentx agent:init [options]

Options:
  --name <name>           Agent name
  --chain <chain>         Default chain (sepolia, base-sepolia, etc.)
  --owner-wallet <id>     Wallet connector ID (default: local-eoa)
  --metadata-uri <uri>    Initial metadata URI
  --mode <mode>           Deployment mode: mock or onchain (default: mock)
  -y, --yes               Accept defaults, overwrite existing
```

### `regentx agent:create`

Create a new agent via the factory contract.

```bash
regentx agent:create [options]

Options:
  --name <name>           Override agent name
  --metadata-uri <uri>    Override metadata URI
  --owner-wallet <id>     Override wallet connector
  --rake-bps <bps>        Rake in basis points (0-10000)
  --initial-bond <wei>    Initial bond amount
  --skip-identity         Don't register with ERC-8004
  --dry-run               Show what would be created
  --json                  Output JSON
```

### `regentx agent:status`

Show the on-chain and ERC-8004 state of an agent.

```bash
regentx agent:status [agentId] [options]

Arguments:
  agentId                 Agent ID (default: from config.state.agentId)

Options:
  --json                  Output JSON
```

### `regentx agent:list`

List all agents owned by a wallet.

```bash
regentx agent:list [options]

Options:
  --owner <address>       Override owner address
  --limit <n>             Max agents to show (default: 50)
  --json                  Output JSON
```

## Global Options

These options are available on all commands:

```
--config <path>       Path to config file
--chain <chain>       Chain ID or name
--rpc-url <url>       Override RPC URL
--wallet <id>         Wallet connector ID
--factory <address>   Factory contract address
--mode <mode>         Deployment mode: mock or onchain
```

## Configuration File

Create a `regent.config.ts` in your project root:

```typescript
import { defineConfig } from '@regent/regentx';

export default defineConfig({
  version: 1,
  agent: {
    name: 'My Regent Agent',
    ownerConnectorId: 'local-eoa',
    metadata: {
      uri: 'ipfs://QmYourMetadataHash',
    },
    deploymentMode: 'mock', // or 'onchain'
    erc8004: {
      chainId: 11155111, // Sepolia
    },
    tokenomics: {
      rakeBps: 500, // 5%
    },
  },
});
```

## Deployment Modes

### Mock Mode (Development)

Use `--mode mock` for local development without blockchain:

```bash
regentx agent:create --mode mock
```

This uses an in-memory factory and doesn't require RPC or wallet setup.

### On-Chain Mode (Production)

Use `--mode onchain` for real blockchain interaction:

```bash
regentx agent:create --mode onchain --chain sepolia
```

Requires:
- `.env` with `PRIVATE_KEY`
- Factory contract deployed on the target chain

## Environment Variables

```bash
# Required for on-chain mode
PRIVATE_KEY=0x...

# Optional overrides
RPC_URL=https://...
FACTORY_ADDRESS=0x...
```

## Related Packages

- `@regent/contracts` - Factory contract interfaces
- `@regent/agents` - Agent orchestration
- `@regent/erc8004` - ERC-8004 identity
- `@regent/wallet` - Wallet connectors

## License

MIT
