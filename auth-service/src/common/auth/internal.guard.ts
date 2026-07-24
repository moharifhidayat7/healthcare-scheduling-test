import { Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { InternalJwtValidator } from './strategies/internal-jwt.validator';

@Injectable()
export class InternalAuthGuard extends AuthGuard {
  constructor(validator: InternalJwtValidator) {
    super(validator);
  }
}
