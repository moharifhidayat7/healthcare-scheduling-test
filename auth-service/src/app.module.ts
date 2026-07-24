import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './integrations/prisma/prisma.module';
import { GraphqlModule } from './integrations/graphql/graphql.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthModule as CommonAuthModule } from './common/auth/auth.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { envVarsSchema } from './config/env-vars.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envVarsSchema,
    }),
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
  ],
})
export class AppModule {}
