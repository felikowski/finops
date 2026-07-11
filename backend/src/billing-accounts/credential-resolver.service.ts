import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getInfisicalClient } from '../config/infisical-client';

export interface ResolvedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: ResolvedCredentials;
  expiresAt: number;
}

/**
 * Resolves the AWS credentials for a billing account.
 *
 * - `credentialRef == null` → the existing global fallback identity
 *   (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`, unchanged from before #16).
 * - `credentialRef` set → fetched from Infisical at that path (TTL-cached),
 *   the first runtime (not just startup) dependency on Infisical — see
 *   ADR-0007. In `local` mode there's no Infisical to query an arbitrary
 *   path against, so this also falls back to the global identity.
 */
@Injectable()
export class CredentialResolverService {
  private readonly logger = new Logger(CredentialResolverService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly warnedNoInfisical = new Set<string>();

  constructor(private readonly config: ConfigService) {}

  async resolve(credentialRef: string | null): Promise<ResolvedCredentials> {
    if (!credentialRef) {
      this.logger.debug('No credentialRef set — using the global fallback AWS identity');
      return this.globalFallback();
    }

    const cached = this.cache.get(credentialRef);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Using cached credentials for "${credentialRef}"`);
      return cached.value;
    }

    const source = (process.env.SECRETS_SOURCE ?? 'local').toLowerCase();
    if (source !== 'infisical') {
      if (!this.warnedNoInfisical.has(credentialRef)) {
        this.warnedNoInfisical.add(credentialRef);
        this.logger.warn(
          `credentialRef "${credentialRef}" set but SECRETS_SOURCE is not "infisical" — ` +
            `falling back to the global AWS identity`,
        );
      }
      return this.globalFallback();
    }

    const value = await this.fetchFromInfisical(credentialRef);
    this.cache.set(credentialRef, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    this.logger.log(`Resolved credentials for "${credentialRef}" from Infisical`);
    return value;
  }

  private globalFallback(): ResolvedCredentials {
    return {
      accessKeyId: this.config.get('AWS_ACCESS_KEY_ID', ''),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY', ''),
    };
  }

  private async fetchFromInfisical(credentialRef: string): Promise<ResolvedCredentials> {
    const projectId = this.config.getOrThrow<string>('INFISICAL_PROJECT_ID');
    const environment = this.config.getOrThrow<string>('INFISICAL_ENVIRONMENT');
    const client = await getInfisicalClient();

    const [accessKeyId, secretAccessKey] = await Promise.all(
      ['access_key_id', 'secret_access_key'].map(async (secretName) => {
        try {
          const secret = await client.secrets().getSecret({
            projectId,
            environment,
            secretName,
            secretPath: credentialRef,
            viewSecretValue: true,
          });
          return secret.secretValue;
        } catch (err) {
          const rawMessage = err instanceof Error ? err.message : String(err);
          // The Infisical SDK's error message embeds the full request URL
          // (including the workspace id) — log that internally, but don't
          // leak it into an API error response.
          this.logger.error(
            `Failed to fetch "${secretName}" from Infisical path "${credentialRef}" ` +
              `(environment="${environment}"): ${rawMessage}`,
          );
          throw new Error(
            `Failed to fetch "${secretName}" from Infisical path "${credentialRef}": ` +
              this.sanitizeInfisicalError(rawMessage),
          );
        }
      }),
    );

    return { accessKeyId, secretAccessKey };
  }

  /**
   * Infisical SDK errors are formatted as leading `[URL=...] [Method=...]
   * [StatusCode=...]` blocks (which embed the workspace id) followed by a
   * human-readable message, e.g. `[URL=...] [Method=GET] [StatusCode=404]
   * Folder with path '/x' in environment with slug 'dev' not found`. Strip
   * the bracketed metadata and keep the human-readable tail.
   */
  private sanitizeInfisicalError(message: string): string {
    const withoutMetadata = message.replace(/^(\[[^\]]*\]\s*)+/, '').trim();
    return withoutMetadata || 'Infisical request failed';
  }
}
