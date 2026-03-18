import type { Command } from 'commander';
import { clearConfig } from '../../core/config.js';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored Calendly credentials')
    .action(async () => {
      await clearConfig();
      console.log(JSON.stringify({ status: 'logged_out' }));
    });
}
