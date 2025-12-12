# ERC-8004 Integration Guide

This guide covers integrating ERC-8004 on-chain agent identity, discovery, and reputation into your Regent agent.

## Overview

ERC-8004 provides:
- **On-chain Identity**: Register your agent on the blockchain with a unique ID
- **Agent Discovery**: Search for agents by capabilities, skills, and reputation
- **Reputation System**: Feedback and ratings for agent performance
- **IPFS Metadata**: Store agent details on IPFS with on-chain references

## Quick Start

### Option 1: Using the Unified SDK

```typescript
import { createRegentAgent } from 'regent-sdk';

const agent = await createRegentAgent({
  name: 'My Agent',
  description: 'An intelligent assistant',
  version: '1.0.0',

  // ERC-8004 Identity configuration
  identity: {
    chainId: 84532, // Base Sepolia
    rpcUrl: process.env.RPC_URL!,
    ipfs: 'pinata',
    ipfsConfig: {
      pinataJwt: process.env.PINATA_JWT,
    },
  },

  // Wallet for signing transactions
  wallet: {
    privateKey: process.env.PRIVATE_KEY,
  },

  // Discovery configuration
  discovery: {
    mcpEndpoint: 'https://myagent.com/mcp',
    a2aEndpoint: 'https://myagent.com/.well-known/agent-card.json',
    oasfSkills: ['code_generation', 'data_analysis'],
    oasfDomains: ['software_development'],
  },

  // Trust model
  trust: {
    reputation: true,
    cryptoEconomic: false,
    teeAttestation: false,
  },
});

// Register on-chain
const { agentId } = await agent.registerOnchain();
console.log('Registered agent:', agentId);
```

### Option 2: Using the ERC-8004 SDK Directly

```typescript
import { SDK } from '@regent/erc8004';

const sdk = new SDK({
  chainId: 84532,
  rpcUrl: process.env.RPC_URL!,
  signer: process.env.PRIVATE_KEY,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
});

// Create and configure agent
const agent = sdk.createAgent(
  'My Agent',
  'An intelligent assistant',
  'https://example.com/logo.png'
);

// Set capabilities
await agent.setMCP('https://myagent.com/mcp', '2025-06-18');
await agent.setA2A('https://myagent.com/a2a.json', '0.30');
agent.setENS('myagent.eth');
agent.setActive(true);

// Configure trust model
agent.setTrust(true, false, false); // reputation, cryptoEconomic, teeAttestation

// Register on IPFS and blockchain
const result = await agent.registerIPFS();
console.log('Agent ID:', result.agentId);
console.log('IPFS URI:', result.agentURI);
```

## Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Ethereum Mainnet | 1 | Supported |
| Sepolia | 11155111 | Supported |
| Base | 8453 | Supported |
| Base Sepolia | 84532 | Recommended for testing |
| Arbitrum One | 42161 | Supported |
| Polygon | 137 | Supported |
| Optimism | 10 | Supported |

## Agent Registration

### Basic Registration

```typescript
const agent = sdk.createAgent('Name', 'Description', 'https://logo.url');
const result = await agent.registerIPFS();
```

### With HTTP URI (No IPFS)

```typescript
const agent = sdk.createAgent('Name', 'Description', 'https://logo.url');
await agent.registerHTTP('https://myserver.com/agent-metadata.json');
```

### Registration Fields

```typescript
// Required
agent.name          // Agent name
agent.description   // Agent description

// Optional endpoints
await agent.setMCP(endpoint, version);    // MCP server endpoint
await agent.setA2A(endpoint, version);    // A2A agent card endpoint

// Optional identity
agent.setENS('myagent.eth', '1.0');       // ENS domain
agent.setAgentWallet(address, chainId);   // Payment wallet

// Configuration
agent.setActive(true);                    // Active status
agent.setX402Support(true);               // x402 payment support
agent.setTrust(reputation, crypto, tee);  // Trust models

// Custom metadata
agent.setMetadata({
  category: 'assistant',
  languages: ['en', 'es'],
});
```

## Agent Discovery

### Search by Capabilities

```typescript
// Find agents with MCP endpoints
const mcpAgents = await sdk.searchAgents({ mcp: true });

// Find agents by skill
const coders = await sdk.searchAgents({
  a2aSkills: ['code_generation']
});

// Find agents by name
const assistants = await sdk.searchAgents({
  name: 'assistant'
});

// Combined filters
const results = await sdk.searchAgents({
  mcp: true,
  a2aSkills: ['data_analysis'],
  active: true,
});
```

### Search by Reputation

```typescript
const topRated = await sdk.searchAgentsByReputation(
  undefined,  // specific agents
  ['helpful'], // tags
  undefined,  // reviewers
  ['code_generation'], // capabilities
  ['python'], // skills
  undefined,  // tasks
  undefined,  // names
  80          // minimum average score
);
```

### Pagination

```typescript
// First page
const page1 = await sdk.searchAgents({ active: true }, undefined, 10);

// Next page
if (page1.nextCursor) {
  const page2 = await sdk.searchAgents(
    { active: true },
    undefined,
    10,
    page1.nextCursor
  );
}
```

### Load Full Agent Data

```typescript
// Get summary from search
const summary = await sdk.getAgent('84532:123');

// Load full agent with methods
const agent = await sdk.loadAgent('84532:123');
console.log(agent.name);
console.log(agent.mcpEndpoint);
```

## Reputation & Feedback

### Submitting Feedback

Feedback requires authorization from the agent owner:

```typescript
// Agent owner signs authorization
const agentSdk = new SDK({
  chainId, rpcUrl,
  signer: agentPrivateKey,
  ipfs: 'pinata',
  pinataJwt,
});

const auth = await agentSdk.signFeedbackAuth(
  agentId,
  clientAddress,
  undefined, // expiresAt (optional)
  24         // hours valid
);

// Client submits feedback
const clientSdk = new SDK({
  chainId, rpcUrl,
  signer: clientPrivateKey,
  ipfs: 'pinata',
  pinataJwt,
});

const feedback = clientSdk.prepareFeedback(
  agentId,
  85,                    // score (0-100)
  ['helpful', 'fast'],   // tags
  'Great experience!',   // text (optional)
  'code_generation',     // capability
  undefined,             // name
  'python',              // skill
  undefined,             // task
  { context: 'enterprise' } // metadata
);

await clientSdk.giveFeedback(agentId, feedback, auth);
```

### Querying Feedback

```typescript
// Get specific feedback
const fb = await sdk.getFeedback(agentId, clientAddress, feedbackIndex);

// Search feedback
const results = await sdk.searchFeedback(
  agentId,
  ['helpful'],           // tags
  ['code_generation'],   // capabilities
  ['python'],            // skills
  70,                    // minScore
  100                    // maxScore
);
```

### Agent Response to Feedback

```typescript
await agentSdk.appendResponse(
  agentId,
  clientAddress,
  feedbackIndex,
  {
    uri: 'ipfs://Qm...',
    hash: '0x...',
  }
);
```

## IPFS Configuration

### Pinata (Recommended)

```typescript
const sdk = new SDK({
  chainId: 84532,
  rpcUrl,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
});
```

Get your JWT at [pinata.cloud](https://pinata.cloud).

### Local IPFS Node

```typescript
const sdk = new SDK({
  chainId: 84532,
  rpcUrl,
  ipfs: 'node',
  ipfsNodeUrl: 'http://localhost:5001',
});
```

### Filecoin Pin

```typescript
const sdk = new SDK({
  chainId: 84532,
  rpcUrl,
  ipfs: 'filecoinPin',
  filecoinPrivateKey: process.env.FILECOIN_KEY,
});
```

## Multi-Chain Support

### Query Agents Across Chains

```typescript
import { AgentIndexer } from '@regent/erc8004';

const indexer = new AgentIndexer();

// Get all agents from multiple chains
const agents = await indexer.getAllAgents([84532, 11155111, 8453]);

// Search with chain filter
const baseAgents = await indexer.searchAgents({
  chainId: 8453,
  mcp: true,
});
```

## Agent Transfer

```typescript
// Transfer ownership
const result = await agent.transfer('0xNewOwnerAddress');
console.log('Transfer TX:', result.txHash);

// Or via SDK
await sdk.transferAgent(agentId, '0xNewOwnerAddress');
```

## Environment Variables

```bash
# Required
CHAIN_ID=84532
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

# For registration (one required)
PRIVATE_KEY=0x...
# or
WALLET_PRIVATE_KEY=0x...

# For IPFS (choose one)
IPFS_PROVIDER=pinata
PINATA_JWT=your_jwt
# or
IPFS_PROVIDER=node
IPFS_NODE_URL=http://localhost:5001

# Optional
SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/...
```

## Environment-Based Setup

```typescript
import {
  createRegentSDKConfigFromEnv,
  createRegentSDK
} from 'regent-sdk';

// Automatically reads from process.env
const config = createRegentSDKConfigFromEnv();
const sdk = createRegentSDK(config);

// With overrides
const config = createRegentSDKConfigFromEnv(process.env, {
  chainId: 8453, // Override chain
});
```

## Error Handling

```typescript
try {
  const result = await agent.registerIPFS();
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    console.error('Need ETH for gas fees');
  } else if (error.message.includes('pinataJwt')) {
    console.error('Invalid or missing Pinata JWT');
  } else {
    throw error;
  }
}
```

## Best Practices

1. **Use testnet first**: Start with Base Sepolia (84532) before mainnet
2. **Cache agent cards**: Use `agentCardTtlMs` option to reduce RPC calls
3. **Batch operations**: Use pagination for large result sets
4. **Secure keys**: Never commit private keys; use environment variables
5. **Monitor gas**: Registration and feedback require ETH for gas

## Related Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [@regent/erc8004 Package](../packages/erc8004/README.md)
- [Agent Discovery API](../packages/erc8004/src/core/subgraph-client.ts)
