/**
 * @regent/contracts - TypeScript interfaces for Regent agent-creation contracts
 *
 * These interfaces define the contract between the SDK and on-chain agent factories.
 * Implementations can be mock (for local dev) or real (viem-based for on-chain).
 */

/**
 * Logical ID for an agent, formatted as "chainId:localId"
 * @example "11155111:42" (Sepolia chain, agent ID 42)
 */
export type AgentId = string;

/**
 * EVM address type
 */
export type Address = `0x${string}`;

/**
 * Transaction hash type
 */
export type TxHash = `0x${string}`;

/**
 * Parameters for creating a new agent via the factory contract
 */
export interface CreateAgentInput {
  /** Human-readable name for the agent */
  name: string;

  /** Owner address (EOA or multisig) that controls the agent */
  owner: Address;

  /** Off-chain metadata URI (IPFS or HTTPS) */
  metadataUri: string;

  /** Optional: Chain ID for ERC-8004 identity registration */
  erc8004IdentityChainId?: number;

  /** Optional: ERC-8004 identity registry address */
  erc8004IdentityRegistry?: Address;

  /** Optional: Initial bond amount in wei */
  initialBondAmount?: bigint;

  /** Optional: Treasury configuration for revenue sharing */
  treasuryConfig?: {
    /** Treasury address to receive rake */
    treasury?: Address;
    /** Rake in basis points (0-10000, where 10000 = 100%) */
    rakeBps?: number;
  };
}

/**
 * Information returned after successfully creating an agent
 */
export interface CreatedAgentInfo {
  /** The assigned agent ID (chainId:localId format) */
  agentId: AgentId;

  /** Owner address */
  owner: Address;

  /** Optional: Agent wallet address (if factory created one) */
  wallet?: Address;

  /** Optional: Agent contract instance address */
  instance?: Address;

  /** Metadata URI that was set */
  metadataUri: string;

  /** Transaction hash of the creation tx */
  txHash: TxHash;

  /** Optional: ERC-8004 identity token ID if registered */
  identityTokenId?: string;
}

/**
 * Bond information for an agent
 */
export interface AgentBond {
  /** ERC20 token address used for bond */
  token: Address;

  /** Current bond amount in wei */
  amount: bigint;
}

/**
 * Treasury configuration for an agent
 */
export interface AgentTreasury {
  /** Treasury address receiving rake */
  address: Address;

  /** Rake in basis points */
  rakeBps: number;
}

/**
 * On-chain state for an agent managed by the factory
 */
export interface AgentOnchainState {
  /** Agent ID (chainId:localId format) */
  agentId: AgentId;

  /** Current owner address */
  owner: Address;

  /** Human-readable name */
  name?: string;

  /** Optional: Agent wallet address */
  wallet?: Address;

  /** Metadata URI */
  metadataUri: string;

  /** Whether the agent is paused */
  paused: boolean;

  /** Optional: Bond information */
  bond?: AgentBond;

  /** Optional: Treasury configuration */
  treasury?: AgentTreasury;
}

/**
 * Factory configuration (immutable after deployment)
 */
export interface FactoryConfig {
  /** ERC20 token address used for bonds, or zero address if disabled */
  bondToken: Address;

  /** Maximum rake in basis points (e.g., 2000 = 20%) */
  maxRakeBps: number;

  /** Default treasury address for new agents */
  defaultTreasury: Address;
}

/**
 * Main interface for interacting with the Regent Agent Factory contract.
 *
 * This interface abstracts the on-chain factory, allowing the SDK to work with
 * both mock implementations (for local dev/testing) and real viem-based clients.
 */
export interface RegentAgentFactory {
  /**
   * Create a new agent via the factory contract.
   *
   * @param input - Agent creation parameters
   * @returns Information about the created agent including ID and tx hash
   * @throws Error if the transaction fails or reverts
   */
  createAgent(input: CreateAgentInput): Promise<CreatedAgentInfo>;

  /**
   * Get the on-chain state for a given agent ID.
   *
   * @param agentId - Agent ID in "chainId:localId" format
   * @returns Agent state or null if not found
   */
  getAgent(agentId: AgentId): Promise<AgentOnchainState | null>;

  /**
   * Get all agent IDs owned by a given address.
   *
   * @param owner - Owner address to query
   * @returns Array of agent states owned by the address
   */
  getAgentsByOwner(owner: Address): Promise<AgentOnchainState[]>;

  /**
   * Update the metadata URI for an agent.
   *
   * @param agentId - Agent ID to update
   * @param metadataUri - New metadata URI
   * @returns Transaction hash
   */
  updateMetadata?(agentId: AgentId, metadataUri: string): Promise<TxHash>;

  /**
   * Pause or unpause an agent.
   *
   * @param agentId - Agent ID to update
   * @param paused - Whether to pause (true) or unpause (false)
   * @returns Transaction hash
   */
  setPaused?(agentId: AgentId, paused: boolean): Promise<TxHash>;

  /**
   * Transfer ownership of an agent.
   *
   * @param agentId - Agent ID to transfer
   * @param newOwner - New owner address
   * @returns Transaction hash
   */
  changeOwner?(agentId: AgentId, newOwner: Address): Promise<TxHash>;

  /**
   * Update treasury configuration for an agent.
   *
   * @param agentId - Agent ID to update
   * @param treasury - New treasury address
   * @param rakeBps - New rake in basis points
   * @returns Transaction hash
   */
  setTreasury?(
    agentId: AgentId,
    treasury: Address,
    rakeBps: number
  ): Promise<TxHash>;

  /**
   * Deposit additional bond for an agent.
   *
   * @param agentId - Agent ID
   * @param amount - Amount to deposit in wei
   * @returns Transaction hash
   */
  depositBond?(agentId: AgentId, amount: bigint): Promise<TxHash>;

  /**
   * Withdraw bond from an agent.
   *
   * @param agentId - Agent ID
   * @param to - Recipient address
   * @param amount - Amount to withdraw in wei
   * @returns Transaction hash
   */
  withdrawBond?(agentId: AgentId, to: Address, amount: bigint): Promise<TxHash>;

  /**
   * Get the factory configuration.
   *
   * @returns Factory config or undefined if not available
   */
  getFactoryConfig?(): Promise<FactoryConfig>;
}

/**
 * Options for constructing a viem-based factory client
 */
export interface ViemFactoryOptions {
  /** Factory contract address */
  address: Address;

  /** Chain configuration */
  chain: {
    id: number;
    rpcUrl: string;
  };

  /** Wallet client for signing transactions */
  walletClient: unknown; // viem WalletClient

  /** Public client for reading state */
  publicClient: unknown; // viem PublicClient
}
