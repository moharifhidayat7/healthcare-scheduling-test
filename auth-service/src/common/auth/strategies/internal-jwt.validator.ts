import { JwtService } from '@nestjs/jwt';
import { TokenValidator, JwtPayload } from '../token-validator';

export class InternalJwtValidator extends TokenValidator {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  async validate(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
