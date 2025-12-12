/**
 * regentx agent:status command
 *
 * Show the combined on-chain and ERC-8004 state of an agent.
 */

import { Command } from 'commander';
import type { GlobalOptions } from '../../types';
import { loadConfig } from '../../utils/config';
import { createManager } from '../../utils/factory';
import { formatOutput, printError } from '../../utils/output';

interface StatusOptions extends GlobalOptions {
  json?: boolean;
}

export function registerAgentStatusCommand(program: Command): void {
  program
    .command('agent:status [agentId]')
    .description('Show the on-chain and ERC-8004 state of an agent')
    .option('--json', 'Output JSON')
    .action(async (agentIdArg: string | undefined, options: StatusOptions) => {
      try {
        const cwd = process.cwd();

        // Load config
        const { config } = await loadConfig(cwd, options);

        // Resolve agent ID
        const agentId = agentIdArg ?? config.state?.agentId;
        if (!agentId) {
          throw new Error(
            'No agent ID specified. Provide an agent ID or run agent:create first.'
          );
        }

        // Create manager
        const { manager, chainId, mode } = createManager({
          config,
          globalOptions: options,
        });

        console.log(`Fetching agent ${agentId} (${mode} mode)...`);

        // Get agent state
        const state = await manager.getAgentState(agentId);

        if (!state.onchain) {
          throw new Error(`Agent not found: ${agentId}`);
        }

        // Format output
        if (options.json) {
          console.log(JSON.stringify(state, null, 2));
        } else {
          console.log('');
          console.log('=== On-Chain Factory State ===');
          console.log(
            formatOutput(
              {
                'Agent ID': state.onchain.agentId,
                Owner: state.onchain.owner,
                Name: state.onchain.name ?? '-',
                'Metadata URI': state.onchain.metadataUri,
                Paused: state.onchain.paused,
                'Bond Token': state.onchain.bond?.token ?? '-',
                'Bond Amount': state.onchain.bond?.amount?.toString() ?? '-',
                Treasury: state.onchain.treasury?.address ?? '-',
                'Rake (bps)': state.onchain.treasury?.rakeBps ?? '-',
              },
              {}
            )
          );

          if (state.erc8004) {
            console.log('');
            console.log('=== ERC-8004 Identity ===');
            console.log(
              formatOutput(
                {
                  'Token ID': state.erc8004.tokenId,
                  'Metadata URI': state.erc8004.metadataUri,
                  Wallet: state.erc8004.wallet ?? '-',
                  'Trust Models': state.erc8004.trustModels?.join(', ') ?? '-',
                  Reputation: state.erc8004.reputationScore ?? '-',
                },
                {}
              )
            );
          }
        }
      } catch (error) {
        printError((error as Error).message);
        process.exit(1);
      }
    });
}
