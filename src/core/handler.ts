import type { CommandDefinition } from './types.js';
import type { CalendlyClient } from './client.js';
import { uriToUuid } from './uri.js';

/**
 * Generic command executor — builds the HTTP request from a CommandDefinition
 * and the validated input, then dispatches via the client.
 *
 * Path parameters are auto-converted from full Calendly URIs to bare UUIDs,
 * so passing either format works transparently.
 */
export async function executeCommand(
  def: CommandDefinition,
  input: Record<string, unknown>,
  client: CalendlyClient,
): Promise<unknown> {
  let path = def.endpoint.path;
  const query: Record<string, unknown> = {};
  const body: Record<string, unknown> = {};

  for (const [field, location] of Object.entries(def.fieldMappings)) {
    const value = input[field];
    if (value === undefined || value === null) continue;

    if (location === 'path') {
      // Auto-extract UUID from full URI (e.g. https://api.calendly.com/event_types/ABC → ABC)
      const uuid = uriToUuid(String(value));
      path = path.replace(`{${field}}`, encodeURIComponent(uuid));
    } else if (location === 'query') {
      query[field] = value;
    } else if (location === 'body') {
      body[field] = value;
    }
  }

  const method = def.endpoint.method.toUpperCase();

  if (method === 'GET') return client.get(path, query);
  if (method === 'DELETE') return client.delete(path);
  return client.post(path, Object.keys(body).length > 0 ? body : undefined);
}
