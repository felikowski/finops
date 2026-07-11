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
  getRuntimeConfig(): { apiBaseUrl: string } {
    return {
      apiBaseUrl: this.config.get('PUBLIC_API_BASE_URL', '/api'),
    };
  }
}
