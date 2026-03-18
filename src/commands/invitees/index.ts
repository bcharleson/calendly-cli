import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const inviteesListCommand: CommandDefinition = {
  name: 'invitees_list',
  group: 'invitees',
  subcommand: 'list',
  description: 'List all invitees for a scheduled event',
  examples: [
    'calendly invitees list abc123def456',
    'calendly invitees list abc123def456 --status active',
    'calendly invitees list abc123def456 --count 50',
  ],
  inputSchema: z.object({
    event_uuid: z.string().describe('Scheduled event UUID'),
    status: z.string().optional().describe('Filter by status: active or canceled'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page (max 100)'),
    page_token: z.string().optional().describe('Pagination token'),
    sort: z.string().optional().describe('Sort (e.g. created_at:desc)'),
    email: z.string().optional().describe('Filter by invitee email'),
  }),
  cliMappings: {
    args: [{ field: 'event_uuid', name: 'event-uuid', required: true }],
    options: [
      { field: 'status', flags: '--status <status>', description: 'active | canceled' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'sort', flags: '--sort <order>', description: 'Sort order' },
      { field: 'email', flags: '--email <email>', description: 'Filter by email' },
    ],
  },
  endpoint: { method: 'GET', path: '/scheduled_events/{event_uuid}/invitees' },
  fieldMappings: {
    event_uuid: 'path',
    status: 'query',
    count: 'query',
    page_token: 'query',
    sort: 'query',
    email: 'query',
  },
  handler: (input, client) => executeCommand(inviteesListCommand, input, client),
};

export const inviteesGetCommand: CommandDefinition = {
  name: 'invitees_get',
  group: 'invitees',
  subcommand: 'get',
  description: 'Get a specific invitee by UUID',
  examples: ['calendly invitees get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Invitee UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/invitees/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(inviteesGetCommand, input, client),
};

/**
 * invitees_create — Books a meeting using the Calendly Scheduling API.
 * Requires a paid Calendly plan. Finds an available slot via
 * event_types_available_times, then books it with this command.
 */
export const inviteesCreateCommand: CommandDefinition = {
  name: 'invitees_create',
  group: 'invitees',
  subcommand: 'create',
  description:
    'Book a meeting (Scheduling API). Requires a paid Calendly plan. ' +
    'Use availability commands first to find an open slot, then call this to book it.',
  examples: [
    'calendly invitees create \\\n  --event-type https://api.calendly.com/event_types/abc123 \\\n  --start-time 2025-02-01T14:00:00Z \\\n  --name "Jane Smith" \\\n  --email jane@example.com',
    'calendly invitees create \\\n  --event-type https://api.calendly.com/event_types/abc123 \\\n  --start-time 2025-02-01T14:00:00Z \\\n  --name "Jane Smith" \\\n  --email jane@example.com \\\n  --location-type outbound_call \\\n  --location-additional "+14155551234"',
  ],
  inputSchema: z.object({
    event_type: z.string().describe('Event type URI (full URL)'),
    start_time: z.string().describe('Start time in UTC ISO 8601 (e.g. 2025-02-01T14:00:00Z)'),
    name: z.string().describe('Invitee full name'),
    email: z.string().email().describe('Invitee email address'),
    location_type: z
      .string()
      .optional()
      .describe(
        'Location type: outbound_call, inbound_call, google_conference, zoom, etc.',
      ),
    location_additional: z
      .string()
      .optional()
      .describe('Phone number or location detail for outbound_call / inbound_call'),
    timezone: z.string().optional().describe('Invitee timezone (e.g. America/Los_Angeles)'),
    guests: z
      .string()
      .optional()
      .describe('Comma-separated guest emails to add to the event'),
    custom_answers: z
      .string()
      .optional()
      .describe('Custom question answers as JSON array: [{"position":0,"value":"answer"}]'),
    text_reminder_number: z.string().optional().describe('Phone number for SMS reminder'),
  }),
  cliMappings: {
    options: [
      { field: 'event_type', flags: '--event-type <uri>', description: 'Event type URI (required)' },
      { field: 'start_time', flags: '--start-time <iso8601>', description: 'Start time UTC (required)' },
      { field: 'name', flags: '--name <name>', description: 'Invitee full name (required)' },
      { field: 'email', flags: '--email <email>', description: 'Invitee email (required)' },
      { field: 'location_type', flags: '--location-type <type>', description: 'Location type' },
      { field: 'location_additional', flags: '--location-additional <value>', description: 'Phone/location detail' },
      { field: 'timezone', flags: '--timezone <tz>', description: 'Invitee timezone' },
      { field: 'guests', flags: '--guests <emails>', description: 'Guest emails (comma-separated)' },
      { field: 'custom_answers', flags: '--custom-answers <json>', description: 'Custom answers JSON' },
      { field: 'text_reminder_number', flags: '--text-reminder-number <phone>', description: 'SMS reminder number' },
    ],
  },
  endpoint: { method: 'POST', path: '/one_off_event_types' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      event_type_uuid: input.event_type,
      start_time: input.start_time,
      invitee: {
        name: input.name,
        email: input.email,
        ...(input.timezone && { timezone: input.timezone }),
        ...(input.text_reminder_number && { text_reminder_number: input.text_reminder_number }),
      },
    };

    if (input.location_type) {
      body.location = {
        type: input.location_type,
        ...(input.location_additional && { additional_info: input.location_additional }),
      };
    }

    if (input.guests) {
      body.guests = input.guests
        .split(',')
        .map((e: string) => ({ email: e.trim() }))
        .filter((g: { email: string }) => g.email);
    }

    if (input.custom_answers) {
      try {
        body.custom_questions_answers = JSON.parse(input.custom_answers);
      } catch {
        throw new Error('--custom-answers must be valid JSON array');
      }
    }

    return client.post('/scheduled_events', body);
  },
};

export const inviteesCommands: CommandDefinition[] = [
  inviteesListCommand,
  inviteesGetCommand,
  inviteesCreateCommand,
];
