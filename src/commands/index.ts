import type { Command } from 'commander';
import { resolveToken } from '../core/auth.js';
import { CalendlyClient } from '../core/client.js';
import { output, outputError } from '../core/output.js';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';

import { registerLoginCommand } from './auth/login.js';
import { registerLogoutCommand } from './auth/logout.js';
import { registerAuthStatusCommand } from './auth/status.js';
import { usersCommands } from './users/index.js';
import { organizationsCommands } from './organizations/index.js';
import { eventTypesCommands } from './event-types/index.js';
import { scheduledEventsCommands } from './scheduled-events/index.js';
import { inviteesCommands } from './invitees/index.js';
import { availabilityCommands } from './availability/index.js';
import { webhooksCommands } from './webhooks/index.js';
import { routingFormsCommands } from './routing-forms/index.js';
import { schedulingLinksCommands } from './scheduling-links/index.js';
import { groupsCommands } from './groups/index.js';
import { dataComplianceCommands } from './data-compliance/index.js';
import { activityLogCommands } from './activity-log/index.js';

export const allCommands: CommandDefinition[] = [
  ...usersCommands,
  ...organizationsCommands,
  ...eventTypesCommands,
  ...scheduledEventsCommands,
  ...inviteesCommands,
  ...availabilityCommands,
  ...webhooksCommands,
  ...routingFormsCommands,
  ...schedulingLinksCommands,
  ...groupsCommands,
  ...dataComplianceCommands,
  ...activityLogCommands,
];

export function registerAllCommands(program: Command): void {
  // Auth commands (special — no CommandDefinition pattern)
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerAuthStatusCommand(program);

  // Register MCP server start command
  program
    .command('mcp')
    .description('Start the Calendly MCP server (for AI agents)')
    .action(async () => {
      const { startMcpServer } = await import('../mcp/server.js');
      await startMcpServer();
    });

  // Group commands by their `group` field
  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    const list = groups.get(cmd.group) ?? [];
    list.push(cmd);
    groups.set(cmd.group, list);
  }

  // Register each group as a Commander subcommand
  for (const [group, cmds] of groups) {
    const groupCmd = program.command(group).description(`${group} commands`);

    for (const cmdDef of cmds) {
      const sub = groupCmd.command(cmdDef.subcommand).description(cmdDef.description);

      // Register positional arguments
      for (const arg of cmdDef.cliMappings.args ?? []) {
        if (arg.required) {
          sub.argument(`<${arg.name}>`, `${arg.field}`);
        } else {
          sub.argument(`[${arg.name}]`, `${arg.field}`);
        }
      }

      // Register command-specific options
      for (const opt of cmdDef.cliMappings.options ?? []) {
        sub.option(opt.flags, opt.description ?? '');
      }

      // Bug fix: add display options directly on each subcommand so Commander
      // parses them when they appear *after* the subcommand name (the common case).
      // Without this, --pretty/--quiet/--fields are only parsed when before the subcommand.
      sub
        .option('--pretty', 'Pretty-print JSON output')
        .option('--quiet', 'Suppress output (exit code only)')
        .option('--fields <fields>', 'Comma-separated fields to include in output');

      // Add examples to help text
      if (cmdDef.examples?.length) {
        sub.addHelpText('after', '\nExamples:\n' + cmdDef.examples.map((e) => `  ${e}`).join('\n'));
      }

      sub.action(async (...actionArgs: any[]) => {
        const instanceOpts = actionArgs[actionArgs.length - 2] as Record<string, any>;
        // Merge subcommand opts with globals (--token lives on program)
        const globalOpts = sub.optsWithGlobals() as GlobalOptions & Record<string, any>;
        // Prefer subcommand-level pretty/quiet/fields if set, fall back to global
        if (instanceOpts.pretty) globalOpts.pretty = true;
        if (instanceOpts.quiet) globalOpts.quiet = true;
        if (instanceOpts.fields) globalOpts.fields = instanceOpts.fields;

        try {
          const token = await resolveToken(globalOpts.token);
          const client = new CalendlyClient({ token });

          // Build input: positional args first, then options
          const input: Record<string, unknown> = {};

          const positionalArgs = actionArgs.slice(0, actionArgs.length - 2);
          for (let i = 0; i < (cmdDef.cliMappings.args ?? []).length; i++) {
            const argDef = cmdDef.cliMappings.args![i];
            if (positionalArgs[i] !== undefined) {
              input[argDef.field] = positionalArgs[i];
            }
          }

          for (const opt of cmdDef.cliMappings.options ?? []) {
            const key = camelCase(opt.flags.match(/--([a-z0-9-]+)/)?.[1] ?? '');
            if (instanceOpts[key] !== undefined) {
              input[opt.field] = instanceOpts[key];
            }
          }

          // Validate with schema
          const parsed = cmdDef.inputSchema.safeParse(input);
          if (!parsed.success) {
            const issues = parsed.error.issues
              .map((i) => `  ${i.path.join('.')}: ${i.message}`)
              .join('\n');
            throw new Error(`Validation error:\n${issues}`);
          }

          const result = await cmdDef.handler(parsed.data, client);
          output(result, globalOpts);
        } catch (err) {
          outputError(err, globalOpts);
        }
      });
    }
  }
}

/** Convert kebab-case to camelCase for Commander option keys */
function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
