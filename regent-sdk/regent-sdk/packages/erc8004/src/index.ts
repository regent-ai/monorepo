/**
 * @regent/erc8004
 * ERC-8004 Agent Identity, Discovery, and Reputation SDK
 *
 * Main entry point - exports public API
 */

// Export models
export * from './models/index.js';

// Export utilities
export * from './utils/index.js';

// Export core classes
export { SDK as RegentErc8004SDK, SDK } from './core/sdk.js';
export type { SDKConfig as RegentErc8004Config, SDKConfig } from './core/sdk.js';
export { Agent as Erc8004Agent, Agent } from './core/agent.js';
export { Web3Client } from './core/web3-client.js';
export type { TransactionOptions } from './core/web3-client.js';
export { IPFSClient } from './core/ipfs-client.js';
export type { IPFSClientConfig } from './core/ipfs-client.js';
export { SubgraphClient } from './core/subgraph-client.js';
export { FeedbackManager } from './core/feedback-manager.js';
export { EndpointCrawler } from './core/endpoint-crawler.js';
export type { McpCapabilities, A2aCapabilities } from './core/endpoint-crawler.js';
export { AgentIndexer } from './core/indexer.js';

// Export contract definitions
export * from './core/contracts.js';

