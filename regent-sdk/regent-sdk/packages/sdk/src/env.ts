/**
 * Environment-based configuration helpers for Regent SDK
 */

import type { RegentAgentConfig } from './config.js';
import type { SDKConfig } from '@regent/erc8004';

type EnvSource = Record<string, string | undefined>;

/**
 * Get environment value with optional default
 */
function getEnv(env: EnvSource, key: string, defaultValue?: string): string | undefined {
  return env[key] ?? defaultValue;
}

/**
 * Get required environment value, throws if missing
 */
function requireEnv(env: EnvSource, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Parse boolean environment value
 */
function parseBool(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse integer environment value
 */
function parseInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Create RegentAgentConfig from environment variables
 *
 * Supported environment variables:
 * - AGENT_NAME (required)
 * - AGENT_DESCRIPTION
 * - AGENT_VERSION
 * - AGENT_LOGO
 * - HTTP_PORT
 * - HTTP_HOST
 * - PRIVATE_KEY / WALLET_PRIVATE_KEY
 * - CHAIN_ID
 * - RPC_URL
 * - IPFS_PROVIDER (node | pinata | filecoinPin)
 * - PINATA_JWT
 * - IPFS_NODE_URL
 * - FILECOIN_PRIVATE_KEY
 * - SUBGRAPH_URL
 * - MCP_ENDPOINT
 * - A2A_ENDPOINT
 * - TRUST_REPUTATION
 * - TRUST_CRYPTO_ECONOMIC
 * - TRUST_TEE_ATTESTATION
 *
 * @example
 * ```ts
 * import { createRegentAgentFromEnv } from 'regent-sdk';
 *
 * // Uses process.env by default
 * const config = createRegentAgentConfigFromEnv();
 *
 * // Or provide custom env source
 * const config = createRegentAgentConfigFromEnv({
 *   AGENT_NAME: 'My Agent',
 *   CHAIN_ID: '84532',
 * });
 * ```
 */
export function createRegentAgentConfigFromEnv(
  env: EnvSource = process.env,
  overrides?: Partial<RegentAgentConfig>
): RegentAgentConfig {
  const config: RegentAgentConfig = {
    name: overrides?.name ?? requireEnv(env, 'AGENT_NAME'),
    description: overrides?.description ?? getEnv(env, 'AGENT_DESCRIPTION') ?? '',
    version: overrides?.version ?? getEnv(env, 'AGENT_VERSION') ?? '1.0.0',
    logo: overrides?.logo ?? getEnv(env, 'AGENT_LOGO'),
  };

  // HTTP configuration
  const httpPort = parseInt(getEnv(env, 'HTTP_PORT'));
  const httpHost = getEnv(env, 'HTTP_HOST');
  if (httpPort || httpHost || overrides?.http) {
    config.http = {
      port: overrides?.http?.port ?? httpPort,
      host: overrides?.http?.host ?? httpHost,
    };
  }

  // Wallet configuration
  const privateKey = getEnv(env, 'PRIVATE_KEY') ?? getEnv(env, 'WALLET_PRIVATE_KEY');
  if (privateKey || overrides?.wallet) {
    config.wallet = {
      privateKey: overrides?.wallet?.privateKey ?? privateKey,
      networks: overrides?.wallet?.networks,
    };
  }

  // Identity (ERC-8004) configuration
  const chainId = parseInt(getEnv(env, 'CHAIN_ID'));
  const rpcUrl = getEnv(env, 'RPC_URL');
  if ((chainId && rpcUrl) || overrides?.identity) {
    config.identity = {
      chainId: overrides?.identity?.chainId ?? chainId ?? 84532,
      rpcUrl: overrides?.identity?.rpcUrl ?? rpcUrl ?? '',
      ipfs: (getEnv(env, 'IPFS_PROVIDER') as 'node' | 'pinata' | 'filecoinPin') ?? overrides?.identity?.ipfs,
      ipfsConfig: {
        pinataJwt: getEnv(env, 'PINATA_JWT'),
        nodeUrl: getEnv(env, 'IPFS_NODE_URL'),
        filecoinPrivateKey: getEnv(env, 'FILECOIN_PRIVATE_KEY'),
        ...overrides?.identity?.ipfsConfig,
      },
      registries: overrides?.identity?.registries,
    };
  }

  // Discovery configuration
  const subgraphUrl = getEnv(env, 'SUBGRAPH_URL');
  const mcpEndpoint = getEnv(env, 'MCP_ENDPOINT');
  const a2aEndpoint = getEnv(env, 'A2A_ENDPOINT');
  if (subgraphUrl || mcpEndpoint || a2aEndpoint || overrides?.discovery) {
    config.discovery = {
      subgraphUrl: overrides?.discovery?.subgraphUrl ?? subgraphUrl,
      mcpEndpoint: overrides?.discovery?.mcpEndpoint ?? mcpEndpoint,
      a2aEndpoint: overrides?.discovery?.a2aEndpoint ?? a2aEndpoint,
      oasfSkills: overrides?.discovery?.oasfSkills,
      oasfDomains: overrides?.discovery?.oasfDomains,
    };
  }

  // Trust configuration
  const trustReputation = parseBool(getEnv(env, 'TRUST_REPUTATION'));
  const trustCryptoEconomic = parseBool(getEnv(env, 'TRUST_CRYPTO_ECONOMIC'));
  const trustTee = parseBool(getEnv(env, 'TRUST_TEE_ATTESTATION'));
  if (trustReputation !== undefined || trustCryptoEconomic !== undefined || trustTee !== undefined || overrides?.trust) {
    config.trust = {
      reputation: overrides?.trust?.reputation ?? trustReputation,
      cryptoEconomic: overrides?.trust?.cryptoEconomic ?? trustCryptoEconomic,
      teeAttestation: overrides?.trust?.teeAttestation ?? trustTee,
    };
  }

  return config;
}

/**
 * Create ERC-8004 SDK config from environment variables
 *
 * Supported environment variables:
 * - CHAIN_ID (required)
 * - RPC_URL (required)
 * - PRIVATE_KEY / WALLET_PRIVATE_KEY
 * - IPFS_PROVIDER (node | pinata | filecoinPin)
 * - PINATA_JWT
 * - IPFS_NODE_URL
 * - FILECOIN_PRIVATE_KEY
 * - SUBGRAPH_URL
 *
 * @example
 * ```ts
 * import { createRegentSDKConfigFromEnv, createRegentSDK } from 'regent-sdk';
 *
 * const config = createRegentSDKConfigFromEnv();
 * const sdk = createRegentSDK(config);
 * ```
 */
export function createRegentSDKConfigFromEnv(
  env: EnvSource = process.env,
  overrides?: Partial<SDKConfig>
): SDKConfig {
  return {
    chainId: overrides?.chainId ?? parseInt(requireEnv(env, 'CHAIN_ID'))!,
    rpcUrl: overrides?.rpcUrl ?? requireEnv(env, 'RPC_URL'),
    signer: overrides?.signer ?? getEnv(env, 'PRIVATE_KEY') ?? getEnv(env, 'WALLET_PRIVATE_KEY'),
    ipfs: overrides?.ipfs ?? (getEnv(env, 'IPFS_PROVIDER') as 'node' | 'pinata' | 'filecoinPin'),
    pinataJwt: overrides?.pinataJwt ?? getEnv(env, 'PINATA_JWT'),
    ipfsNodeUrl: overrides?.ipfsNodeUrl ?? getEnv(env, 'IPFS_NODE_URL'),
    filecoinPrivateKey: overrides?.filecoinPrivateKey ?? getEnv(env, 'FILECOIN_PRIVATE_KEY'),
    subgraphUrl: overrides?.subgraphUrl ?? getEnv(env, 'SUBGRAPH_URL'),
    registryOverrides: overrides?.registryOverrides,
  };
}

/**
 * Validate that all required environment variables are set
 *
 * @returns List of missing environment variables, empty if all present
 */
export function validateRegentEnv(
  env: EnvSource = process.env,
  options?: { requireIdentity?: boolean }
): string[] {
  const missing: string[] = [];

  if (!env.AGENT_NAME) missing.push('AGENT_NAME');

  if (options?.requireIdentity) {
    if (!env.CHAIN_ID) missing.push('CHAIN_ID');
    if (!env.RPC_URL) missing.push('RPC_URL');
  }

  return missing;
}
