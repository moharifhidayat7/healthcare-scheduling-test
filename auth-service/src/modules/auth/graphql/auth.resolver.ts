import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { AuthType } from './types/auth.type';
import { UserType } from './types/user.type';
import { RegisterInput } from './inputs/register.input';
import { LoginInput } from './inputs/login.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthType)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input.email, input.password);
  }

  @Mutation(() => AuthType)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => UserType)
  async validateToken(@Args('token') token: string) {
    return this.authService.validateToken(token);
  }
}
