import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UserJwtValidator } from '../../../common/auth/strategies/user-jwt.validator';
import { ValidateTokenUseCase } from './validate-token.use-case';

describe('ValidateTokenUseCase', () => {
  let useCase: ValidateTokenUseCase;
  let userJwtValidator: jest.Mocked<UserJwtValidator>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateTokenUseCase,
        {
          provide: UserJwtValidator,
          useValue: { validate: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(ValidateTokenUseCase);
    userJwtValidator = module.get(
      UserJwtValidator,
    ) as jest.Mocked<UserJwtValidator>;
  });

  const token = 'some-jwt';

  it('returns payload for a valid token', async () => {
    const payload = {
      sub: 'user-1',
      email: 'test@example.com',
      roles: ['user'],
    };
    userJwtValidator.validate.mockResolvedValue(payload);

    const result = await useCase.execute(token);

    expect(userJwtValidator.validate).toHaveBeenCalledWith(token);
    expect(result).toEqual(payload);
  });

  it('throws UnauthorizedException when validator rejects', async () => {
    userJwtValidator.validate.mockRejectedValue(new Error('jwt expired'));

    await expect(useCase.execute(token)).rejects.toThrow(UnauthorizedException);
    expect(userJwtValidator.validate).toHaveBeenCalledWith(token);
  });
});
