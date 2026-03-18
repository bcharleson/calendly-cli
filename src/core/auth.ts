import { loadConfig } from './config.js';
import { AuthError } from './errors.js';

/**
 * Resolve the Calendly personal access token in priority order:
 * 1. --token CLI flag
 * 2. CALENDLY_TOKEN env var
 * 3. ~/.calendly-cli/config.json
 */
export async function resolveToken(flagToken?: string): Promise<string> {
  if (flagToken) return flagToken;
  if (process.env.CALENDLY_TOKEN) return process.env.CALENDLY_TOKEN;

  const config = await loadConfig();
  if (config.token) return config.token;

  throw new AuthError(
    'No Calendly token found.\n\n' +
      'Options:\n' +
      '  1. Run: calendly auth login\n' +
      '  2. Set env var: CALENDLY_TOKEN=<token>\n' +
      '  3. Pass flag: --token <token>',
  );
}
