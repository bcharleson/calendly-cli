import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const CLI_VERSION = '0.1.0';

const program = new Command();

program
  .name('calendly')
  .description('Agent-native CLI and MCP server for the Calendly API')
  .version(CLI_VERSION)
  .option('--token <token>', 'Calendly personal access token (overrides env/config)')
  .option('--pretty', 'Pretty-print JSON output')
  .option('--quiet', 'Suppress output (exit code only)')
  .option('--fields <fields>', 'Comma-separated fields to include in output');

registerAllCommands(program);

program.parse(process.argv);
