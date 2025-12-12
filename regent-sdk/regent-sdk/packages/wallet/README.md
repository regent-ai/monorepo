# @regent/wallet

Wallet connectors and helpers for Regent agents.

## Installation

```bash
bun add @regent/wallet
```

## Features

- Multiple wallet connector types
- Local EOA (private key) signing
- Server Orchestrator integration
- Thirdweb wallet support
- Environment-based configuration
- Runtime wallet extension

## Quick Start

```typescript
import { createAgentWallet, wallets } from '@regent/wallet';

// Create a local EOA wallet
const wallet = await createAgentWallet({
  type: 'local-eoa',
  privateKey: process.env.PRIVATE_KEY,
  chainId: 84532, // Base Sepolia
});

// Add wallet extension to agent
agent.use(wallets());
```

## Wallet Types

### Local EOA

Direct private key signing for development and simple deployments:

```typescript
import { LocalEoaWalletConnector } from '@regent/wallet';

const connector = new LocalEoaWalletConnector({
  privateKey: process.env.PRIVATE_KEY,
  chainId: 84532,
});

const address = await connector.getAddress();
const signature = await connector.signMessage('Hello');
```

### Server Orchestrator

Remote wallet management via orchestration service:

```typescript
import { ServerOrchestratorWalletConnector } from '@regent/wallet';

const connector = new ServerOrchestratorWalletConnector({
  orchestratorUrl: 'https://orchestrator.example.com',
  apiKey: process.env.ORCHESTRATOR_API_KEY,
  walletId: 'my-wallet-id',
});
```

### Thirdweb

Integration with Thirdweb SDK for advanced wallet features:

```typescript
import { ThirdwebWalletConnector } from '@regent/wallet';

const connector = new ThirdwebWalletConnector({
  clientId: process.env.THIRDWEB_CLIENT_ID,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
  chainId: 84532,
});
```

## Factory Functions

### createAgentWallet

Create wallet for agent operations (receiving payments):

```typescript
import { createAgentWallet } from '@regent/wallet';

const wallet = await createAgentWallet({
  type: 'local-eoa',
  privateKey: process.env.AGENT_PRIVATE_KEY,
  chainId: 84532,
});
```

### createDeveloperWallet

Create wallet for developer operations (making payments):

```typescript
import { createDeveloperWallet } from '@regent/wallet';

const wallet = await createDeveloperWallet({
  type: 'thirdweb',
  clientId: process.env.THIRDWEB_CLIENT_ID,
  secretKey: process.env.THIRDWEB_SECRET_KEY,
});
```

### createSignerConnector

Generic adapter for any viem signer:

```typescript
import { createSignerConnector } from '@regent/wallet';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(privateKey);
const connector = createSignerConnector(account);
```

## Environment Configuration

Load wallet configuration from environment variables:

```typescript
import { walletsFromEnv } from '@regent/wallet';

// Reads from WALLET_TYPE, PRIVATE_KEY, CHAIN_ID, etc.
const walletConfig = walletsFromEnv();
const wallet = await createAgentWallet(walletConfig);
```

Environment variables:
- `WALLET_TYPE` - Connector type (local-eoa, server-orchestrator, thirdweb)
- `PRIVATE_KEY` - Private key for local EOA
- `CHAIN_ID` - Target chain ID
- `ORCHESTRATOR_URL` - Server orchestrator URL
- `THIRDWEB_CLIENT_ID` - Thirdweb client ID
- `THIRDWEB_SECRET_KEY` - Thirdweb secret key

## Runtime Extension

Register wallets with agent runtime:

```typescript
import { wallets, createWalletsRuntime } from '@regent/wallet';

// As extension
agent.use(wallets());

// Or create runtime directly
const walletsRuntime = createWalletsRuntime({
  agent: agentWallet,
  developer: developerWallet,
});
```

## Utilities

```typescript
import {
  normalizeChallenge,
  extractSignature,
  detectMessageEncoding
} from '@regent/wallet';

// Normalize challenge for signing
const normalized = normalizeChallenge(challenge);

// Extract signature components
const { r, s, v } = extractSignature(signature);

// Detect message encoding
const encoding = detectMessageEncoding(message); // 'hex' | 'utf8' | 'base64'
```

## API

### Connectors

- `LocalEoaWalletConnector` - Private key signing
- `ServerOrchestratorWalletConnector` - Remote orchestration
- `ThirdwebWalletConnector` - Thirdweb SDK integration

### Factory Functions

- `createAgentWallet(options)` - Create agent wallet
- `createDeveloperWallet(options)` - Create developer wallet
- `createSignerConnector(signer)` - Generic signer adapter
- `walletsFromEnv()` - Load config from environment

### Extensions

- `wallets()` - Wallet runtime extension
- `createWalletsRuntime(config)` - Direct runtime creation

### Utilities

- `normalizeChallenge(challenge)` - Normalize signing challenge
- `extractSignature(sig)` - Extract r, s, v from signature
- `detectMessageEncoding(msg)` - Detect message encoding

## License

MIT
