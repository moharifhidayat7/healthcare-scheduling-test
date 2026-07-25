import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Env } from '../../config/env-vars.schema';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: {
          host: config.getOrThrow('REDIS_HOST', { infer: true }),
          port: config.getOrThrow('REDIS_PORT', { infer: true }),
          password: config.getOrThrow('REDIS_PASSWORD', { infer: true }),
          db: config.getOrThrow('REDIS_DB', { infer: true }),
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class BullMqModule {}
