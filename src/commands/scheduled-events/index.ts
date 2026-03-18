import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const scheduledEventsListCommand: CommandDefinition = {
  name: 'scheduled_events_list',
  group: 'scheduled-events',
  subcommand: 'list',
  description:
    'List scheduled events for a user or organization. Defaults to your own upcoming events.',
  examples: [
    'calendly scheduled-events list',
    'calendly scheduled-events list --status active',
    'calendly scheduled-events list --min-start-time 2025-01-01T00:00:00Z --max-start-time 2025-01-31T23:59:59Z',
    'calendly scheduled-events list --count 50 --sort start_time:desc',
  ],
  inputSchema: z.object({
    user: z.string().optional().describe('User URI (defaults to authenticated user)'),
    organization: z.string().optional().describe('Organization URI'),
    status: z.string().optional().describe('Filter by status: active or canceled'),
    min_start_time: z.string().optional().describe('Min start time (ISO 8601 UTC)'),
    max_start_time: z.string().optional().describe('Max start time (ISO 8601 UTC)'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page (max 100)'),
    page_token: z.string().optional().describe('Pagination token'),
    sort: z.string().optional().describe('Sort (e.g. start_time:asc or start_time:desc)'),
    invitee_email: z.string().optional().describe('Filter by invitee email'),
  }),
  cliMappings: {
    options: [
      { field: 'user', flags: '--user <uri>', description: 'User URI' },
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'status', flags: '--status <status>', description: 'active | canceled' },
      { field: 'min_start_time', flags: '--min-start-time <iso8601>', description: 'Min start time (UTC)' },
      { field: 'max_start_time', flags: '--max-start-time <iso8601>', description: 'Max start time (UTC)' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'sort', flags: '--sort <order>', description: 'start_time:asc or start_time:desc' },
      { field: 'invitee_email', flags: '--invitee-email <email>', description: 'Filter by invitee email' },
    ],
  },
  endpoint: { method: 'GET', path: '/scheduled_events' },
  fieldMappings: {
    user: 'query',
    organization: 'query',
    status: 'query',
    min_start_time: 'query',
    max_start_time: 'query',
    count: 'query',
    page_token: 'query',
    sort: 'query',
    invitee_email: 'query',
  },
  handler: async (input, client) => {
    if (!input.user && !input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.user_uri) {
        input = { ...input, user: config.user_uri };
      }
    }
    return executeCommand(scheduledEventsListCommand, input, client);
  },
};

export const scheduledEventsGetCommand: CommandDefinition = {
  name: 'scheduled_events_get',
  group: 'scheduled-events',
  subcommand: 'get',
  description: 'Get a specific scheduled event by UUID',
  examples: ['calendly scheduled-events get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Scheduled event UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/scheduled_events/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(scheduledEventsGetCommand, input, client),
};

export const scheduledEventsCancelCommand: CommandDefinition = {
  name: 'scheduled_events_cancel',
  group: 'scheduled-events',
  subcommand: 'cancel',
  description: 'Cancel a scheduled event',
  examples: [
    'calendly scheduled-events cancel abc123def456',
    'calendly scheduled-events cancel abc123def456 --reason "Scheduling conflict"',
  ],
  inputSchema: z.object({
    uuid: z.string().describe('Scheduled event UUID'),
    reason: z.string().optional().describe('Cancellation reason'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
    options: [
      { field: 'reason', flags: '--reason <reason>', description: 'Cancellation reason' },
    ],
  },
  endpoint: { method: 'POST', path: '/scheduled_events/{uuid}/cancellation' },
  fieldMappings: {
    uuid: 'path',
    reason: 'body',
  },
  handler: (input, client) => executeCommand(scheduledEventsCancelCommand, input, client),
};

export const scheduledEventsCommands: CommandDefinition[] = [
  scheduledEventsListCommand,
  scheduledEventsGetCommand,
  scheduledEventsCancelCommand,
];
