import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadRemoteSecrets } from './config/secrets.bootstrap';

async function bootstrap(): Promise<void> {
  // Must run before AppModule is created so ConfigService sees the values.
  await loadRemoteSecrets();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
}

void bootstrap();
