import { getInfisicalClient, requireEnv } from './infisical-client';

/**
 * Loads managed configuration (secrets and non-secret config) before the Nest
 * application boots.
 *
 * Controlled by the SECRETS_SOURCE environment variable:
 *   - unset / "local" → no-op; @nestjs/config loads backend/.env as usual
 *   - "infisical"     → fetch the values declared in MANAGED_ENV from the
 *                       Infisical instance and inject them into process.env so
 *                       ConfigService reads them exactly as if they came from a
 *                       local .env file
 *
 * In "infisical" mode the app authenticates with a machine identity
 * (Universal Auth). The client id/secret are the only bootstrap credentials
 * that must be supplied via the environment ("secret zero") — everything else
 * comes from Infisical.
 *
 * Note: Infisical is used here as a combined secret + config store, so not
 * every entry below is strictly a secret (e.g. DB_HOST is plain config).
 */

/**
 * A value the backend pulls from Infisical at startup.
 *
 * Declared explicitly so the code — not a wildcard fetch — is the source of
 * truth for *what* it pulls and *where each value lands*. Infisical organises
 * values by folder path + key; the app reads flat env vars. This mapping
 * bridges the two.
 */
interface ManagedValue {
  /** Folder path within the Infisical project, e.g. "/postgres/finops/finops_owner". */
  path: string;
  /** Key at that path, e.g. "password". */
  key: string;
  /** process.env variable to populate, e.g. "DB_PASSWORD". */
  envVar: string;
}

/**
 * Values fetched from Infisical and injected into process.env at boot.
 *
 * - Postgres connection info (host/port/database/schema, shared across roles)
 *   lives directly at /postgres.
 * - Postgres role credentials live under a per-role folder, keyed by
 *   "user"/"password". The app connects as finops_owner for now because
 *   synchronize:true needs DDL rights — switch to /postgres/finops/finops_app
 *   (CRUD-only) once migrations replace synchronize (issue #10).
 * - AWS billing-reader credentials live under /aws/finops/billing-s3-reader.
 *   This is the *global fallback* identity, used only for billing accounts
 *   that don't set their own `credential_ref` (billing_accounts registry,
 *   issue #16). Region is no longer fetched here — it's per-account config
 *   (`source_config.region`) resolved at pull time, not startup.
 *
 * Only the INFISICAL_* bootstrap vars ("secret zero") remain outside Infisical.
 */
const MANAGED_ENV: ManagedValue[] = [
  // Connection info (shared across roles) lives directly at /postgres.
  { path: '/postgres', key: 'host', envVar: 'DB_HOST' },
  { path: '/postgres', key: 'port', envVar: 'DB_PORT' },
  { path: '/postgres', key: 'database', envVar: 'DB_NAME' },
  { path: '/postgres', key: 'schema', envVar: 'DB_SCHEMA' },
  // Role credentials live under a per-role folder.
  { path: '/postgres/finops/finops_owner', key: 'user', envVar: 'DB_USER' },
  { path: '/postgres/finops/finops_owner', key: 'password', envVar: 'DB_PASSWORD' },
  { path: '/aws/finops/billing-s3-reader', key: 'access_key_id', envVar: 'AWS_ACCESS_KEY_ID' },
  { path: '/aws/finops/billing-s3-reader', key: 'secret_access_key', envVar: 'AWS_SECRET_ACCESS_KEY' },
];

export async function loadRemoteSecrets(): Promise<void> {
  const source = (process.env.SECRETS_SOURCE ?? 'local').toLowerCase();
  if (source !== 'infisical') {
    return;
  }

  const projectId = requireEnv('INFISICAL_PROJECT_ID');
  const environment = requireEnv('INFISICAL_ENVIRONMENT');
  const client = await getInfisicalClient();

  for (const { path, key, envVar } of MANAGED_ENV) {
    let value;
    try {
      value = await client.secrets().getSecret({
        projectId,
        environment,
        secretName: key,
        secretPath: path,
        viewSecretValue: true,
      });
    } catch (err) {
      throw new Error(
        `[secrets] Failed to fetch "${key}" from Infisical path "${path}" ` +
          `(environment="${environment}"): ${(err as Error).message}`,
      );
    }
    process.env[envVar] = value.secretValue;
  }

  // Never log values — only the mapping, so boot logs stay safe to share.
  console.log(
    `[secrets] Loaded ${MANAGED_ENV.length} value(s) from Infisical ` +
      `(environment="${environment}"): ` +
      MANAGED_ENV.map((v) => `${v.path}:${v.key}→${v.envVar}`).join(', '),
  );
}
