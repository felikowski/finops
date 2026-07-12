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
import { CreateBillingAccountDto } from './dto/create-billing-account.dto';
import { BillingService } from '../billing/billing.service';
import { CredentialResolverService } from './credential-resolver.service';

@Injectable()
export class BillingAccountsService {
  constructor(
    @InjectRepository(BillingAccount)
    private readonly repo: Repository<BillingAccount>,
    private readonly billingService: BillingService,
    private readonly credentialResolver: CredentialResolverService,
  ) {}

  findAll(): Promise<BillingAccount[]> {
    return this.repo.find();
  }

  create(dto: CreateBillingAccountDto): Promise<BillingAccount> {
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
    });
    return this.repo.save(account);
  }

  async pull(id: string): Promise<{ rowsInserted: number }> {
    const account = await this.repo.findOneBy({ id });
    if (!account) {
      throw new NotFoundException(`billing account "${id}" not found`);
    }
    if (!account.enabled) {
      throw new ConflictException(`billing account "${id}" is disabled`);
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
        `Failed to resolve credentials for billing account "${id}": ${reason}`,
      );
    }

    let rowsInserted: number;
    try {
      ({ rowsInserted } = await this.billingService.ingestFromS3({
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

    return { rowsInserted };
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
