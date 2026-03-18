import { Command } from 'commander';
import { createRequire } from 'node:module';
import { registerAllCommands } from './commands/index.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('calendly')
  .description('Agent-native CLI and MCP server for the Calendly API')
  .version(version)
  .option('--token <token>', 'Calendly personal access token (overrides env/config)')
  .option('--pretty', 'Pretty-print JSON output')
  .option('--quiet', 'Suppress output (exit code only)')
  .option('--fields <fields>', 'Comma-separated fields to include in output');

registerAllCommands(program);

program.parse(process.argv);
