/**
 * Extract the UUID from a full Calendly resource URI.
 * If the value is already a bare UUID (no slashes), return it as-is.
 *
 * Example:
 *   "https://api.calendly.com/event_types/ACDSNR66IWCQYYCI" → "ACDSNR66IWCQYYCI"
 *   "ACDSNR66IWCQYYCI" → "ACDSNR66IWCQYYCI"
 */
export function uriToUuid(value: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  if (trimmed.includes('/')) {
    return trimmed.split('/').pop() ?? trimmed;
  }
  return trimmed;
}

/**
 * Build a full Calendly resource URI from a UUID and resource path.
 * If the value already looks like a full URI, return it unchanged.
 */
export function toUri(resource: string, value: string): string {
  if (value.startsWith('https://')) return value;
  return `https://api.calendly.com/${resource}/${value}`;
}
