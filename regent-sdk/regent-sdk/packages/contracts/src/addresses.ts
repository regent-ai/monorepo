/**
 * Multi-chain deployment addresses for the Regent Agent Factory
 *
 * These addresses will be populated once contracts are deployed.
 * For now, they serve as placeholders that the SDK can reference.
 */

import type { Address } from './interfaces';

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS = {
  // Mainnets
  ETHEREUM: 1,
  BASE: 8453,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,

  // Testnets
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  POLYGON_AMOY: 80002,
  HEDERA_TESTNET: 296,
  HYPEREVM_TESTNET: 998,

  // Local
  LOCALHOST: 31337,
} as const;

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

/**
 * Regent Agent Factory contract addresses by chain ID
 *
 * NOTE: These are placeholder addresses. They will be updated once
 * the contracts are deployed to each network.
 */
export const REGENT_AGENT_FACTORY_ADDRESSES: Partial<Record<ChainId, Address>> =
  {
    // Testnets - will be deployed first
    [CHAIN_IDS.SEPOLIA]: '0x0000000000000000000000000000000000000000',
    [CHAIN_IDS.BASE_SEPOLIA]: '0x0000000000000000000000000000000000000000',
    [CHAIN_IDS.POLYGON_AMOY]: '0x0000000000000000000000000000000000000000',

    // Mainnets - TBD
    // [CHAIN_IDS.ETHEREUM]: '0x...',
    // [CHAIN_IDS.BASE]: '0x...',
  };

/**
 * Get the factory address for a given chain ID
 *
 * @param chainId - The chain ID to look up
 * @returns The factory address or undefined if not deployed
 */
export function getFactoryAddress(chainId: number): Address | undefined {
  return REGENT_AGENT_FACTORY_ADDRESSES[chainId as ChainId];
}

/**
 * Check if a factory is deployed on a given chain
 *
 * @param chainId - The chain ID to check
 * @returns True if a non-zero factory address exists
 */
export function isFactoryDeployed(chainId: number): boolean {
  const address = getFactoryAddress(chainId);
  return (
    address !== undefined &&
    address !== '0x0000000000000000000000000000000000000000'
  );
}

/**
 * Get all chain IDs where the factory is deployed
 *
 * @returns Array of chain IDs with deployed factories
 */
export function getDeployedChains(): number[] {
  return Object.entries(REGENT_AGENT_FACTORY_ADDRESSES)
    .filter(
      ([_, address]) =>
        address && address !== '0x0000000000000000000000000000000000000000'
    )
    .map(([chainId]) => parseInt(chainId, 10));
}

/**
 * Human-readable chain names
 */
export const CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: 'Ethereum',
  [CHAIN_IDS.BASE]: 'Base',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
  [CHAIN_IDS.OPTIMISM]: 'Optimism',
  [CHAIN_IDS.SEPOLIA]: 'Sepolia',
  [CHAIN_IDS.BASE_SEPOLIA]: 'Base Sepolia',
  [CHAIN_IDS.POLYGON_AMOY]: 'Polygon Amoy',
  [CHAIN_IDS.HEDERA_TESTNET]: 'Hedera Testnet',
  [CHAIN_IDS.HYPEREVM_TESTNET]: 'HyperEVM Testnet',
  [CHAIN_IDS.LOCALHOST]: 'Localhost',
};

/**
 * Get a human-readable chain name
 *
 * @param chainId - The chain ID
 * @returns The chain name or "Unknown Chain"
 */
export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] ?? `Unknown Chain (${chainId})`;
}
