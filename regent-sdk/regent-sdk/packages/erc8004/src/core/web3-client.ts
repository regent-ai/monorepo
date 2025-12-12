/**
 * Web3 integration layer for smart contract interactions using viem
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Abi,
  type Account,
  type Hash,
  type Address as ViemAddress,
  type TransactionReceipt,
  type Log,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
  toBytes,
  getAddress,
  isAddress,
  verifyMessage,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import * as chains from 'viem/chains';

export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

/**
 * Contract wrapper for viem compatibility with the existing codebase
 */
export interface ContractInstance {
  address: ViemAddress;
  abi: Abi;
  publicClient: PublicClient;
  walletClient?: WalletClient;
}

/**
 * Get viem chain config by chain ID
 */
function getChainById(chainId: number): Chain | undefined {
  for (const chain of Object.values(chains)) {
    if (typeof chain === 'object' && chain !== null && 'id' in chain && (chain as Chain).id === chainId) {
      return chain as Chain;
    }
  }
  return undefined;
}

/**
 * Create a custom chain config if not found in viem's defaults
 */
function createCustomChain(chainId: number, rpcUrl: string): Chain {
  return {
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  } as Chain;
}

/**
 * Web3 client for interacting with ERC-8004 smart contracts
 */
export class Web3Client {
  public readonly publicClient: PublicClient;
  public readonly walletClient?: WalletClient;
  public readonly account?: PrivateKeyAccount;
  public chainId: bigint;
  private readonly _chain: Chain;
  private readonly _rpcUrl: string;

  /**
   * Initialize Web3 client
   * @param rpcUrl - RPC endpoint URL
   * @param signerOrKey - Optional private key string for signing transactions
   */
  constructor(rpcUrl: string, signerOrKey?: string) {
    this._rpcUrl = rpcUrl;
    this.chainId = 0n;

    // We'll determine the chain dynamically
    // For now, create a placeholder chain that will be updated on initialize()
    this._chain = createCustomChain(1, rpcUrl);

    // Create public client for read operations
    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    // Create wallet client if private key provided
    if (signerOrKey) {
      if (typeof signerOrKey === 'string') {
        // Validate that it's not an empty string
        if (signerOrKey.trim() === '') {
          throw new Error('Private key cannot be empty');
        }
        // Ensure proper 0x prefix
        const key = signerOrKey.startsWith('0x')
          ? (signerOrKey as `0x${string}`)
          : (`0x${signerOrKey}` as `0x${string}`);
        this.account = privateKeyToAccount(key);
        this.walletClient = createWalletClient({
          account: this.account,
          transport: http(rpcUrl),
        });
      } else {
        throw new Error(
          'Web3Client now only accepts private key strings. For advanced signer support, use viem directly.'
        );
      }
    }
  }

  /**
   * Initialize the client (fetch chain ID and update chain config)
   */
  async initialize(): Promise<void> {
    this.chainId = BigInt(await this.publicClient.getChainId());

    // Try to get the proper chain config from viem
    const chain = getChainById(Number(this.chainId)) || createCustomChain(Number(this.chainId), this._rpcUrl);

    // Recreate clients with proper chain config (viem clients are immutable)
    // Note: The public client is already created without chain, which is fine for most operations
    // For chain-specific operations, we pass the chain when needed
    Object.assign(this, { _chain: chain });
  }

  /**
   * Get contract instance
   */
  getContract(address: string, abi: Abi): ContractInstance {
    return {
      address: address as ViemAddress,
      abi,
      publicClient: this.publicClient,
      walletClient: this.walletClient,
    };
  }

  /**
   * Call a contract method (view/pure function)
   */
  async callContract(contract: ContractInstance, methodName: string, ...args: unknown[]): Promise<unknown> {
    const result = await this.publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: methodName,
      args,
    });
    return result;
  }

  /**
   * Execute a contract transaction
   * For overloaded functions like register(), use registerAgent() wrapper instead
   */
  async transactContract(
    contract: ContractInstance,
    methodName: string,
    options: TransactionOptions = {},
    ...args: unknown[]
  ): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error(
        'Cannot execute transaction: SDK is in read-only mode. Provide a private key to enable write operations.'
      );
    }

    // Special handling for register() function with multiple overloads
    if (methodName === 'register') {
      return this.registerAgent(contract, options, ...args);
    }

    // Build gas parameters - prefer EIP-1559 if available, fall back to legacy
    const gasParams = options.maxFeePerGas || options.maxPriorityFeePerGas
      ? {
          ...(options.maxFeePerGas && { maxFeePerGas: options.maxFeePerGas }),
          ...(options.maxPriorityFeePerGas && { maxPriorityFeePerGas: options.maxPriorityFeePerGas }),
        }
      : options.gasPrice
        ? { gasPrice: options.gasPrice }
        : {};

    // Simulate transaction first to check for errors
    const { request } = await this.publicClient.simulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName: methodName,
      args,
      account: this.account,
      ...(options.gasLimit && { gas: options.gasLimit }),
      ...gasParams,
    } as any);

    // Execute transaction
    const hash = await this.walletClient.writeContract(request as any);
    return hash;
  }

  /**
   * Router wrapper for register() function overloads
   * Intelligently selects the correct overload based on arguments:
   * - register() - no arguments
   * - register(string tokenUri) - just tokenUri
   * - register(string tokenUri, tuple[] metadata) - tokenUri + metadata
   */
  private async registerAgent(
    contract: ContractInstance,
    options: TransactionOptions,
    ...args: unknown[]
  ): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error('No signer available for transaction');
    }

    // Determine function name based on arguments
    let functionName: string;
    let callArgs: unknown[];

    if (args.length === 0) {
      // register() - no arguments
      functionName = 'register';
      callArgs = [];
    } else if (args.length === 1 && typeof args[0] === 'string') {
      // register(string tokenUri) - just tokenUri
      functionName = 'register';
      callArgs = [args[0]];
    } else if (args.length === 2 && typeof args[0] === 'string' && Array.isArray(args[1])) {
      // register(string tokenUri, tuple[] metadata) - tokenUri + metadata
      functionName = 'register';
      callArgs = [args[0], args[1]];
    } else {
      throw new Error(
        `Invalid arguments for register(). Expected: () | (string) | (string, tuple[]), got ${args.length} arguments`
      );
    }

    // Build gas parameters - prefer EIP-1559 if available, fall back to legacy
    const gasParams = options.maxFeePerGas || options.maxPriorityFeePerGas
      ? {
          ...(options.maxFeePerGas && { maxFeePerGas: options.maxFeePerGas }),
          ...(options.maxPriorityFeePerGas && { maxPriorityFeePerGas: options.maxPriorityFeePerGas }),
        }
      : options.gasPrice
        ? { gasPrice: options.gasPrice }
        : {};

    // Simulate and execute
    const { request } = await this.publicClient.simulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName,
      args: callArgs,
      account: this.account,
      ...(options.gasLimit && { gas: options.gasLimit }),
      ...gasParams,
    } as any);

    const hash = await this.walletClient.writeContract(request as any);
    return hash;
  }

  /**
   * Wait for transaction to be mined
   */
  async waitForTransaction(txHash: string, timeout: number = 60000): Promise<TransactionReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash as Hash,
      timeout,
    });
    return receipt;
  }

  /**
   * Get contract events
   */
  async getEvents(
    contract: ContractInstance,
    eventName: string,
    fromBlock: number = 0,
    toBlock?: number
  ): Promise<Log[]> {
    const logs = await this.publicClient.getLogs({
      address: contract.address,
      fromBlock: BigInt(fromBlock),
      toBlock: toBlock ? BigInt(toBlock) : undefined,
    });
    // Filter by event name would require ABI parsing - returning all logs for now
    return logs;
  }

  /**
   * Encode feedback authorization data
   */
  encodeFeedbackAuth(
    agentId: bigint,
    clientAddress: string,
    indexLimit: bigint,
    expiry: bigint,
    chainId: bigint,
    identityRegistry: string,
    signerAddress: string
  ): `0x${string}` {
    return encodeAbiParameters(
      parseAbiParameters('uint256, address, uint64, uint256, uint256, address, address'),
      [
        agentId,
        clientAddress as ViemAddress,
        indexLimit,
        expiry,
        chainId,
        identityRegistry as ViemAddress,
        signerAddress as ViemAddress,
      ]
    );
  }

  /**
   * Sign a message with the account's private key
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error('No signer available');
    }
    const msg = typeof message === 'string' ? message : toHex(message);
    return await this.walletClient.signMessage({
      account: this.account,
      message: typeof message === 'string' ? message : { raw: message },
    });
  }

  /**
   * Recover address from message and signature
   */
  recoverAddress(message: string | Uint8Array, signature: string): string {
    // Note: verifyMessage returns boolean, we need recoverMessageAddress
    // For now, we'll use a different approach
    const { recoverMessageAddress } = require('viem');
    return recoverMessageAddress({
      message: typeof message === 'string' ? message : { raw: message },
      signature: signature as `0x${string}`,
    });
  }

  /**
   * Compute Keccak-256 hash
   */
  keccak256(data: string | Uint8Array): string {
    if (typeof data === 'string') {
      return keccak256(toHex(toBytes(data)));
    }
    return keccak256(toHex(data));
  }

  /**
   * Convert address to checksum format
   */
  toChecksumAddress(address: string): string {
    return getAddress(address);
  }

  /**
   * Check if string is a valid Ethereum address
   */
  isAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Get ETH balance of an address
   */
  async getBalance(address: string): Promise<bigint> {
    return await this.publicClient.getBalance({ address: address as ViemAddress });
  }

  /**
   * Get transaction count (nonce) of an address
   */
  async getTransactionCount(address: string): Promise<number> {
    return await this.publicClient.getTransactionCount({
      address: address as ViemAddress,
      blockTag: 'pending',
    });
  }

  /**
   * Get the account address (if signer is available)
   */
  get address(): string | undefined {
    return this.account?.address;
  }

  /**
   * Get the account address asynchronously (if signer is available)
   * Use this method when you need the address from a generic Signer
   */
  async getAddress(): Promise<string | undefined> {
    return this.account?.address;
  }
}
