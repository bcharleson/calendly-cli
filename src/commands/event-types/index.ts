import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const eventTypesListCommand: CommandDefinition = {
  name: 'event_types_list',
  group: 'event-types',
  subcommand: 'list',
  description:
    'List event types for a user or organization. Defaults to your own event types.',
  examples: [
    'calendly event-types list',
    'calendly event-types list --active',
    'calendly event-types list --organization https://api.calendly.com/organizations/abc123',
    'calendly event-types list --count 50',
  ],
  inputSchema: z.object({
    user: z.string().optional().describe('User URI (defaults to authenticated user)'),
    organization: z.string().optional().describe('Organization URI'),
    active: z.boolean().optional().describe('Filter to active event types only'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page (max 100)'),
    page_token: z.string().optional().describe('Pagination token'),
    sort: z.string().optional().describe('Sort order (e.g. created_at:desc)'),
    admin_managed: z.boolean().optional().describe('Filter to admin-managed event types'),
  }),
  cliMappings: {
    options: [
      { field: 'user', flags: '--user <uri>', description: 'User URI' },
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'active', flags: '--active', description: 'Active event types only' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'sort', flags: '--sort <order>', description: 'Sort (e.g. created_at:desc)' },
      { field: 'admin_managed', flags: '--admin-managed', description: 'Admin-managed only' },
    ],
  },
  endpoint: { method: 'GET', path: '/event_types' },
  fieldMappings: {
    user: 'query',
    organization: 'query',
    active: 'query',
    count: 'query',
    page_token: 'query',
    sort: 'query',
    admin_managed: 'query',
  },
  handler: async (input, client) => {
    // Auto-resolve user URI from config if neither user nor org provided
    if (!input.user && !input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.user_uri) {
        input = { ...input, user: config.user_uri };
      }
    }
    return executeCommand(eventTypesListCommand, input, client);
  },
};

export const eventTypesGetCommand: CommandDefinition = {
  name: 'event_types_get',
  group: 'event-types',
  subcommand: 'get',
  description: 'Get a specific event type by UUID',
  examples: ['calendly event-types get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Event type UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/event_types/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(eventTypesGetCommand, input, client),
};

export const oneOffEventTypeCreateCommand: CommandDefinition = {
  name: 'one_off_event_type_create',
  group: 'event-types',
  subcommand: 'create-one-off',
  description:
    'Create a one-off event type for a single scheduling session. ' +
    'Returns a unique booking URL that can be shared directly.',
  examples: [
    'calendly event-types create-one-off --name "Quick Chat" --duration 30 --timezone America/New_York',
    'calendly event-types create-one-off --name "Demo Call" --duration 60 --timezone America/Los_Angeles --location-type zoom',
  ],
  inputSchema: z.object({
    name: z.string().describe('Event name'),
    host: z.string().optional().describe('Host user URI (defaults to authenticated user)'),
    duration: z.coerce.number().describe('Duration in minutes'),
    timezone: z.string().describe('Timezone (e.g. America/New_York)'),
    date_setting_type: z
      .string()
      .optional()
      .describe('Date setting: date_range or indefinite (default: indefinite)'),
    date_setting_start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    date_setting_end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
    location_type: z
      .string()
      .optional()
      .describe('Location type: zoom, google_conference, outbound_call, inbound_call, etc.'),
    location_additional: z.string().optional().describe('Location additional info (phone number, etc.)'),
  }),
  cliMappings: {
    options: [
      { field: 'name', flags: '--name <name>', description: 'Event name (required)' },
      { field: 'host', flags: '--host <uri>', description: 'Host user URI' },
      { field: 'duration', flags: '--duration <minutes>', description: 'Duration in minutes (required)' },
      { field: 'timezone', flags: '--timezone <tz>', description: 'Timezone (required)' },
      { field: 'date_setting_type', flags: '--date-setting-type <type>', description: 'date_range | indefinite' },
      { field: 'date_setting_start_date', flags: '--start-date <YYYY-MM-DD>', description: 'Start date' },
      { field: 'date_setting_end_date', flags: '--end-date <YYYY-MM-DD>', description: 'End date' },
      { field: 'location_type', flags: '--location-type <type>', description: 'Location type' },
      { field: 'location_additional', flags: '--location-additional <value>', description: 'Location detail' },
    ],
  },
  endpoint: { method: 'POST', path: '/one_off_event_types' },
  fieldMappings: {},
  handler: async (input, client) => {
    let host = input.host;
    if (!host) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      host = config.user_uri;
    }
    const body: Record<string, unknown> = {
      name: input.name,
      host,
      duration: input.duration,
      timezone: input.timezone,
    };
    if (input.date_setting_type) {
      body.date_setting = {
        type: input.date_setting_type,
        ...(input.date_setting_start_date && { start_date: input.date_setting_start_date }),
        ...(input.date_setting_end_date && { end_date: input.date_setting_end_date }),
      };
    }
    if (input.location_type) {
      body.location = {
        type: input.location_type,
        ...(input.location_additional && { additional_info: input.location_additional }),
      };
    }
    return client.post('/one_off_event_types', body);
  },
};

export const eventTypesCommands: CommandDefinition[] = [
  eventTypesListCommand,
  eventTypesGetCommand,
  oneOffEventTypeCreateCommand,
];
