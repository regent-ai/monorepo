# @regent/erc8004

ERC-8004 Agent Identity, Discovery, and Reputation SDK for Regent.

## Installation

```bash
bun add @regent/erc8004
```

## Features

- On-chain agent identity management (ERC-8004)
- Agent registration and updates
- IPFS metadata storage (Pinata integration)
- Reputation and feedback system
- Agent discovery via Subgraph
- Multi-chain support
- MCP/A2A endpoint crawling

## Quick Start

```typescript
import { SDK } from '@regent/erc8004';

// Initialize SDK
const sdk = new SDK({
  chainId: 11155111, // Sepolia
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
  signer: process.env.AGENT_PRIVATE_KEY,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
});

// Create and register an agent
const agent = sdk.createAgent('My Agent', 'An AI assistant', 'https://example.com/image.png');

// Configure agent capabilities
await agent.setMCP('https://api.example.com/mcp', '2025-06-18');
await agent.setA2A('https://api.example.com/a2a.json', '0.30');
agent.setENS('myagent.eth');
agent.setActive(true);

// Register on-chain with IPFS metadata
const result = await agent.registerIPFS();
console.log('Agent ID:', result.agentId);
```

## Agent Discovery

```typescript
// Search for agents
const results = await sdk.searchAgents({
  name: 'assistant',
  mcp: true,
  active: true,
});

// Get agent by ID
const agent = await sdk.getAgent('11155111:123');

// Load full agent data
const loadedAgent = await sdk.loadAgent('11155111:123');
```

## Reputation & Feedback

```typescript
// Sign feedback authorization
const auth = await sdk.signFeedbackAuth(agentId, clientAddress, undefined, 24);

// Submit feedback
const feedback = sdk.prepareFeedback(
  agentId,
  85, // score
  ['helpful', 'accurate'], // tags
  'Great experience!', // text
  'code_generation', // capability
);

await clientSdk.giveFeedback(agentId, feedback, auth);

// Search feedback
const feedbackResults = await sdk.searchFeedback(agentId, ['helpful']);
```

## Agent Transfer

```typescript
// Transfer agent ownership
const result = await agent.transfer('0xNewOwnerAddress');
console.log('Transfer TX:', result.txHash);
```

## API

### SDK Class

- `new SDK(config)` - Initialize SDK with chain, RPC, signer, and IPFS config
- `createAgent(name, description, image)` - Create new agent instance
- `loadAgent(agentId)` - Load existing agent by ID
- `getAgent(agentId)` - Get agent summary from Subgraph
- `searchAgents(filters, cursor, pageSize)` - Search agents with filters
- `searchAgentsByReputation(...)` - Search by reputation criteria
- `transferAgent(agentId, newOwner)` - Transfer agent ownership
- `signFeedbackAuth(...)` - Sign feedback authorization
- `giveFeedback(...)` - Submit agent feedback
- `getFeedback(...)` - Retrieve feedback
- `searchFeedback(...)` - Search feedback with filters

### Agent Class

- `registerIPFS()` - Register agent with IPFS metadata
- `registerHTTP(uri)` - Register agent with HTTP URI
- `transfer(newOwner)` - Transfer ownership
- `setMCP(endpoint, version)` - Set MCP endpoint
- `setA2A(endpoint, version)` - Set A2A endpoint
- `setENS(name, version)` - Set ENS domain
- `setActive(active)` - Set active status
- `setMetadata(metadata)` - Set custom metadata
- `getRegistrationFile()` - Get registration file data

### Supporting Classes

- `Web3Client` - Blockchain interaction client
- `IPFSClient` - IPFS storage client
- `SubgraphClient` - Subgraph query client
- `FeedbackManager` - Feedback operations
- `EndpointCrawler` - MCP/A2A capability discovery
- `AgentIndexer` - Agent indexing

## Supported Chains

- Ethereum Mainnet (1)
- Sepolia (11155111)
- Base (8453)
- Base Sepolia (84532)
- Arbitrum (42161)
- Polygon (137)
- And more...

## Environment Variables

```bash
CHAIN_ID=11155111
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
AGENT_PRIVATE_KEY=0x...
PINATA_JWT=your_pinata_jwt
```

## License

MIT
