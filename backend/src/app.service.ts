import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from NestJS!';
  }

  getHealth(): { status: 'ok'; service: string; checkedAt: string } {
    return {
      status: 'ok',
      service: 'finops-api',
      checkedAt: new Date().toISOString(),
    };
  }
}
