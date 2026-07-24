import { Injectable } from '@nestjs/common';
import { TokenValidator, JwtPayload } from '../token-validator';
import { UserJwtService } from '../user-jwt.service';

@Injectable()
export class UserJwtValidator extends TokenValidator {
  constructor(private readonly jwtService: UserJwtService) {
    super();
  }

  async validate(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
