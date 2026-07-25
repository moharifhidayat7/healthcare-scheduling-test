import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './integrations/prisma/prisma.module';
import { GraphqlModule } from './integrations/graphql/graphql.module';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthModule as CommonAuthModule } from './common/auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { envVarsSchema, Env } from './config/env-vars.schema';

@Module({
  imports: [
    ConfigModule.forRoot<Env>({
      isGlobal: true,
      validate: (config) => envVarsSchema.parse(config),
    }),
    CacheModule,
    GraphqlModule,
    PrismaModule,
    AuthModule,
    CommonAuthModule,
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
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule {}
