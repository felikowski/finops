import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Customer } from './entities/customer.entity';

/** Reads the Customer attached by CustomerContextGuard — that guard must run first. */
export const CurrentCustomer = createParamDecorator((_: unknown, ctx: ExecutionContext): Customer => {
  const req = ctx.switchToHttp().getRequest();
  return req.customer;
});
