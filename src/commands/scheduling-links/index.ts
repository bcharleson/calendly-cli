import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const schedulingLinksCreateCommand: CommandDefinition = {
  name: 'scheduling_links_create',
  group: 'scheduling-links',
  subcommand: 'create',
  description:
    'Create a single-use or multi-use scheduling link for an event type or user. ' +
    'Useful for sharing a specific booking URL.',
  examples: [
    'calendly scheduling-links create --owner https://api.calendly.com/event_types/abc123 --owner-type EventType',
    'calendly scheduling-links create --owner https://api.calendly.com/users/abc123 --owner-type User --max-event-count 5',
  ],
  inputSchema: z.object({
    owner: z.string().describe('URI of the owner (EventType or User URI)'),
    owner_type: z.enum(['EventType', 'User']).describe('Type of owner: EventType or User'),
    max_event_count: z.coerce.number().optional().describe('Max bookings allowed (omit for unlimited)'),
  }),
  cliMappings: {
    options: [
      { field: 'owner', flags: '--owner <uri>', description: 'Owner URI (required)' },
      { field: 'owner_type', flags: '--owner-type <type>', description: 'EventType | User (required)' },
      { field: 'max_event_count', flags: '--max-event-count <number>', description: 'Max bookings (omit for unlimited)' },
    ],
  },
  endpoint: { method: 'POST', path: '/scheduling_links' },
  fieldMappings: {
    owner: 'body',
    owner_type: 'body',
    max_event_count: 'body',
  },
  handler: (input, client) => executeCommand(schedulingLinksCreateCommand, input, client),
};

export const schedulingLinksCommands: CommandDefinition[] = [
  schedulingLinksCreateCommand,
];
