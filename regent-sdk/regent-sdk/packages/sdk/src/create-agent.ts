/**
 * High-level API for creating Regent agents
 */

import { createAgent } from '@regent/core';
import { http } from '@regent/http';
import { SDK as RegentErc8004SDK, type SDKConfig } from '@regent/erc8004';
import type { RegentAgentConfig } from './config.js';

/**
 * Result of creating a Regent agent
 */
export interface RegentAgentResult {
  /** The agent runtime (extension-based builder) */
  runtime: Awaited<ReturnType<ReturnType<typeof createAgent>['build']>>;
  /** The ERC-8004 SDK (if identity config provided) */
  erc8004?: RegentErc8004SDK;
  /** High-level method to register the agent on-chain */
  registerOnchain: () => Promise<{ agentId: string; txHash: string }>;
  /** High-level method to search for agents */
  search: (params?: unknown) => Promise<unknown[]>;
}

/**
 * Create a full-featured Regent agent with runtime and optional ERC-8004 identity
 *
 * @example
 * ```ts
 * import { createRegentAgent } from 'regent-sdk';
 *
 * const agent = await createRegentAgent({
 *   name: 'My Agent',
 *   description: 'An intelligent assistant',
 *   version: '1.0.0',
 *   http: { port: 3000 },
 *   identity: {
 *     chainId: 11155111,
 *     rpcUrl: 'https://rpc.sepolia.org',
 *     ipfs: 'pinata',
 *     ipfsConfig: { pinataJwt: process.env.PINATA_JWT },
 *   },
 * });
 *
 * // Register on-chain
 * const { agentId } = await agent.registerOnchain();
 * console.log('Registered agent:', agentId);
 * ```
 */
export async function createRegentAgent(config: RegentAgentConfig): Promise<RegentAgentResult> {
  // Build agent runtime using the extension-based builder
  const builder = createAgent({
    name: config.name,
    description: config.description,
    version: config.version,
  });

  // Add HTTP extension if configured
  if (config.http) {
    builder.use(http());
  }

  // Build the runtime
  const runtime = await builder.build();

  // Initialize ERC-8004 SDK if identity config provided
  let erc8004: RegentErc8004SDK | undefined;
  if (config.identity) {
    const sdkConfig: SDKConfig = {
      chainId: config.identity.chainId,
      rpcUrl: config.identity.rpcUrl,
      signer: config.wallet?.privateKey,
      registryOverrides: config.identity.registries
        ? {
            [config.identity.chainId]: {
              IDENTITY: config.identity.registries.identity || '',
              REPUTATION: config.identity.registries.reputation || '',
              VALIDATION: config.identity.registries.validation || '',
            },
          }
        : undefined,
      ipfs: config.identity.ipfs,
      ipfsNodeUrl: config.identity.ipfsConfig?.nodeUrl,
      pinataJwt: config.identity.ipfsConfig?.pinataJwt,
      filecoinPrivateKey: config.identity.ipfsConfig?.filecoinPrivateKey,
      subgraphUrl: config.discovery?.subgraphUrl,
    };

    erc8004 = new RegentErc8004SDK(sdkConfig);
  }

  // High-level helper methods
  const registerOnchain = async (): Promise<{ agentId: string; txHash: string }> => {
    if (!erc8004) {
      throw new Error('ERC-8004 identity not configured. Provide identity config to use registerOnchain().');
    }

    const agent = erc8004.createAgent(config.name, config.description, config.logo);

    // Configure endpoints
    if (config.discovery?.mcpEndpoint) {
      await agent.setMCP(config.discovery.mcpEndpoint);
    }
    if (config.discovery?.a2aEndpoint) {
      await agent.setA2A(config.discovery.a2aEndpoint);
    }

    // Configure trust models
    if (config.trust) {
      agent.setTrust(
        config.trust.reputation ?? false,
        config.trust.cryptoEconomic ?? false,
        config.trust.teeAttestation ?? false
      );
    }

    // Add OASF skills and domains
    if (config.discovery?.oasfSkills) {
      for (const skill of config.discovery.oasfSkills) {
        agent.addSkill(skill, false);
      }
    }
    if (config.discovery?.oasfDomains) {
      for (const domain of config.discovery.oasfDomains) {
        agent.addDomain(domain, false);
      }
    }

    // Register on IPFS and blockchain
    const result = await agent.registerIPFS();

    return { agentId: result.agentId || '', txHash: '' };
  };

  const search = async (params?: unknown): Promise<unknown[]> => {
    if (!erc8004) {
      throw new Error('ERC-8004 identity not configured. Provide identity config to use search().');
    }

    const result = await erc8004.searchAgents(params as any);
    return result.items;
  };

  return {
    runtime,
    erc8004,
    registerOnchain,
    search,
  };
}

/**
 * Create a standalone ERC-8004 SDK (without runtime)
 *
 * Use this when you only need ERC-8004 identity/discovery features
 * without the full agent runtime.
 *
 * @example
 * ```ts
 * import { createRegentSDK } from 'regent-sdk';
 *
 * const sdk = createRegentSDK({
 *   chainId: 11155111,
 *   rpcUrl: 'https://rpc.sepolia.org',
 * });
 *
 * // Search for agents
 * const agents = await sdk.searchAgents({ mcp: true });
 * ```
 */
export function createRegentSDK(config: SDKConfig): RegentErc8004SDK {
  return new RegentErc8004SDK(config);
}
