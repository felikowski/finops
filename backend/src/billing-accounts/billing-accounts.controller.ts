import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerContextGuard } from '../customers/customer-context.guard';
import { CurrentCustomer } from '../customers/current-customer.decorator';
import { Customer } from '../customers/entities/customer.entity';
import { BillingAccountsService } from './billing-accounts.service';
import { CreateBillingAccountDto } from './dto/create-billing-account.dto';
import { BillingAccount } from './entities/billing-account.entity';
import { BillingAccountPull } from './entities/billing-account-pull.entity';

@UseGuards(JwtAuthGuard, CustomerContextGuard)
@Controller('billing-accounts')
export class BillingAccountsController {
  constructor(private readonly billingAccountsService: BillingAccountsService) {}

  @Get()
  findAll(@CurrentCustomer() customer: Customer): Promise<BillingAccount[]> {
    return this.billingAccountsService.findAll(customer.id);
  }

  @Post()
  create(
    @Body() dto: CreateBillingAccountDto,
    @CurrentCustomer() customer: Customer,
  ): Promise<BillingAccount> {
    return this.billingAccountsService.create(dto, customer.id);
  }

  @Post(':id/pull')
  pull(
    @Param('id') id: string,
    @CurrentCustomer() customer: Customer,
  ): Promise<{ rowsInserted: number }> {
    return this.billingAccountsService.pull(id, customer.id);
  }

  @Get(':id/pulls')
  listPulls(
    @Param('id') id: string,
    @CurrentCustomer() customer: Customer,
  ): Promise<BillingAccountPull[]> {
    return this.billingAccountsService.listPulls(id, customer.id);
  }
}
