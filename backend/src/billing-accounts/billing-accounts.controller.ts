import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BillingAccountsService } from './billing-accounts.service';
import { CreateBillingAccountDto } from './dto/create-billing-account.dto';
import { BillingAccount } from './entities/billing-account.entity';

@Controller('billing-accounts')
export class BillingAccountsController {
  constructor(private readonly billingAccountsService: BillingAccountsService) {}

  @Get()
  findAll(): Promise<BillingAccount[]> {
    return this.billingAccountsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBillingAccountDto): Promise<BillingAccount> {
    return this.billingAccountsService.create(dto);
  }

  @Post(':id/pull')
  pull(@Param('id') id: string): Promise<{ rowsInserted: number }> {
    return this.billingAccountsService.pull(id);
  }
}
