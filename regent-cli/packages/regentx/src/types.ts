/**
 * Type definitions for regentx CLI
 */

import type { Address } from '@regent/contracts';
import type { RegentAgentConfig } from '@regent/agents';

/**
 * Project configuration file schema (regent.config.ts)
 */
export interface RegentProjectConfig {
  /** Schema version */
  version: 1;

  /** Agent configuration */
  agent: RegentAgentConfig;

  /** CLI state (persisted after operations) */
  state?: {
    /** Last created agent ID */
    agentId?: string;
    /** Last transaction hash */
    lastTxHash?: string;
  };
}

/**
 * Global CLI options available on all commands
 */
export interface GlobalOptions {
  /** Override config file path */
  config?: string;
  /** Override chain ID or name */
  chain?: string;
  /** Override RPC URL */
  rpcUrl?: string;
  /** Override wallet connector */
  wallet?: string;
  /** Override factory address */
  factory?: string;
  /** Override deployment mode */
  mode?: 'mock' | 'onchain';
  /** Output JSON instead of human-readable */
  json?: boolean;
}

/**
 * Supported chain identifiers
 */
export const CHAIN_ALIASES: Record<string, number> = {
  // Mainnets
  ethereum: 1,
  base: 8453,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,

  // Testnets
  sepolia: 11155111,
  'base-sepolia': 84532,
  'polygon-amoy': 80002,
  'hedera-testnet': 296,
  'hyperevm-testnet': 998,

  // Local
  localhost: 31337,
  local: 31337,
};

/**
 * Resolve chain ID from name or number string
 */
export function resolveChainId(input: string): number {
  // Try as number first
  const asNumber = parseInt(input, 10);
  if (!isNaN(asNumber)) {
    return asNumber;
  }

  // Try as alias
  const normalized = input.toLowerCase().replace(/\s+/g, '-');
  const chainId = CHAIN_ALIASES[normalized];
  if (chainId) {
    return chainId;
  }

  throw new Error(
    `Unknown chain: ${input}. Use a chain ID or one of: ${Object.keys(CHAIN_ALIASES).join(', ')}`
  );
}

/**
 * Default config file names to search for
 */
export const CONFIG_FILE_NAMES = [
  'regent.config.ts',
  'regent.config.mts',
  'regent.config.js',
  'regent.config.mjs',
  'regent.config.json',
];
