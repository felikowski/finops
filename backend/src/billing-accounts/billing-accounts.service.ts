import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BillingAccount,
  BillingProvider,
  AwsSourceConfig,
  SourceConfig,
} from './entities/billing-account.entity';
import { BillingAccountPull, PullStatus } from './entities/billing-account-pull.entity';
import { CreateBillingAccountDto } from './dto/create-billing-account.dto';
import { BillingService } from '../billing/billing.service';
import { CredentialResolverService } from './credential-resolver.service';

@Injectable()
export class BillingAccountsService {
  constructor(
    @InjectRepository(BillingAccount)
    private readonly repo: Repository<BillingAccount>,
    @InjectRepository(BillingAccountPull)
    private readonly pullRepo: Repository<BillingAccountPull>,
    private readonly billingService: BillingService,
    private readonly credentialResolver: CredentialResolverService,
  ) {}

  findAll(customerId: string): Promise<BillingAccount[]> {
    return this.repo.find({ where: { customerId } });
  }

  create(dto: CreateBillingAccountDto, customerId: string): Promise<BillingAccount> {
    if (!dto.displayName) {
      throw new BadRequestException('displayName is required');
    }
    const provider = dto.provider ?? BillingProvider.AWS;
    this.assertSupportedProvider(provider);
    this.assertAwsSourceConfig(dto.sourceConfig);

    const account = this.repo.create({
      displayName: dto.displayName,
      provider,
      sourceConfig: dto.sourceConfig,
      credentialRef: dto.credentialRef ?? null,
      focusVersion: dto.focusVersion ?? '1.2',
      enabled: dto.enabled ?? true,
      cloudAccountId: dto.cloudAccountId ?? null,
      customerId,
    });
    return this.repo.save(account);
  }

  async pull(id: string, customerId: string): Promise<{ rowsInserted: number }> {
    const account = await this.repo.findOneBy({ id, customerId });
    if (!account) {
      throw new NotFoundException(`billing account "${id}" not found`);
    }

    const startedAt = new Date();
    try {
      const rowsInserted = await this.runPull(account);
      await this.recordPull(account.id, startedAt, {
        status: PullStatus.SUCCESS,
        rowsInserted,
        errorMessage: null,
      });
      return { rowsInserted };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'unknown error';
      await this.recordPull(account.id, startedAt, {
        status: PullStatus.ERROR,
        rowsInserted: null,
        errorMessage,
      });
      throw err;
    }
  }

  async listPulls(id: string, customerId: string): Promise<BillingAccountPull[]> {
    const account = await this.repo.findOneBy({ id, customerId });
    if (!account) {
      throw new NotFoundException(`billing account "${id}" not found`);
    }
    return this.pullRepo.find({
      where: { billingAccountId: id },
      order: { startedAt: 'DESC' },
    });
  }

  private async runPull(account: BillingAccount): Promise<number> {
    if (!account.enabled) {
      throw new ConflictException(`billing account "${account.id}" is disabled`);
    }
    this.assertSupportedProvider(account.provider);

    const { bucket, key, region } = account.sourceConfig as AwsSourceConfig;

    let accessKeyId: string;
    let secretAccessKey: string;
    try {
      ({ accessKeyId, secretAccessKey } = await this.credentialResolver.resolve(
        account.credentialRef,
      ));
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      throw new BadGatewayException(
        `Failed to resolve credentials for billing account "${account.id}": ${reason}`,
      );
    }

    let rowsInserted: number;
    try {
      ({ rowsInserted } = await this.billingService.ingestFromS3({
        billingAccountId: account.id,
        bucket,
        key,
        region,
        accessKeyId,
        secretAccessKey,
      }));
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      throw new BadGatewayException(
        `Failed to pull from s3://${bucket}/${key}: ${reason}`,
      );
    }

    account.lastIngestedAt = new Date();
    account.lastRowsInserted = rowsInserted;
    await this.repo.save(account);

    return rowsInserted;
  }

  private async recordPull(
    billingAccountId: string,
    startedAt: Date,
    outcome: { status: PullStatus; rowsInserted: number | null; errorMessage: string | null },
  ): Promise<void> {
    const pull = this.pullRepo.create({
      billingAccountId,
      startedAt,
      finishedAt: new Date(),
      ...outcome,
    });
    await this.pullRepo.save(pull);
  }

  private assertSupportedProvider(provider: BillingProvider): void {
    if (provider !== BillingProvider.AWS) {
      throw new BadRequestException(`provider "${provider}" is not yet implemented`);
    }
  }

  private assertAwsSourceConfig(sourceConfig: SourceConfig): void {
    const { bucket, key, region } = (sourceConfig ?? {}) as Partial<AwsSourceConfig>;
    if (!bucket || !key || !region) {
      throw new BadRequestException(
        'sourceConfig must include bucket, key, and region for provider "aws"',
      );
    }
  }
}
