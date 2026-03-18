import type { Command } from 'commander';
import { CalendlyClient } from '../../core/client.js';
import { saveConfig, loadConfig } from '../../core/config.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Calendly personal access token')
    .action(async (_opts, cmd) => {
      // Read --token from global options (defined on program) so it works
      // regardless of whether it's passed before or after 'login'
      const globalOpts = cmd.optsWithGlobals();
      let token = globalOpts.token as string | undefined;

      if (!token) {
        try {
          const { password } = await import('@inquirer/prompts');
          token = await password({
            message: 'Paste your Calendly personal access token:',
            mask: '*',
          });
        } catch {
          console.error(
            'Interactive prompts not available. Use:\n  CALENDLY_TOKEN=<token> calendly login\n  or: calendly --token <token> login',
          );
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
        user = res.resource ?? res;
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

      console.log(
        JSON.stringify(
          {
            status: 'authenticated',
            name: user.name,
            email: user.email,
            user_uri: user.uri,
            organization_uri: user.current_organization,
          },
          null,
          2,
        ),
      );
    });
}
