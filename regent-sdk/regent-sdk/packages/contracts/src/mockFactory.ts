/**
 * In-memory mock implementation of RegentAgentFactory
 *
 * Use this for local development and testing before real contracts are deployed.
 * All state is stored in memory and lost when the process ends.
 */

import type {
  RegentAgentFactory,
  CreateAgentInput,
  CreatedAgentInfo,
  AgentOnchainState,
  AgentId,
  Address,
  TxHash,
  FactoryConfig,
} from './interfaces';

/**
 * Configuration options for the mock factory
 */
export interface InMemoryFactoryOptions {
  /** Chain ID to use for agent IDs (default: 31337 for local) */
  chainId?: number;

  /** Optional factory config to simulate on-chain config */
  config?: Partial<FactoryConfig>;
}

/**
 * In-memory implementation of RegentAgentFactory for local development.
 *
 * @example
 * ```typescript
 * const factory = new InMemoryAgentFactory({ chainId: 11155111 });
 *
 * const agent = await factory.createAgent({
 *   name: 'My Agent',
 *   owner: '0x1234...',
 *   metadataUri: 'ipfs://...',
 * });
 *
 * console.log(agent.agentId); // "11155111:1"
 * ```
 */
export class InMemoryAgentFactory implements RegentAgentFactory {
  private agents = new Map<string, AgentOnchainState>();
  private ownerIndex = new Map<Address, Set<string>>();
  private nextId = 1n;
  private readonly chainId: number;
  private readonly factoryConfig: FactoryConfig;

  constructor(options: InMemoryFactoryOptions = {}) {
    this.chainId = options.chainId ?? 31337;
    this.factoryConfig = {
      bondToken: '0x0000000000000000000000000000000000000000',
      maxRakeBps: 2000, // 20% max rake
      defaultTreasury: '0x0000000000000000000000000000000000000000',
      ...options.config,
    };
  }

  /**
   * Generate a mock transaction hash
   */
  private generateTxHash(): TxHash {
    const randomBytes = new Array(32)
      .fill(0)
      .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      .join('');
    return `0x${randomBytes}` as TxHash;
  }

  /**
   * Format agent ID as "chainId:localId"
   */
  private formatAgentId(localId: bigint): AgentId {
    return `${this.chainId}:${localId.toString()}`;
  }

  /**
   * Parse agent ID to extract local ID
   */
  private parseAgentId(agentId: AgentId): { chainId: number; localId: bigint } {
    const [chainIdStr, localIdStr] = agentId.split(':');
    return {
      chainId: parseInt(chainIdStr, 10),
      localId: BigInt(localIdStr),
    };
  }

  async createAgent(input: CreateAgentInput): Promise<CreatedAgentInfo> {
    // Validate rake if provided
    const rakeBps = input.treasuryConfig?.rakeBps ?? 0;
    if (rakeBps > this.factoryConfig.maxRakeBps) {
      throw new Error(
        `Invalid rake: ${rakeBps} exceeds max ${this.factoryConfig.maxRakeBps}`
      );
    }

    const localId = this.nextId++;
    const agentId = this.formatAgentId(localId);
    const txHash = this.generateTxHash();

    const state: AgentOnchainState = {
      agentId,
      owner: input.owner,
      name: input.name,
      metadataUri: input.metadataUri,
      paused: false,
      bond:
        input.initialBondAmount && input.initialBondAmount > 0n
          ? {
              token: this.factoryConfig.bondToken,
              amount: input.initialBondAmount,
            }
          : undefined,
      treasury: input.treasuryConfig
        ? {
            address:
              input.treasuryConfig.treasury ??
              this.factoryConfig.defaultTreasury,
            rakeBps,
          }
        : undefined,
    };

    // Store agent
    this.agents.set(agentId, state);

    // Update owner index
    const ownerAgents = this.ownerIndex.get(input.owner) ?? new Set();
    ownerAgents.add(agentId);
    this.ownerIndex.set(input.owner, ownerAgents);

    return {
      agentId,
      owner: input.owner,
      metadataUri: input.metadataUri,
      txHash,
      identityTokenId: input.erc8004IdentityRegistry
        ? localId.toString()
        : undefined,
    };
  }

  async getAgent(agentId: AgentId): Promise<AgentOnchainState | null> {
    return this.agents.get(agentId) ?? null;
  }

  async getAgentsByOwner(owner: Address): Promise<AgentOnchainState[]> {
    const agentIds = this.ownerIndex.get(owner);
    if (!agentIds) return [];

    const agents: AgentOnchainState[] = [];
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      if (agent) agents.push(agent);
    }
    return agents;
  }

  async updateMetadata(agentId: AgentId, metadataUri: string): Promise<TxHash> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.metadataUri = metadataUri;
    return this.generateTxHash();
  }

  async setPaused(agentId: AgentId, paused: boolean): Promise<TxHash> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.paused = paused;
    return this.generateTxHash();
  }

  async changeOwner(agentId: AgentId, newOwner: Address): Promise<TxHash> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const oldOwner = agent.owner;

    // Update owner index
    const oldOwnerAgents = this.ownerIndex.get(oldOwner);
    if (oldOwnerAgents) {
      oldOwnerAgents.delete(agentId);
      if (oldOwnerAgents.size === 0) {
        this.ownerIndex.delete(oldOwner);
      }
    }

    const newOwnerAgents = this.ownerIndex.get(newOwner) ?? new Set();
    newOwnerAgents.add(agentId);
    this.ownerIndex.set(newOwner, newOwnerAgents);

    agent.owner = newOwner;
    return this.generateTxHash();
  }

  async setTreasury(
    agentId: AgentId,
    treasury: Address,
    rakeBps: number
  ): Promise<TxHash> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (rakeBps > this.factoryConfig.maxRakeBps) {
      throw new Error(
        `Invalid rake: ${rakeBps} exceeds max ${this.factoryConfig.maxRakeBps}`
      );
    }

    agent.treasury = { address: treasury, rakeBps };
    return this.generateTxHash();
  }

  async depositBond(agentId: AgentId, amount: bigint): Promise<TxHash> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!agent.bond) {
      agent.bond = {
        token: this.factoryConfig.bondToken,
        amount: 0n,
      };
    }

    agent.bond.amount += amount;
    return this.generateTxHash();
  }

  async withdrawBond(
    agentId: AgentId,
    _to: Address,
    amount: bigint
  ): Promise<TxHash> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (!agent.bond || agent.bond.amount < amount) {
      throw new Error(`Insufficient bond balance`);
    }

    agent.bond.amount -= amount;
    return this.generateTxHash();
  }

  async getFactoryConfig(): Promise<FactoryConfig> {
    return { ...this.factoryConfig };
  }

  /**
   * Reset all state (useful for tests)
   */
  reset(): void {
    this.agents.clear();
    this.ownerIndex.clear();
    this.nextId = 1n;
  }

  /**
   * Get the total number of agents created
   */
  getAgentCount(): number {
    return this.agents.size;
  }
}
