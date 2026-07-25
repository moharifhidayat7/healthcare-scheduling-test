import { Test, TestingModule } from '@nestjs/testing';
import { CreateCustomerUseCase } from './create-customer.use-case';
import { CustomerService } from '../customer.service';
import { PrismaService } from '../../../integrations/prisma/prisma.service';

import { CacheService } from '../../../common/cache/cache.service';
type MockPrisma = {
  customer: { create: jest.Mock };
};

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let prisma: MockPrisma;

  const mockPrisma: MockPrisma = {
    customer: { create: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCustomerUseCase,
        CustomerService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delByPattern: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get(CreateCustomerUseCase);
    prisma = module.get(PrismaService) as unknown as MockPrisma;
  });

  it('should create a customer', async () => {
    const input = { name: 'Test', email: 'test@example.com' };
    const expected = {
      id: '1',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.customer.create.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(prisma.customer.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(expected);
  });
});
