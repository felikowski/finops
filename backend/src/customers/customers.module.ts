import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomersService } from './customers.service';
import { CustomerContextGuard } from './customer-context.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersService, CustomerContextGuard],
  exports: [CustomersService, CustomerContextGuard],
})
export class CustomersModule {}
