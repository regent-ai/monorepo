/**
 * Agent command registrations
 */

import type { Command } from 'commander';
import { registerAgentInitCommand } from './init';
import { registerAgentCreateCommand } from './create';
import { registerAgentStatusCommand } from './status';
import { registerAgentListCommand } from './list';

export function registerAgentCommands(program: Command): void {
  registerAgentInitCommand(program);
  registerAgentCreateCommand(program);
  registerAgentStatusCommand(program);
  registerAgentListCommand(program);
}
