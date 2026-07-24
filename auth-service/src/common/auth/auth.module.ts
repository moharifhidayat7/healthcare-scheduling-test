import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InternalJwtValidator } from './strategies/internal-jwt.validator';
import { InternalAuthGuard } from './internal.guard';
import { InternalTokenService } from './internal-token.service';

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
  ],
  exports: [InternalAuthGuard, InternalTokenService],
})
export class AuthModule {}
