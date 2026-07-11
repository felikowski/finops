export interface BillingAccountSourceConfig {
  bucket?: string;
  key?: string;
  region?: string;
}

export interface BillingAccount {
  id: string;
  tenantId: number;
  provider: string;
  displayName: string;
  cloudAccountId: string | null;
  sourceConfig: BillingAccountSourceConfig;
  credentialRef: string | null;
  focusVersion: string;
  enabled: boolean;
  lastIngestedAt: string | null;
  lastRowsInserted: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PullResult {
  rowsInserted: number;
}
