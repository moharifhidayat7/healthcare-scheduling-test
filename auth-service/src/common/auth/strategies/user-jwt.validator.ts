import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenValidator, JwtPayload } from '../token-validator';
import { USER_JWT_SERVICE } from '../user-token.service';

@Injectable()
export class UserJwtValidator extends TokenValidator {
  constructor(@Inject(USER_JWT_SERVICE) private readonly jwtService: JwtService) {
    super();
  }

  async validate(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
