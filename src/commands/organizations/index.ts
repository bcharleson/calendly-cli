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
    'calendly organizations memberships',
    'calendly organizations memberships --count 50',
    'calendly organizations memberships --email user@example.com',
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
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) input = { ...input, organization: config.organization_uri };
    }
    return executeCommand(organizationsMembershipsCommand, input, client);
  },
};

export const organizationsMembershipGetCommand: CommandDefinition = {
  name: 'organizations_membership_get',
  group: 'organizations',
  subcommand: 'membership',
  description: 'Get a specific organization membership by UUID',
  examples: ['calendly organizations membership abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Membership UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/organization_memberships/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(organizationsMembershipGetCommand, input, client),
};

export const organizationsMembershipRemoveCommand: CommandDefinition = {
  name: 'organizations_membership_remove',
  group: 'organizations',
  subcommand: 'remove-member',
  description: 'Remove a user from an organization by membership UUID',
  examples: ['calendly organizations remove-member abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Membership UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'DELETE', path: '/organization_memberships/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(organizationsMembershipRemoveCommand, input, client),
};

export const organizationsInvitationsListCommand: CommandDefinition = {
  name: 'organizations_invitations_list',
  group: 'organizations',
  subcommand: 'invitations',
  description: 'List invitations sent for an organization',
  examples: [
    'calendly organizations invitations',
    'calendly organizations invitations --status pending',
  ],
  inputSchema: z.object({
    organization: z.string().optional().describe('Organization UUID'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
    email: z.string().optional().describe('Filter by email'),
    status: z.string().optional().describe('Filter by status: pending, accepted, declined, revoked'),
    sort: z.string().optional().describe('Sort order'),
  }),
  cliMappings: {
    options: [
      { field: 'organization', flags: '--organization <uuid>', description: 'Organization UUID' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'email', flags: '--email <email>', description: 'Filter by email' },
      { field: 'status', flags: '--status <status>', description: 'pending | accepted | declined | revoked' },
      { field: 'sort', flags: '--sort <order>', description: 'Sort order' },
    ],
  },
  endpoint: { method: 'GET', path: '/organizations/{organization}/invitations' },
  fieldMappings: {
    organization: 'path',
    count: 'query',
    page_token: 'query',
    email: 'query',
    status: 'query',
    sort: 'query',
  },
  handler: async (input, client) => {
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) {
        // Extract UUID from URI
        const parts = config.organization_uri.split('/');
        input = { ...input, organization: parts[parts.length - 1] };
      }
    }
    return executeCommand(organizationsInvitationsListCommand, input, client);
  },
};

export const organizationsInvitationGetCommand: CommandDefinition = {
  name: 'organizations_invitation_get',
  group: 'organizations',
  subcommand: 'invitation',
  description: 'Get a specific organization invitation by UUID',
  examples: ['calendly organizations invitation --org abc123 --uuid inv456'],
  inputSchema: z.object({
    org_uuid: z.string().describe('Organization UUID'),
    uuid: z.string().describe('Invitation UUID'),
  }),
  cliMappings: {
    options: [
      { field: 'org_uuid', flags: '--org-uuid <uuid>', description: 'Organization UUID (required)' },
      { field: 'uuid', flags: '--uuid <uuid>', description: 'Invitation UUID (required)' },
    ],
  },
  endpoint: { method: 'GET', path: '/organizations/{org_uuid}/invitations/{uuid}' },
  fieldMappings: { org_uuid: 'path', uuid: 'path' },
  handler: (input, client) => executeCommand(organizationsInvitationGetCommand, input, client),
};

export const organizationsInviteCommand: CommandDefinition = {
  name: 'organizations_invite',
  group: 'organizations',
  subcommand: 'invite',
  description: 'Send an invitation email to add a user to the organization',
  examples: [
    'calendly organizations invite --email newuser@example.com',
    'calendly organizations invite --email newuser@example.com --organization abc123',
  ],
  inputSchema: z.object({
    email: z.string().email().describe('Email address to invite'),
    organization: z.string().optional().describe('Organization UUID (defaults to your org)'),
  }),
  cliMappings: {
    options: [
      { field: 'email', flags: '--email <email>', description: 'Email to invite (required)' },
      { field: 'organization', flags: '--organization <uuid>', description: 'Organization UUID' },
    ],
  },
  endpoint: { method: 'POST', path: '/organizations/{organization}/invitations' },
  fieldMappings: { organization: 'path', email: 'body' },
  handler: async (input, client) => {
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) {
        const parts = config.organization_uri.split('/');
        input = { ...input, organization: parts[parts.length - 1] };
      }
    }
    return executeCommand(organizationsInviteCommand, input, client);
  },
};

export const organizationsRevokeInvitationCommand: CommandDefinition = {
  name: 'organizations_revoke_invitation',
  group: 'organizations',
  subcommand: 'revoke-invitation',
  description: 'Revoke a pending organization invitation',
  examples: ['calendly organizations revoke-invitation --org-uuid abc123 --uuid inv456'],
  inputSchema: z.object({
    org_uuid: z.string().describe('Organization UUID'),
    uuid: z.string().describe('Invitation UUID'),
  }),
  cliMappings: {
    options: [
      { field: 'org_uuid', flags: '--org-uuid <uuid>', description: 'Organization UUID (required)' },
      { field: 'uuid', flags: '--uuid <uuid>', description: 'Invitation UUID (required)' },
    ],
  },
  endpoint: { method: 'DELETE', path: '/organizations/{org_uuid}/invitations/{uuid}' },
  fieldMappings: { org_uuid: 'path', uuid: 'path' },
  handler: (input, client) => executeCommand(organizationsRevokeInvitationCommand, input, client),
};

export const organizationsCommands: CommandDefinition[] = [
  organizationsGetCommand,
  organizationsMembershipsCommand,
  organizationsMembershipGetCommand,
  organizationsMembershipRemoveCommand,
  organizationsInvitationsListCommand,
  organizationsInvitationGetCommand,
  organizationsInviteCommand,
  organizationsRevokeInvitationCommand,
];
