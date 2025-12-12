/**
 * SSR-compatible viem configuration for TanStack Start (headless)
 *
 * This module provides a lazy-loaded viem public client that only
 * initializes on the client side to avoid SSR serialization issues.
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Chain configuration - extend as needed
const chains = {
  base,
  baseSepolia,
} as const;

type ChainKey = keyof typeof chains;

// Lazy-loaded client cache
let clientCache: Map<ChainKey, PublicClient> | null = null;

/**
 * Check if we're running on the server
 */
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Get a viem public client for the specified chain.
 * Returns null on the server to prevent SSR serialization issues.
 *
 * @example
 * ```ts
 * const client = getViemClient('base');
 * if (client) {
 *   const balance = await client.getBalance({ address: '0x...' });
 * }
 * ```
 */
export function getViemClient(chain: ChainKey = 'base'): PublicClient | null {
  // Return null on server - client code should handle this
  if (isServer()) {
    return null;
  }

  // Initialize cache on first client-side access
  if (!clientCache) {
    clientCache = new Map();
  }

  // Return cached client if available
  if (clientCache.has(chain)) {
    return clientCache.get(chain)!;
  }

  // Create and cache new client
  const client = createPublicClient({
    chain: chains[chain],
    transport: http(),
  });

  clientCache.set(chain, client);
  return client;
}

/**
 * Get all available chain configurations
 */
export function getAvailableChains() {
  return chains;
}

/**
 * @deprecated Use getViemClient() instead for SSR-safe access
 */
export const viemConfig = null;
