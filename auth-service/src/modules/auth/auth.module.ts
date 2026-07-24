import { Module } from '@nestjs/common';
import { AuthResolver } from './graphql/auth.resolver';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { ValidateTokenUseCase } from './use-cases/validate-token.use-case';
import { PrismaModule } from '../../integrations/prisma/prisma.module';
import { AuthModule as CommonAuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [PrismaModule, CommonAuthModule],
  providers: [
    AuthResolver,
    RegisterUseCase,
    LoginUseCase,
    ValidateTokenUseCase,
  ],
})
export class AuthModule {}
