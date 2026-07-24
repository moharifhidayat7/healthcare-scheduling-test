import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { UserTokenService } from '../../../common/auth/user-token.service';
import { LoginInput } from '../graphql/inputs/login.input';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userTokenService: UserTokenService,
  ) {}

  async execute(input: LoginInput): Promise<{ token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.userTokenService.generate(user.id, user.email);
    return { token };
  }
}
