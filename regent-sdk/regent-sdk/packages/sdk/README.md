# regent-sdk

Unified SDK for building AI agents with blockchain capabilities.

## Installation

```bash
bun add regent-sdk
```

## Features

- Complete agent runtime with typed entrypoints
- HTTP server adapters (Hono, Express, TanStack)
- x402 payment protocol integration
- ERC-8004 on-chain identity and reputation
- Agent-to-agent (A2A) communication
- Wallet management and connectors
- Multi-chain blockchain support

## Quick Start

```typescript
import { createRegentAgent } from 'regent-sdk';
import { z } from 'zod';

const agent = createRegentAgent({
  name: 'My AI Agent',
  version: '1.0.0',
  chainId: 84532, // Base Sepolia
  rpcUrl: process.env.RPC_URL,
});

// Define an entrypoint
agent.entrypoint('chat', {
  input: z.object({ message: z.string() }),
  output: z.object({ response: z.string() }),
  handler: async ({ input }) => ({
    response: `You said: ${input.message}`,
  }),
});

// Start server
agent.listen(3000);
```

## With Payments

```typescript
import { createRegentAgent, x402 } from 'regent-sdk';

const agent = createRegentAgent({
  name: 'Premium Agent',
  version: '1.0.0',
});

// Enable x402 payments
agent.use(x402({
  network: 'base-sepolia',
  wallet: await createAgentWallet(),
}));

// Paid entrypoint
agent.entrypoint('premium-feature', {
  input: z.object({ query: z.string() }),
  output: z.object({ result: z.string() }),
  price: '0.001', // 0.001 USDC
  handler: async ({ input }) => ({
    result: await processQuery(input.query),
  }),
});
```

## On-Chain Identity

```typescript
import { SDK as Erc8004SDK } from 'regent-sdk';

const identitySdk = new Erc8004SDK({
  chainId: 84532,
  rpcUrl: process.env.RPC_URL,
  signer: process.env.PRIVATE_KEY,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
});

// Register agent on-chain
const regAgent = identitySdk.createAgent('My Agent', 'Description', 'https://image.url');
await regAgent.setMCP('https://api.example.com/mcp', '2025-06-18');
const result = await regAgent.registerIPFS();

console.log('Agent ID:', result.agentId);
```

## Exports

### Core Runtime

- `createAgent` - Create agent instance
- `AgentBuilder` - Fluent agent builder
- `createAgentCore` - Low-level core creation

### Extensions

- `http()` - HTTP handlers
- `x402()` - Payment processing
- `a2a()` - Agent-to-agent communication
- `wallets()` - Wallet management
- `analytics()` - Payment analytics

### Adapters

- `createAgentApp` - Create HTTP server (Hono)
- Express and TanStack adapters available separately

### ERC-8004 Identity

- `SDK` / `RegentErc8004SDK` - Identity SDK
- `Agent` / `Erc8004Agent` - Agent wrapper
- `Web3Client` - Blockchain client
- `IPFSClient` - IPFS storage
- `SubgraphClient` - Query client
- `FeedbackManager` - Reputation system

### Utilities

- `createRegentAgent()` - High-level agent factory
- `createRegentSDK()` - SDK factory
- Type definitions and helpers

## Package Structure

```
regent-sdk (this package)
├── @regent/core - Agent runtime foundation
├── @regent/http - HTTP handlers
├── @regent/hono - Hono adapter
├── @regent/express - Express adapter
├── @regent/tanstack - TanStack adapter
├── @regent/x402 - Payment processing
├── @regent/a2a - Agent-to-agent protocol
├── @regent/wallet - Wallet connectors
├── @regent/erc8004 - On-chain identity
├── @regent/analytics - Payment analytics
└── @regent/types - Shared types
```

## Documentation

- [Core Runtime](./packages/core/README.md)
- [HTTP Extension](./packages/http/README.md)
- [Payments (x402)](./packages/x402/README.md)
- [Identity (ERC-8004)](./packages/erc8004/README.md)
- [Agent-to-Agent](./packages/a2a/README.md)

## License

MIT
