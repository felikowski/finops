import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { RUNTIME_CONFIG } from '../runtime-config';

/**
 * Attaches the access token only to calls against our own API — never to the
 * IdP's own endpoints (discovery/token), which angular-oauth2-oidc calls
 * directly via HttpClient too.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);
  const { apiBaseUrl } = inject(RUNTIME_CONFIG);

  if (!req.url.startsWith(apiBaseUrl)) {
    return next(req);
  }

  const token = oauthService.getAccessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
