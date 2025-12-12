# @regent/contracts

TypeScript interfaces and clients for Regent agent-creation contracts.

## Overview

This package provides a type-safe interface for interacting with the Regent Agent Factory smart contract. It includes:

- **Type definitions** for agent creation, state management, and factory configuration
- **Mock implementation** for local development and testing (no blockchain required)
- **Viem implementation** for on-chain interaction with deployed contracts
- **Multi-chain address registry** for deployed factory contracts

## Installation

```bash
npm install @regent/contracts
# or
bun add @regent/contracts
```

## Quick Start

### Local Development (Mock Factory)

For development and testing without blockchain infrastructure:

```typescript
import { InMemoryAgentFactory } from '@regent/contracts';

// Create a mock factory
const factory = new InMemoryAgentFactory({ chainId: 11155111 });

// Create an agent
const agent = await factory.createAgent({
  name: 'My Agent',
  owner: '0x1234567890123456789012345678901234567890',
  metadataUri: 'ipfs://QmYourMetadataHash',
});

console.log('Created agent:', agent.agentId); // "11155111:1"

// Query agent state
const state = await factory.getAgent(agent.agentId);
console.log('Agent state:', state);
```

### On-Chain Interaction (Viem Factory)

For production use with deployed contracts:

```typescript
import { ViemRegentAgentFactory, getFactoryAddress } from '@regent/contracts';
import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Setup viem clients
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(),
});

// Create factory client
const factory = new ViemRegentAgentFactory({
  address: getFactoryAddress(sepolia.id)!,
  chain: sepolia,
  publicClient,
  walletClient,
});

// Create an agent on-chain
const agent = await factory.createAgent({
  name: 'My On-Chain Agent',
  owner: account.address,
  metadataUri: 'ipfs://QmYourMetadataHash',
  treasuryConfig: {
    rakeBps: 500, // 5% rake
  },
});

console.log('Created agent:', agent.agentId);
console.log('Transaction:', agent.txHash);
```

## API Reference

### `RegentAgentFactory` Interface

The main interface for interacting with agent factories:

```typescript
interface RegentAgentFactory {
  // Create a new agent
  createAgent(input: CreateAgentInput): Promise<CreatedAgentInfo>;

  // Query agent state
  getAgent(agentId: AgentId): Promise<AgentOnchainState | null>;
  getAgentsByOwner(owner: Address): Promise<AgentOnchainState[]>;

  // Management operations (optional)
  updateMetadata?(agentId: AgentId, metadataUri: string): Promise<TxHash>;
  setPaused?(agentId: AgentId, paused: boolean): Promise<TxHash>;
  changeOwner?(agentId: AgentId, newOwner: Address): Promise<TxHash>;
  setTreasury?(agentId: AgentId, treasury: Address, rakeBps: number): Promise<TxHash>;

  // Bond operations (optional)
  depositBond?(agentId: AgentId, amount: bigint): Promise<TxHash>;
  withdrawBond?(agentId: AgentId, to: Address, amount: bigint): Promise<TxHash>;

  // Factory config
  getFactoryConfig?(): Promise<FactoryConfig>;
}
```

### `CreateAgentInput`

Parameters for creating a new agent:

```typescript
interface CreateAgentInput {
  name: string;                          // Human-readable name
  owner: Address;                        // Owner address (EOA or multisig)
  metadataUri: string;                   // IPFS or HTTPS metadata URL

  // Optional ERC-8004 integration
  erc8004IdentityChainId?: number;
  erc8004IdentityRegistry?: Address;

  // Optional tokenomics
  initialBondAmount?: bigint;
  treasuryConfig?: {
    treasury?: Address;
    rakeBps?: number;                    // 0-10000 (basis points)
  };
}
```

### `AgentOnchainState`

On-chain state for an agent:

```typescript
interface AgentOnchainState {
  agentId: AgentId;           // "chainId:localId" format
  owner: Address;
  name?: string;
  wallet?: Address;
  metadataUri: string;
  paused: boolean;
  bond?: {
    token: Address;
    amount: bigint;
  };
  treasury?: {
    address: Address;
    rakeBps: number;
  };
}
```

## Chain Addresses

```typescript
import {
  CHAIN_IDS,
  getFactoryAddress,
  isFactoryDeployed,
  getDeployedChains,
} from '@regent/contracts';

// Check if factory is deployed on a chain
if (isFactoryDeployed(CHAIN_IDS.SEPOLIA)) {
  const address = getFactoryAddress(CHAIN_IDS.SEPOLIA);
  console.log('Sepolia factory:', address);
}

// Get all deployed chains
const chains = getDeployedChains();
console.log('Deployed on:', chains);
```

## Testing

The mock factory is ideal for unit tests:

```typescript
import { InMemoryAgentFactory } from '@regent/contracts';
import { describe, it, expect, beforeEach } from 'bun:test';

describe('MyAgentService', () => {
  let factory: InMemoryAgentFactory;

  beforeEach(() => {
    factory = new InMemoryAgentFactory({ chainId: 31337 });
  });

  it('should create and manage agents', async () => {
    const agent = await factory.createAgent({
      name: 'Test Agent',
      owner: '0x1234...',
      metadataUri: 'ipfs://test',
    });

    expect(agent.agentId).toBe('31337:1');

    // Reset between tests
    factory.reset();
  });
});
```

## Solidity Interface

The factory expects contracts implementing `IRegentAgentFactory`. See the ABI in `@regent/contracts/abi`:

```typescript
import { IREGENT_AGENT_FACTORY_ABI } from '@regent/contracts/abi';
```

## Related Packages

- `@regent/agents` - High-level agent orchestration
- `@regent/erc8004` - ERC-8004 identity integration
- `@regent/wallet` - Wallet connectors for signing
- `@regent/x402` - Payment integration

## License

MIT
