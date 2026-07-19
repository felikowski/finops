import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerContextGuard } from '../customers/customer-context.guard';
import { CurrentCustomer } from '../customers/current-customer.decorator';
import { Customer } from '../customers/entities/customer.entity';
import { CostByCategoryAndProvider, CostByDay, CostByMonth } from '../ducklake/ducklake-billing.repository';
import { ReportingService } from './reporting.service';

@UseGuards(JwtAuthGuard, CustomerContextGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('cost-by-month')
  getCostByMonth(@CurrentCustomer() customer: Customer): Promise<CostByMonth[]> {
    return this.reportingService.getCostByMonth(customer.id);
  }

  @Get('cost-by-category-provider')
  getCostByCategoryAndProvider(
    @Query('month') month: string | undefined,
    @CurrentCustomer() customer: Customer,
  ): Promise<CostByCategoryAndProvider[]> {
    return this.reportingService.getCostByCategoryAndProvider(customer.id, month);
  }

  @Get('cost-by-day')
  getCostByDay(
    @Query('month') month: string,
    @CurrentCustomer() customer: Customer,
  ): Promise<CostByDay[]> {
    return this.reportingService.getCostByDay(customer.id, month);
  }
}
