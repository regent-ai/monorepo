/**
 * Viem-based implementation of RegentAgentFactory
 *
 * This is a stub implementation that will be completed once the
 * Solidity contracts are deployed. It demonstrates the expected
 * integration pattern with viem.
 */

import { decodeEventLog } from 'viem';
import type { Chain } from 'viem';
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
import { IREGENT_AGENT_FACTORY_ABI } from './abi';

/**
 * Minimal wallet client interface for writing contracts
 */
interface MinimalWalletClient {
  writeContract(args: {
    address: Address;
    abi: typeof IREGENT_AGENT_FACTORY_ABI;
    functionName: string;
    args: unknown[];
    chain: Chain;
    account?: unknown;
  }): Promise<TxHash>;
  account?: { address: Address };
}

/**
 * Minimal public client interface for reading contracts
 */
interface MinimalPublicClient {
  readContract(args: {
    address: Address;
    abi: typeof IREGENT_AGENT_FACTORY_ABI;
    functionName: string;
    args?: unknown[];
  }): Promise<unknown>;
  waitForTransactionReceipt(args: { hash: TxHash }): Promise<{
    logs: Array<{ data: `0x${string}`; topics: [`0x${string}`, ...`0x${string}`[]] }>;
  }>;
}

/**
 * Options for constructing a ViemRegentAgentFactory
 */
export interface ViemRegentAgentFactoryOptions {
  /** Factory contract address */
  address: Address;

  /** Chain configuration */
  chain: Chain;

  /** Viem wallet client for signing transactions */
  walletClient: MinimalWalletClient;

  /** Viem public client for reading state */
  publicClient: MinimalPublicClient;
}

/**
 * Viem-based implementation of the RegentAgentFactory interface.
 *
 * This implementation uses viem to interact with the deployed
 * IRegentAgentFactory contract on-chain.
 *
 * @example
 * ```typescript
 * import { createPublicClient, createWalletClient, http } from 'viem';
 * import { sepolia } from 'viem/chains';
 * import { privateKeyToAccount } from 'viem/accounts';
 *
 * const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
 *
 * const publicClient = createPublicClient({
 *   chain: sepolia,
 *   transport: http(),
 * });
 *
 * const walletClient = createWalletClient({
 *   account,
 *   chain: sepolia,
 *   transport: http(),
 * });
 *
 * const factory = new ViemRegentAgentFactory({
 *   address: '0x...',
 *   chain: sepolia,
 *   publicClient,
 *   walletClient,
 * });
 *
 * const agent = await factory.createAgent({
 *   name: 'My Agent',
 *   owner: account.address,
 *   metadataUri: 'ipfs://...',
 * });
 * ```
 */
export class ViemRegentAgentFactory implements RegentAgentFactory {
  private readonly address: Address;
  private readonly chain: Chain;
  private readonly walletClient: MinimalWalletClient;
  private readonly publicClient: MinimalPublicClient;

  constructor(options: ViemRegentAgentFactoryOptions) {
    this.address = options.address;
    this.chain = options.chain;
    this.walletClient = options.walletClient;
    this.publicClient = options.publicClient;
  }

  /**
   * Format agent ID as "chainId:localId"
   */
  private formatAgentId(localId: bigint): AgentId {
    return `${this.chain.id}:${localId.toString()}`;
  }

  /**
   * Parse agent ID to extract local ID
   */
  private parseLocalId(agentId: AgentId): bigint {
    const [, localIdStr] = agentId.split(':');
    return BigInt(localIdStr);
  }

  async createAgent(input: CreateAgentInput): Promise<CreatedAgentInfo> {
    // Build the CreateAgentParams struct
    const params = {
      owner: input.owner,
      name: input.name,
      metadataURI: input.metadataUri,
      treasury:
        input.treasuryConfig?.treasury ??
        ('0x0000000000000000000000000000000000000000' as Address),
      rakeBps: input.treasuryConfig?.rakeBps ?? 0,
      initialBond: input.initialBondAmount ?? 0n,
      identityRegistry:
        input.erc8004IdentityRegistry ??
        ('0x0000000000000000000000000000000000000000' as Address),
      identityData: '0x' as `0x${string}`,
    };

    // Write to contract
    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'createAgent',
      args: [params],
      chain: this.chain,
      account: this.walletClient.account,
    });

    // Wait for transaction receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // Parse AgentCreated event to get agentId
    const agentCreatedLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: IREGENT_AGENT_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'AgentCreated';
      } catch {
        return false;
      }
    });

    if (!agentCreatedLog) {
      throw new Error('AgentCreated event not found in transaction receipt');
    }

    const decoded = decodeEventLog({
      abi: IREGENT_AGENT_FACTORY_ABI,
      data: agentCreatedLog.data,
      topics: agentCreatedLog.topics,
    }) as unknown as {
      eventName: 'AgentCreated';
      args: {
        agentId: bigint;
        identityTokenId: bigint;
      };
    };

    const localId = decoded.args.agentId;
    const agentId = this.formatAgentId(localId);

    return {
      agentId,
      owner: input.owner,
      metadataUri: input.metadataUri,
      txHash,
      identityTokenId:
        decoded.args.identityTokenId > 0n
          ? decoded.args.identityTokenId.toString()
          : undefined,
    };
  }

  async getAgent(agentId: AgentId): Promise<AgentOnchainState | null> {
    const localId = this.parseLocalId(agentId);

    try {
      const agent = (await this.publicClient.readContract({
        address: this.address,
        abi: IREGENT_AGENT_FACTORY_ABI,
        functionName: 'getAgent',
        args: [localId],
      })) as {
        id: bigint;
        owner: Address;
        name: string;
        metadataURI: string;
        treasury: Address;
        rakeBps: number;
        bondToken: Address;
        bondAmount: bigint;
        paused: boolean;
      };

      const zeroAddress = '0x0000000000000000000000000000000000000000';

      return {
        agentId,
        owner: agent.owner,
        name: agent.name,
        metadataUri: agent.metadataURI,
        paused: agent.paused,
        bond:
          agent.bondToken !== zeroAddress
            ? {
                token: agent.bondToken,
                amount: agent.bondAmount,
              }
            : undefined,
        treasury:
          agent.treasury !== zeroAddress
            ? {
                address: agent.treasury,
                rakeBps: agent.rakeBps,
              }
            : undefined,
      };
    } catch {
      // Agent doesn't exist
      return null;
    }
  }

  async getAgentsByOwner(owner: Address): Promise<AgentOnchainState[]> {
    const agentIds = (await this.publicClient.readContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'getAgentsByOwner',
      args: [owner],
    })) as bigint[];

    const agents: AgentOnchainState[] = [];

    for (const localId of agentIds) {
      const agentId = this.formatAgentId(localId);
      const agent = await this.getAgent(agentId);
      if (agent) {
        agents.push(agent);
      }
    }

    return agents;
  }

  async updateMetadata(agentId: AgentId, metadataUri: string): Promise<TxHash> {
    const localId = this.parseLocalId(agentId);

    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'updateMetadata',
      args: [localId, metadataUri],
      chain: this.chain,
      account: this.walletClient.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async setPaused(agentId: AgentId, paused: boolean): Promise<TxHash> {
    const localId = this.parseLocalId(agentId);

    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'setPaused',
      args: [localId, paused],
      chain: this.chain,
      account: this.walletClient.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async changeOwner(agentId: AgentId, newOwner: Address): Promise<TxHash> {
    const localId = this.parseLocalId(agentId);

    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'changeOwner',
      args: [localId, newOwner],
      chain: this.chain,
      account: this.walletClient.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async setTreasury(
    agentId: AgentId,
    treasury: Address,
    rakeBps: number
  ): Promise<TxHash> {
    const localId = this.parseLocalId(agentId);

    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'setTreasury',
      args: [localId, treasury, rakeBps],
      chain: this.chain,
      account: this.walletClient.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async depositBond(agentId: AgentId, amount: bigint): Promise<TxHash> {
    const localId = this.parseLocalId(agentId);

    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'depositBond',
      args: [localId, amount],
      chain: this.chain,
      account: this.walletClient.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async withdrawBond(
    agentId: AgentId,
    to: Address,
    amount: bigint
  ): Promise<TxHash> {
    const localId = this.parseLocalId(agentId);

    const txHash = await this.walletClient.writeContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'withdrawBond',
      args: [localId, to, amount],
      chain: this.chain,
      account: this.walletClient.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async getFactoryConfig(): Promise<FactoryConfig> {
    const config = (await this.publicClient.readContract({
      address: this.address,
      abi: IREGENT_AGENT_FACTORY_ABI,
      functionName: 'factoryConfig',
    })) as {
      bondToken: Address;
      maxRakeBps: number;
      defaultTreasury: Address;
    };

    return {
      bondToken: config.bondToken,
      maxRakeBps: config.maxRakeBps,
      defaultTreasury: config.defaultTreasury,
    };
  }
}
