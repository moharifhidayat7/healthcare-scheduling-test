import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './token-validator';

export const USER_JWT_SERVICE = 'USER_JWT_SERVICE';

@Injectable()
export class UserTokenService {
  constructor(@Inject(USER_JWT_SERVICE) private readonly jwtService: JwtService) {}

  generate(userId: string, email: string, roles?: string[]): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      roles: roles ?? ['user'],
    } satisfies JwtPayload);
  }
}
