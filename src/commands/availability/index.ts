import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const availabilityEventTimesCommand: CommandDefinition = {
  name: 'availability_event_times',
  group: 'availability',
  subcommand: 'event-times',
  description:
    'Get available time slots for an event type. Maximum 7-day range. ' +
    'Use this to find open slots before booking with invitees create.',
  examples: [
    'calendly availability event-times --event-type https://api.calendly.com/event_types/abc123 --start-time 2025-02-01T00:00:00Z --end-time 2025-02-07T23:59:59Z',
    'calendly availability event-times --event-type https://api.calendly.com/event_types/abc123 --start-time 2025-02-01T00:00:00Z --end-time 2025-02-07T23:59:59Z --pretty',
  ],
  inputSchema: z.object({
    event_type: z.string().describe('Event type URI (full URL)'),
    start_time: z.string().describe('Range start in UTC ISO 8601'),
    end_time: z.string().describe('Range end in UTC ISO 8601 (max 7 days from start)'),
    timezone: z.string().optional().describe('Timezone for availability (e.g. America/Los_Angeles)'),
    diagnostics: z.boolean().optional().describe('Include diagnostics in response'),
  }),
  cliMappings: {
    options: [
      { field: 'event_type', flags: '--event-type <uri>', description: 'Event type URI (required)' },
      { field: 'start_time', flags: '--start-time <iso8601>', description: 'Range start UTC (required)' },
      { field: 'end_time', flags: '--end-time <iso8601>', description: 'Range end UTC (required, max 7 days)' },
      { field: 'timezone', flags: '--timezone <tz>', description: 'Timezone (e.g. America/New_York)' },
      { field: 'diagnostics', flags: '--diagnostics', description: 'Include diagnostics' },
    ],
  },
  endpoint: { method: 'GET', path: '/event_type_available_times' },
  fieldMappings: {
    event_type: 'query',
    start_time: 'query',
    end_time: 'query',
    timezone: 'query',
    diagnostics: 'query',
  },
  handler: (input, client) => executeCommand(availabilityEventTimesCommand, input, client),
};

export const availabilityBusyTimesCommand: CommandDefinition = {
  name: 'availability_busy_times',
  group: 'availability',
  subcommand: 'busy-times',
  description:
    'Get busy/blocked times for a user. Maximum 7-day range. ' +
    'Shows when the user is NOT available.',
  examples: [
    'calendly availability busy-times --start-time 2025-02-01T00:00:00Z --end-time 2025-02-07T23:59:59Z',
    'calendly availability busy-times --user https://api.calendly.com/users/abc123 --start-time 2025-02-01T00:00:00Z --end-time 2025-02-07T23:59:59Z',
  ],
  inputSchema: z.object({
    user: z.string().optional().describe('User URI (defaults to authenticated user)'),
    start_time: z.string().describe('Range start in UTC ISO 8601'),
    end_time: z.string().describe('Range end in UTC ISO 8601 (max 7 days from start)'),
  }),
  cliMappings: {
    options: [
      { field: 'user', flags: '--user <uri>', description: 'User URI' },
      { field: 'start_time', flags: '--start-time <iso8601>', description: 'Range start UTC (required)' },
      { field: 'end_time', flags: '--end-time <iso8601>', description: 'Range end UTC (required)' },
    ],
  },
  endpoint: { method: 'GET', path: '/user_busy_times' },
  fieldMappings: {
    user: 'query',
    start_time: 'query',
    end_time: 'query',
  },
  handler: async (input, client) => {
    if (!input.user) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.user_uri) {
        input = { ...input, user: config.user_uri };
      }
    }
    return executeCommand(availabilityBusyTimesCommand, input, client);
  },
};

export const availabilitySchedulesCommand: CommandDefinition = {
  name: 'availability_schedules',
  group: 'availability',
  subcommand: 'schedules',
  description: 'List availability schedules for a user (working hours configuration)',
  examples: [
    'calendly availability schedules',
    'calendly availability schedules --user https://api.calendly.com/users/abc123',
  ],
  inputSchema: z.object({
    user: z.string().optional().describe('User URI (defaults to authenticated user)'),
  }),
  cliMappings: {
    options: [
      { field: 'user', flags: '--user <uri>', description: 'User URI' },
    ],
  },
  endpoint: { method: 'GET', path: '/user_availability_schedules' },
  fieldMappings: { user: 'query' },
  handler: async (input, client) => {
    if (!input.user) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.user_uri) {
        input = { ...input, user: config.user_uri };
      }
    }
    return executeCommand(availabilitySchedulesCommand, input, client);
  },
};

export const availabilityScheduleGetCommand: CommandDefinition = {
  name: 'availability_schedule_get',
  group: 'availability',
  subcommand: 'schedule',
  description: 'Get a specific availability schedule by UUID',
  examples: ['calendly availability schedule abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Availability schedule UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/user_availability_schedules/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(availabilityScheduleGetCommand, input, client),
};

export const availabilityCommands: CommandDefinition[] = [
  availabilityEventTimesCommand,
  availabilityBusyTimesCommand,
  availabilitySchedulesCommand,
  availabilityScheduleGetCommand,
];
