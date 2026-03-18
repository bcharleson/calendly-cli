import type { Command } from 'commander';
import { loadConfig, getConfigPath } from '../../core/config.js';

export function registerAuthStatusCommand(program: Command): void {
  program
    .command('auth-status')
    .description('Show current authentication status')
    .action(async () => {
      const config = await loadConfig();
      if (config.token) {
        console.log(JSON.stringify({
          status: 'authenticated',
          name: config.user_name ?? null,
          email: config.user_email ?? null,
          user_uri: config.user_uri ?? null,
          organization_uri: config.organization_uri ?? null,
          config_path: getConfigPath(),
        }, null, 2));
      } else {
        console.log(JSON.stringify({
          status: 'unauthenticated',
          message: 'Run: calendly login',
          config_path: getConfigPath(),
        }, null, 2));
      }
    });
}
