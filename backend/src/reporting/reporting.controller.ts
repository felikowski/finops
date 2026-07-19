import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerContextGuard } from '../customers/customer-context.guard';
import { CurrentCustomer } from '../customers/current-customer.decorator';
import { Customer } from '../customers/entities/customer.entity';
import { CostByMonth, CostByProviderAndService } from '../ducklake/ducklake-billing.repository';
import { ReportingService } from './reporting.service';

@UseGuards(JwtAuthGuard, CustomerContextGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('cost-by-month')
  getCostByMonth(@CurrentCustomer() customer: Customer): Promise<CostByMonth[]> {
    return this.reportingService.getCostByMonth(customer.id);
  }

  @Get('cost-by-provider-service')
  getCostByProviderAndService(@CurrentCustomer() customer: Customer): Promise<CostByProviderAndService[]> {
    return this.reportingService.getCostByProviderAndService(customer.id);
  }
}
