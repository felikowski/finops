import { Controller, Post, Body } from '@nestjs/common';
import { BillingService } from './billing.service';

class IngestDto {
  bucket!: string;
  key!: string;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('ingest')
  ingest(@Body() body: IngestDto): Promise<{ rowsInserted: number }> {
    return this.billingService.ingestFromS3(body.bucket, body.key);
  }
}
