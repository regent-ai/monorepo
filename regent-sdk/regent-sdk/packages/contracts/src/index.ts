/**
 * @regent/contracts
 *
 * TypeScript interfaces and clients for Regent agent-creation contracts.
 *
 * This package provides:
 * - Type-safe interfaces for interacting with the RegentAgentFactory contract
 * - An in-memory mock implementation for local development and testing
 * - A viem-based implementation for on-chain interaction
 * - Multi-chain contract addresses
 *
 * @example
 * ```typescript
 * // Local development with mock factory
 * import { InMemoryAgentFactory } from '@regent/contracts';
 *
 * const factory = new InMemoryAgentFactory({ chainId: 11155111 });
 * const agent = await factory.createAgent({
 *   name: 'My Agent',
 *   owner: '0x1234...',
 *   metadataUri: 'ipfs://...',
 * });
 * ```
 *
 * @example
 * ```typescript
 * // On-chain interaction with viem
 * import { ViemRegentAgentFactory } from '@regent/contracts';
 * import { createPublicClient, createWalletClient, http } from 'viem';
 * import { sepolia } from 'viem/chains';
 *
 * const factory = new ViemRegentAgentFactory({
 *   address: '0x...',
 *   chain: sepolia,
 *   publicClient,
 *   walletClient,
 * });
 * ```
 *
 * @packageDocumentation
 */

// Core interfaces
export type {
  AgentId,
  Address,
  TxHash,
  CreateAgentInput,
  CreatedAgentInfo,
  AgentBond,
  AgentTreasury,
  AgentOnchainState,
  FactoryConfig,
  RegentAgentFactory,
  ViemFactoryOptions,
} from './interfaces';

// Mock implementation
export {
  InMemoryAgentFactory,
  type InMemoryFactoryOptions,
} from './mockFactory';

// Viem implementation
export {
  ViemRegentAgentFactory,
  type ViemRegentAgentFactoryOptions,
} from './viemFactory';

// Chain addresses and utilities
export {
  CHAIN_IDS,
  type ChainId,
  REGENT_AGENT_FACTORY_ADDRESSES,
  CHAIN_NAMES,
  getFactoryAddress,
  isFactoryDeployed,
  getDeployedChains,
  getChainName,
} from './addresses';
