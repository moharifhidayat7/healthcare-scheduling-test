import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './integrations/prisma/prisma.module';
import { GraphqlModule } from './integrations/graphql/graphql.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './common/auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { envVarsSchema } from './config/env-vars.schema';
import { RedisModule } from './integrations/redis/redis.module';
import { BullMqModule } from './integrations/bullmq/bullmq.module';
import { CacheModule } from './common/cache/cache.module';
import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envVarsSchema,
    }),
    GraphqlModule,
    PrismaModule,
    RedisModule,
    BullMqModule,
    CacheModule,
    CustomerModule,
    DoctorModule,
    ScheduleModule,
    HealthModule,
    AuthModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule { }
