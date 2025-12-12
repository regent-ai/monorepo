/**
 * regentx agent:init command
 *
 * Scaffold a new Regent agent project with a config file.
 */

import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import type { GlobalOptions } from '../../types';
import { generateDefaultConfig } from '../../utils/config';
import { printSuccess, printWarning } from '../../utils/output';

interface InitOptions extends GlobalOptions {
  name?: string;
  ownerWallet?: string;
  metadataUri?: string;
  mode?: 'mock' | 'onchain';
  yes?: boolean;
}

export function registerAgentInitCommand(program: Command): void {
  program
    .command('agent:init')
    .description('Initialize a new Regent agent project')
    .option('--name <name>', 'Agent name')
    .option('--chain <chain>', 'Default chain ID or name')
    .option('--owner-wallet <id>', 'Wallet connector ID (default: local-eoa)')
    .option('--metadata-uri <uri>', 'Initial metadata URI')
    .option('--mode <mode>', 'Deployment mode: mock or onchain', 'mock')
    .option('-y, --yes', 'Accept defaults, overwrite existing')
    .action(async (options: InitOptions) => {
      const cwd = process.cwd();
      const configPath = resolve(cwd, 'regent.config.ts');

      // Check if config already exists
      if (existsSync(configPath) && !options.yes) {
        printWarning(
          'regent.config.ts already exists. Use --yes to overwrite.'
        );
        return;
      }

      // Generate config
      const name = options.name ?? 'my-regent-agent';
      const chainId = options.chain
        ? parseInt(options.chain, 10) || 11155111
        : undefined;

      const config = generateDefaultConfig({
        name,
        chainId,
        ownerConnectorId: options.ownerWallet,
        metadataUri: options.metadataUri,
        deploymentMode: options.mode,
      });

      // Generate config file content
      const content = `import { defineConfig } from '@regent/regentx';

export default defineConfig({
  version: 1,
  agent: {
    name: '${config.agent.name}',
    ownerConnectorId: '${config.agent.ownerConnectorId}',
    metadata: {
      uri: '${config.agent.metadata.uri}',
    },
    deploymentMode: '${config.agent.deploymentMode ?? 'mock'}',
${
  config.agent.erc8004
    ? `    erc8004: {
      chainId: ${config.agent.erc8004.chainId},
    },
`
    : ''
  }  },
});
`;

      await writeFile(configPath, content, 'utf-8');
      printSuccess(`Created regent.config.ts`);

      // Create .env.example if it doesn't exist
      const envExamplePath = resolve(cwd, '.env.example');
      if (!existsSync(envExamplePath)) {
        const envContent = `# Regent Agent Configuration

# Required for on-chain mode
PRIVATE_KEY=0x...

# ERC-8004 Identity Registration
RPC_URL=https://sepolia.base.org

# Optional: IPFS for metadata storage (choose one)
PINATA_JWT=
# IPFS_NODE_URL=http://localhost:5001
# FILECOIN_KEY=

# Optional: Custom subgraph endpoint
# SUBGRAPH_URL=

# Optional: Factory contract address (for on-chain mode)
# FACTORY_ADDRESS=0x...
`;
        await writeFile(envExamplePath, envContent, 'utf-8');
        printSuccess(`Created .env.example`);
      }

      console.log('');
      console.log('Next steps:');
      console.log('  1. Edit regent.config.ts with your agent details');
      console.log('  2. Set up your .env file with PRIVATE_KEY');
      console.log('  3. Run `regentx agent:create` to create your agent');
    });
}
