import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CostByCategoryAndProvider,
  CostByDay,
  CostByMonth,
  DuckLakeBillingRepository,
} from '../ducklake/ducklake-billing.repository';
import { BillingAccountsService } from '../billing-accounts/billing-accounts.service';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

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

  async getCostByCategoryAndProvider(customerId: string): Promise<CostByCategoryAndProvider[]> {
    const billingAccountIds = await this.billingAccountIdsFor(customerId);
    return this.billingRepository.getCostByCategoryAndProvider(billingAccountIds);
  }

  async getCostByDay(customerId: string, month: string): Promise<CostByDay[]> {
    if (!MONTH_PATTERN.test(month)) {
      throw new BadRequestException('month must be in "YYYY-MM" format');
    }
    const billingAccountIds = await this.billingAccountIdsFor(customerId);
    return this.billingRepository.getCostByDay(billingAccountIds, month);
  }

  private async billingAccountIdsFor(customerId: string): Promise<string[]> {
    const accounts = await this.billingAccountsService.findAll(customerId);
    return accounts.map((account) => account.id);
  }
}
