/**
 * Factory resolution utilities
 */

import {
  InMemoryAgentFactory,
  ViemRegentAgentFactory,
  getFactoryAddress,
  type RegentAgentFactory,
  type Address,
} from '@regent/contracts';
import { RegentAgentManager } from '@regent/agents';
import type { RegentProjectConfig, GlobalOptions } from '../types.js';
import { resolveChainId } from '../types.js';
import { createErc8004Sdk } from './erc8004-sdk.js';

/**
 * Options for resolving the factory
 */
export interface ResolveFactoryOptions {
  config: RegentProjectConfig;
  globalOptions: GlobalOptions;
  /** Skip ERC-8004 identity registration */
  skipIdentity?: boolean;
}

/**
 * Resolve the appropriate factory based on config and options
 */
export function resolveFactory(options: ResolveFactoryOptions): {
  factory: RegentAgentFactory;
  chainId: number;
  mode: 'mock' | 'onchain';
} {
  const { config, globalOptions } = options;

  // Determine chain ID
  let chainId = 31337; // Default to localhost
  if (globalOptions.chain) {
    chainId = resolveChainId(globalOptions.chain);
  } else if (config.agent.factory?.chainId) {
    chainId = config.agent.factory.chainId;
  } else if (config.agent.erc8004?.chainId) {
    chainId = config.agent.erc8004.chainId;
  }

  // Determine mode
  const mode: 'mock' | 'onchain' =
    (globalOptions.mode as 'mock' | 'onchain') ??
    config.agent.deploymentMode ??
    'mock';

  if (mode === 'mock') {
    const factory = new InMemoryAgentFactory({ chainId });
    return { factory, chainId, mode };
  }

  // On-chain mode requires additional setup
  const factoryAddress =
    (globalOptions.factory as Address) ??
    config.agent.factory?.address ??
    getFactoryAddress(chainId);

  if (!factoryAddress) {
    throw new Error(
      `No factory address configured for chain ${chainId}. ` +
        `Either specify --factory <address> or configure agent.factory.address in your config.`
    );
  }

  // For on-chain mode, we need viem clients
  // This is a stub - in real usage, you'd set up proper clients
  throw new Error(
    `On-chain mode requires additional setup. ` +
      `Use --mode mock for local development, or configure RPC and wallet settings.`
  );
}

/**
 * Create a RegentAgentManager from resolved factory
 */
export function createManager(options: ResolveFactoryOptions): {
  manager: RegentAgentManager;
  chainId: number;
  mode: 'mock' | 'onchain';
} {
  const { factory, chainId, mode } = resolveFactory(options);

  // Create ERC-8004 SDK if configured and not skipped
  const erc8004Sdk =
    options.skipIdentity !== true
      ? createErc8004Sdk(options.config, options.globalOptions)
      : undefined;

  const manager = new RegentAgentManager(factory, {
    erc8004Sdk,
    managerOptions: {
      autoRegisterIdentity: !options.skipIdentity && !!erc8004Sdk,
    },
  });

  return { manager, chainId, mode };
}
