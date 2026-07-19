import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CustomersService } from './customers.service';

/** The bit of the request this guard reads/writes — avoids depending on @types/express. */
interface RequestWithCustomer {
  user?: { sub?: string };
  customer?: unknown;
}

/**
 * Runs after JwtAuthGuard on any route that needs customer-scoped data —
 * resolves (or provisions) the caller's Customer row and attaches it to the
 * request so `@CurrentCustomer()` can read it without every controller
 * re-implementing the same "sub" lookup.
 */
@Injectable()
export class CustomerContextGuard implements CanActivate {
  constructor(private readonly customersService: CustomersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: RequestWithCustomer = context.switchToHttp().getRequest();
    const auth0UserId = req.user?.sub;
    if (!auth0UserId) {
      throw new UnauthorizedException('JWT payload is missing a "sub" claim');
    }
    req.customer = await this.customersService.resolveForAuth0User(auth0UserId);
    return true;
  }
}
