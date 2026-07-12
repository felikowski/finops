import { BillingProvider, SourceConfig } from '../entities/billing-account.entity';

export class CreateBillingAccountDto {
  displayName!: string;
  provider?: BillingProvider;
  sourceConfig!: SourceConfig;
  credentialRef?: string | null;
  focusVersion?: string;
  enabled?: boolean;
  cloudAccountId?: string | null;
}
