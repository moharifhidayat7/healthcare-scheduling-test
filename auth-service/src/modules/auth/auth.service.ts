import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../../integrations/prisma/prisma.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await hash(password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email, password: hashed },
    });

    return { accessToken: this.signToken(user.id, user.email) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { accessToken: this.signToken(user.id, user.email) };
  }

  async validateToken(token: string) {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private signToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      roles: ['user'],
    });
  }
}
