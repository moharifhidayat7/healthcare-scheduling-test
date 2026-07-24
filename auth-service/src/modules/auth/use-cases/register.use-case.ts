import { Injectable, ConflictException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { UserTokenService } from '../../../common/auth/user-token.service';
import { RegisterInput } from '../graphql/inputs/register.input';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userTokenService: UserTokenService,
  ) {}

  async execute(input: RegisterInput): Promise<{ token: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const password = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: { email: input.email, password },
    });

    const token = this.userTokenService.generate(user.id, user.email);
    return { token };
  }
}
