import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolveToken } from '../core/auth.js';
import { CalendlyClient } from '../core/client.js';
import { allCommands } from '../commands/index.js';

export async function startMcpServer(): Promise<void> {
  const token = await resolveToken();
  const client = new CalendlyClient({ token });

  const server = new McpServer({
    name: 'calendly',
    version: '0.1.0',
  });

  for (const cmdDef of allCommands) {
    server.registerTool(
      cmdDef.name,
      {
        description: cmdDef.description,
        inputSchema: cmdDef.inputSchema.shape,
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = await cmdDef.handler(args as any, client);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error?.message ?? String(error),
                  code: error?.code ?? 'UNKNOWN_ERROR',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `Calendly MCP server started. ${allCommands.length} tools registered:\n` +
      allCommands.map((c) => `  - ${c.name}`).join('\n'),
  );
}
