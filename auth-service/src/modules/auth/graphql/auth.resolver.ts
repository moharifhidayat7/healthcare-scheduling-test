import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { AuthToken } from './types/auth-token.type';
import { UserInfo } from './types/user-info.type';
import { RegisterInput } from './inputs/register.input';
import { LoginInput } from './inputs/login.input';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { ValidateTokenUseCase } from '../use-cases/validate-token.use-case';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly validateTokenUseCase: ValidateTokenUseCase,
  ) {}

  @Mutation(() => AuthToken, { description: 'Create a new user account. Password is hashed with bcrypt (10 rounds). Returns a JWT.' })
  register(
    @Args({ name: 'input', description: 'Email and password for the new account' })
    input: RegisterInput,
  ) {
    return this.registerUseCase.execute(input);
  }

  @Mutation(() => AuthToken, { description: 'Authenticate with email and password. Returns a JWT.' })
  login(
    @Args({ name: 'input', description: 'Email and password credentials' })
    input: LoginInput,
  ) {
    return this.loginUseCase.execute(input);
  }

  @Query(() => UserInfo, { description: 'Validate a user JWT and return the decoded user information (id, email, roles).' })
  validateToken(
    @Args({ name: 'token', description: 'JWT token to validate' })
    token: string,
  ) {
    return this.validateTokenUseCase.execute(token);
  }
}
