import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

const WEBHOOK_EVENTS = [
  'invitee.created',
  'invitee.canceled',
  'invitee_no_show.created',
  'invitee_no_show.deleted',
  'routing_form_submission.created',
] as const;

export const webhooksListCommand: CommandDefinition = {
  name: 'webhooks_list',
  group: 'webhooks',
  subcommand: 'list',
  description: 'List webhook subscriptions for an organization or user',
  examples: [
    'calendly webhooks list --scope organization',
    'calendly webhooks list --scope user',
    'calendly webhooks list --scope organization --organization https://api.calendly.com/organizations/abc123',
  ],
  inputSchema: z.object({
    scope: z.enum(['organization', 'user']).describe('Scope: organization or user'),
    organization: z.string().optional().describe('Organization URI (defaults to your org)'),
    user: z.string().optional().describe('User URI (defaults to authenticated user, required for user scope)'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
  }),
  cliMappings: {
    options: [
      { field: 'scope', flags: '--scope <scope>', description: 'organization | user (required)' },
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'user', flags: '--user <uri>', description: 'User URI' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
    ],
  },
  endpoint: { method: 'GET', path: '/webhook_subscriptions' },
  fieldMappings: {
    scope: 'query',
    organization: 'query',
    user: 'query',
    count: 'query',
    page_token: 'query',
  },
  handler: async (input, client) => {
    const { loadConfig } = await import('../../core/config.js');
    const config = await loadConfig();
    if (!input.organization && config.organization_uri) {
      input = { ...input, organization: config.organization_uri };
    }
    if (!input.user && config.user_uri) {
      input = { ...input, user: config.user_uri };
    }
    return executeCommand(webhooksListCommand, input, client);
  },
};

export const webhooksGetCommand: CommandDefinition = {
  name: 'webhooks_get',
  group: 'webhooks',
  subcommand: 'get',
  description: 'Get a specific webhook subscription by UUID',
  examples: ['calendly webhooks get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Webhook subscription UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/webhook_subscriptions/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(webhooksGetCommand, input, client),
};

export const webhooksCreateCommand: CommandDefinition = {
  name: 'webhooks_create',
  group: 'webhooks',
  subcommand: 'create',
  description:
    'Create a webhook subscription. Available events: invitee.created, invitee.canceled, ' +
    'invitee_no_show.created, invitee_no_show.deleted, routing_form_submission.created',
  examples: [
    'calendly webhooks create --url https://example.com/webhook --events invitee.created,invitee.canceled --scope organization',
    'calendly webhooks create --url https://example.com/webhook --events invitee.created --scope user --signing-key mysecret',
  ],
  inputSchema: z.object({
    url: z.string().url().describe('HTTPS URL to receive webhook POST requests'),
    events: z
      .string()
      .describe(
        `Comma-separated event types: ${WEBHOOK_EVENTS.join(', ')}`,
      ),
    scope: z.enum(['organization', 'user']).describe('Scope: organization or user'),
    organization: z.string().optional().describe('Organization URI (defaults to your org)'),
    user: z.string().optional().describe('User URI (required for user scope)'),
    signing_key: z.string().optional().describe('Secret key to sign webhook payloads'),
  }),
  cliMappings: {
    options: [
      { field: 'url', flags: '--url <url>', description: 'Webhook endpoint URL (required)' },
      { field: 'events', flags: '--events <events>', description: 'Comma-separated event types (required)' },
      { field: 'scope', flags: '--scope <scope>', description: 'organization | user (required)' },
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'user', flags: '--user <uri>', description: 'User URI' },
      { field: 'signing_key', flags: '--signing-key <secret>', description: 'Payload signing secret' },
    ],
  },
  endpoint: { method: 'POST', path: '/webhook_subscriptions' },
  fieldMappings: {},
  handler: async (input, client) => {
    const { loadConfig } = await import('../../core/config.js');
    const config = await loadConfig();

    const body: Record<string, unknown> = {
      url: input.url,
      events: input.events.split(',').map((e: string) => e.trim()),
      scope: input.scope,
      organization: input.organization ?? config.organization_uri,
    };

    if (input.scope === 'user') {
      body.user = input.user ?? config.user_uri;
    }

    if (input.signing_key) {
      body.signing_key = input.signing_key;
    }

    return client.post('/webhook_subscriptions', body);
  },
};

export const webhooksDeleteCommand: CommandDefinition = {
  name: 'webhooks_delete',
  group: 'webhooks',
  subcommand: 'delete',
  description: 'Delete a webhook subscription',
  examples: ['calendly webhooks delete abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Webhook subscription UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'DELETE', path: '/webhook_subscriptions/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(webhooksDeleteCommand, input, client),
};

export const webhooksCommands: CommandDefinition[] = [
  webhooksListCommand,
  webhooksGetCommand,
  webhooksCreateCommand,
  webhooksDeleteCommand,
];
