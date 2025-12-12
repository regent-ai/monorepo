/**
 * Type aliases for Regent ERC-8004 SDK
 */

// AgentId format: "chainId:tokenId" (e.g., "8453:1234") or just tokenId when chain is implicit
export type AgentId = string;

// Chain ID (numeric)
export type ChainId = number;

// Ethereum address (0x-hex format)
export type Address = string;

// URI (https://... or ipfs://...)
export type URI = string;

// IPFS CID (if used)
export type CID = string;

// Unix timestamp in seconds
export type Timestamp = number;

// Idempotency key for write operations
export type IdemKey = string;

