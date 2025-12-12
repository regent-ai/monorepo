/**
 * ERC-8004 Domain Proof Signatures
 *
 * Utilities for signing domain ownership proofs per ERC-8004 specification.
 * Domain proofs are used to verify that an agent owns/controls a specific domain.
 */

import type { WalletClient, Account, Chain, Transport, Address } from 'viem';

/**
 * Parameters for building a domain proof message
 */
export interface DomainProofParams {
  /** The domain being claimed (e.g., "myagent.example.com") */
  domain: string;
  /** The Ethereum address of the agent owner */
  address: Address;
  /** The chain ID where the agent is registered */
  chainId: number;
  /** Optional nonce for replay protection */
  nonce?: string;
}

/**
 * Build ERC-8004 domain ownership proof message
 *
 * The message format follows ERC-8004 specification:
 * ```
 * ERC-8004 Agent Ownership Proof
 * Domain: <domain>
 * Address: <address>
 * ChainId: <chainId>
 * Nonce: <nonce> (optional)
 * ```
 *
 * @param params - Domain proof parameters
 * @returns The formatted message string ready for signing
 */
export function buildDomainProofMessage(params: DomainProofParams): string {
  const lines = [
    'ERC-8004 Agent Ownership Proof',
    `Domain: ${params.domain}`,
    `Address: ${params.address.toLowerCase()}`,
    `ChainId: ${params.chainId}`,
  ];
  if (params.nonce) {
    lines.push(`Nonce: ${params.nonce}`);
  }
  return lines.join('\n');
}

/**
 * Sign ERC-8004 domain ownership proof using a viem wallet client
 *
 * This creates an EIP-191 personal_sign signature over the domain proof message.
 * The signature can be verified to prove that the signer controls the claimed domain.
 *
 * @param walletClient - Viem wallet client with signing capability
 * @param params - Domain proof parameters
 * @returns The signature as a hex string
 *
 * @example
 * ```ts
 * import { createWalletClient, http } from 'viem';
 * import { privateKeyToAccount } from 'viem/accounts';
 * import { signDomainProof } from '@regent/erc8004';
 *
 * const account = privateKeyToAccount('0x...');
 * const walletClient = createWalletClient({ account, transport: http() });
 *
 * const signature = await signDomainProof(walletClient, {
 *   domain: 'myagent.example.com',
 *   address: account.address,
 *   chainId: 11155111,
 * });
 * ```
 */
export async function signDomainProof<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined,
>(
  walletClient: WalletClient<Transport, TChain, TAccount>,
  params: DomainProofParams
): Promise<`0x${string}`> {
  if (!walletClient.account) {
    throw new Error('Wallet client must have an account to sign domain proofs');
  }

  const message = buildDomainProofMessage(params);

  const signature = await walletClient.signMessage({
    account: walletClient.account,
    message,
  });

  return signature;
}

/**
 * Build the metadata URI path for agent domain verification
 *
 * Per ERC-8004, agents should host their metadata at:
 * `https://<domain>/.well-known/agent-metadata.json`
 *
 * @param domain - The domain to build the URI for
 * @returns The full metadata URI
 */
export function buildMetadataURI(domain: string): string {
  // Normalize domain - remove protocol if present
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${normalizedDomain}/.well-known/agent-metadata.json`;
}

/**
 * Parameters for validation request message
 */
export interface ValidationRequestParams {
  /** The agent ID being validated */
  agentId: bigint;
  /** Hash of the validation request content */
  requestHash: `0x${string}`;
  /** Address of the validator */
  validator: Address;
  /** Chain ID where the validation occurs */
  chainId: number;
  /** Unix timestamp of the request */
  timestamp: number;
}

/**
 * Build ERC-8004 validation request message
 *
 * @param params - Validation request parameters
 * @returns The formatted message string
 */
export function buildValidationRequestMessage(params: ValidationRequestParams): string {
  return [
    'ERC-8004 Validation Request',
    `Agent ID: ${params.agentId.toString()}`,
    `Request Hash: ${params.requestHash}`,
    `Validator: ${params.validator.toLowerCase()}`,
    `Chain ID: ${params.chainId}`,
    `Timestamp: ${params.timestamp}`,
  ].join('\n');
}

/**
 * Sign ERC-8004 validation request using a viem wallet client
 *
 * @param walletClient - Viem wallet client with signing capability
 * @param params - Validation request parameters
 * @returns The signature as a hex string
 */
export async function signValidationRequest<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends Account | undefined = Account | undefined,
>(
  walletClient: WalletClient<Transport, TChain, TAccount>,
  params: ValidationRequestParams
): Promise<`0x${string}`> {
  if (!walletClient.account) {
    throw new Error('Wallet client must have an account to sign validation requests');
  }

  const message = buildValidationRequestMessage(params);

  const signature = await walletClient.signMessage({
    account: walletClient.account,
    message,
  });

  return signature;
}
