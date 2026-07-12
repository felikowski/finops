import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { RUNTIME_CONFIG } from '../runtime-config';

/**
 * Configures OAuthService purely from runtime config (issuer/clientId/audience
 * fetched from the backend's /config.json) — no provider-specific code here,
 * so swapping the IdP later is a config change, not a rewrite of this file.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideOAuthClient(),
    provideAppInitializer(() => {
      const oauthService = inject(OAuthService);
      const { issuer, clientId, audience } = inject(RUNTIME_CONFIG).auth;

      if (!issuer || !clientId) {
        // No IdP configured yet (e.g. local dev without an Auth0 tenant) — skip.
        return undefined;
      }

      oauthService.configure({
        issuer,
        clientId,
        redirectUri: window.location.origin,
        responseType: 'code',
        scope: 'openid profile email',
        ...(audience ? { customQueryParams: { audience } } : {}),
      });

      return oauthService.loadDiscoveryDocumentAndTryLogin();
    }),
  ]);
}
