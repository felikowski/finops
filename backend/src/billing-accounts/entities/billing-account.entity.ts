import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BillingProvider {
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp',
}

/** Only `aws` is implemented today; azure/gcp shapes are TBD when those providers land. */
export interface AwsSourceConfig {
  bucket: string;
  key: string;
  region: string;
}

export type SourceConfig = AwsSourceConfig;

@Entity('billing_accounts')
export class BillingAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Placeholder until issue #8 (multi-tenant architecture) defines the real
   * tenant model — not an FK yet, just a column so #8 won't need a migration
   * under `synchronize`. Development uses tenant 1.
   */
  @Column({ type: 'integer', default: 1 })
  tenantId!: number;

  @Column({ type: 'enum', enum: BillingProvider, default: BillingProvider.AWS })
  provider!: BillingProvider;

  @Column({ type: 'varchar' })
  displayName!: string;

  @Column({ type: 'varchar', nullable: true })
  cloudAccountId!: string | null;

  @Column({ type: 'jsonb' })
  sourceConfig!: SourceConfig;

  /** Infisical path to this account's read credentials, e.g. '/aws/finops/acme-s3-reader'. Null → use the global fallback identity. */
  @Column({ type: 'varchar', nullable: true })
  credentialRef!: string | null;

  @Column({ type: 'varchar', default: '1.2' })
  focusVersion!: string;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastIngestedAt!: Date | null;

  @Column({ type: 'integer', nullable: true })
  lastRowsInserted!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
