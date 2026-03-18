import { z } from 'zod';
import { executeCommand } from '../../core/handler.js';
import type { CommandDefinition } from '../../core/types.js';

export const usersMeCommand: CommandDefinition = {
  name: 'users_me',
  group: 'users',
  subcommand: 'me',
  description: 'Get the currently authenticated user profile',
  examples: ['calendly users me', 'calendly users me --pretty'],
  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/users/me' },
  fieldMappings: {},
  handler: (_input, client) => executeCommand(usersMeCommand, {}, client),
};

export const usersGetCommand: CommandDefinition = {
  name: 'users_get',
  group: 'users',
  subcommand: 'get',
  description: 'Get a specific user by UUID',
  examples: ['calendly users get abc123def456'],
  inputSchema: z.object({
    uuid: z.string().describe('User UUID'),
  }),
  cliMappings: {
    args: [{ field: 'uuid', name: 'uuid', required: true }],
  },
  endpoint: { method: 'GET', path: '/users/{uuid}' },
  fieldMappings: { uuid: 'path' },
  handler: (input, client) => executeCommand(usersGetCommand, input, client),
};

export const usersCommands: CommandDefinition[] = [usersMeCommand, usersGetCommand];
