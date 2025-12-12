# Regent SDK - Development Notes

## Project Overview

Merged monorepo combining:
- **Regent Agents runtime** - Agent runtime, HTTP/adapters, x402 payments
- **ERC-8004 SDK (legacy source)** - identity, discovery, reputation

## Commands

### Build
```bash
bun run build           # Build all packages
bun run build:clean     # Clean and rebuild
```

### Test
```bash
# Run all tests (unit + integration)
bun run test

# Run with coverage
bun run test:coverage

# Run specific package tests
cd packages/erc8004 && bun test

# Run specific test file
cd packages/erc8004 && bun test src/__tests__/oasf-management.test.ts
```

### Type Check
```bash
bun run type-check
```

### Lint & Format
```bash
bun run lint
bun run lint:fix
bun run format
bun run format:check
```

## Test Environment Setup

For integration tests that require blockchain/IPFS access, create `packages/erc8004/.env`:

```env
CHAIN_ID=11155111
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
AGENT_PRIVATE_KEY=0x...
CLIENT_PRIVATE_KEY=0x...
PINATA_JWT=your_pinata_jwt
SUBGRAPH_URL=https://gateway.thegraph.com/api/YOUR_KEY/subgraphs/id/...
AGENT_ID=11155111:374
```

## Package Structure

```
packages/
├── types/          # @regent/types - Shared TypeScript types
├── core/           # @regent/core - Agent runtime core
├── http/           # @regent/http - HTTP server extension
├── hono/           # @regent/hono - Hono adapter
├── express/        # @regent/express - Express adapter
├── tanstack/       # @regent/tanstack - TanStack adapter
├── wallet/         # @regent/wallet - Wallet management
├── x402/           # @regent/x402 - Payment integration
├── analytics/      # @regent/analytics - Analytics
├── a2a/            # @regent/a2a - Agent-to-Agent protocol
├── ap2/            # @regent/ap2 - AP2 protocol
├── scheduler/      # @regent/scheduler - Task scheduling
├── erc8004/        # @regent/erc8004 - ERC-8004 SDK (identity/discovery/reputation)
└── sdk/            # regent-sdk - Umbrella package
```

CLI packages (`@regent/cli`, `@regent/regentx`) live under `monorepo/regent-cli/packages/`.

## Migration Status

| Task | Status |
|------|--------|
| Initialize monorepo | ✅ Complete |
| Copy legacy agents packages | ✅ Complete |
| Rename legacy package scope to @regent/* | ✅ Complete |
| Create @regent/erc8004 from legacy ERC-8004 SDK | ✅ Complete |
| Migrate ethers.js to viem | ✅ Complete |
| Create @regent/sdk umbrella | ✅ Complete |
| Migrate Jest tests to Bun | ✅ Complete |
| Add monorepo test commands | ✅ Complete |
| Merge identity features into erc8004 | ✅ Complete |
| Update CLI to regent command | ✅ Complete |

## Notes

### ethers.js → viem Migration
- `packages/erc8004/src/core/web3-client.ts` - Now uses viem's publicClient/walletClient
- Signing uses viem's `signMessage` instead of ethers' `signMessage`
- Contract calls use `readContract`/`writeContract` instead of ethers Contract

### Test Migration (Jest → Bun)
- Tests moved to `packages/erc8004/src/__tests__/`
- Imports changed from `@jest/globals` to `bun:test`
- Timeout set to 120000ms for blockchain integration tests
- 56 unit tests pass without env vars
- 13 integration tests require env vars

### Identity Features Merged (legacy identity package → @regent/erc8004)
- `domain-proof.ts` - Domain proof signing (EIP-191 personal_sign)
  - `buildDomainProofMessage()` - Create proof message
  - `signDomainProof()` - Sign with viem walletClient
  - `buildMetadataURI()` - Generate metadata URI
  - `signValidationRequest()` - Sign validation requests
- `a2a-manifest.ts` - A2A manifest enhancement
  - `createAgentCardWithIdentity()` - Add ERC-8004 identity to Agent Cards
  - `buildTrustConfig()` - Build trust config from registration data
  - `TrustConfig`, `RegistrationEntry`, `AgentCard` types
- Additional chains added to contracts.ts:
  - Hedera Testnet (296)
  - HyperEVM Testnet (998)
  - SKALE Base Sepolia (202402221200)

### CLI Updates
- Added `regent` command (alongside existing `create-agent-kit`)
- Templates updated to use `@regent/core` references
- Repository URL updated to regent-protocol/regent-sdk
