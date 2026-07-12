import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config.json')
  getRuntimeConfig(): {
    apiBaseUrl: string;
    auth: { issuer: string; clientId: string; audience: string };
  } {
    const domain = this.config.get<string>('AUTH0_DOMAIN', '');
    return {
      apiBaseUrl: this.config.get('PUBLIC_API_BASE_URL', '/api'),
      auth: {
        issuer: domain ? `https://${domain}/` : '',
        clientId: this.config.get('AUTH0_CLIENT_ID', ''),
        audience: this.config.get('AUTH0_AUDIENCE', ''),
      },
    };
  }
}
