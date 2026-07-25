import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env-vars.schema';
import Redis from 'ioredis';

@Injectable()
export class RedisService
  extends Redis
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    super({
      host: config.getOrThrow('REDIS_HOST', { infer: true }),
      port: config.getOrThrow('REDIS_PORT', { infer: true }),
      password: config.getOrThrow('REDIS_PASSWORD', { infer: true }),
      db: config.getOrThrow('REDIS_DB', { infer: true }),
      lazyConnect: true,
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
