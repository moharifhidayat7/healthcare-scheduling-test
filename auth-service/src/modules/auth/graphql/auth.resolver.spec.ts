import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from '../../../integrations/prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

import { hash, compare } from 'bcrypt';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  password: 'hashed-password',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('jwt-token'),
  verifyAsync: jest.fn(),
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('returns accessToken for new email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await resolver.register({
        email: 'test@test.com',
        password: 'secret',
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
      expect(hash).toHaveBeenCalledWith('secret', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@test.com', password: 'hashed-password' },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@test.com',
        roles: ['user'],
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('throws on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        resolver.register({ email: 'test@test.com', password: 'secret' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns accessToken on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await resolver.login({
        email: 'test@test.com',
        password: 'secret',
      });

      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@test.com',
        roles: ['user'],
      });
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });

    it('throws on unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        resolver.login({ email: 'unknown@test.com', password: 'secret' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws on wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        resolver.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('returns user on valid token', async () => {
      mockJwt.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'test@test.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await resolver.validateToken('valid-token');

      expect(mockJwt.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('throws on invalid token', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt error'));

      await expect(
        resolver.validateToken('bad-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user deleted after token issued', async () => {
      mockJwt.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'test@test.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        resolver.validateToken('valid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
