import { Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RemoteAuthValidator } from './strategies/remote-auth.validator';

@Injectable()
export class ExternalAuthGuard extends AuthGuard {
  constructor(validator: RemoteAuthValidator) {
    super(validator);
  }
}
