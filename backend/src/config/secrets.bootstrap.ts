import { InfisicalSDK } from '@infisical/sdk';

/**
 * Loads secrets before the Nest application boots.
 *
 * Controlled by the SECRETS_SOURCE environment variable:
 *   - unset / "local" → no-op; @nestjs/config loads backend/.env as usual
 *   - "infisical"     → fetch secrets from the Infisical instance and inject
 *                       them into process.env so ConfigService can read them
 *                       exactly as if they came from a local .env file
 *
 * In "infisical" mode the app authenticates with a machine identity
 * (Universal Auth). The client id/secret are the only bootstrap credentials
 * that must be supplied via the environment ("secret zero") — everything else
 * comes from Infisical.
 */
export async function loadRemoteSecrets(): Promise<void> {
  const source = (process.env.SECRETS_SOURCE ?? 'local').toLowerCase();
  if (source !== 'infisical') {
    return;
  }

  const siteUrl = requireEnv('INFISICAL_SITE_URL');
  const projectId = requireEnv('INFISICAL_PROJECT_ID');
  const environment = requireEnv('INFISICAL_ENVIRONMENT');
  const clientId = requireEnv('INFISICAL_CLIENT_ID');
  const clientSecret = requireEnv('INFISICAL_CLIENT_SECRET');
  const secretPath = process.env.INFISICAL_SECRET_PATH ?? '/';

  const client = new InfisicalSDK({ siteUrl });
  await client.auth().universalAuth.login({ clientId, clientSecret });

  const { secrets } = await client.secrets().listSecrets({
    projectId,
    environment,
    secretPath,
    recursive: true,
    expandSecretReferences: true,
    viewSecretValue: true,
  });

  for (const secret of secrets) {
    // Remote is the source of truth in infisical mode; let it win over any
    // value already present in the process environment.
    process.env[secret.secretKey] = secret.secretValue;
  }

  // Never log secret values — only a count, so boot logs stay safe to share.
  console.log(
    `[secrets] Loaded ${secrets.length} secret(s) from Infisical ` +
      `(environment="${environment}", path="${secretPath}")`,
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[secrets] SECRETS_SOURCE=infisical requires ${name} to be set`,
    );
  }
  return value;
}
