import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InternalJwtValidator } from './strategies/internal-jwt.validator';
import { UserJwtValidator } from './strategies/user-jwt.validator';
import { InternalAuthGuard } from './internal.guard';
import { InternalTokenService } from './internal-token.service';
import { UserTokenService, USER_JWT_SERVICE } from './user-token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('INTERNAL_JWT_SECRET'),
        signOptions: { expiresIn: '5m' },
      }),
    }),
  ],
  providers: [
    InternalJwtValidator,
    InternalAuthGuard,
    InternalTokenService,
    UserJwtValidator,
    UserTokenService,
    {
      provide: USER_JWT_SERVICE,
      useFactory: (config: ConfigService) =>
        new JwtService({ secret: config.get<string>('JWT_SECRET'), signOptions: { expiresIn: '24h' } }),
      inject: [ConfigService],
    },
  ],
  exports: [InternalAuthGuard, InternalTokenService, UserJwtValidator, UserTokenService],
})
export class AuthModule {}
