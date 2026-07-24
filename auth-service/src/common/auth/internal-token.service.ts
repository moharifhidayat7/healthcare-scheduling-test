import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class InternalTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  generate(): string {
    return this.jwtService.sign({
      sub: this.config.get<string>('SERVICE_NAME', 'unknown'),
      roles: ['internal'],
    });
  }
}
