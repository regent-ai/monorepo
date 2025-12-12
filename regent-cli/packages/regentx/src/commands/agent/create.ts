/**
 * regentx agent:create command
 *
 * Create a new agent via the agent-creation factory contract.
 */

import { Command } from 'commander';
import type { GlobalOptions } from '../../types';
import { loadConfig, saveConfig } from '../../utils/config';
import { createManager } from '../../utils/factory';
import { formatOutput, printSuccess, printError } from '../../utils/output';
import type { Address } from '@regent/contracts';

interface CreateOptions extends GlobalOptions {
  name?: string;
  metadataUri?: string;
  ownerWallet?: string;
  rakeBps?: string;
  initialBond?: string;
  skipIdentity?: boolean;
  dryRun?: boolean;
}

export function registerAgentCreateCommand(program: Command): void {
  program
    .command('agent:create')
    .description('Create a new agent via the agent-creation contract')
    .option('--name <name>', 'Override agent name from config')
    .option('--metadata-uri <uri>', 'Override metadata URI')
    .option('--owner-wallet <id>', 'Override wallet connector')
    .option('--rake-bps <bps>', 'Override rake in basis points (0-10000)')
    .option('--initial-bond <wei>', 'Override initial bond amount')
    .option('--skip-identity', "Don't register with ERC-8004")
    .option('--dry-run', 'Show what would be created without executing')
    .option('--json', 'Output JSON')
    .action(async (options: CreateOptions) => {
      try {
        const cwd = process.cwd();

        // Load config
        const { config, configPath } = await loadConfig(cwd, options);

        // Apply overrides
        if (options.name) {
          config.agent.name = options.name;
        }
        if (options.metadataUri) {
          config.agent.metadata.uri = options.metadataUri;
        }
        if (options.ownerWallet) {
          config.agent.ownerConnectorId = options.ownerWallet;
        }
        if (options.rakeBps) {
          config.agent.tokenomics = config.agent.tokenomics ?? {};
          config.agent.tokenomics.rakeBps = parseInt(options.rakeBps, 10);
        }
        if (options.initialBond) {
          config.agent.tokenomics = config.agent.tokenomics ?? {};
          config.agent.tokenomics.initialBond = BigInt(options.initialBond);
        }

        // Create manager
        const { manager, chainId, mode } = createManager({
          config,
          globalOptions: options,
          skipIdentity: options.skipIdentity,
        });

        // Dry run mode
        if (options.dryRun) {
          console.log('Dry run mode - would create agent with:');
          console.log(
            formatOutput(
              {
                name: config.agent.name,
                metadataUri: config.agent.metadata.uri,
                chainId,
                mode,
                rakeBps: config.agent.tokenomics?.rakeBps ?? 0,
                initialBond: config.agent.tokenomics?.initialBond?.toString() ?? '0',
              },
              { json: options.json }
            )
          );
          return;
        }

        // For mock mode, we need an owner address
        // In real usage, this would come from the wallet connector
        const mockOwner: Address =
          '0x1234567890123456789012345678901234567890';

        console.log(`Creating agent in ${mode} mode on chain ${chainId}...`);

        // Create the agent
        const result = await manager.createAgentFromConfig(
          config.agent,
          mockOwner // In real usage, this would be resolved from wallet
        );

        // Update config state
        config.state = {
          agentId: result.agentId,
          lastTxHash: result.txHash,
        };
        await saveConfig(configPath, config);

        // Output result
        if (options.json) {
          console.log(
            JSON.stringify(
              {
                agentId: result.agentId,
                wallet: result.wallet,
                txHash: result.txHash,
                identityTokenId: result.identityTokenId,
                mode,
              },
              null,
              2
            )
          );
        } else {
          printSuccess(`Created agent: ${result.agentId}`);
          console.log('');
          console.log(
            formatOutput(
              {
                'Agent ID': result.agentId,
                'Transaction': result.txHash,
                'Wallet': result.wallet ?? '-',
                'ERC-8004 Token': result.identityTokenId ?? '-',
                'Mode': mode,
              },
              {}
            )
          );
        }
      } catch (error) {
        printError((error as Error).message);
        process.exit(1);
      }
    });
}
