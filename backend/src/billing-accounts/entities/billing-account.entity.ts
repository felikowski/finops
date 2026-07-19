import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

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
   * Owning customer, resolved from the caller's Auth0 user on every request
   * (see CustomersService) — nullable only because rows created before this
   * scoping existed have no owner yet and need manual assignment.
   */
  @Column({ type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

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
