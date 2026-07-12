import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface S3GetStreamParams {
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

@Injectable()
export class S3Adapter {
  async getStream(params: S3GetStreamParams): Promise<Readable> {
    const client = new S3Client({
      region: params.region,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
    });

    const response = await client.send(
      new GetObjectCommand({ Bucket: params.bucket, Key: params.key }),
    );
    return response.Body as Readable;
  }
}
