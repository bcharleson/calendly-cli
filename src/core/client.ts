import { AuthError, NotFoundError, RateLimitError, ServerError, ValidationError } from './errors.js';

export const BASE_URL = 'https://api.calendly.com';
const DEFAULT_TIMEOUT = 30_000;
const WRITE_TIMEOUT = 15_000;
const MAX_RETRIES = 3;

export interface CalendlyClientOptions {
  token: string;
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export class CalendlyClient {
  private token: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;

  constructor(opts: CalendlyClientOptions) {
    this.token = opts.token;
    this.baseUrl = opts.baseUrl ?? BASE_URL;
    this.maxRetries = opts.maxRetries ?? MAX_RETRIES;
    this.timeout = opts.timeout ?? DEFAULT_TIMEOUT;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'calendly-cli/0.1.0',
    };
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { query?: Record<string, unknown>; body?: unknown } = {},
    attempt = 0,
  ): Promise<T> {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    const timeout = isWrite ? WRITE_TIMEOUT : this.timeout;

    let url = `${this.baseUrl}${path}`;
    if (opts.query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null && v !== '') {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers: this.headers(),
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 204) return {} as T;

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        const msg =
          data?.message ??
          data?.title ??
          (data?.details && Array.isArray(data.details)
            ? data.details.map((d: any) => d.message).join('; ')
            : undefined) ??
          res.statusText;

        if (res.status === 401 || res.status === 403) throw new AuthError(msg);
        if (res.status === 404) throw new NotFoundError(msg);
        if (res.status === 400 || res.status === 422) throw new ValidationError(msg);
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after') ?? 60);
          if (attempt < this.maxRetries) {
            await sleep(retryAfter * 1000);
            return this.request<T>(method, path, opts, attempt + 1);
          }
          throw new RateLimitError(msg, retryAfter);
        }
        if (res.status >= 500) {
          if (attempt < this.maxRetries) {
            await sleep(Math.pow(2, attempt) * 1000);
            return this.request<T>(method, path, opts, attempt + 1);
          }
          throw new ServerError(msg, res.status);
        }
        throw new Error(msg);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        if (attempt < this.maxRetries) {
          await sleep(1000 * (attempt + 1));
          return this.request<T>(method, path, opts, attempt + 1);
        }
        throw new Error('Request timed out');
      }
      throw err;
    }
  }

  get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, { query });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /** Build a full Calendly resource URI from a UUID and resource type */
  uri(resource: string, uuid: string): string {
    return `${this.baseUrl}/${resource}/${uuid}`;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
