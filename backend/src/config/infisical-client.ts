import { InfisicalSDK } from '@infisical/sdk';

/**
 * Lazily authenticates a single, shared Infisical client (machine identity via
 * Universal Auth) and memoizes it so callers don't repeat the login round-trip.
 *
 * Used both at startup (`secrets.bootstrap.ts`, fetching MANAGED_ENV) and at
 * runtime (per-account credential resolution) — whichever fires first pays the
 * login cost, the other reuses the same authenticated client.
 */
let clientPromise: Promise<InfisicalSDK> | null = null;

export function getInfisicalClient(): Promise<InfisicalSDK> {
  if (!clientPromise) {
    clientPromise = authenticate().catch((err) => {
      // Allow a later call to retry rather than caching a permanent failure.
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

async function authenticate(): Promise<InfisicalSDK> {
  const siteUrl = requireEnv('INFISICAL_SITE_URL');
  const clientId = requireEnv('INFISICAL_CLIENT_ID');
  const clientSecret = requireEnv('INFISICAL_CLIENT_SECRET');

  const client = new InfisicalSDK({ siteUrl });
  try {
    await client.auth().universalAuth.login({ clientId, clientSecret });
  } catch (err) {
    throw new Error(
      `[secrets] Infisical machine-identity login failed at ${siteUrl}: ` +
        `${(err as Error).message}`,
    );
  }
  return client;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[secrets] SECRETS_SOURCE=infisical requires ${name} to be set`,
    );
  }
  return value;
}
