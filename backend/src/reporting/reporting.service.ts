import { Injectable } from '@nestjs/common';
import {
  CostByMonth,
  CostByProviderAndService,
  DuckLakeBillingRepository,
} from '../ducklake/ducklake-billing.repository';
import { BillingAccountsService } from '../billing-accounts/billing-accounts.service';

@Injectable()
export class ReportingService {
  constructor(
    private readonly billingRepository: DuckLakeBillingRepository,
    private readonly billingAccountsService: BillingAccountsService,
  ) {}

  async getCostByMonth(customerId: string): Promise<CostByMonth[]> {
    const billingAccountIds = await this.billingAccountIdsFor(customerId);
    return this.billingRepository.getCostByMonth(billingAccountIds);
  }

  async getCostByProviderAndService(customerId: string): Promise<CostByProviderAndService[]> {
    const billingAccountIds = await this.billingAccountIdsFor(customerId);
    return this.billingRepository.getCostByProviderAndService(billingAccountIds);
  }

  private async billingAccountIdsFor(customerId: string): Promise<string[]> {
    const accounts = await this.billingAccountsService.findAll(customerId);
    return accounts.map((account) => account.id);
  }
}
