import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const activityLogListCommand: CommandDefinition = {
  name: 'activity_log_list',
  group: 'activity-log',
  subcommand: 'list',
  description:
    'List activity log entries for an organization (Enterprise plan required). ' +
    'Shows all actions taken in the organization.',
  examples: [
    'calendly activity-log list',
    'calendly activity-log list --from 2025-01-01T00:00:00Z --to 2025-01-31T23:59:59Z',
    'calendly activity-log list --action event_type.created --count 50',
  ],
  inputSchema: z.object({
    organization: z.string().optional().describe('Organization URI (defaults to your org)'),
    from: z.string().optional().describe('Start time ISO 8601 UTC'),
    to: z.string().optional().describe('End time ISO 8601 UTC'),
    action: z.string().optional().describe('Filter by action type (e.g. event_type.created)'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
    sort: z.string().optional().describe('Sort order (e.g. occurred_at:desc)'),
  }),
  cliMappings: {
    options: [
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'from', flags: '--from <iso8601>', description: 'Start time UTC' },
      { field: 'to', flags: '--to <iso8601>', description: 'End time UTC' },
      { field: 'action', flags: '--action <action>', description: 'Filter by action type' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'sort', flags: '--sort <order>', description: 'Sort order' },
    ],
  },
  endpoint: { method: 'GET', path: '/activity_log_entries' },
  fieldMappings: {
    organization: 'query',
    from: 'query',
    to: 'query',
    action: 'query',
    count: 'query',
    page_token: 'query',
    sort: 'query',
  },
  handler: async (input, client) => {
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) input = { ...input, organization: config.organization_uri };
    }
    return executeCommand(activityLogListCommand, input, client);
  },
};

export const activityLogCommands: CommandDefinition[] = [activityLogListCommand];
