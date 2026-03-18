import type { GlobalOptions } from './types.js';
import { formatError } from './errors.js';

export function output(data: unknown, opts: GlobalOptions): void {
  if (opts.quiet) return;

  let result = data;

  if (opts.fields && result !== null && typeof result === 'object') {
    const fields = opts.fields.split(',').map((f) => f.trim());
    result = pickFields(result, fields);
  }

  const pretty = opts.pretty || opts.output === 'pretty';
  console.log(pretty ? JSON.stringify(result, null, 2) : JSON.stringify(result));
}

export function outputError(error: unknown, opts: GlobalOptions): void {
  if (!opts.quiet) {
    console.error(formatError(error));
  }
  process.exit(1);
}

function pickFields(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item, fields));
  }
  if (data !== null && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Unwrap single-resource wrapper (e.g. { resource: { name, email } })
    if ('resource' in obj && obj.resource !== null && typeof obj.resource === 'object' && !Array.isArray(obj.resource)) {
      return pickFields(obj.resource, fields);
    }
    // Check for paginated response with collection key
    const collectionKey = Object.keys(obj).find(
      (k) => Array.isArray(obj[k]) && !['warnings', 'errors'].includes(k),
    );
    if (collectionKey) {
      return {
        ...obj,
        [collectionKey]: (obj[collectionKey] as unknown[]).map((item) =>
          pickFields(item, fields),
        ),
      };
    }
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in obj) out[f] = obj[f];
    }
    return out;
  }
  return data;
}
