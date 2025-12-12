/**
 * A2A Manifest Enhancement for ERC-8004 Identity
 *
 * Utilities for enhancing A2A Agent Cards with ERC-8004 identity information.
 */

import type { Address } from 'viem';

/**
 * Agent registration entry for A2A manifest
 */
export interface RegistrationEntry {
  /** The agent ID (token ID) on the registry */
  agentId: number;
  /** The registry contract address in CAIP-10 format (eip155:chainId:address) */
  agentRegistry: string;
}

/**
 * Trust configuration for ERC-8004 agents
 */
export interface TrustConfig {
  /** Registration entries from on-chain registries */
  registrations?: RegistrationEntry[];
  /** Supported trust models (e.g., "feedback", "inference-validation") */
  trustModels?: string[];
  /** URI for validation requests */
  validationRequestsUri?: string;
  /** URI for validation responses */
  validationResponsesUri?: string;
  /** URI for feedback data */
  feedbackDataUri?: string;
}

/**
 * Minimal A2A Agent Card structure
 * This is a subset of the full A2A Agent Card spec
 */
export interface AgentCard {
  name: string;
  description?: string;
  url?: string;
  version?: string;
  skills?: Array<{
    id: string;
    name?: string;
    description?: string;
    tags?: string[];
  }>;
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  authentication?: {
    schemes?: string[];
    credentials?: string[];
  };
  // ERC-8004 extensions
  registrations?: RegistrationEntry[];
  trustModels?: string[];
  ValidationRequestsURI?: string;
  ValidationResponsesURI?: string;
  FeedbackDataURI?: string;
  // Allow additional properties
  [key: string]: unknown;
}

/**
 * Creates a new Agent Card with ERC-8004 identity/trust metadata added.
 * Immutable - returns a new card, doesn't mutate input.
 *
 * @param card - The base A2A Agent Card
 * @param trustConfig - ERC-8004 trust configuration to add
 * @returns Enhanced Agent Card with identity metadata
 *
 * @example
 * ```ts
 * const baseCard = {
 *   name: 'My Agent',
 *   description: 'An AI assistant',
 *   skills: [{ id: 'chat', name: 'Chat' }],
 * };
 *
 * const trustConfig = {
 *   registrations: [{
 *     agentId: 123,
 *     agentRegistry: 'eip155:11155111:0x8004a6090Cd10A7288092483047B097295Fb8847',
 *   }],
 *   trustModels: ['feedback', 'inference-validation'],
 *   feedbackDataUri: 'https://myagent.com/feedback',
 * };
 *
 * const enhancedCard = createAgentCardWithIdentity(baseCard, trustConfig);
 * ```
 */
export function createAgentCardWithIdentity<T extends AgentCard>(
  card: T,
  trustConfig: TrustConfig
): T {
  const enhanced: T = {
    ...card,
  };

  if (trustConfig.registrations) {
    enhanced.registrations = trustConfig.registrations;
  }

  if (trustConfig.trustModels) {
    // Deduplicate trust models
    const unique = Array.from(new Set(trustConfig.trustModels));
    enhanced.trustModels = unique;
  }

  if (trustConfig.validationRequestsUri) {
    enhanced.ValidationRequestsURI = trustConfig.validationRequestsUri;
  }

  if (trustConfig.validationResponsesUri) {
    enhanced.ValidationResponsesURI = trustConfig.validationResponsesUri;
  }

  if (trustConfig.feedbackDataUri) {
    enhanced.FeedbackDataURI = trustConfig.feedbackDataUri;
  }

  return enhanced;
}

/**
 * Build a TrustConfig from agent registration data
 *
 * @param agentId - The numeric agent ID (token ID)
 * @param chainId - The chain ID where the agent is registered
 * @param registryAddress - The identity registry contract address
 * @param options - Additional configuration options
 * @returns TrustConfig ready to be applied to an Agent Card
 *
 * @example
 * ```ts
 * const trustConfig = buildTrustConfig(123, 11155111, '0x8004a6090Cd10A7288092483047B097295Fb8847', {
 *   trustModels: ['feedback'],
 *   feedbackDataUri: 'https://myagent.com/api/feedback',
 * });
 * ```
 */
export function buildTrustConfig(
  agentId: number,
  chainId: number,
  registryAddress: Address,
  options: {
    trustModels?: string[];
    validationRequestsUri?: string;
    validationResponsesUri?: string;
    feedbackDataUri?: string;
  } = {}
): TrustConfig {
  return {
    registrations: [
      {
        agentId,
        agentRegistry: `eip155:${chainId}:${registryAddress}`,
      },
    ],
    trustModels: options.trustModels ?? ['feedback', 'inference-validation'],
    validationRequestsUri: options.validationRequestsUri,
    validationResponsesUri: options.validationResponsesUri,
    feedbackDataUri: options.feedbackDataUri,
  };
}

/**
 * Default ERC-8004 trust models
 */
export const DEFAULT_TRUST_MODELS = ['feedback', 'inference-validation'] as const;

/**
 * ERC-8004 namespace for EVM chains
 */
export const ERC8004_NAMESPACE = 'eip155';
