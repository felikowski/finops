import { AppService } from './app.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('returns the API greeting', () => {
    expect(service.getHello()).toBe('Hello from NestJS!');
  });
});
