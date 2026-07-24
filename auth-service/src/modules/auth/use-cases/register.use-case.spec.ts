import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../../integrations/prisma/prisma.service';
import { UserTokenService } from '../../../common/auth/user-token.service';
import { RegisterUseCase } from './register.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userFindUnique: jest.Mock;
  let userCreate: jest.Mock;
  let generate: jest.Mock;

  beforeEach(async () => {
    userFindUnique = jest.fn();
    userCreate = jest.fn();
    generate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: userFindUnique, create: userCreate },
          },
        },
        {
          provide: UserTokenService,
          useValue: { generate },
        },
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
    (bcrypt.hash as jest.Mock).mockReset();
  });

  const input = { email: 'new@example.com', password: 'secret123' };

  it('hashes password, creates user, and returns a token', async () => {
    const hashed = '$2b$10$hashed';
    (bcrypt.hash as jest.Mock).mockResolvedValue(hashed);
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      id: 'user-1',
      email: input.email,
      password: hashed,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    generate.mockReturnValue('jwt-token');

    const result = await useCase.execute(input);

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: input.email },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(input.password, 10);
    expect(userCreate).toHaveBeenCalledWith({
      data: { email: input.email, password: hashed },
    });
    expect(generate).toHaveBeenCalledWith('user-1', input.email);
    expect(result).toEqual({ token: 'jwt-token' });
  });

  it('throws ConflictException when email already exists', async () => {
    userFindUnique.mockResolvedValue({
      id: 'existing',
      email: input.email,
      password: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: input.email },
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
  });
});
