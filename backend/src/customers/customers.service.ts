import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  /** Looks up the customer for this Auth0 user, provisioning one on first sight. */
  async resolveForAuth0User(auth0UserId: string): Promise<Customer> {
    const existing = await this.repo.findOneBy({ auth0UserId });
    if (existing) {
      return existing;
    }
    return this.repo.save(this.repo.create({ auth0UserId }));
  }
}
