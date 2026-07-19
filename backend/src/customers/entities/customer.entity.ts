import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** The Auth0 `sub` claim of the user this customer maps to. One user per customer for now. */
  @Column({ type: 'varchar', unique: true })
  auth0UserId!: string;

  @Column({ type: 'varchar', nullable: true })
  displayName!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
