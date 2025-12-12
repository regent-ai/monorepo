/**
 * regent-sdk
 * Unified SDK for Regent agent runtime, HTTP adapters, x402 payments, and ERC-8004 identity
 */

// Re-export core agent runtime
export { createAgent, AgentBuilder, AgentCore, createAgentCore } from '@regent/core';
export type { AgentConfig, EntrypointDef, EntrypointHandler, EntrypointStreamHandler, Network } from '@regent/core';

// Re-export HTTP extension
export { http } from '@regent/http';

// Re-export A2A extension
export { a2a } from '@regent/a2a';

// Re-export ERC-8004 SDK
export {
  SDK as RegentErc8004SDK,
  Agent as Erc8004Agent,
  Web3Client,
  IPFSClient,
  SubgraphClient,
  FeedbackManager,
  EndpointCrawler,
  AgentIndexer,
} from '@regent/erc8004';
export type {
  SDKConfig as RegentErc8004Config,
  TransactionOptions,
  IPFSClientConfig,
  McpCapabilities,
  A2aCapabilities,
} from '@regent/erc8004';

// Re-export types
export type {
  AgentRuntime,
  Extension,
} from '@regent/types/core';
export type {
  TrustConfig,
  TrustModel,
  RegistrationEntry,
} from '@regent/types/identity';

// Unified configuration type
export type { RegentAgentConfig } from './config.js';

// High-level API
export { createRegentAgent, createRegentSDK } from './create-agent.js';
export type { RegentAgentResult } from './create-agent.js';

// Environment-based configuration helpers
export {
  createRegentAgentConfigFromEnv,
  createRegentSDKConfigFromEnv,
  validateRegentEnv,
} from './env.js';
