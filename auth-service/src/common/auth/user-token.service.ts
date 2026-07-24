import { Injectable } from '@nestjs/common';
import { UserJwtService } from './user-jwt.service';
import { JwtPayload } from './token-validator';

@Injectable()
export class UserTokenService {
  constructor(private readonly jwtService: UserJwtService) {}

  generate(userId: string, email: string, roles?: string[]): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      roles: roles ?? ['user'],
    } satisfies JwtPayload);
  }
}
