import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const groupsListCommand: CommandDefinition = {
  name: 'groups_list',
  group: 'groups',
  subcommand: 'list',
  description: 'List groups in an organization',
  examples: [
    'calendly groups list',
    'calendly groups list --organization https://api.calendly.com/organizations/abc123',
  ],
  inputSchema: z.object({
    organization: z.string().optional().describe('Organization URI (defaults to your org)'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
  }),
  cliMappings: {
    options: [
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
    ],
  },
  endpoint: { method: 'GET', path: '/groups' },
  fieldMappings: {
    organization: 'query',
    count: 'query',
    page_token: 'query',
  },
  handler: async (input, client) => {
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) input = { ...input, organization: config.organization_uri };
    }
    return executeCommand(groupsListCommand, input, client);
  },
};

export const groupsGetCommand: CommandDefinition = {
  name: 'groups_get',
  group: 'groups',
  subcommand: 'get',
  description: 'Get a specific group by UUID',
  examples: ['calendly groups get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Group UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/groups/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(groupsGetCommand, input, client),
};

export const groupRelationshipsListCommand: CommandDefinition = {
  name: 'group_relationships_list',
  group: 'groups',
  subcommand: 'relationships',
  description: 'List relationships (members) for a group',
  examples: [
    'calendly groups relationships --group https://api.calendly.com/groups/abc123',
    'calendly groups relationships --group https://api.calendly.com/groups/abc123 --count 50',
  ],
  inputSchema: z.object({
    group: z.string().describe('Group URI'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
  }),
  cliMappings: {
    options: [
      { field: 'group', flags: '--group <uri>', description: 'Group URI (required)' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
    ],
  },
  endpoint: { method: 'GET', path: '/group_relationships' },
  fieldMappings: {
    group: 'query',
    count: 'query',
    page_token: 'query',
  },
  handler: (input, client) => executeCommand(groupRelationshipsListCommand, input, client),
};

export const groupsCommands: CommandDefinition[] = [
  groupsListCommand,
  groupsGetCommand,
  groupRelationshipsListCommand,
];
