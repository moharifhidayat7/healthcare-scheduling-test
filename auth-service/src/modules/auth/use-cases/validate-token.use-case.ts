import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserJwtValidator } from '../../../common/auth/strategies/user-jwt.validator';
import { JwtPayload } from '../../../common/auth/token-validator';

@Injectable()
export class ValidateTokenUseCase {
  constructor(private readonly userJwtValidator: UserJwtValidator) {}

  async execute(token: string): Promise<JwtPayload> {
    try {
      return await this.userJwtValidator.validate(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
