import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { UserTokenService } from '../../../common/auth/user-token.service';
import { LoginUseCase } from './login.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userFindUnique: jest.Mock;
  let generate: jest.Mock;

  const user = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$10$stored-hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userFindUnique = jest.fn();
    generate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: PrismaService,
          useValue: { user: { findUnique: userFindUnique } },
        },
        {
          provide: UserTokenService,
          useValue: { generate },
        },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
    (bcrypt.compare as jest.Mock).mockReset();
  });

  const input = { email: 'test@example.com', password: 'secret123' };

  it('returns a token on valid credentials', async () => {
    userFindUnique.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    generate.mockReturnValue('jwt-token');

    const result = await useCase.execute(input);

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: input.email },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(input.password, user.password);
    expect(generate).toHaveBeenCalledWith(user.id, user.email);
    expect(result).toEqual({ token: 'jwt-token' });
  });

  it('throws UnauthorizedException when user not found', async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException on wrong password', async () => {
    userFindUnique.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedException);
    expect(bcrypt.compare).toHaveBeenCalledWith(input.password, user.password);
    expect(generate).not.toHaveBeenCalled();
  });
});
