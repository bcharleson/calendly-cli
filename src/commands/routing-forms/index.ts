import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const routingFormsListCommand: CommandDefinition = {
  name: 'routing_forms_list',
  group: 'routing-forms',
  subcommand: 'list',
  description: 'List routing forms for an organization',
  examples: [
    'calendly routing-forms list',
    'calendly routing-forms list --organization https://api.calendly.com/organizations/abc123',
  ],
  inputSchema: z.object({
    organization: z.string().optional().describe('Organization URI (defaults to your org)'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page (max 100)'),
    page_token: z.string().optional().describe('Pagination token'),
    sort: z.string().optional().describe('Sort order (e.g. created_at:desc)'),
  }),
  cliMappings: {
    options: [
      { field: 'organization', flags: '--organization <uri>', description: 'Organization URI' },
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'sort', flags: '--sort <order>', description: 'Sort order' },
    ],
  },
  endpoint: { method: 'GET', path: '/routing_forms' },
  fieldMappings: {
    organization: 'query',
    count: 'query',
    page_token: 'query',
    sort: 'query',
  },
  handler: async (input, client) => {
    if (!input.organization) {
      const { loadConfig } = await import('../../core/config.js');
      const config = await loadConfig();
      if (config.organization_uri) input = { ...input, organization: config.organization_uri };
    }
    return executeCommand(routingFormsListCommand, input, client);
  },
};

export const routingFormsGetCommand: CommandDefinition = {
  name: 'routing_forms_get',
  group: 'routing-forms',
  subcommand: 'get',
  description: 'Get a specific routing form by UUID',
  examples: ['calendly routing-forms get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Routing form UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/routing_forms/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(routingFormsGetCommand, input, client),
};

export const routingFormSubmissionsListCommand: CommandDefinition = {
  name: 'routing_form_submissions_list',
  group: 'routing-forms',
  subcommand: 'submissions',
  description: 'List submissions for a routing form',
  examples: [
    'calendly routing-forms submissions abc123def456',
    'calendly routing-forms submissions abc123def456 --count 50',
  ],
  inputSchema: z.object({
    routing_form: z.string().describe('Routing form URI or UUID'),
    count: z.coerce.number().min(1).max(100).optional().describe('Results per page'),
    page_token: z.string().optional().describe('Pagination token'),
    sort: z.string().optional().describe('Sort order'),
  }),
  cliMappings: {
    args: [{ field: 'routing_form', name: 'routing-form', required: true }],
    options: [
      { field: 'count', flags: '--count <number>', description: 'Results per page' },
      { field: 'page_token', flags: '--page-token <token>', description: 'Pagination token' },
      { field: 'sort', flags: '--sort <order>', description: 'Sort order' },
    ],
  },
  endpoint: { method: 'GET', path: '/routing_form_submissions' },
  fieldMappings: {
    routing_form: 'query',
    count: 'query',
    page_token: 'query',
    sort: 'query',
  },
  handler: (input, client) => executeCommand(routingFormSubmissionsListCommand, input, client),
};

export const routingFormSubmissionGetCommand: CommandDefinition = {
  name: 'routing_form_submission_get',
  group: 'routing-forms',
  subcommand: 'submission',
  description: 'Get a specific routing form submission by UUID',
  examples: ['calendly routing-forms submission abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('Submission UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/routing_form_submissions/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(routingFormSubmissionGetCommand, input, client),
};

export const routingFormsCommands: CommandDefinition[] = [
  routingFormsListCommand,
  routingFormsGetCommand,
  routingFormSubmissionsListCommand,
  routingFormSubmissionGetCommand,
];
