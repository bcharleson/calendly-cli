import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.calendly-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface CalendlyConfig {
  token?: string;
  user_uri?: string;
  user_name?: string;
  user_email?: string;
  organization_uri?: string;
}

export async function loadConfig(): Promise<CalendlyConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(raw) as CalendlyConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: CalendlyConfig): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function clearConfig(): Promise<void> {
  await saveConfig({});
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
