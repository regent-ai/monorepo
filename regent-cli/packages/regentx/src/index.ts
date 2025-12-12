/**
 * regentx - CLI for managing Regent agents on-chain
 *
 * Commands:
 *   agent:init    - Initialize a new Regent agent project
 *   agent:create  - Create an agent via the factory contract
 *   agent:status  - Show agent state (factory + ERC-8004)
 *   agent:list    - List agents owned by a wallet
 */

import { Command } from 'commander';
import { registerAgentCommands } from './commands/agent';

// Re-export config helper
export { defineConfig } from './utils/config';

// Re-export types
export type { RegentProjectConfig, GlobalOptions } from './types';

const program = new Command();

program
  .name('regentx')
  .description('CLI for managing Regent agents on-chain')
  .version('0.1.0');

// Global options
program
  .option('--config <path>', 'Path to config file')
  .option('--chain <chain>', 'Chain ID or name (sepolia, base-sepolia, etc.)')
  .option('--rpc-url <url>', 'Override RPC URL')
  .option('--wallet <id>', 'Wallet connector ID')
  .option('--factory <address>', 'Override factory address')
  .option('--mode <mode>', 'Deployment mode: mock or onchain');

// Register command groups
registerAgentCommands(program);

// Parse and run
program.parse();
