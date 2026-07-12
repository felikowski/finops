import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { BillingAccount } from './billing-account.entity';

export enum PullStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

@Entity('billing_account_pulls')
@Index(['billingAccountId', 'startedAt'])
export class BillingAccountPull {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  billingAccountId!: string;

  @ManyToOne(() => BillingAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billingAccountId' })
  billingAccount?: BillingAccount;

  @Column({ type: 'timestamp' })
  startedAt!: Date;

  @Column({ type: 'timestamp' })
  finishedAt!: Date;

  @Column({ type: 'enum', enum: PullStatus })
  status!: PullStatus;

  @Column({ type: 'integer', nullable: true })
  rowsInserted!: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
