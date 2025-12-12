/**
 * regentx agent:list command
 *
 * List all agents owned by the current wallet.
 */

import { Command } from 'commander';
import type { GlobalOptions } from '../../types';
import type { Address } from '@regent/contracts';
import { loadConfig } from '../../utils/config';
import { createManager } from '../../utils/factory';
import { printError, printTable } from '../../utils/output';

interface ListOptions extends GlobalOptions {
  owner?: string;
  limit?: string;
  json?: boolean;
}

export function registerAgentListCommand(program: Command): void {
  program
    .command('agent:list')
    .description('List all agents owned by the current wallet')
    .option('--owner <address>', 'Override owner address')
    .option('--limit <n>', 'Max number of agents to show', '50')
    .option('--json', 'Output JSON')
    .action(async (options: ListOptions) => {
      try {
        const cwd = process.cwd();

        // Load config
        const { config } = await loadConfig(cwd, options);

        // Create manager
        const { manager, chainId, mode } = createManager({
          config,
          globalOptions: options,
        });

        // Resolve owner address
        // In real usage, this would come from the wallet connector
        const owner: Address =
          (options.owner as Address) ??
          '0x1234567890123456789012345678901234567890';

        console.log(
          `Fetching agents for ${owner.slice(0, 10)}... (${mode} mode)`
        );

        // Get agents
        const agents = await manager.getAgentsByOwner(owner);
        const limit = parseInt(options.limit ?? '50', 10);
        const limited = agents.slice(0, limit);

        // Output
        if (options.json) {
          console.log(JSON.stringify(limited, null, 2));
        } else {
          if (limited.length === 0) {
            console.log('No agents found for this owner.');
            return;
          }

          console.log('');
          printTable(
            limited.map((a) => ({
              agentId: a.agentId,
              name: a.name ?? '-',
              paused: a.paused ? 'Yes' : 'No',
              metadataUri:
                a.metadataUri.length > 30
                  ? a.metadataUri.slice(0, 27) + '...'
                  : a.metadataUri,
            })),
            [
              { key: 'agentId', header: 'Agent ID', width: 20 },
              { key: 'name', header: 'Name', width: 20 },
              { key: 'paused', header: 'Paused', width: 8 },
              { key: 'metadataUri', header: 'Metadata URI', width: 35 },
            ]
          );

          if (agents.length > limit) {
            console.log(
              `\n(Showing ${limit} of ${agents.length}. Use --limit to show more.)`
            );
          }
        }
      } catch (error) {
        printError((error as Error).message);
        process.exit(1);
      }
    });
}
