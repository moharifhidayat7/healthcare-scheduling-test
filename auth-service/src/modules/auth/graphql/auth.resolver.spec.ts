import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { ValidateTokenUseCase } from '../use-cases/validate-token.use-case';
import { RegisterInput } from './inputs/register.input';
import { LoginInput } from './inputs/login.input';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let registerUseCase: jest.Mocked<RegisterUseCase>;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let validateTokenUseCase: jest.Mocked<ValidateTokenUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: RegisterUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: LoginUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ValidateTokenUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    resolver = module.get(AuthResolver);
    registerUseCase = module.get(RegisterUseCase);
    loginUseCase = module.get(LoginUseCase);
    validateTokenUseCase = module.get(ValidateTokenUseCase);
  });

  describe('register', () => {
    const input: RegisterInput = { email: 'test@example.com', password: 'secret123' };

    it('returns a token on successful registration', async () => {
      registerUseCase.execute.mockResolvedValue({ token: 'jwt-token' });

      const result = await resolver.register(input);

      expect(registerUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual({ token: 'jwt-token' });
    });

    it('throws ConflictException when email already registered', async () => {
      registerUseCase.execute.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(resolver.register(input)).rejects.toThrow(ConflictException);
      expect(registerUseCase.execute).toHaveBeenCalledWith(input);
    });
  });

  describe('login', () => {
    const input: LoginInput = { email: 'test@example.com', password: 'secret123' };

    it('returns a token on successful login', async () => {
      loginUseCase.execute.mockResolvedValue({ token: 'jwt-token' });

      const result = await resolver.login(input);

      expect(loginUseCase.execute).toHaveBeenCalledWith(input);
      expect(result).toEqual({ token: 'jwt-token' });
    });

    it('throws UnauthorizedException on invalid email', async () => {
      loginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(resolver.login(input)).rejects.toThrow(UnauthorizedException);
      expect(loginUseCase.execute).toHaveBeenCalledWith(input);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      loginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Invalid email or password'),
      );

      await expect(resolver.login(input)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    const token = 'valid-jwt';

    it('returns user info for a valid token', async () => {
      const payload = {
        sub: 'test@example.com',
        email: 'test@example.com',
      };
      validateTokenUseCase.execute.mockResolvedValue(payload);

      const result = await resolver.validateToken(token);

      expect(validateTokenUseCase.execute).toHaveBeenCalledWith(token);
      expect(result).toEqual(payload);
    });

    it('throws UnauthorizedException for an invalid or expired token', async () => {
      validateTokenUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Invalid or expired token'),
      );

      await expect(resolver.validateToken(token)).rejects.toThrow(UnauthorizedException);
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith(token);
    });
  });
});
