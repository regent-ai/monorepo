/**
 * ERC-8004 SDK factory utility
 *
 * Creates an ERC-8004 SDK instance from config and environment variables.
 */

import { SDK, type SDKConfig } from '@regent/erc8004';
import type { RegentProjectConfig, GlobalOptions } from '../types.js';

/**
 * Create an ERC-8004 SDK instance from project config and global options.
 *
 * Returns undefined if ERC-8004 is not configured or required environment
 * variables are missing.
 */
export function createErc8004Sdk(
  config: RegentProjectConfig,
  globalOptions: GlobalOptions
): SDK | undefined {
  const erc8004Config = config.agent.erc8004;

  // If no ERC-8004 config, skip
  if (!erc8004Config) {
    return undefined;
  }

  const chainId = erc8004Config.chainId;

  // Resolve RPC URL from global options, config, or environment
  const rpcUrl =
    globalOptions.rpcUrl || erc8004Config.rpcUrl || process.env.RPC_URL;

  if (!rpcUrl) {
    console.warn(
      'No RPC URL configured for ERC-8004. Set RPC_URL env var or erc8004.rpcUrl in config.'
    );
    return undefined;
  }

  // Get signer from environment (private key)
  const signer = process.env.PRIVATE_KEY;

  // Build SDK config
  const sdkConfig: SDKConfig = {
    chainId,
    rpcUrl,
    signer,
    subgraphUrl: erc8004Config.subgraphUrl || process.env.SUBGRAPH_URL,
  };

  // Add IPFS config if specified
  if (erc8004Config.ipfs) {
    sdkConfig.ipfs = erc8004Config.ipfs;
    sdkConfig.ipfsNodeUrl =
      erc8004Config.ipfsNodeUrl || process.env.IPFS_NODE_URL;
    sdkConfig.pinataJwt = erc8004Config.pinataJwt || process.env.PINATA_JWT;
    sdkConfig.filecoinPrivateKey =
      erc8004Config.filecoinPrivateKey || process.env.FILECOIN_KEY;
  }

  // Add registry override if specified
  if (erc8004Config.identityRegistry) {
    sdkConfig.registryOverrides = {
      [chainId]: {
        IDENTITY: erc8004Config.identityRegistry,
      },
    };
  }

  try {
    return new SDK(sdkConfig);
  } catch (error) {
    console.warn(
      `Failed to create ERC-8004 SDK: ${error instanceof Error ? error.message : error}`
    );
    return undefined;
  }
}
