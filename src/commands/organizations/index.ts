import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const organizationsGetCommand: CommandDefinition = {
  name: 'organizations_get',
  group: 'organizations',
  subcommand: 'get',
  description: 'Get an organization by UUID',
  examples: ['calendly organizations get abc123'],
  inputSchema: z.object({
    uuid: z.string().describe('Organization UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/organizations/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(organizationsGetCommand, input, client),
};

export const organizationsMembershipsCommand: CommandDefinition = {
  name: 'organizations_memberships',
  group: 'organizations',
  subcommand: 'memberships',
  description: 'List all members of an organization',
  examples: [
    'calendly organizations memberships --organization https://api.calendly.com/organizations/abc123',
    'calendly organizations memberships --count 50',
  ],
  inputSchema: z.object({
    organization: z.string().optional().describe('Organization URI (defaults to your org from config)'),
    user: z.string().optional().describe('Filter by user URI'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page (max 100)'),
    page_token: z.string().optional().describe('Pagination token'),
    email: z.string().optional().describe('Filter by email address'),
  }),
  cliMappings: {
    options: [
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'user', flags: '--user <uri>', description: 'Filter by user URI' },
      { field: 'count', flags: '--count <number>', description: 'Results per page (max 100)' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'email', flags: '--email <email>', description: 'Filter by email' },
    ],
  },
  endpoint: { method: 'GET', path: '/organization_memberships' },
  fieldMappings: {
    organization: 'query',
    user: 'query',
    count: 'query',
    page_token: 'query',
    email: 'query',
  },
  handler: async (input, client) => {
    // Auto-resolve organization from config if not provided
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) {
        input = { ...input, organization: config.organization_uri };
      }
    }
    return executeCommand(organizationsMembershipsCommand, input, client);
  },
};

export const organizationsInvitationsCommand: CommandDefinition = {
  name: 'organizations_invitations',
  group: 'organizations',
  subcommand: 'invitations',
  description: 'List invitations sent for an organization',
  examples: ['calendly organizations invitations --organization https://api.calendly.com/organizations/abc123'],
  inputSchema: z.object({
    organization: z.string().describe('Organization UUID'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
    email: z.string().optional().describe('Filter by email'),
    status: z.string().optional().describe('Filter by status: pending, accepted, declined, revoked'),
  }),
  cliMappings: {
    args: [{ field: 'organization', name: 'organization', required: true }],
    options: [
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'email', flags: '--email <email>', description: 'Filter by email' },
      { field: 'status', flags: '--status <status>', description: 'pending | accepted | declined | revoked' },
    ],
  },
  endpoint: { method: 'GET', path: '/organizations/{organization}/invitations' },
  fieldMappings: {
    organization: 'path',
    count: 'query',
    page_token: 'query',
    email: 'query',
    status: 'query',
  },
  handler: (input, client) => executeCommand(organizationsInvitationsCommand, input, client),
};

export const organizationsCommands: CommandDefinition[] = [
  organizationsGetCommand,
  organizationsMembershipsCommand,
  organizationsInvitationsCommand,
];
