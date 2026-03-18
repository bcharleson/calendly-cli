import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const dataComplianceDeleteInviteesCommand: CommandDefinition = {
  name: 'data_compliance_delete_invitees',
  group: 'data-compliance',
  subcommand: 'delete-invitees',
  description:
    'Delete all data for invitees by email address (GDPR/data compliance). ' +
    'This permanently removes scheduling data. Cannot be undone.',
  examples: [
    'calendly data-compliance delete-invitees --emails jane@example.com',
    'calendly data-compliance delete-invitees --emails "jane@example.com,bob@example.com"',
  ],
  inputSchema: z.object({
    emails: z.string().describe('Comma-separated email addresses to delete data for'),
  }),
  cliMappings: {
    options: [
      { field: 'emails', flags: '--emails <emails>', description: 'Comma-separated emails (required)' },
    ],
  },
  endpoint: { method: 'DELETE', path: '/data_compliance/deletion/invitees' },
  fieldMappings: {},
  handler: async (input, client) => {
    const emails = input.emails
      .split(',')
      .map((e: string) => e.trim())
      .filter((e: string) => e);
    return client.post('/data_compliance/deletion/invitees', { emails });
  },
};

export const dataComplianceDeleteInviteeCommand: CommandDefinition = {
  name: 'data_compliance_delete_scheduled_event_data',
  group: 'data-compliance',
  subcommand: 'delete-event-data',
  description:
    'Delete all data for a specific invitee by UUID (GDPR). Permanently removes event data.',
  examples: ['calendly data-compliance delete-event-data abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Invitee UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'DELETE', path: '/scheduled_event_data/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: async (input, client) => client.delete(`/scheduled_event_data/${input.uuid}`),
};

export const dataComplianceCommands: CommandDefinition[] = [
  dataComplianceDeleteInviteesCommand,
  dataComplianceDeleteInviteeCommand,
];
