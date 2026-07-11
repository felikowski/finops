import { InjectionToken } from '@angular/core';

export interface RuntimeConfig {
  apiBaseUrl: string;
}

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  apiBaseUrl: 'http://localhost:3000',
};

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('runtime.config');

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' });
    if (!response.ok) {
      return DEFAULT_RUNTIME_CONFIG;
    }
    return { ...DEFAULT_RUNTIME_CONFIG, ...(await response.json()) };
  } catch {
    return DEFAULT_RUNTIME_CONFIG;
  }
}
