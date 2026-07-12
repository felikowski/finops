import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Validates access tokens against a standard OIDC provider's JWKS endpoint —
 * issuer/audience/JWKS URI all come from config, so this has no Auth0-specific
 * code and would work unchanged against any OIDC-compliant IdP.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const issuer = `https://${config.get<string>('AUTH0_DOMAIN')}/`;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer,
      audience: config.get<string>('AUTH0_AUDIENCE'),
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: `${issuer}.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
      }),
    });
  }

  validate(payload: unknown): unknown {
    return payload;
  }
}
