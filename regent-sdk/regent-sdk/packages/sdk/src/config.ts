/**
 * Unified configuration for Regent agents
 */

import type { Network } from '@regent/core';

/**
 * Unified configuration for creating a Regent agent
 */
export type RegentAgentConfig = {
  // Core identity
  name: string;
  description: string;
  version: string;
  logo?: string;

  // HTTP runtime
  http?: {
    port?: number;
    host?: string;
  };

  // Wallet configuration
  wallet?: {
    privateKey?: string;
    networks?: Network[];
  };

  // x402 payments configuration
  payments?: {
    payTo: `0x${string}`;
    facilitatorUrl: string;
    network: Network;
    policies?: unknown[]; // PaymentPolicyGroup[]
  };

  // ERC-8004 identity configuration
  identity?: {
    chainId: number;
    rpcUrl: string;
    registries?: {
      identity?: `0x${string}`;
      reputation?: `0x${string}`;
      validation?: `0x${string}`;
    };
    ipfs?: 'node' | 'pinata' | 'filecoinPin';
    ipfsConfig?: {
      pinataJwt?: string;
      nodeUrl?: string;
      filecoinPrivateKey?: string;
    };
  };

  // Discovery & capabilities
  discovery?: {
    subgraphUrl?: string;
    mcpEndpoint?: string;
    a2aEndpoint?: string;
    oasfSkills?: string[];
    oasfDomains?: string[];
  };

  // Trust model configuration
  trust?: {
    reputation?: boolean;
    cryptoEconomic?: boolean;
    teeAttestation?: boolean;
  };
};
