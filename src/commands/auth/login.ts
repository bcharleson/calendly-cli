import type { Command } from 'commander';
import { CalendlyClient } from '../../core/client.js';
import { saveConfig, loadConfig } from '../../core/config.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Calendly personal access token')
    .option('--token <token>', 'Provide token non-interactively')
    .action(async (opts) => {
      let token = opts.token as string | undefined;

      if (!token) {
        try {
          const { password } = await import('@inquirer/prompts');
          token = await password({
            message: 'Paste your Calendly personal access token:',
            mask: '*',
          });
        } catch {
          console.error('Interactive prompts not available. Use: calendly login --token <token>');
          process.exit(1);
        }
      }

      if (!token?.trim()) {
        console.error('Token cannot be empty.');
        process.exit(1);
      }

      console.error('Validating token...');
      const client = new CalendlyClient({ token: token.trim() });

      let user: any;
      try {
        const res: any = await client.get('/users/me');
        user = res.resource;
      } catch (err: any) {
        console.error(`Authentication failed: ${err.message}`);
        process.exit(1);
      }

      const existing = await loadConfig();
      await saveConfig({
        ...existing,
        token: token.trim(),
        user_uri: user.uri,
        user_name: user.name,
        user_email: user.email,
        organization_uri: user.current_organization,
      });

      console.log(JSON.stringify({
        status: 'authenticated',
        name: user.name,
        email: user.email,
        user_uri: user.uri,
        organization_uri: user.current_organization,
      }, null, 2));
    });
}
