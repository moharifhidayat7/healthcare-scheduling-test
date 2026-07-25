import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Env } from '../../config/env-vars.schema';
import { RemoteAuthValidator } from './strategies/remote-auth.validator';
import { InternalJwtValidator } from './strategies/internal-jwt.validator';
import { InternalAuthGuard } from './internal.guard';
import { ExternalAuthGuard } from './external.guard';
import { InternalTokenService } from './internal-token.service';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.getOrThrow('INTERNAL_JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: '5m' },
      }),
    }),
  ],
  providers: [
    InternalJwtValidator,
    RemoteAuthValidator,
    InternalAuthGuard,
    ExternalAuthGuard,
    InternalTokenService,
  ],
  exports: [
    InternalAuthGuard,
    ExternalAuthGuard,
    InternalTokenService,
    RemoteAuthValidator,
  ],
})
export class AuthModule {}
